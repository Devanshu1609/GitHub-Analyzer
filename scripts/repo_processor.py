import logging
from fastapi import APIRouter, HTTPException, Request
from utils.file_tree_builder import build_file_tree
from parser_tool import process_repo, clone_repo
from question_answer import process_query
import os
from dotenv import load_dotenv
from question_answer import process_query

load_dotenv()

SKIP_FILENAMES = {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}
SKIP_DIR_NAMES = {"node_modules", "__pycache__", ".git", ".venv", "venv"}

def is_file_allowed(file_path: str) -> bool:
    filename = os.path.basename(file_path)
    if filename in SKIP_FILENAMES:
        print(f"Skipping unwanted file: {filename}")
        return False
    parts = set(file_path.split(os.sep))
    if parts.intersection(SKIP_DIR_NAMES):
        print(f"Skipping file inside ignored dir: {file_path}")
        return False
    return True

def upload_repo(repo_url: str):
    try:
        if not repo_url or not repo_url.startswith("https://github.com/"):
            raise HTTPException(status_code=400, detail="Invalid GitHub URL")
        file_path, target_dir = clone_repo(repo_url)
        result = process_repo(repo_url)
        file_tree = build_file_tree(f"temp\\{file_path}")
        while True:
            user_query = input("Enter your query about the repository (or 'exit' to quit): ")
            if user_query.lower() == 'exit':
                print("Exiting the query loop.")
                break
            answer = process_query(user_query, file_path)
            print("Final Answer : - ", answer)


    except Exception as e:
        print("Exception in /upload-repo", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {e}")

repo_url = input("Enter GitHub repository URL: ")
upload_repo(repo_url)