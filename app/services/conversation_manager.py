from collections import defaultdict
from typing import List, Optional
from sqlalchemy import desc, or_, select, func
from sqlalchemy.orm import Session, joinedload, aliased
from app.models.query import Query
from app.models.query_relation import QueryRelation
from app.models.search_result import SearchResult
from app.services.base_service import BaseService
from app.utils.langchain_utils import langgraph_agent
from app.utils.message_conversion import get_langchain_messages
from app.utils.url_extractor import extract_urls


class ConversationManager(BaseService):
    """
    Manages conversation-related operations, including creating queries,
    retrieving conversation history, and handling user interactions.
    """

    def __init__(self, db: Session):
        """
        Initializes the ConversationManager with a database session.

        Args:
            db (Session): The SQLAlchemy database session.
        """
        super().__init__(db)

    def create_query_with_response(
        self,
        thread_id: int,
        user_id: int,
        query_content: str,
        conversation_history: Optional[List[dict]] = None,
        parent_query_ids: List[int] = [None],
        history_not_included: List[int] = [None],
    ) -> List[dict]:
        """
        Creates a new query, generates a response using a language model agent,
        extracts URLs from the response, and saves the query and related data
        to the database.

        Args:
            thread_id (int): The ID of the thread the query belongs to.
            user_id (int): The ID of the user who initiated the query.
            query_content (str): The text content of the query.
            conversation_history (Optional[List[dict]], optional): A list of previous
                conversation turns. Defaults to None.
            parent_query_ids (List[int], optional): A list of IDs of parent queries.
                Defaults to [None].
            history_not_included (List[int], optional): A list of parent query IDs to
                exclude from the history. Defaults to [None].

        Returns:
            List[dict]: The updated conversation history including the new query and response.
        """
        try:
            new_conversation_unit = {"query": query_content}

            if conversation_history is None:
                conversation_history = []
            conversation_history.append(new_conversation_unit)
            messages = get_langchain_messages(conversation_history)
            agent_response = langgraph_agent.invoke({"messages": messages})
            extracted_urls = extract_urls(agent_response)
            response_content = agent_response["messages"][-1].content

            query = Query(
                thread_id=thread_id,
                user_id=user_id,
                query_text=query_content,
                ai_response=response_content,
            )
            self.db.add(query)
            self.db.flush()

            for url in extracted_urls:
                search_result = SearchResult(query_id=query.query_id, url=url)
                self.db.add(search_result)

            history_included_bool = []

            for parent_query_id in parent_query_ids:
                if (
                    history_not_included != [None]
                    and parent_query_id in history_not_included
                ):
                    query_relation = QueryRelation(
                        child_query_id=query.query_id,
                        parent_query_id=parent_query_id,
                        history_included=False,
                    )
                    history_included_bool.append(False)
                else:
                    query_relation = QueryRelation(
                        child_query_id=query.query_id,
                        parent_query_id=parent_query_id,
                    )
                    history_included_bool.append(True)
                self.db.add(query_relation)

            parent_queries = (
                self.db.query(Query).filter(Query.query_id.in_(parent_query_ids)).all()
            )
            parent_query_texts = [query.query_text for query in parent_queries]

            conversation_history[-1] = {
                "query_id": query.query_id,
                "parent_query_ids": parent_query_ids,
                "parent_queries": list(
                    zip(parent_query_ids, parent_query_texts, history_included_bool)
                ),
                "query": query_content,
                "response": response_content,
                "search_results": extracted_urls,
            }

            self.db.commit()
            return conversation_history

        except Exception as e:
            self.handle_error(e)

    def get_latest_query_id(self, thread_id: int):
        """
        Retrieves the ID of the most recent query in a given thread.

        Args:
            thread_id (int): The ID of the thread.

        Returns:
            int: The query_id of the latest query, or None if no queries exist in the thread.
        """
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
        """
        Retrieves the conversation history for a specific query, either as a
        single-turn history or a multi-turn history including all ancestor queries.

        Args:
            query_id (int): The ID of the query to retrieve history for.
            just_query_id (bool): If True, returns only the immediate parent queries;
                if False, returns the entire conversation history.

        Returns:
            List[dict]: A list of dictionaries representing the conversation history.
        """
        try:
            query = self.db.query(Query).filter(Query.query_id == query_id).first()
            if not query:
                raise ValueError(f"The following query ID does not exist: {query_id}")

            if just_query_id:
                parent_relations = (
                    self.db.query(QueryRelation)
                    .filter(QueryRelation.child_query_id == query.query_id)
                    .options(joinedload(QueryRelation.parent_query))
                    .all()
                )

                parent_query_ids = []
                parent_query_texts = []
                history_included_flags = []

                for relation in parent_relations:
                    parent_query_ids.append(relation.parent_query_id)
                    parent_query_texts.append(relation.parent_query.query_text)
                    history_included_flags.append(relation.history_included)

                search_results = (
                    self.db.query(SearchResult)
                    .filter(SearchResult.query_id == query.query_id)
                    .all()
                )
                search_result_urls = (
                    [sr.url for sr in search_results] if search_results else []
                )

                return [
                    {
                        "query_id": query.query_id,
                        "parent_queries": list(
                            zip(
                                parent_query_ids,
                                parent_query_texts,
                                history_included_flags,
                            )
                        ),
                        "query": query.query_text,
                        "response": query.ai_response,
                        "search_results": search_result_urls,
                    }
                ]
            else:
                QueryCTE = aliased(Query)
                RelationCTE = aliased(QueryRelation)
                recursive_cte = (
                    select(
                        QueryCTE,
                        func.first_value(RelationCTE.parent_query_id)
                        .over(
                            partition_by=QueryCTE.query_id,
                            order_by=RelationCTE.relationship_id,
                        )
                        .label("parent_query_id"),
                    )
                    .join(
                        RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id
                    )
                    .where(QueryCTE.query_id == query_id)
                    .cte(recursive=True)
                )

                ancestors = recursive_cte.union_all(
                    select(
                        QueryCTE,
                        func.first_value(RelationCTE.parent_query_id)
                        .over(
                            partition_by=QueryCTE.query_id,
                            order_by=RelationCTE.relationship_id,
                        )
                        .label("parent_query_id"),
                    )
                    .join(
                        RelationCTE, RelationCTE.child_query_id == QueryCTE.query_id
                    )
                    .join(
                        recursive_cte,
                        recursive_cte.c.parent_query_id == QueryCTE.query_id,
                    )
                )

                ParentQuery = aliased(Query)

                query_chain = (
                    self.db.query(
                        Query,
                        QueryRelation.parent_query_id,
                        ParentQuery.query_text.label("parent_query_text"),
                        QueryRelation.history_included,
                    )
                    .join(
                        ancestors,
                        ancestors.c.query_id == Query.query_id,
                        isouter=True,
                    )
                    .outerjoin(
                        QueryRelation,
                        QueryRelation.child_query_id == Query.query_id,
                    )
                    .outerjoin(
                        ParentQuery,
                        ParentQuery.query_id == QueryRelation.parent_query_id,
                    )
                    .filter(
                        or_(
                            Query.query_id == query_id,
                            Query.query_id == ancestors.c.query_id,
                        )
                    )
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
                    matching_tuple = [
                        t for t in processed_ids if t[0] == q.query_id
                    ]
                    if matching_tuple and matching_tuple[0][1] != parent_query_id:
                        continue

                    search_results = (
                        self.db.query(SearchResult)
                        .filter(SearchResult.query_id == q.query_id)
                        .all()
                    )
                    search_result_urls = (
                        [sr.url for sr in search_results] if search_results else []
                    )

                    conversation_item = {
                        "query_id": q.query_id,
                        "parent_queries": list(
                            zip(
                                parent_query_id_map.get(q.query_id, []),
                                parent_query_text_map.get(q.query_id, []),
                                history_included_map.get(q.query_id, []),
                            )
                        ),
                        "query": q.query_text,
                        "response": q.ai_response,
                        "search_results": search_result_urls,
                    }

                    conversation_history.append(conversation_item)
                    processed_ids.add((q.query_id, parent_query_id))

                return conversation_history
        except Exception as e:
            self.handle_error(e)

    def get_thread_conversation_history(self, thread_id: int):
        """
        Retrieves the conversation history for a given thread.

        Args:
            thread_id (int): The ID of the thread.

        Returns:
            List[dict]: A list of dictionaries representing the conversation history of the thread.
        """
        try:
            query = (
                select(
                    QueryRelation.parent_query_id,
                    QueryRelation.child_query_id,
                    Query.query_text,
                    Query.ai_response,
                )
                .join(Query, QueryRelation.child_query_id == Query.query_id)
                .where(Query.thread_id == thread_id)
            )

            results = self.db.execute(query).fetchall()

            grouped_results = defaultdict(
                lambda: {
                    "parent_query_ids": [],
                    "query_text": "",
                    "ai_response": "",
                }
            )
            for parent_id, child_id, query_text, ai_response in results:
                grouped_results[child_id]["parent_query_ids"].append(parent_id)
                grouped_results[child_id]["query_text"] = query_text
                grouped_results[child_id]["ai_response"] = ai_response

            formatted_results = [
                {
                    "child_query_id": child_id,
                    "parent_query_ids": data["parent_query_ids"],
                    "query_text": data["query_text"],
                    "ai_response": data["ai_response"],
                }
                for child_id, data in grouped_results.items()
            ]

            return formatted_results

        except Exception as e:
            self.handle_error(e)
