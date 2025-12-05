import os
import logging
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model

load_dotenv()


def summarize_repo(readme_path: str) -> Optional[str]:
    """
    Summarizes a repository based on its README file using Gemini API.
    Returns the summary string or None if an error occurs.
    """
    if not os.path.exists(readme_path):
        print(f"README file not found at {readme_path}")
        return None

    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            readme_content = f.read()

        model = init_chat_model("google_genai:gemini-2.5-flash-lite")

        prompt = f"""
        Analyze this GitHub repository's README file and provide insights about the project.

        README Content:
        {readme_content}

        Conduct a comprehensive and detailed analysis that answers:
        - What does this project do and what problem does it solve?
        - What are its key features and capabilities?
        - What technologies, languages, and frameworks does it use?
        - How do you install and use it?
        - Who is the target audience?
        - What are the main dependencies and requirements?
        - Are there any notable aspects, limitations, or unique characteristics?

        Format your response in a clear, structured, professional way that would help someone
        quickly understand this repository and decide if it's relevant to their needs.
        """

        response = model.invoke(prompt)
        return response.content

    except Exception as e:
        print(f"Error during summary generation: {e}")
        return None
