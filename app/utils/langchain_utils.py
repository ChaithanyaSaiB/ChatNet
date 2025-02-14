from langgraph.graph import StateGraph, START, END
from app.models.pydantic_models import State
from app.services.llm_service import call_model, should_continue
from app.core.llm_config import tool_node

def create_agent():
    # Create the graph
    graph = StateGraph(State)

    graph.add_node("agent", call_model)
    graph.add_node("tools", tool_node)

    graph.add_edge("__start__", "agent")
    graph.add_conditional_edges(
        "agent",
        should_continue,
    )
    graph.add_edge("tools", 'agent')

    # Compile the graph
    chain = graph.compile()
    return chain
