from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
import re
import json

def extract_urls(messages):
    """
    Extracts all unique URLs from a sequence of LangChain messages.

    This function processes a list of LangChain messages and extracts URLs
    from `ToolMessage` objects, ignoring `AIMessage` and other message types.
    The URLs are identified using JSON format and duplicates are removed.

    Args:
        messages (dict): A dictionary containing a key 'messages', which is a list of LangChain message objects.
                         Each message can be an instance of `HumanMessage`, `AIMessage`, or `ToolMessage`.

    Returns:
        list: A list of unique URLs extracted from the `ToolMessage` objects.

    Example:
        Input:
        {
            "messages": [
                ToolMessage(content='[{"url": "https://example.com"}]'),
                AIMessage(content="I cannot provide links."),
                ToolMessage(content='[{"url": "http://test.com"}]')
            ]
        }

        Output:
        ["https://example.com", "http://test.com"]
    """
    extracted_urls = []  # Initialize an empty list to store extracted URLs

    # Reverse iterate through the messages to process them in reverse order
    for message in reversed(messages['messages']):
        # Break if the message is a HumanMessage
        if isinstance(message, HumanMessage):
            break

        # Skip processing if the message is an AIMessage
        if isinstance(message, AIMessage):
            continue
        
        # Process only ToolMessage objects
        if isinstance(message, ToolMessage):
            content = message.content  # Extract the content of the ToolMessage
            try:
                data = json.loads(content)  # Parse the JSON string
                urls = [item['url'] for item in data]  # Extract the 'url' values
            except json.JSONDecodeError:
                urls = []  # Handle JSON decode errors
            extracted_urls.extend(urls)

    # Remove duplicate URLs by converting the list to a set and back to a list
    return list(set(extracted_urls))
