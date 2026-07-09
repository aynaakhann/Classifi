# Classifi backend

Few-shot classifier API. No training step — labeled examples become in-context
exemplars in a prompt sent to an LLM, which returns a label, confidence, and a
natural-language explanation.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# put your real FIREWORKS_API_KEY in .env
uvicorn app.main:app --reload
```

`FIREWORKS_MODEL` currently defaults to `kimi-k2p6` — confirmed working on the
team's Fireworks account for **both text and image** classification (unlike
`gpt-oss-120b`, which is text-only and can't be used for the image path). Swap
it to `accounts/fireworks/models/gemma-3-12b-it` once Gemma access is enabled
on the account, or point it at a self-hosted vLLM endpoint on AMD Developer
Cloud once that's running — set `ENGINE_LABEL=amd-self-hosted` when you do, so
the API response honestly reflects what actually answered it.

## Endpoints

- `GET /health` — status + which engine is currently active.
- `POST /classify` — one-off classification, no persistence. Text example:
  ```json
  {
    "classes": ["spam", "not spam"],
    "examples": [
      {"text": "Buy cheap meds now!!!", "label": "spam"},
      {"text": "Meeting moved to 3pm", "label": "not spam"}
    ],
    "input": "Congratulations! You won a free iPhone, click here"
  }
  ```
  Image example — use `image_url` on examples and `input_image_url` instead of
  `text`/`input` (either http(s) URLs or `data:` base64 URIs work):
  ```json
  {
    "classes": ["cat", "dog"],
    "examples": [
      {"image_url": "https://example.com/cat.jpg", "label": "cat"},
      {"image_url": "https://example.com/dog.jpg", "label": "dog"}
    ],
    "input_image_url": "https://example.com/new-photo.jpg"
  }
  ```
  Returns `{"label", "confidence", "explanation", "engine"}` either way.
- `POST /classifiers` — save a classifier (name + classes + examples), returns
  `{"id", "endpoint"}` — the "export" feature: a stable per-classifier route.
- `GET /classifiers/{id}` — read back a saved classifier's config.
- `POST /classifiers/{id}/classify` — classify against a saved classifier:
  `{"input": "..."}` → same response shape as `/classify`.

Storage is in-memory (resets on restart) — intentional v1 scope, see
`docs/SNAPCLASSIFY.md` in the project root.
