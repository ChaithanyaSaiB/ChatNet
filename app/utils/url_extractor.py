from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
import re

def extract_urls(messages):
    """
    Extracts all unique URLs from a sequence of LangChain messages.

    This function processes a list of LangChain messages and extracts URLs
    from `ToolMessage` objects while ignoring `AIMessage` and other message types.
    The URLs are identified using a regular expression and duplicates are removed.

    Args:
        messages (dict): A dictionary containing a key 'messages', which is a list of LangChain message objects.
                         Each message can be an instance of `HumanMessage`, `AIMessage`, or `ToolMessage`.

    Returns:
        list: A list of unique URLs extracted from the `ToolMessage` objects.

    Example:
        Input:
        {
            "messages": [
                ToolMessage(content="Here is the link: https://example.com"),
                AIMessage(content="I cannot provide links."),
                ToolMessage(content="Another link: http://test.com")
            ]
        }

        Output:
        ["https://example.com", "http://test.com"]
    """
    urls = []  # Initialize an empty list to store extracted URLs

    # Reverse iterate through the messages to process them in reverse order
    for message in reversed(messages['messages']):
        # Skip processing if the message is an AIMessage
        if isinstance(message, AIMessage):
            continue
        
        # Process only ToolMessage objects
        if isinstance(message, ToolMessage):
            content = message.content  # Extract the content of the ToolMessage
            
            # Define a regular expression pattern to match URLs
            url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
            
            # Find all URLs in the content and add them to the list
            urls.extend(re.findall(url_pattern, content))

    # Remove duplicate URLs by converting the list to a set and back to a list
    return list(set(urls))
