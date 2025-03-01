from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
import re

def extract_urls(messages):
    urls = []

    # Reverse iterate through messages
    for message in reversed(messages['messages']):
        if isinstance(message, AIMessage):
            continue
        
        if isinstance(message, ToolMessage):
            content = message.content
            url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
            urls = re.findall(url_pattern, content)

    return list(urls)  # Reverse the URLs to maintain chronological order
