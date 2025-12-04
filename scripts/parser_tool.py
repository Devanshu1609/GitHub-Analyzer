import os
import shutil
import stat
import time
from typing import List, Tuple, Dict

from git import Repo
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_vertexai import VertexAIEmbeddings
from langchain_core.documents import Document

BASE_VECTOR_DIR = "vector_store"

VALID_EXTENSIONS = [
    ".py", ".js", ".ts", ".java", ".go", ".cpp", ".md",
    ".txt", ".json", ".yaml", ".yml"
]

SKIP_DIRS = {".git", "__pycache__", "venv", ".venv", "node_modules"}

# ----------------------------
# ⭐ VERTEX AI EMBEDDINGS (768-d)
# ----------------------------
EMBED_MODEL = VertexAIEmbeddings(model_name="text-embedding-004")


def handle_remove_readonly(func, path, exc):
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception as e:
        print(f"Failed to delete: {path}. Error: {e}")


def clone_repo(repo_url: str) -> str:
    repo_name = repo_url.rstrip("/").split("/")[-1].replace(".git", "")
    target_dir = os.path.join("temp", repo_name)

    if os.path.exists(target_dir):
        print(f"[INFO] Removing existing repo folder: {target_dir}")
        shutil.rmtree(target_dir, onerror=handle_remove_readonly)

    print(f"[INFO] Cloning {repo_url} → {target_dir}")
    Repo.clone_from(repo_url, target_dir)

    return repo_name, target_dir


def get_relevant_files(repo_path: str) -> List[str]:
    collected = []

    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for file in files:
            if any(file.endswith(ext) for ext in VALID_EXTENSIONS):
                collected.append(os.path.join(root, file))

    return collected


# ===============================================================
# 🔥 FINAL FIX: Safe Chunking using CharacterTextSplitter
# ===============================================================
def chunk_file(file_path: str, repo_name: str) -> List[Document]:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception:
        return []

    if not content.strip():
        return []

    # ⭐ HARD SPLIT — NO CHUNK > 2000 characters ⭐
    splitter = CharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200,
    )

    chunks = splitter.create_documents(
        [content],
        metadatas=[{
            "source_file": file_path,
            "repo_name": repo_name,
        }]
    )

    return chunks


def load_repo_vector_db(repo_name: str):
    repo_vector_path = os.path.join(BASE_VECTOR_DIR, repo_name)
    os.makedirs(repo_vector_path, exist_ok=True)

    vectordb = Chroma(
        collection_name=repo_name,
        persist_directory=repo_vector_path,
        embedding_function=EMBED_MODEL
    )

    return vectordb


def store_chunks(vectordb: Chroma, chunks: List[Document], repo_name: str):
    for i, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = f"{repo_name}_{i}"

    vectordb.add_documents(chunks)
    vectordb.persist()


def process_repo(repo_url: str) -> Dict:
    print("\n===== Starting Repo Ingestion =====\n")

    repo_name, repo_path = clone_repo(repo_url)
    files = get_relevant_files(repo_path)

    all_chunks = []

    for fp in files:
        file_chunks = chunk_file(fp, repo_name)
        all_chunks.extend(file_chunks)

    if not all_chunks:
        return {"error": "No chunks generated from repo."}

    vectordb = load_repo_vector_db(repo_name)
    store_chunks(vectordb, all_chunks, repo_name)

    print("\n===== Repo Ingestion Completed Successfully =====\n")

    return {
        "repo": repo_name,
        "file_count": len(files),
        "chunks_count": len(all_chunks),
        "vector_db_path": f"{BASE_VECTOR_DIR}/{repo_name}",
    }


def retrieve_similar_context(
    repo_name: str,
    query: str,
    k: int = 5
) -> List[Dict]:

    vectordb = load_repo_vector_db(repo_name)

    try:
        results = vectordb.similarity_search_with_score(query, k=k)

        hits = []
        for doc, score in results:
            similarity = score
            if similarity > 1.0:
                similarity = 1.0 / (1.0 + score)

            hits.append({
                "content": doc.page_content,
                "score": float(similarity),
                "metadata": doc.metadata
            })

        combined_context = "\n\n".join(
            [f"Metadata: {hit['metadata']['source_file']}\n{hit['content']}" for hit in hits]
        )
        return combined_context

    except Exception as e:
        print(f"[WARN] similarity_search_with_score failed → fallback: {e}")

        collection = vectordb._collection
        raw = collection.query(
            query_texts=[query],
            n_results=k,
            include=["documents", "distances", "metadatas"]
        )

        docs = raw["documents"][0]
        dists = raw["distances"][0]
        metas = raw["metadatas"][0]

        hits = []
        for doc, dist, meta in zip(docs, dists, metas):
            similarity = 1.0 / (1.0 + dist)
            hits.append({
                "content": doc,
                "score": float(similarity),
                "metadata": meta
            })

        combined_context = "\n\n".join(
            [f"Metadata: {hit['metadata']['source_file']}\n{hit['content']}" for hit in hits]
        )
        return combined_context
