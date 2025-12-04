import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi import APIRouter, Query
from utils.file_tree_builder import build_file_tree
from parser_tool import process_repo, clone_repo
from question_answer import process_query
from summarizer import summarize_repo

load_dotenv()

app = FastAPI(title="GitHub Analyzer")

origins = [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://13.60.137.213:8000",
    "https://exam-preparation-ai.vercel.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    repo_url: str

class ChatRequest(BaseModel):
    query: str
    repo_name: str


@app.post("/upload-repo")
def upload_repo(req: RepoRequest):
    repo_url = req.repo_url
    try:
        if not repo_url.startswith("https://github.com/"):
            raise HTTPException(status_code=400, detail="Invalid GitHub URL")

        file_path, target_dir = clone_repo(repo_url)
        process_repo(repo_url)

        file_tree = build_file_tree(f"temp/{file_path}")

        readme_path = os.path.join(target_dir, "README.md")
        summary = summarize_repo(readme_path=readme_path)
        print("Generated Summary:", summary)
        return {
            "status": "success",
            "file_tree": file_tree,
            "summary": summary
        }

    except Exception as e:
        logging.exception("Exception in /upload-repo")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat_with_repo(req: ChatRequest):
    try:
        answer = process_query(req.query, req.repo_name)
        return {"answer": answer}

    except Exception as e:
        logging.exception("Error in /chat")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/view-file", response_class=PlainTextResponse)
def view_file(file_path: str = Query(...)):
    """
    Returns the raw contents of a file given its path (must be inside ./temp/)
    """
    if not file_path.startswith("temp/"):
        return "Invalid file path."

    if not os.path.exists(file_path):
        return "File not found."

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"Could not read file: {str(e)}"
    
@app.get("/")
def read_root():
    return {"message": "Welcome to the GitHub Analyzer API!"}

@app.get("/ping")
async def ping():
    return {"status": "active"}