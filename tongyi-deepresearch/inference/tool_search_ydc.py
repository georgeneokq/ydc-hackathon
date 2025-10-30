import json
from concurrent.futures import ThreadPoolExecutor
from typing import List, Union
import requests
from qwen_agent.tools.base import BaseTool, register_tool
import asyncio
from typing import Dict, List, Optional, Union
import uuid
import http.client
import json
import httpx

import os


YDC_API_KEY = os.environ.get("YDC_API_KEY")


@register_tool("search", allow_overwrite=True)
class Search(BaseTool):
    name = "search"
    description = "Performs batched web searches: supply an array 'query'; the tool retrieves the top 10 results for each query in one call."
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Array of query strings. Include multiple complementary search queries in a single call."
            },
        },
        "required": ["query"],
    }

    def __init__(self, cfg: Optional[dict] = None):
        super().__init__(cfg)

    async def search_with_ydc(self, query: str):
        # Prepare parameters for You.com API
        # TODO: Maybe handle region detection using LLM
        params = {
            "query": query,
            "count": 10,
            "country": "US"
        }
        
        headers = {
            'X-API-Key': YDC_API_KEY,
            'Content-Type': 'application/json'
        }
        
        results = {}
        for i in range(5):
            try:
                async with httpx.AsyncClient() as client:
                    print("Calling YDC")
                    response = await client.get("https://api.ydc-index.io/v1/search", 
                                               params=params, 
                                               headers=headers)
                    print("Called YDC")
                    response.raise_for_status()
                    results = response.json()
                    break
            except Exception as e:
                print(e)
                if i == 4:
                    return f"You.com search Timeout, return None, Please try again later."
                continue
    
        # TODO: Handle "news" parameter. Currently only "web"
        # https://documentation.you.com/api-reference/search
        try:
            web_snippets = list()
            idx = 0
            results = results["results"]
            print("YDC RESULTS")
            print(results)
            if "web" in results:
                for page in results["web"]:
                    idx += 1
                    date_published = ""
                    if "page_age" in page:
                        date_published = "\nDate published: " + str(page["page_age"])

                    source = ""
                    if "url" in page:
                        source = "\nSource: " + page["url"]

                    snippet = ""
                    if "snippets" in page:
                        snippet = "\n" + "\n".join(page["snippets"])

                    title = page.get("title", "No Title")
                    url = page.get("url", "")

                    redacted_version = f"{idx}. [{title}]({url}){date_published}{source}\n{snippet}"
                    redacted_version = redacted_version.replace("Your browser can't play this video.", "")
                    web_snippets.append(redacted_version)

            content = f"A You.com search for '{query}' found {len(web_snippets)} results:\n\n## Web Results\n" + "\n\n".join(web_snippets)
            print(content)
            return content
        except Exception:
            import traceback
            traceback.print_exc()
            return f"No results found for '{query}'. Try with a more general query."

    async def call(self, params: dict, **kwargs) -> str:
        try:
            query = params["query"]
        except:
            return "[Search] Invalid request format: Input must be a JSON object containing 'query' field"
        
        if isinstance(query, str):
            # 单个查询
            response = await self.search_with_ydc(query)
        else:
            # 多个查询
            assert isinstance(query, List)
            # Run all queries in parallel using asyncio.gather
            tasks = [self.search_with_ydc(q) for q in query]
            responses = await asyncio.gather(*tasks)
            response = "\n=======\n".join(responses)
            
        return response

