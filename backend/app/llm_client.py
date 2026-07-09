import httpx

from .config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL


def call_llm(messages: list[dict], temperature: float = 0.2) -> str:
    response = httpx.post(
        LLM_BASE_URL,
        headers={
            "Authorization": f"Bearer {LLM_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": LLM_MODEL,
            "messages": messages,
            "temperature": temperature,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
