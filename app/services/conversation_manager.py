from uuid import UUID
from datetime import datetime
from typing import List, Optional
from typing import Tuple as PyTuple
from sqlalchemy import ARRAY, Integer, desc
from sqlalchemy.orm import Session, joinedload
from app.models.query import Query
from app.models.query_relation import QueryRelation
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

    def create_query_with_response(
        self, 
        thread_id: int, 
        user_id: int,
        parent_query_id: int,
        query_content: str, 
        conversation_history: Optional[List[str]] = None
    ) -> PyTuple[Query]:
        try:
            new_dialogue = { "role": "user", "content": query_content }

            # If conversation_history is provided, include it in the messages
            if conversation_history:
                conversation_history.append(new_dialogue)
                messages = get_langchain_messages(conversation_history)
            else:
                messages = get_langchain_messages([new_dialogue])

            agent_response = langgraph_agent.invoke({"messages": messages})
            response_content = agent_response['messages'][-1].content

            query = Query(thread_id=thread_id, user_id=user_id, query_text=query_content, ai_response=response_content)
            self.db.add(query)
            self.db.flush()  # This assigns an ID to the query without committing the transaction

            # If this is not the first query in the thread, set the parent_query_id
            if conversation_history:
                query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=parent_query_id)
                self.db.add(query_relation)
            else:
                # If there's no conversation history, add a query relation with null parent_query_id
                query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=None)
                self.db.add(query_relation)

            self.db.commit()
            return query

        except Exception as e:
            self.db.rollback()
            self.handle_error(e)

    def get_latest_query(self, thread_id: UUID):
        try:
            latest_query = (
                self.db.query(Query)
                .filter(Query.thread_id == thread_id)
                .order_by(desc(Query.created_at))
                .first()
            )
            return latest_query
        except Exception as e:
            self.handle_error(e)

    def get_conversation_history(self, query_id: int):
        try:
            # First, check if the query exists
            query = self.db.query(Query).filter(Query.query_id == query_id).first()
            if not query:
                return None

            # Check if the query has a parent in the QueryRelation table
            has_parent = self.db.query(QueryRelation).filter(
                QueryRelation.child_query_id == query_id, 
                QueryRelation.parent_query_id != None
            ).first() is not None

            if not has_parent:
                # If the query has no parent, fetch the query and all its search results
                search_results = self.db.query(SearchResult).filter(SearchResult.query_id == query_id).all()
                
                return [{
                    'role': 'user',
                    'content': query.query_text
                }, {
                    'role': 'ai',
                    'content': query.ai_response
                }] + ([{
                    'role': 'system',
                    'content': "Search Results:\n" + "\n".join([f"URL: {sr.url}\nContent: {sr.content}" for sr in search_results])
                }] if search_results else [])

            else:
                # Recursive CTE to get all ancestors
                QueryCTE = aliased(Query)
                RelationCTE = aliased(QueryRelation)
                recursive_cte = (
                    select(QueryCTE, RelationCTE.parent_query_id)
                    .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                    .where(QueryCTE.query_id == query_id)
                    .cte(recursive=True)
                )

                ancestors = recursive_cte.union_all(
                    select(QueryCTE, RelationCTE.parent_query_id)
                    .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                    .join(recursive_cte, recursive_cte.c.parent_query_id == QueryCTE.query_id)
                )

                # Query to get all ancestors and the original query, ordered from root to leaf
                query_chain = (
                    self.db.query(Query)
                    .join(ancestors, ancestors.c.query_id == Query.query_id)
                    .order_by(ancestors.c.query_id)
                    .all()
                )

                # If no ancestors found, just use the original query
                if not query_chain:
                    query_chain = [query]

                conversation_history = []
                for q in query_chain:
                    # Add user query
                    conversation_history.append({
                        "role": "user",
                        "content": q.query_text
                    })
                    
                    # Add AI response
                    conversation_history.append({
                        "role": "ai",
                        "content": q.ai_response
                    })

                    # Fetch and add search results
                    search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
                    if search_results:
                        search_results_content = "\n".join([f"URL: {sr.url}\nContent: {sr.content}" for sr in search_results])
                        conversation_history.append({
                            "role": "system",
                            "content": f"Search Results:\n{search_results_content}"
                        })

                return conversation_history

        except Exception as e:
            self.handle_error(e)



                    
                