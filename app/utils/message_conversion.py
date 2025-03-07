from langchain_core.messages import HumanMessage, AIMessage

# def get_langchain_messages(conversation_history:list[dict]):
#     messages = []
#     for conversation_unit in conversation_history:
#         if conversation_unit['query'] == "Initial Merge Message":
#             messages += [HumanMessage(content="This is a merge request where multiple conversations are being passed together to answer a query")]
#         elif conversation_unit['query'] == "Conversation Start":
#             messages += [HumanMessage(content="The below is a independent conversation")]
#         else:
#             messages += [HumanMessage(content=conversation_unit['query'])]
#             if "response" in conversation_unit:
#                 messages += [AIMessage(content=conversation_unit['response'])]
#     return messages

def get_langchain_messages(conversation_history: list[dict]):
    messages = []
    for conversation_unit in conversation_history:
        if not isinstance(conversation_unit, dict):
            print(f"Warning: Skipping non-dictionary element: {conversation_unit} of actual type {type(conversation_unit)}")
            continue
        
        query = conversation_unit.get('query')
        if query == "Initial Merge Message":
            messages.append(HumanMessage(content="This is a merge request where multiple conversations are being passed together to answer a query"))
        elif query == "Conversation Start":
            messages.append(HumanMessage(content="The below is an independent conversation"))
        elif query == "End Merge Message":
            messages.append(HumanMessage(content="Given the conversations above. Now please answer the following query:"))
        else:
            messages.append(HumanMessage(content=query))
            if "response" in conversation_unit:
                messages.append(AIMessage(content=conversation_unit['response']))
    return messages