from sqlalchemy import Column, BigInteger, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AIResponse(Base):
    __tablename__ = "ai_responses"
    response_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    query_id = Column(BigInteger, ForeignKey('queries.query_id'), nullable=False, index=True)
    response_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())

    # Add relationship
    query = relationship("Query", back_populates="ai_responses")
