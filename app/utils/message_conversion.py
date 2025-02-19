from langchain_core.messages import HumanMessage, AIMessage

def get_langchain_messages(conversation_history:str):
    messages = []
    for dialogue in conversation_history:
        if dialogue['role'] == "user" :
            messages += [HumanMessage(content=dialogue['content'])]
        else:
            messages += [AIMessage(content=dialogue['content'])]
    return messages