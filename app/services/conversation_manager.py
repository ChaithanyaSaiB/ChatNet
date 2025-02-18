from uuid import UUID
from datetime import datetime
from typing import List, Optional
from typing import Tuple as PyTuple
from sqlalchemy import ARRAY, Integer, desc
from sqlalchemy.orm import Session, joinedload
from app.models.query import Query
from app.models.query_relation import QueryRelation
from app.models.ai_response import AIResponse
from app.models.search_result import SearchResult
from app.services.base_service import BaseService
from app.utils.api_error import APIError
from app.utils.langchain_utils import langgraph_agent
from sqlalchemy import literal, select, func
from sqlalchemy.orm import aliased
from sqlalchemy.sql import union_all
from app.utils.message_conversion import get_langchain_messages
import uuid
from sqlalchemy.dialects.postgresql import array

class ConversationManager(BaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def create_query_with_response(self, thread_id: uuid.UUID, user_id: int, query_content: str) -> PyTuple[Query, AIResponse]:
        try:
            messages = get_langchain_messages(query_content)
            agent_response =langgraph_agent.invoke({"messages": messages})
            response_content=agent_response['messages'][-1].content

            query = Query(thread_id=thread_id, user_id=user_id, query_text=query_content)
            self.db.add(query)
            self.db.flush()  # This assigns an ID to the query without committing the transaction

            response = AIResponse(query_id=query.query_id, response_text=response_content)
            self.db.add(response)

            query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=None)
            self.db.add(query_relation)
            
            self.db.commit()
            return query, response
        except Exception as e:
            self.db.rollback()
            self.handle_error(e)

    def get_latest_query(self, thread_id: UUID):
        try:
            latest_query = (
                self.db.query(Query)
                .filter(Query.thread_id == thread_id)
                .order_by(desc(Query.timestamp))
                .first()
            )
            return latest_query
        except Exception as e:
            self.handle_error(e)


    def get_conversation_history(self, query_id: int):
        try:
            # Check if the query has no parent in the QueryRelation table
            has_parent = self.db.query(QueryRelation).filter(
                    QueryRelation.child_query_id == query_id, 
                    QueryRelation.parent_query_id != None
                ).first() is not None

            if not has_parent:
                # If the query has no parent, fetch the query, its search result, and its response
                result = self.db.query(Query, SearchResult, AIResponse)\
                    .outerjoin(SearchResult, Query.query_id == SearchResult.query_id)\
                    .outerjoin(AIResponse, Query.query_id == AIResponse.query_id)\
                    .filter(Query.query_id == query_id)\
                    .first()

                if result:
                    query, search_result, response = result
                    return {{
                        'query_id': query.query_id,
                        'query_text': query.query_text,
                        'timestamp': query.timestamp,
                        'search_result': {
                            'content': search_result.content,
                            'timestamp': search_result.timestamp
                        } if search_result else None,
                        'response': {
                            'response_text': response.response_text,
                            'timestamp': response.timestamp
                        } if response else None
                    }}
                else:
                    return None
            else:
                # If the query has a parent, return None or implement your desired logic here
                return None

        except Exception as e:
            self.handle_error(e)


                
            