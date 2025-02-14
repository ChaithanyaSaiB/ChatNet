# Custom persistence layer abstraction using PostgreSQL
import uuid
from sqlalchemy.orm import Session
from app.models.conversation_message import ConversationMessage
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

class PostgresChatMemory:
    def __init__(self, db: Session):
        self.db = db

    def add_message(self, role: str, message: str, conversation_id: str = None):
        db_message = ConversationMessage(
            conversation_id=uuid.UUID(conversation_id) if conversation_id else uuid.uuid4(),
            role=role,
            message=message
        )
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def get_history(self, conversation_id: str):
        messages = (
            self.db.query(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation_id)
            .order_by(ConversationMessage.timestamp)
            .all()
        )

        # Convert SQLAlchemy objects into LangChain message objects
        return [self._convert_to_langchain_message(msg) for msg in messages]

    def _convert_to_langchain_message(self, msg: ConversationMessage) -> BaseMessage:
        """Converts a ConversationMessage to a LangChain BaseMessage."""
        if msg.role == "human":
            return HumanMessage(content=msg.message)
        elif msg.role == "assistant":
            return AIMessage(content=msg.message)
        elif msg.role == "system":
            return SystemMessage(content=msg.message)
        else:
            return BaseMessage(content=msg.message)  # Default fallback