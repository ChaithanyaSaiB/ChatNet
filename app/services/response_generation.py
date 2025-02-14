from app.services.postgres_chat_memory import PostgresChatMemory
from app.utils.langchain_utils import create_agent
from app.core.database import get_db
from fastapi import Depends
import uuid

#conversation_history = []
conversation_id = uuid.uuid4()

# Function to add a new message and get a response
def get_response(user_input,db):
    # Instantiate our custom memory layer with the current DB session
    memory = PostgresChatMemory(db)

    # Save the user's message to the conversation history
    updated_record = memory.add_message(role='human', message=user_input)

    # Retrieve the full conversation history (could be used as context for your LLM chain)
    history = memory.get_history(updated_record.conversation_id)
    
    # For demonstration, we print the history (or you might pass it to your LLM chain)
    print("Conversation history:")
    for msg in history:
        print(f" {msg.type}: {msg.content}")

    chain = create_agent()

    assistant_response = chain.invoke({"messages": history})

    print(updated_record.conversation_id)

    # Save the assistant's response in the conversation history
    memory.add_message("assistant", assistant_response['messages'][-1].content, str(updated_record.conversation_id))

    return assistant_response['messages'][-1].content


