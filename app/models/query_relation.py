from sqlalchemy import Boolean, Column, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class QueryRelation(Base):
    __tablename__ = 'query_relations'

    relationship_id = Column(Integer, primary_key=True)
    parent_query_id = Column(Integer, ForeignKey('queries.query_id'))
    child_query_id = Column(Integer, ForeignKey('queries.query_id'))
    history_included = Column(Boolean, default=True)

    parent_query = relationship("Query", foreign_keys=[parent_query_id], back_populates="child_relations")
    child_query = relationship("Query", foreign_keys=[child_query_id], back_populates="parent_relations")
    
