# GitHub Analyzer – AI-Powered Repository Companion

GitHub Analyzer is an AI-powered chatbot and codebase explorer that enables users to interact with any public GitHub repository using natural language. Simply provide a GitHub repo link, and the assistant will summarize the repository, explain code logic, answer questions, and guide you through unfamiliar codebases using LLMs and a Retrieval-Augmented Generation (RAG) pipeline.

---

## Features
- Summarize repository README and code structure
- Answer technical questions about the codebase
- Explain code logic and architecture
- Visualize file structure and code
- Chatbot interface powered by LLMs

---

## Technology Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI (Python)
- **AI/RAG:** LangChain, OpenAI, ChromaDB, CrewAI

---

## Installation & Setup

### 1. Backend Setup
```powershell
cd scripts
pip install -r requirements.txt
```
Create a `.env` file in the `scripts` folder:
```env
OPENAI_API_KEY=your_openai_key
TAVILY_API_KEY=your_tavily_search_api_key
```
Run the FastAPI server:
```powershell
uvicorn repo_processor:app --reload
```

### 2. Frontend Setup
```powershell
cd project
npm install
npm run dev
```
Visit: [http://localhost:5173](http://localhost:5173)

---

## Contributing
Contributions are welcome! Please open issues or submit pull requests for improvements.

## License
This project is licensed under the MIT License. See `LICENSE` for details.



---
