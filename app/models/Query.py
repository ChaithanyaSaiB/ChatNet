from sqlalchemy import UUID, Column, Integer, String, Text, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.query_relation import QueryRelation

class Query(Base):
    __tablename__ = 'queries'

    query_id = Column(Integer, primary_key=True)
    thread_id = Column(Integer, ForeignKey('threads.thread_id'))
    user_id = Column(Integer, ForeignKey('users.user_id'))
    query_text = Column(Text, nullable=False)
    ai_response = Column(Text)
    status = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="queries")
    thread = relationship("Thread", back_populates="queries")
    search_results = relationship("SearchResult", back_populates="query")
    parent_relations = relationship("QueryRelation", foreign_keys="QueryRelation.child_query_id", back_populates="child_query")
    child_relations = relationship("QueryRelation", foreign_keys="QueryRelation.parent_query_id", back_populates="parent_query")
