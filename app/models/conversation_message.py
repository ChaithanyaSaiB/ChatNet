from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

# Define the ConversationMessage model, representing a table in the database
class ConversationMessage(Base):
    """
    ConversationMessage Model:
    Represents a message within a conversation. Each message has an ID,
    is associated with a specific conversation, and includes metadata such as
    the sender's role, the message content, and a timestamp.
    """
    __tablename__ = "conversation_messages"  # Name of the database table

    # Primary key column for uniquely identifying each message
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key to associate this message with a specific conversation
    # UUID is used to ensure globally unique identifiers
    conversation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, index=True)

    # Role of the sender
    role = Column(String)

    # The actual content of the message
    message = Column(Text)

    # Timestamp indicating when the message was created
    # Defaults to the current time when the record is inserted
    timestamp = Column(DateTime, default=func.now())
