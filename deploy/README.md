# AMD self-hosted deployment (vLLM + ROCm)

Runs Gemma 3 directly on the AMD MI300X GPU Droplet via vLLM's official
ROCm image, with our FastAPI app talking to it over the OpenAI-compatible
protocol — same protocol Fireworks uses, so `app/llm_client.py` needed zero
changes to support this.

**Status: written but not yet build/run-tested.** This machine has no Docker
and no AMD GPU, so `docker compose up` here has literally never been run.
The first real test happens on the AMD Developer Cloud Droplet once GPU
access is approved — budget time for that, don't assume it works first try
(see Risks below).

## Prerequisites (do these BEFORE first run)

1. **AMD Developer Cloud GPU Droplet approved and provisioned** (ROCm
   pre-installed, Docker + GPU passthrough working — verify with `rocm-smi`
   on the host before touching this compose file at all).
2. **Accept Gemma's license on Hugging Face** and generate an access token —
   `google/gemma-3-12b-it` is a gated model; vLLM will fail to download it
   without a valid `HF_TOKEN`. This is a separate gate from the Fireworks
   Gemma access issue we hit earlier — don't assume fixing one fixes the
   other.
3. Docker + Docker Compose installed on the Droplet.

## Run

```bash
export HF_TOKEN=hf_xxx           # from huggingface.co/settings/tokens
cd classifi/deploy
docker compose up --build
```

Verify the GPU is actually being used, not silently falling back to CPU:

```bash
docker exec -it deploy-vllm-1 rocm-smi
```

Then hit the app the same way as the Fireworks path:

```bash
curl http://localhost:8000/health
# should return {"status":"ok","engine":"amd-self-hosted"}
```

If `engine` still says `fireworks-fallback`, the compose environment
variables aren't reaching the `api` container — check `docker compose config`
before debugging further.

## Model size

Defaults to `google/gemma-3-12b-it`. To try 27B instead:

```bash
VLLM_MODEL=google/gemma-3-27b-it docker compose up --build
```

Per `docs/SNAPCLASSIFY.md`: if 27B hits ROCm/vLLM compatibility or memory
issues, fall back to 12B — never spend more than a time-boxed session on
this before shipping with whichever size actually runs.

## Risks (stated honestly, not discovered live during the demo)

- First-time image pull for `vllm/vllm-openai-rocm:latest` plus the Gemma
  weights download can take a long time on a fresh Droplet — do this well
  before the demo, not minutes before.
- `--device /dev/kfd` / `/dev/dri` passthrough assumes the Droplet exposes
  those device nodes the same way a bare-metal ROCm host does. If the
  Droplet is itself virtualized, passthrough may need extra flags not
  captured here — verify on first boot.
- If this doesn't come together in time, `ENGINE_LABEL=fireworks-fallback`
  (the current default in `backend/.env.example`) is a fully working,
  already-tested fallback. Ship that rather than a broken self-hosted setup.
