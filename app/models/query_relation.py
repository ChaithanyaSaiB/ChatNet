from sqlalchemy import Boolean, Column, Integer, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class QueryRelation(Base):
    """
    Query Relationship Model:
    Manages hierarchical relationships between query entities in a self-referential
    structure. Enables parent-child query associations with historical tracking.
    """
    __tablename__ = 'query_relations'  # Database table name

    # Primary key for unique relationship identification
    relationship_id = Column(Integer, primary_key=True)

    # Parent query reference (foreign key to queries table)
    parent_query_id = Column(Integer, ForeignKey('queries.query_id'))

    # Child query reference (foreign key to queries table)
    child_query_id = Column(Integer, ForeignKey('queries.query_id'))

    # Flag to control historical visibility of relationships
    history_included = Column(Boolean, default=True)

    # Relationship to parent query (self-referential)
    parent_query = relationship(
        "Query",
        foreign_keys=[parent_query_id],
        back_populates="child_relations"  # Mirrors relationship in Query model
    )

    # Relationship to child query (self-referential)
    child_query = relationship(
        "Query",
        foreign_keys=[child_query_id],
        back_populates="parent_relations"  # Mirrors relationship in Query model
    )
