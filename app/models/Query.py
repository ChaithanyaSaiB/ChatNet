from sqlalchemy import UUID, Column, BigInteger, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.query_relation import QueryRelation

class Query(Base):
    __tablename__ = "queries"
    query_id = Column(BigInteger, primary_key=True, index=True)
    thread_id = Column(UUID(as_uuid=True), ForeignKey('threads.thread_id'), nullable=False, index=True)  # Changed to BigInteger
    user_id = Column(BigInteger, ForeignKey('users.user_id'), nullable=False, index=True)  # Changed to BigInteger
    query_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now())
    status = Column(String(20), default="pending", index=True)

    # Add relationships
    thread = relationship("Thread", back_populates="queries")
    user = relationship("User", back_populates="queries")
    search_results = relationship("SearchResult", back_populates="query")
    ai_responses = relationship("AIResponse", back_populates="query")
    child_relations = relationship("QueryRelation", foreign_keys=[QueryRelation.parent_query_id], back_populates="parent_query")
    parent_relations = relationship("QueryRelation", foreign_keys=[QueryRelation.child_query_id], back_populates="child_query")

