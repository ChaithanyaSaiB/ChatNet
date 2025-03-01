from langgraph.graph import StateGraph, START, END
from app.models.pydantic_models import State
from app.core.llm_config import tool_node
from app.core.llm_config import llm, tavily_search
from langchain_core.messages import SystemMessage
from typing import Literal

system_prompt = """
    You are an AI chat assistant. Follow these guidelines:
    1. Engage in natural conversation with users.
    2. Use tools for additional information when needed, especially for current events or recent data.
    3. Provide informative responses, using existing knowledge when possible.
    4. Mention tool usage only if relevant to the conversation.
    5. Express uncertainty when appropriate and suggest verification.
    6. Adapt your tone to the user's style.
    7. Ask clarifying questions when needed.
    8. Output must be well formatted markdown format that is intuitive to understand content at a glance and use all the text formatting as necessary to hightlight and emphasize content

    Aim for meaningful conversation while providing accurate, helpful information.
"""

def should_continue(state: State) -> Literal["tools", "__end__"]:
    messages = state['messages']
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return "__end__"

def call_model(state: State):
    messages = state['messages']
    system_message = SystemMessage(content=system_prompt.replace('\n',''))
    messages = [system_message] + messages

    response = llm.invoke(messages)
    print("Call model's response:", response)
    return {"messages": [response]}

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

langgraph_agent = create_agent()
