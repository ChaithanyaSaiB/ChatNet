from collections import defaultdict
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from typing import Tuple as PyTuple
from sqlalchemy import ARRAY, Integer, String, case, cast, column, desc, literal_column, nulls_first, or_, text, values
from sqlalchemy.orm import Session, joinedload
from app.models.thread import Thread
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
        query_content: str, 
        conversation_history: Optional[List[dict]] = None,
        parent_query_ids: List[int] = [None],
    ) -> List[dict]:
        try:
            new_conversation_unit = {"query": query_content}

            # Initialize conversation_history if it's None
            if conversation_history is None:
                conversation_history = []

            conversation_history.append(new_conversation_unit)
            messages = get_langchain_messages(conversation_history)

            agent_response = langgraph_agent.invoke({"messages": messages})
            response_content = agent_response['messages'][-1].content

            query = Query(thread_id=thread_id, user_id=user_id, query_text=query_content, ai_response=response_content)
            self.db.add(query)
            self.db.flush()  # This assigns an ID to the query without committing the transaction

            # Always add a query relation
            for parent_query_id in parent_query_ids:
                query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=parent_query_id)
                self.db.add(query_relation)

            conversation_history[-1] = {
                "query_id": query.query_id,
                "parent_query_ids": parent_query_ids,
                "query": query_content,
                "response": response_content,
                "search_results": []  # Add this if you want to maintain consistency with your previous format
            }

            self.db.commit()
            return conversation_history

        except Exception as e:
            # Delete the last entry in the thread table
            self.db.query(Thread).filter(Thread.thread_id == thread_id).delete()
            self.db.rollback()
            self.handle_error(e)

    def get_latest_query_id(self, thread_id: int):
        try:
            latest_query = (
                self.db.query(Query)
                .filter(Query.thread_id == thread_id)
                .order_by(desc(Query.created_at))
                .first()
            )
            return latest_query.query_id
        except Exception as e:
            self.handle_error(e)

    def get_query_conversation_history(self, query_id: int):
        try:
            # First, check if the query exists
            query = self.db.query(Query).filter(Query.query_id == query_id).first()
            if not query:
                return None

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
                self.db.query(Query, QueryRelation.parent_query_id)
                .join(ancestors, ancestors.c.query_id == Query.query_id, isouter=True)
                .outerjoin(QueryRelation, QueryRelation.child_query_id == Query.query_id)
                .filter(or_(Query.query_id == query_id, Query.query_id == ancestors.c.query_id))
                .order_by(ancestors.c.query_id)
                .all()
            )

            conversation_history = []
            for q, parent_query_id in query_chain:
                # Fetch search results
                search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
                search_result_urls = [sr.url for sr in search_results] if search_results else []
                
                # Create dictionary for this query-response pair
                conversation_item = {
                    "query_id": q.query_id,
                    "parent_query_ids": parent_query_id,
                    "query": q.query_text,
                    "response": q.ai_response,
                    "search_results": search_result_urls # List of URLs
                }

                conversation_history.append(conversation_item)
            return conversation_history
        except Exception as e:
            self.handle_error(e)
    
    def get_thread_conversation_history(self, thread_id: int):
        try:
            query = select(QueryRelation.parent_query_id, QueryRelation.child_query_id).join(
                Query, QueryRelation.child_query_id == Query.query_id
            ).where(Query.thread_id == thread_id)

            results = self.db.execute(query).fetchall()

            # Use defaultdict to group parent IDs by child ID
            grouped_results = defaultdict(list)
            for parent_id, child_id in results:
                grouped_results[child_id].append(parent_id)

            # Convert the grouped results to the desired format
            formatted_results = [
                {"parent_query_ids": parent_ids, "child_query_id": child_id}
                for child_id, parent_ids in grouped_results.items()
            ]

            return formatted_results

        except Exception as e:
            print(e)
            self.handle_error(e)
    
    # def get_multiple_query_conversation_history(self, query_ids: List[int], just_query_ids: List[int]):
    #     try:
    #         # Check if the queries exist
    #         existing_queries = self.db.query(Query.query_id).filter(Query.query_id.in_(query_ids)).all()
    #         existing_ids = [q.query_id for q in existing_queries]
    #         if len(existing_ids) != len(query_ids):
    #             missing_ids = set(query_ids) - set(existing_ids)
    #             raise ValueError(f"The following query IDs do not exist: {missing_ids}")

    #         # Create input_order CTE using explicit VALUES
    #         input_order_values = values(
    #             column("query_id", Integer),
    #             column("input_order", Integer),
    #             name="input_order_values"
    #         ).data([(qid, i+1) for i, qid in enumerate(query_ids)])

    #         input_order = select(input_order_values).cte("input_order")

    #         # Recursive CTE remains the same
    #         QueryCTE = aliased(Query)
    #         RelationCTE = aliased(QueryRelation)
    #         recursive_cte = (
    #             select(QueryCTE.query_id, 
    #                 func.first_value(RelationCTE.parent_query_id)
    #                     .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
    #                     .label('parent_query_id'),
    #                 func.cast(0, Integer).label('depth'))
    #             .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
    #             .where(QueryCTE.query_id.in_(query_ids))
    #             .cte(recursive=True)
    #         )

    #         ancestors = recursive_cte.union_all(
    #             select(QueryCTE.query_id, 
    #                 func.first_value(RelationCTE.parent_query_id)
    #                     .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
    #                     .label('parent_query_id'),
    #                 (recursive_cte.c.depth + 1).label('depth'))
    #             .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
    #             .join(recursive_cte, recursive_cte.c.parent_query_id == QueryCTE.query_id)
    #         )


    #         # Modified main query
    #         query_chain = (
    #             self.db.query(
    #                 Query,
    #                 QueryRelation.parent_query_id,
    #                 ancestors.c.depth,
    #                 func.coalesce(input_order.c.input_order, 9999).label("input_order")  # 9999 as high number for ancestors
    #             )
    #             .join(ancestors, ancestors.c.query_id == Query.query_id, isouter=True)
    #             .outerjoin(QueryRelation, QueryRelation.child_query_id == Query.query_id)
    #             .outerjoin(input_order, input_order.c.query_id == Query.query_id)
    #             .filter(or_(Query.query_id.in_(query_ids), Query.query_id == ancestors.c.query_id))
    #             .order_by(
    #                 "input_order",  # Order by original input position first
    #                 ancestors.c.depth  # Then by depth for ancestors
    #             )
    #             .all()
    #         )

    #         # print(query_chain)
    #         for q, parent_query_id, depth, input_order in query_chain:
    #             print(q.query_id, parent_query_id, depth, input_order)
    #         print("-----------------")

    #         query_nodes = []
    #         remaining_nodes = []

    #         for q in query_chain:
    #             if q[2] == 0:
    #                 query_nodes.append(q)
    #             else:
    #                 remaining_nodes.append(q)
            
    #         #print(query_nodes)
    #         #print(remaining_nodes)

    #         def build_subtree(query_node, remaining_nodes, depth, query_path):
    #             depth += 1
    #             child = next((node for node in remaining_nodes if node[0].query_id == query_node[1] and depth == node[2]), None)
    #             if child:
    #                 query_path.append(child)
    #                 build_subtree(child, remaining_nodes, depth, query_path)
    #             return query_path


    #         def build_conversation_tree(query_nodes, remaining_nodes):
    #             conversation_tree = []
    #             for query_node in query_nodes:
    #                 if query_node[0].query_id in just_query_ids:
    #                     conversation_tree.append(query_node)
    #                 else:
    #                     depth = query_node[2]
    #                     query_path = [query_node]
    #                     branch = build_subtree(query_node, remaining_nodes, depth, query_path)
    #                     conversation_tree.extend(branch[::-1])
    #             return conversation_tree


    #         # Build the conversation tree
    #         if len(remaining_nodes) == 0:
    #             conversation_tree = query_nodes
    #         else:
    #             conversation_tree = build_conversation_tree(query_nodes, remaining_nodes)

    #         print(conversation_tree)

    #         for q, parent_query_id, depth, _ in conversation_tree:
    #             print(q.query_id, parent_query_id, depth)

    #         conversation_history = []
    #         processed_ids = set()
    #         for q, parent_query_id, depth, _ in conversation_tree:                            
    #             # Fetch search results
    #             search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
    #             search_result_urls = [sr.url for sr in search_results] if search_results else []
    #             print(parent_query_id)
    #             # Create dictionary for this query-response pair
    #             conversation_item = {
    #                 "query_id": q.query_id,
    #                 "parent_query_ids": parent_query_id,
    #                 "query": q.query_text,
    #                 "response": q.ai_response,
    #                 "search_results": search_result_urls
    #             }

    #             conversation_history.append(conversation_item)
    #             processed_ids.add(q.query_id)

    #         return conversation_history

    #     except Exception as e:
    #         self.handle_error(e)

    def get_multiple_query_conversation_history(self, query_ids: List[int], just_query_ids: List[int]):
        try:
            # Check if the queries exist
            existing_queries = self.db.query(Query.query_id).filter(Query.query_id.in_(query_ids)).all()
            existing_ids = [q.query_id for q in existing_queries]
            if len(existing_ids) != len(query_ids):
                missing_ids = set(query_ids) - set(existing_ids)
                raise ValueError(f"The following query IDs do not exist: {missing_ids}")

            # Create input_order CTE using explicit VALUES
            input_order_values = values(
                column("query_id", Integer),
                column("input_order", Integer),
                name="input_order_values"
            ).data([(qid, i+1) for i, qid in enumerate(query_ids)])

            input_order = select(input_order_values).cte("input_order")
            
            # Recursive CTE remains the same
            QueryCTE = aliased(Query)
            RelationCTE = aliased(QueryRelation)
            recursive_cte = (
                select(QueryCTE.query_id, 
                    func.first_value(RelationCTE.parent_query_id)
                        .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
                        .label('parent_query_id'),
                    func.cast(0, Integer).label('depth'))
                .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                .where(QueryCTE.query_id.in_(query_ids))
                .cte(recursive=True)
            )

            ancestors = recursive_cte.union_all(
                select(QueryCTE.query_id, 
                    func.first_value(RelationCTE.parent_query_id)
                        .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
                        .label('parent_query_id'),
                    (recursive_cte.c.depth + 1).label('depth'))
                .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                .join(recursive_cte, recursive_cte.c.parent_query_id == QueryCTE.query_id)
            )


            # Modified main query to get all parent relationships
            query_chain = (
                self.db.query(
                    Query,
                    QueryRelation.parent_query_id,  # Keep individual parent IDs
                    ancestors.c.depth,
                    func.coalesce(input_order.c.input_order, 9999).label("input_order")
                )
                .join(ancestors, ancestors.c.query_id == Query.query_id, isouter=True)
                .outerjoin(QueryRelation, QueryRelation.child_query_id == Query.query_id)
                .outerjoin(input_order, input_order.c.query_id == Query.query_id)
                .filter(or_(Query.query_id.in_(query_ids), Query.query_id == ancestors.c.query_id))
                .order_by(
                    case(
                        (len(query_ids) == 1, QueryRelation.relationship_id),
                        else_=9999
                    ),
                    "input_order",
                    ancestors.c.depth
                )
                .all()
            )

            # Build map of all parent relationships
            parent_map = defaultdict(list)
            for q, parent_id, _, _ in query_chain:
                if parent_id is not None:
                    parent_map[q.query_id].append(parent_id)

            # print(query_chain)
            # for q, parent_query_id, depth, input_order in query_chain:
            #     print(q.query_id, parent_query_id, depth, input_order)
            # print("-----------------")

            query_nodes = []
            remaining_nodes = []

            for q in query_chain:
                if q[2] == 0:
                    query_nodes.append(q)
                else:
                    remaining_nodes.append(q)
            
            #print(query_nodes)
            #print(remaining_nodes)

            def build_subtree(query_node, remaining_nodes, depth, query_path):
                depth += 1
                child = next((node for node in remaining_nodes if node[0].query_id == query_node[1] and depth == node[2]), None)
                if child:
                    query_path.append(child)
                    build_subtree(child, remaining_nodes, depth, query_path)
                return query_path


            def build_conversation_tree(query_nodes, remaining_nodes):
                conversation_tree = []
                for query_node in query_nodes:
                    if query_node[0].query_id in just_query_ids:
                        conversation_tree.append(query_node)
                    else:
                        depth = query_node[2]
                        query_path = [query_node]
                        branch = build_subtree(query_node, remaining_nodes, depth, query_path)
                        conversation_tree.extend(branch[::-1])
                return conversation_tree


            # Build the conversation tree
            if len(remaining_nodes) == 0:
                conversation_tree = query_nodes
            else:
                conversation_tree = build_conversation_tree(query_nodes, remaining_nodes)

            #print(conversation_tree)

            # for q, parent_query_id, depth, _ in conversation_tree:
            #     print(q.query_id, parent_query_id, depth)

            # Modified conversation history creation
            conversation_history = []
            processed_ids = set()
            for q, parent_query_id, depth, _ in conversation_tree:
                matching_tuple = [t for t in processed_ids if t[0] == q.query_id]
                if matching_tuple and matching_tuple[0][1] != parent_query_id:
                    continue
                    
                search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
                search_result_urls = [sr.url for sr in search_results] if search_results else []
                
                conversation_item = {
                    "query_id": q.query_id,
                    "parent_query_ids": parent_map.get(q.query_id, []),  # Use mapped parents
                    "query": q.query_text,
                    "response": q.ai_response,
                    "search_results": search_result_urls
                }

                conversation_history.append(conversation_item)
                processed_ids.add((q.query_id, parent_query_id))

            return conversation_history

        except Exception as e:
            self.handle_error(e)

        