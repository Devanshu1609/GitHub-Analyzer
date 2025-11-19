import os
import shutil
import time
from git import Repo
from typing import List
import stat
from typing import List, Tuple
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

VALID_EXTENSIONS = [".py", ".js", ".ts", ".java", ".go", ".cpp", ".md", ".txt", ".json", ".yaml", ".yml"]
SKIP_DIRS = {".git", "__pycache__", ".venv", "venv", "node_modules"}
def handle_remove_readonly(func, path, exc):
    """
    Fix Windows error: Access denied when trying to remove read-only .git files.
    """
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception as e:
        print(f"Failed to delete: {path}, even after removing read-only. Error: {e}")


def clone_repo(repo_url: str, repo_name: str = "cloned_repo") -> str:
    """
    Clones the repo from GitHub to ./temp/{repo_name}, cleaning up the old one safely.
    """
    temp_dir = os.path.join("temp", repo_name)
    print(f"Target directory: {temp_dir}")

    if os.path.exists(temp_dir):
        print(f"Removing existing folder: {temp_dir}")
        try:
            shutil.rmtree(temp_dir, onexc=handle_remove_readonly)
        except Exception as e:
            print(f"Could not remove folder, retrying after delay: {e}")
            time.sleep(1)
            shutil.rmtree(temp_dir, onexc=handle_remove_readonly)

    print(f"Cloning repo {repo_url} into {temp_dir} ...")
    Repo.clone_from(repo_url, temp_dir)
    print("Clone complete.")

    return temp_dir


def get_relevant_files(repo_path: str) -> List[str]:
    """
    Walks through the repo and collects only relevant code/text files, skipping system dirs.
    """
    relevant_files = []

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if any(file.endswith(ext) for ext in VALID_EXTENSIONS):
                full_path = os.path.join(root, file)
                relevant_files.append(full_path)

    print(f"Found {len(relevant_files)} relevant files for processing.")
    return relevant_files



PERSIST_DIR = "vector_store"
embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")

def load_vector_db():
    """Loads Chroma vector DB with embedding model."""
    vectordb = Chroma(
        collection_name="github_repo",
        persist_directory=PERSIST_DIR,
        embedding_function=embedding_model
    )
    return vectordb

def chunk_file(file_path: str) -> List[Document]:
    """
    Reads a file and splits it into semantic chunks using filetype-based separators.
    Returns list of LangChain Document chunks.
    """
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read {file_path}: {e}")
        return []

    if not content.strip():
        print(f"Empty file skipped: {file_path}")
        return []

    extension = os.path.splitext(file_path)[1].lower()
    separators_map = {
        ".md":  ["\n#", "\n##", "\n\n", "\n", " "],
        ".py":  ["\ndef ", "\nclass ", "\n\n", "\n", " "],
        ".js":  ["\nfunction ", "\nclass ", "\n\n", "\n", " "],
        ".ts":  ["\nfunction ", "\nclass ", "\n\n", "\n", " "],
        ".java": ["\nclass ", "\n\n", "\n", " "],
        ".cpp": ["\n", " "],
        ".go":  ["\n", " "]
    }

    separators = separators_map.get(extension, ["\n\n", "\n", " "])

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=separators
    )

    chunks = splitter.create_documents(
        [content],
        metadatas=[{"source": file_path}]
    )

    print(f"Created {len(chunks)} chunks from {file_path}")
    return chunks

def create_embeddings(chunks: List[Document]) -> Tuple[List[List[float]], List[Document]]:
    """
    Takes Document chunks and returns:
      - embeddings list (vectors)
      - original chunks
    """

    if not chunks:
        print("No chunks to embed.")
        return [], []

    texts = [c.page_content for c in chunks]
    print(f"Generating embeddings for {len(texts)} chunks...")
    embeddings_list = embedding_model.embed_documents(texts)
    print("Embeddings generated.")
    return embeddings_list, chunks


def store_embeddings(embeddings: List[List[float]], chunks: List[Document]):
    """
    Stores manual embeddings into Chroma vector database.
    """

    if not embeddings or not chunks:
        print("No embeddings/chunks available for storing.")
        return None

    print("Storing embeddings into Chroma vector store...")

    vectordb = load_vector_db()

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [chunk.metadata for chunk in chunks]
    documents = [chunk.page_content for chunk in chunks]

    vectordb._collection.add(
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

    vectordb.persist()
    print(f"Stored {len(chunks)} chunks with embeddings in Chroma.")

    return vectordb


def process_file(file_path: str) -> dict:
    """
    Complete pipeline for:
       - chunking
       - embedding
       - storing into DB
    """

    print(f"Running full processing pipeline for {file_path}")
    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    chunks = chunk_file(file_path)
    if not chunks:
        return {"error": "No chunks generated."}

    embeddings, chunks = create_embeddings(chunks)
    store_embeddings(embeddings, chunks)

    return {
        "status": "success",
        "file": os.path.basename(file_path),
        "chunks_count": len(chunks),
        "db_path": PERSIST_DIR
    }

def retrieve_context(query: str, k: int = 5) -> str:
    """Fetches top-k relevant chunks as formatted context text."""
    vectordb = load_vector_db()

    results = vectordb.similarity_search(query, k=k)

    context = "\n\n--- Retrieved Chunk ---\n\n".join(
        f"[Source: {res.metadata.get('source')}]\n{res.page_content}"
        for res in results
    )

    return context