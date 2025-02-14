from sqlalchemy import Column, Integer, String, Text, DateTime,func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class ConversationMessage(Base):
    __tablename__ = "conversation_messages"
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, index=True)
    role = Column(String)
    message = Column(Text)
    timestamp = Column(DateTime, default=func.now())
