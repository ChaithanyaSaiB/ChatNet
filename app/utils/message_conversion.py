from langchain_core.messages import HumanMessage, AIMessage

def get_langchain_messages(conversation_history: list[dict]):
    """
    Converts a list of conversation history dictionaries into LangChain message objects.

    This function processes a conversation history, represented as a list of dictionaries,
    and converts it into a sequence of `HumanMessage` and `AIMessage` objects from LangChain.
    Special handling is applied to specific types of messages such as "Initial Merge Message",
    "Conversation Start", and "End Merge Message".

    Args:
        conversation_history (list[dict]): A list of dictionaries representing the conversation
                                           history. Each dictionary should contain at least a
                                           'query' key, and optionally a 'response' key.

    Returns:
        list: A list of LangChain `HumanMessage` and `AIMessage` objects representing the conversation.

    Warnings:
        - If an element in the conversation history is not a dictionary, it is skipped with a warning.
        - Unexpected or missing keys in the dictionaries are handled gracefully.

    Example:
        Input:
        [
            {"query": "Hello, how are you?", "response": "I'm good, thank you!"},
            {"query": "What is the weather like today?"},
            {"query": "End Merge Message"}
        ]

        Output:
        [
            HumanMessage(content="Hello, how are you?"),
            AIMessage(content="I'm good, thank you!"),
            HumanMessage(content="What is the weather like today?"),
            HumanMessage(content="Given the conversations above. Now please answer the following query:")
        ]
    """
    messages = []  # Initialize an empty list to store LangChain messages

    # Iterate through each unit in the conversation history
    for conversation_unit in conversation_history:
        # Check if the current element is a dictionary; skip non-dictionary elements
        if not isinstance(conversation_unit, dict):
            print(f"Warning: Skipping non-dictionary element: {conversation_unit} of actual type {type(conversation_unit)}")
            continue
        
        # Extract the 'query' key from the current dictionary
        query = conversation_unit.get('query')

        # Handle special cases based on the value of 'query'
        if query == "Initial Merge Message":
            # Add a message indicating that multiple conversations are being merged
            messages.append(HumanMessage(content="This is a merge request where multiple conversations are being passed together to answer a query"))
        elif query == "Conversation Start":
            # Add a message indicating the start of an independent conversation
            messages.append(HumanMessage(content="The below is an independent conversation"))
        elif query == "End Merge Message":
            # Add a message indicating the end of merged conversations and requesting an answer
            messages.append(HumanMessage(content="Given the conversations above. Now please answer the following query:"))
        else:
            # For regular queries, add them as `HumanMessage`
            messages.append(HumanMessage(content=query))
            
            # If there is a corresponding response, add it as an `AIMessage`
            if "response" in conversation_unit:
                messages.append(AIMessage(content=conversation_unit['response']))
    
    return messages  # Return the list of LangChain messages
