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
            
            # Find all URLs in the content and extend the list
            urls.extend(re.findall(url_pattern, content))

    return list(set(urls))  # Remove duplicates by converting to a set and back to a list
