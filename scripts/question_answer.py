import os
from langchain_openai import ChatOpenAI
from crewai import Agent, Task, Crew, LLM
from crewai_tools import CodeDocsSearchTool
from crewai_tools import TavilySearchTool
from crewai_tools import SerperDevTool
from crewai_tools import ScrapeWebsiteTool
from parser_tool import retrieve_similar_context
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4.1",
    temperature=0,
    max_tokens=500,
    timeout=None,
    max_retries=2,
)

crew_llm = LLM(
    model="gpt-4.1",
    max_tokens=500,
    temperature=0.7
)

def check_local_knowledge(query, context):
    """Function to determine if we can answer from retrieved knowledge"""
    prompt = '''Role: Question-Answering Assistant
                Task: Determine whether the system can answer the user's question based on the provided text.
                Instructions:
                    - Analyze the text and identify if it contains the meaningful information to answer the user's question.
                    - Provide a clear and concise response indicating whether the system can answer the question or not.
                    - Your response should include only a single word. Nothing else, no other text, information, header/footer. 
                Output Format:
                    - Answer: Yes/No
                Study the below examples and based on that, respond to the last question. 
                Examples:
                    Input: 
                        Text: The capital of France is Paris.
                        User Question: What is the capital of France?
                    Expected Output:
                        Answer: Yes
                    Input: 
                        Text: The population of the United States is over 330 million.
                        User Question: What is the population of China?
                    Expected Output:
                        Answer: No
                    Input:
                        User Question: {query}
                        Text: {text}
                '''
    formatted_prompt = prompt.format(text=context, query=query)
    response = llm.invoke(formatted_prompt)
    return response.content.strip().lower() == "yes"

def setup_web_scraping_agent():
    """Setup the web scraping agent and related components"""
    # search_tool = SerperDevTool()  # Tool for performing web searches
    # scrape_website = ScrapeWebsiteTool()  # Tool for extracting data from websites
    # code_docs_search = CodeDocsSearchTool(docs_url="https://stackoverflow.com")  # Tool for searching code documentation
    tavily_search = TavilySearchTool(max_results=5)  # Tool for searching using Tavily

    tavily_search_agent = Agent(
        role="Tavily Search Agent",
        goal="Find the most accurate, reliable, and relevant information from the web using Tavily semantic search. Filter out noise and provide only high-quality insights.",
        backstory="A highly specialized research agent trained to extract the most relevant information from the internet using semantic search, prioritizing accuracy and source credibility.",
        allow_delegation=False,
        verbose=True,
        llm=crew_llm
    )

    # code_doc_search_agent = Agent(
    #     role="Expert Code Documentation Search Agent",
    #     goal=(
    #         "Retrieve the most accurate, official, and relevant documentation for the user's programming "
    #         "questions. Provide API references, usage examples, and detailed explanations from reliable "
    #         "documentation sources."
    #     ),
    #     backstory=(
    #         "A highly trained technical documentation expert capable of scanning language docs, framework "
    #         "docs, function references, and API specifications to extract precise programming knowledge."
    #     ),
    #     allow_delegation=False,
    #     verbose=True,
    #     llm=crew_llm,
    #     tools=[code_docs_search]
    # )

    tavily_search_task =Task(
        description=(
            "Using Tavily semantic search, identify the most relevant information regarding '{topic}'. "
            "Focus on accuracy, source reliability, and well-structured insights. "
            "Return the useful content, not unnecessary noise."
        ),
        expected_output=(
            "A concise yet comprehensive summary of the most accurate results from Tavily regarding '{topic}', "
            "including key points and relevant details."
        ),
        tools=[tavily_search],
        agent=tavily_search_agent,
    )

    # code_docs_search_task = Task(
    #     description=(
    #         "Using CodeDocSearchTool, find the most accurate and official documentation related to '{query}'. "
    #         "Focus on providing API usage, parameters, return values, and examples. If multiple sources exist, "
    #         "choose the most authoritative one."
    #     ),
    #     expected_output=(
    #         "A clear, detailed summary of the official documentation related to '{query}', including examples, "
    #         "parameters, and explanations."
    #     ),
    #     tools=[code_docs_search],
    #     agent=code_doc_search_agent(),
    # )

    
    # Define the crew to manage agents and tasks
    crew = Crew(
        agents=[tavily_search_agent],
        tasks=[tavily_search_task],
        verbose=1,
        memory=False,
    )
    return crew

def get_web_content(query):
    """Get content from web scraping"""
    crew = setup_web_scraping_agent()
    result = crew.kickoff(inputs={"topic": query})
    return result.raw


def generate_final_answer(context, query):
    """Generate final answer using LLM"""
    messages = [
        (
            "system",
            "You are a helpful assistant. Use the provided context to answer the query accurately.",
        ),
        ("system", f"Context: {context}"),
        ("human", query),
    ]
    response = llm.invoke(messages)
    return response.content

def process_query(query, repo_name):
    """Main function to process user query"""
    retrieved_context = retrieve_similar_context(repo_name, query)
    can_answer_locally = check_local_knowledge(query, retrieved_context)
    print(f"Can answer locally: {can_answer_locally}")
    
    if can_answer_locally:
        answer = generate_final_answer(retrieved_context, query)
    else:
        context = get_web_content(query)
        answer = generate_final_answer(context, query)

    return answer
