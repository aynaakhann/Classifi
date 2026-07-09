import os

from dotenv import load_dotenv

load_dotenv()

# Generic OpenAI-compatible chat endpoint. Fireworks and a self-hosted vLLM
# server both speak this exact protocol, so switching engines is a .env edit,
# never a code change.
LLM_API_KEY = os.environ["LLM_API_KEY"]
LLM_MODEL = os.getenv("LLM_MODEL", "accounts/fireworks/models/kimi-k2p6")
LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL", "https://api.fireworks.ai/inference/v1/chat/completions"
)

# "fireworks-fallback" today; set to "amd-self-hosted" once LLM_BASE_URL points
# at the vLLM server on AMD Developer Cloud — the API response echoes this back
# so the demo/dashboard can honestly show which engine actually answered.
ENGINE_LABEL = os.getenv("ENGINE_LABEL", "fireworks-fallback")
