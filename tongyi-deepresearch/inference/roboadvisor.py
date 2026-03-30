import os
import httpx
from typing import Optional, Any, Dict
from agno.agent import Agent
from agno.models.openai import OpenAILike
from agno.db.sqlite import SqliteDb
from agno.tools.serper import SerperTools
from datetime import datetime

# Get the current local date and time
now = datetime.now()

# Format it for a system prompt (Example: Thursday, March 26, 2026 at 5:15 PM)
system_time = now.strftime("%A, %B %d, %Y at %I:%M %p")

print(f"Current System Prompt Time: {system_time}")

# Setup the SQLite database
db = SqliteDb(db_file="/tmp/agent_db/data.db")

roboadvisor_agent = Agent(
    model=OpenAILike(
        id=os.getenv("ROBOADVISOR_OPENAI_MODEL", "qwen3-30b-a3b-instruct-2507"),
        api_key=os.getenv("ROBOADVISOR_OPENAI_API_KEY"),
        base_url=os.getenv("ROBOADVISOR_OPENAI_API_BASE"),
    ),
    db=db,
    instructions=[
        "You are a roboadvisor. Answer any questions and offer financial information to guide the user's financial decisions.",
        "When you require information from the web to respond to users' queries, use `google_search` tool."
        "Ensure you have the latest information, do not rely on your own knowledge for price data."
        f"Current datetime: {system_time}"
    ],
    tools=[
        SerperTools(
            api_key=os.getenv("SERPER_KEY_ID")
        ),
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
