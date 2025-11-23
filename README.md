# 🤖 GitHub Repository Companion – AI Chatbot

An AI-powered chatbot that enables users to interact with the contents of any public GitHub repository in natural language. Simply provide a GitHub repo link, and get the Insights of the Repository summarizing the README.md file. The assistant can summarize code, explain logic, answer questions, and guide you through unfamiliar codebases — all powered by LLMs and a Retrieval-Augmented Generation (RAG) pipeline.

---

## 🔧 Backend Setup

```bash
cd scripts
pip install -r requirements.txt
```

1. Create a `.env` file

```env
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=tavily_search_api
```

2. Run the FastAPI server

```bash
uvicorn repo_processor:app --reload
```

---

## 🔧 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: [http://localhost:5173](http://localhost:5173)

---
