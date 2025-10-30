import os
import httpx
from agno.agent import Agent
from agno.models.openai import OpenAILike
from agno.db.sqlite import SqliteDb

YDC_API_KEY = os.getenv("YDC_API_KEY")

# Setup the SQLite database
db = SqliteDb(db_file="/tmp/agent_db/data.db")

# Tools powered by YDC
# https://documentation.you.com/api-reference/express
async def ydc_answer(question: str) -> str:
    """This tool answers the user's query with an agent that does research before giving an answer"""
    async with httpx.AsyncClient() as client:
        body = {
            "agent": "express",
            "input": question,
            "stream": False,
        }

        headers = {
            'Authorization': f"Bearer {YDC_API_KEY}",
            'Content-Type': 'application/json'
        }
        
        # 8 minutes
        timeout = httpx.Timeout(10.0, read=480.0)

        response = await client.post("https://api.you.com/v1/agents/runs", 
                                    timeout=timeout,
                                    json=body, 
                                    headers=headers)

        response.raise_for_status()
        results = response.json()

        output = results["output"]
        print(output)
        if len(output) == 0:
            return "Failed to get answer."

        return results["output"][0]["text"]


roboadvisor_agent = Agent(
    model=OpenAILike(
        id="qwen3-30b-a3b-instruct-2507",
        api_key=os.getenv("ROBOADVISOR_OPENAI_API_KEY"),
        base_url=os.getenv("ROBOADVISOR_OPENAI_API_BASE"),
    ),
    db=db,
    instructions=[
        "You are a roboadvisor. Answer any questions and offer financial information to guide the user's financial decisions.",
        "When you require information from the web to respond to users' queries, use `ydc_answer` tool."
    ],
    tools=[
        ydc_answer,
    ],
    add_history_to_context=True,
    num_history_runs=15
)


async def roboadvisor_chat_generator(session_id: str, message: str):
    response = roboadvisor_agent.arun(message, session_id=session_id, stream=True)

    async for chunk in response:
        if chunk.content:
            yield chunk.content


def roboadvisor_get_chat_history(session_id: str):
    try:
        chat_history = roboadvisor_agent.get_chat_history(session_id)
        
        # Remove system prompt
        chat_history = list(filter(lambda item: item.role != "system" and item.role != "tool" and item.content is not None, chat_history))

        # Extract only needed fields
        chat_history = list(map(lambda item: { "id": item.id, "role": item.role, "content": item.content }, chat_history))

        return chat_history

    except:
        print(f"No chat history for session {session_id}")
        return []
