from langchain_core.messages import HumanMessage, AIMessage

def get_langchain_messages(conversation_history:list[dict]):
    messages = []
    for conversation_unit in conversation_history:
        messages += [HumanMessage(content=conversation_unit['query'])]
        if "response" in conversation_unit:
            messages += [AIMessage(content=conversation_unit['response'])]
    return messages