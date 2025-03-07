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
from app.utils.url_extractor import extract_urls

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
        history_not_included: List[int] = [None]
    ) -> List[dict]:
        try:
            new_conversation_unit = {"query": query_content}

            # Initialize conversation_history if it's None
            if conversation_history is None:
                conversation_history = []
            print("before appending conversation unit")
            conversation_history.append(new_conversation_unit)
            print("before lanchain message conversions")
            messages = get_langchain_messages(conversation_history)
            print("passed langchain message conversions")
            agent_response = langgraph_agent.invoke({"messages": messages})
            print('&'*15)
            print(agent_response)
            print('^'*15)
            extracted_urls = extract_urls(agent_response)
            print(extracted_urls)
            response_content = agent_response['messages'][-1].content

            query = Query(thread_id=thread_id, user_id=user_id, query_text=query_content, ai_response=response_content)
            self.db.add(query)
            self.db.flush()  # This assigns an ID to the query without committing the transaction

            for url in extracted_urls:
                search_result = SearchResult(query_id=query.query_id, url=url)
                self.db.add(search_result)

            print("parent_query_ids are", parent_query_ids)
            print("history_not_included are", history_not_included)
            print("sgs")

            history_included_bool = []

            # Always add a query relation
            for parent_query_id in parent_query_ids:
                print(parent_query_id)
                print(history_not_included != [None])
                print(parent_query_id in history_not_included)

                if history_not_included != [None] and parent_query_id in history_not_included:
                    query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=parent_query_id, history_included=False)
                    history_included_bool.append(False)
                else:
                    query_relation = QueryRelation(child_query_id=query.query_id, parent_query_id=parent_query_id)
                    history_included_bool.append(True)
                self.db.add(query_relation)

            parent_queries = self.db.query(Query).filter(Query.query_id.in_(parent_query_ids)).all()
            parent_query_texts = [query.query_text for query in parent_queries]        

            conversation_history[-1] = {
                "query_id": query.query_id,
                "parent_query_ids": parent_query_ids,
                "parent_queries": list(zip(
                        parent_query_ids, 
                        parent_query_texts, 
                        history_included_bool
                    )),
                "query": query_content,
                "response": response_content,
                "search_results": extracted_urls 
            }

            print("committed")
            self.db.commit()
            return conversation_history

        except Exception as e:
            print(e)
            # Delete the last entry in the thread table
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

    def get_query_conversation_history(self, query_id: int, just_query_id: bool):
        try:
            print("got query id as",query_id,"and just query value as",just_query_id)
            # First, check if the query exists
            query = self.db.query(Query).filter(Query.query_id == query_id).first()
            if not query:
                raise ValueError(f"The following query ID does not exist: {query_id}")
            
            if just_query_id:
                print("went in the just query block")
                # First, query all relevant QueryRelation objects
                parent_relations = (
                    self.db.query(QueryRelation)
                    .filter(QueryRelation.child_query_id == query.query_id)
                    .options(
                        joinedload(QueryRelation.parent_query)
                    )
                    .all()
                )

                # Initialize the three lists
                parent_query_ids = []
                parent_query_texts = []
                history_included_flags = []

                # Populate the lists
                for relation in parent_relations:
                    parent_query_ids.append(relation.parent_query_id)
                    parent_query_texts.append(relation.parent_query.query_text)
                    history_included_flags.append(relation.history_included)

                search_results = self.db.query(SearchResult).filter(SearchResult.query_id == query.query_id).all()
                search_result_urls = [sr.url for sr in search_results] if search_results else []

                return [{
                        "query_id": query.query_id,
                        "parent_queries": list(zip(
                            parent_query_ids, 
                            parent_query_texts, 
                            history_included_flags
                        )),
                        "query": query.query_text,
                        "response": query.ai_response,
                        "search_results": search_result_urls # List of URLs
                    }]
            else:
                # Recursive CTE to get all ancestors
                QueryCTE = aliased(Query)
                RelationCTE = aliased(QueryRelation)
                recursive_cte = (
                    select(QueryCTE, 
                        func.first_value(RelationCTE.parent_query_id)
                            .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
                            .label('parent_query_id'))
                    .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                    .where(QueryCTE.query_id == query_id)
                    .cte(recursive=True)
                )

                ancestors = recursive_cte.union_all(
                    select(QueryCTE, 
                        func.first_value(RelationCTE.parent_query_id)
                            .over(partition_by=QueryCTE.query_id, order_by=RelationCTE.relationship_id)
                            .label('parent_query_id'))
                    .join(RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id)
                    .join(recursive_cte, recursive_cte.c.parent_query_id == QueryCTE.query_id)
                )

                ParentQuery = aliased(Query)

                # Query to get all ancestors and the original query, ordered from root to leaf
                query_chain = (
                    self.db.query(
                        Query,
                        QueryRelation.parent_query_id, 
                        ParentQuery.query_text.label("parent_query_text"),
                        QueryRelation.history_included
                    )
                    .join(ancestors, ancestors.c.query_id == Query.query_id, isouter=True)
                    .outerjoin(QueryRelation, QueryRelation.child_query_id == Query.query_id)
                    .outerjoin(ParentQuery, ParentQuery.query_id == QueryRelation.parent_query_id)
                    .filter(or_(Query.query_id == query_id, Query.query_id == ancestors.c.query_id))
                    .order_by(ancestors.c.query_id)
                    .all()
                )

                parent_query_id_map = defaultdict(list)
                parent_query_text_map = defaultdict(list)
                history_included_map = defaultdict(list)
                for q, parent_query_id, parent_query_text, history_included in query_chain:
                    if parent_query_id is not None:
                        parent_query_id_map[q.query_id].append(parent_query_id)
                        parent_query_text_map[q.query_id].append(parent_query_text)
                        history_included_map[q.query_id].append(history_included)

                processed_ids = set()
                conversation_history = []
                for q, parent_query_id, parent_query_text, history_included in query_chain:
                    matching_tuple = [t for t in processed_ids if t[0] == q.query_id]
                    if matching_tuple and matching_tuple[0][1] != parent_query_id:
                        continue

                    # Fetch search results
                    search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
                    search_result_urls = [sr.url for sr in search_results] if search_results else []
                    
                    # Create dictionary for this query-response pair
                    conversation_item = {
                        "query_id": q.query_id,
                        "parent_queries": list(zip(
                            parent_query_id_map.get(q.query_id, []), 
                            parent_query_text_map.get(q.query_id, []), 
                            history_included_map.get(q.query_id, [])
                        )),
                        "query": q.query_text,
                        "response": q.ai_response,
                        "search_results": search_result_urls # List of URLs
                    }

                    conversation_history.append(conversation_item)
                    processed_ids.add((q.query_id, parent_query_id))

                return conversation_history
        except Exception as e:
            self.handle_error(e)
    
    def get_thread_conversation_history(self, thread_id: int):
        try:
            query = select(
                QueryRelation.parent_query_id, 
                QueryRelation.child_query_id,
                Query.query_text,
                Query.ai_response
            ).join(
                Query, QueryRelation.child_query_id == Query.query_id
            ).where(
                Query.thread_id == thread_id
            )

            results = self.db.execute(query).fetchall()

            # Use defaultdict to group results by child ID
            grouped_results = defaultdict(lambda: {"parent_query_ids": [], "query_text": "", "ai_response": ""})
            for parent_id, child_id, query_text, ai_response in results:
                grouped_results[child_id]["parent_query_ids"].append(parent_id)
                grouped_results[child_id]["query_text"] = query_text
                grouped_results[child_id]["ai_response"] = ai_response

            # Convert the grouped results to the desired format
            formatted_results = [
                {
                    "child_query_id": child_id,
                    "parent_query_ids": data["parent_query_ids"],
                    "query_text": data["query_text"],
                    "ai_response": data["ai_response"]
                }
                for child_id, data in grouped_results.items()
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

            ParentQuery = aliased(Query)

            # Modified main query to get all parent relationships
            query_chain = (
                self.db.query(
                    Query,
                    QueryRelation.parent_query_id,
                    ancestors.c.depth,
                    func.coalesce(input_order.c.input_order, 9999).label("input_order"),
                    ParentQuery.query_text.label("parent_query_text"),
                    QueryRelation.history_included
                )
                .join(ancestors, ancestors.c.query_id == Query.query_id, isouter=True)
                .outerjoin(QueryRelation, QueryRelation.child_query_id == Query.query_id)
                .outerjoin(input_order, input_order.c.query_id == Query.query_id)
                .outerjoin(ParentQuery, ParentQuery.query_id == QueryRelation.parent_query_id)  # Add this join
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
            parent_query_text_map = defaultdict(list)
            history_included_map = defaultdict(list)
            for q, parent_id, _, _, parent_query_text,history_included in query_chain:
                if parent_id is not None:
                    parent_map[q.query_id].append(parent_id)
                    parent_query_text_map[q.query_id].append(parent_query_text)
                    history_included_map[q.query_id].append(history_included)

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

            # if len(query_ids) == 1:
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
            
            print("query nodes",query_nodes)

            print("remaining nodes",remaining_nodes)

            # Build the conversation tree
            if len(remaining_nodes) == 0:
                conversation_tree = query_nodes
            else:
                conversation_tree = build_conversation_tree(query_nodes, remaining_nodes)

            # print(conversation_tree)

            # for q, parent_query_id, depth, _ in conversation_tree:
            #     print(q.query_id, parent_query_id, depth)

            # Modified conversation history creation
            conversation_history = []
            processed_ids = set()
            for q, parent_query_id, depth, _, _, _ in conversation_tree:
                matching_tuple = [t for t in processed_ids if t[0] == q.query_id]
                if matching_tuple and matching_tuple[0][1] != parent_query_id:
                    continue
                    
                search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
                search_result_urls = [sr.url for sr in search_results] if search_results else []
                
                conversation_item = {
                    "query_id": q.query_id,
                    "parent_queries": list(zip(
                        parent_map.get(q.query_id, []), 
                        parent_query_text_map.get(q.query_id, []), 
                        history_included_map.get(q.query_id, [])
                    )),
                    "query": q.query_text,
                    "response": q.ai_response,
                    "search_results": search_result_urls
                }

                conversation_history.append(conversation_item)
                processed_ids.add((q.query_id, parent_query_id))

            return conversation_history
            # else:
            #     print("conversation history started")

            #     conversation_history = []
            #     processed_ids = set()
            #     for q, parent_query_id, depth, _, _, _ in query_chain:
            #         # Check if this query has already been processed
            #         if q.query_id in [t[0] for t in processed_ids]:
            #             continue
                    
            #         if q.query_id not in query_ids:
            #             continue
                    
            #         search_results = self.db.query(SearchResult).filter(SearchResult.query_id == q.query_id).all()
            #         search_result_urls = [sr.url for sr in search_results] if search_results else []
                    
            #         conversation_item = {
            #             "query_id": q.query_id,
            #             "parent_querys": list(zip(
            #                 parent_map.get(q.query_id, []), 
            #                 parent_query_text_map.get(q.query_id, []), 
            #                 history_included_map.get(q.query_id, [])
            #             )),
            #             "query": q.query_text,
            #             "response": q.ai_response,
            #             "search_results": search_result_urls
            #         }

            #         conversation_history.append(conversation_item)
            #         processed_ids.add((q.query_id, parent_query_id))

            #     print(conversation_history)
            #     return conversation_history

        except Exception as e:
            self.handle_error(e)

        