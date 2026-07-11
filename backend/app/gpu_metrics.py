import re

import httpx

from .config import ENGINE_LABEL, LLM_BASE_URL

# vLLM's OpenAI-compatible server exposes Prometheus metrics on the same host,
# at /metrics instead of /v1/chat/completions. We only ever query this when
# ENGINE_LABEL says we're actually self-hosted — never fabricate GPU numbers
# while running on the Fireworks fallback.
_METRICS_OF_INTEREST = {
    "vllm:avg_generation_throughput_toks_per_s": "tokens_per_sec",
    "vllm:num_requests_running": "requests_running",
    "vllm:num_requests_waiting": "requests_waiting",
    "vllm:gpu_cache_usage_perc": "gpu_cache_usage_pct",
}


def get_gpu_metrics() -> dict:
    if ENGINE_LABEL != "amd-self-hosted":
        return {
            "available": False,
            "engine": ENGINE_LABEL,
            "message": (
                "Inference is active through Fireworks AI on AMD-hosted models. "
                "Provider-managed GPU telemetry is not exposed through the API."
            ),
        }

    metrics_url = LLM_BASE_URL.replace("/v1/chat/completions", "/metrics")
    try:
        response = httpx.get(metrics_url, timeout=5.0)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        return {
            "available": False,
            "engine": ENGINE_LABEL,
            "message": f"vLLM metrics endpoint unreachable: {exc}",
        }

    parsed = _parse_prometheus_text(response.text)
    return {"available": True, "engine": ENGINE_LABEL, **parsed}


def _parse_prometheus_text(text: str) -> dict:
    result: dict[str, float] = {}
    for line in text.splitlines():
        if line.startswith("#") or not line.strip():
            continue
        for prom_name, friendly_name in _METRICS_OF_INTEREST.items():
            if line.startswith(prom_name):
                match = re.search(r"(-?\d+(?:\.\d+)?)\s*$", line)
                if match:
                    result[friendly_name] = float(match.group(1))
    return result
