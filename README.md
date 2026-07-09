# Classifi

No-code AI classifier via few-shot LLM inference. Define 2+ categories, label
~5–10 examples each, get a working text or image classifier — with a
natural-language explanation for every prediction. No training step, ever.

Built for the [AMD Developer Hackathon: ACT II](https://lablab.ai/ai-hackathons/amd-developer-hackathon-act-ii)
(lablab.ai, July 6–11 2026), Track 3 "Unicorn."

## Why

Building a custom classifier today usually means collecting hundreds of
labeled examples and either training a model or hiring an ML engineer. That's
fine for a company with an ML team — not for a teacher grading essays, a
clinic triaging intake notes, or a QA line spotting defective parts. Classifi
skips the training step entirely: labeled examples become in-context
exemplars in a prompt sent to an LLM, which classifies new inputs and explains
why.

[Nyckel](https://nyckel.com) does something similar and is worth naming
directly rather than pretending it doesn't exist. See
[`docs/SNAPCLASSIFY.md`](docs/SNAPCLASSIFY.md) for the full honest
differentiation (explainability on every prediction, zero training vs.
Nyckel's per-classifier training job, open-source + self-hostable, one
multimodal model for text and images).

## How it works

1. Define classes (2+ categories)
2. Label ~5–10 text or image examples per class
3. Classify — few-shot prompt built automatically, sent to an LLM, returns a
   label + confidence + one-sentence explanation
4. Export — one click turns the classifier into its own stable REST endpoint

## Project layout

- [`classifi/backend/`](backend/) — the FastAPI app: prompt builder, classify
  + export endpoints, GPU metrics. See its own README for setup and full API
  reference.
- [`classifi/deploy/`](deploy/) — self-hosting Gemma 3 on AMD MI300X via vLLM
  + ROCm (the primary inference path once the GPU Droplet is live).
- `docs/SNAPCLASSIFY.md` — full spec: architecture, differentiation,
  judging alignment, milestones, demo script.

## Inference engine

Runs against any OpenAI-compatible chat endpoint — currently Fireworks
(`kimi-k2p6`, confirmed working for text + image) while self-hosted Gemma 3
access is being set up on both Fireworks and AMD Developer Cloud. Switching
engines is a `.env` change, not a code change — see
[`backend/README.md`](backend/README.md).

## Status

Backend: text classification, image classification, and classifier export are
built and verified working end-to-end. AMD self-hosted deployment is written
but not yet run on real hardware (GPU access pending). Frontend and final demo
packaging are tracked separately by the rest of the team.

## License

MIT — see [`LICENSE`](LICENSE).
