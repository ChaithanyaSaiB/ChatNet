import os
from langchain_groq import ChatGroq
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.prebuilt import ToolNode
from langsmith import Client

tavily_search = TavilySearchResults(max_results=3)

tools = [tavily_search]
tool_node = ToolNode(tools)

llm = ChatGroq(model="llama3-70b-8192").bind_tools(tools)

client = Client(api_url=os.environ["LANGSMITH_ENDPOINT"], api_key=os.environ["LANGSMITH_API_KEY"])
