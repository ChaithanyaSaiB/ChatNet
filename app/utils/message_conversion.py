from langchain_core.messages import HumanMessage

def get_langchain_messages(query:str):
    return [HumanMessage(content=query)]