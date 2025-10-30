import os
import asyncio
import time
from io import BytesIO
from fastapi import FastAPI, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn

from roboadvisor import roboadvisor_chat_generator, roboadvisor_get_chat_history
from react_agent import MultiTurnReactAgent
from markdown_to_docx import markdown_to_docx

app = FastAPI()

class QuestionRequest(BaseModel):
    question: str

class RoboadvisorRequest(BaseModel):
    message: str


session_id_header_key = 'X-Session-Id'


def iter_bytes(data: bytes, chunk_size: int = 1024):
    """Generator to yield bytes in chunks."""
    buf = BytesIO(data)
    while chunk := buf.read(chunk_size):
        yield chunk


async def async_iter_bytes(data: bytes, chunk_size: int = 1024):
    """
    An iterator that's nice to the event loop, giving way for other requests to run as it streams.
    """
    buf = BytesIO(data)
    while chunk := buf.read(chunk_size):
        yield chunk
        await asyncio.sleep(0)  # yield to event loop


async def generate_prediction(question: str):
    task = {
        "item": {
            "question": question,
            "answer": ""
        },
        "rollout_idx": 1,
        "planning_port": 0,  # Ignored
    } 

    model = os.getenv("MODEL_PATH", "")

    llm_cfg = {
        'model': model,
        'generate_cfg': {
            'max_input_tokens': 32000,
            'max_retries': 10,
            'temperature': float(os.getenv("TEMPERATURE", 0.85)),
            'top_p': 0.95,
            'presence_penalty': float(os.getenv("PRESENCE_PENALTY", 1.1))
        },
        'model_type': 'qwen_dashscope'
    }

    agent = MultiTurnReactAgent(
        llm=llm_cfg,
        function_list=["search", "visit", "google_scholar"]
    )

    result = await agent._run(task, model)
    success = result.get("termination") == "answer"

    if not success:
        print(f'Unable to complete run: {result.get("termination")}')
    
    return {
        "prediction": result["prediction"] if success else "Unknown error in generating content."
    }


@app.post("/generate")
async def research(body: QuestionRequest):
    """
    Returns an answer to a given question or topic in JSON format.
    
    Returns:
        prediction: str
    """
    result = await generate_prediction(body.question)
    return result


@app.post("/report")
async def report(body: QuestionRequest):
    """Generates a docx report for a given question or topic."""

    ### Uncomment the following 2 lines, and comment out the generate_prediction call to test docx styling
    # from test_scripts.test_markdown_to_docx import test_markdown
    # result = {"prediction": test_markdown}

    result = await generate_prediction(body.question)
    buffer = markdown_to_docx(result["prediction"], None)
    assert isinstance(buffer, bytes)

    timestamp = int(time.time())
    headers = {
        "Content-Disposition": f'attachment; filename="{timestamp}.docx"'
    }

    return StreamingResponse(
        async_iter_bytes(buffer),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers
    )

@app.get("/roboadvisor")
async def roboadvisor_chat_history(x_session_id: str = Header()):
    session_id = x_session_id
    print(f"SESSION ID: {session_id}")
    chat_history = roboadvisor_get_chat_history(session_id)
    
    return {
        "messages": chat_history
    }

@app.post("/roboadvisor")
async def roboadvisor_send_message(body: RoboadvisorRequest, x_session_id: str = Header()):
    message = body.message
    session_id = x_session_id
    generator = roboadvisor_chat_generator(session_id, message)

    return StreamingResponse(generator, media_type="application/json")
    

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description="Run the API server")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to run the server on")
    parser.add_argument("--port", type=int, default=8000, help="Port to run the server on")
    parser.add_argument("--reload", action="store_true", default=False, help="Port to run the server on")
    
    args = parser.parse_args()
    
    uvicorn.run(app="api_server:app", host=args.host, port=args.port, reload=args.reload)