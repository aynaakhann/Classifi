# SnapClassify — Hackathon Spec

No-code AI classifier via few-shot LLM inference. Pivoted from HYDRA (AI scambaiting network — archived, see note in `CLAUDE.md`) for AMD Developer Hackathon ACT II, lablab.ai, July 6–11 2026, Track 3 "Unicorn."

## Problem

Building a custom AI classifier — "is this support ticket urgent," "is this X-ray note normal or flagged," "is this essay on-topic," "is this part defective" — still typically means collecting hundreds of labeled examples and either training a model or hiring (or being) an ML engineer. That cost is fine for a company with an ML team and a data pipeline. It is not fine for a teacher grading essays, a clinic triaging intake notes, a QA line spotting defective parts, a researcher coding survey responses, or an NGO field team sorting reports — people who know exactly what categories they need but have no path to a working classifier in the time they actually have.

The gap isn't "can an LLM classify text/images" — it obviously can. It's "can a non-technical person go from zero to a working, explainable, shareable classifier in minutes, without labeling hundreds of examples or touching a training pipeline."

## Idea

SnapClassify: a no-code platform where anyone builds a text or image classifier in under 5 minutes using roughly 5 labeled examples per class — no training step, ever. Under the hood it's few-shot prompting, not fine-tuning: the labeled examples become in-context exemplars in a prompt sent to Gemma 3, which classifies new inputs and returns a confidence score plus — the headline feature — a natural-language explanation of why it chose that label. The finished classifier can be tested live in the browser and exported as its own REST API endpoint.

## How it works

1. **Define classes** — user names 2+ categories (e.g. "spam" / "not spam").
2. **Label examples** — drag-and-drop ~5–10 example texts or images per class.
3. **Few-shot prompt built automatically** — backend assembles the labeled examples into a structured prompt. No training job, no fine-tuning run, nothing to wait for.
4. **Classify** — the prompt plus a new input is sent to Gemma 3 (self-hosted on AMD MI300X, primary path — see Architecture). The model returns a label, a confidence score, and a one-sentence natural-language reason.
5. **Test live** — user pastes or uploads a fresh input and watches the classifier work in real time.
6. **Export as REST API endpoint** — one click generates a stable URL other apps can POST to.

This works because Gemma 3 already has strong zero-shot visual and language understanding out of the box — its SigLIP-based vision encoder gives it real zero-shot image classification ability before any examples are ever added. The 5–10 labeled examples aren't teaching it a new skill; they're steering an already-capable model onto the user's specific taxonomy. That's also why the 128K context window matters in practice: even a generous example set across both text and image classes fits comfortably inside a single prompt, with no retrieval or chunking tricks needed.

## Differentiation

The honest starting point: **Nyckel (nyckel.com) is a near-identical existing product** — "upload as few as 5-10 samples per label, trains in seconds, ready-to-use API endpoint, text + image." Any judge who has seen a no-code classifier tool before will think of Nyckel, or Teachable Machine, within the first 30 seconds. Pretending otherwise is the fastest way to lose credibility on originality, so this pitch names Nyckel explicitly and differentiates against it head-on instead of hoping nobody asks.

| | **SnapClassify** | Nyckel | Teachable Machine | Lobe | Levity |
|---|---|---|---|---|---|
| Method | Few-shot LLM prompting — **zero training step** | Trains a small model per classifier ("seconds") | Trains an on-device model (transfer learning) | Trains a local image model (transfer learning) | Trains a hosted classifier inside a workflow tool |
| Modality | **One model, text AND image** | Text + image | Image / audio / pose — no text | Image only | Text + image, ops-focused |
| Explanation per prediction | **Yes — natural-language reason with every result** | No | No | No | No |
| License / hosting | **Open-source MIT, self-hostable** | Closed SaaS | Closed | Closed | Closed SaaS |
| API export | Per-classifier REST endpoint | Yes | Edge export only | Edge export only | Workflow-embedded |

Levity (levity.ai) is included for completeness rather than as a head-to-head rival — it's a B2B ops-automation platform with classification built into a broader workflow tool, not a standalone classifier-builder, so it's a lighter comparison than Nyckel. Teachable Machine and Lobe predate the LLM approach entirely: both train small on-device/edge models and are image-only, with no text classification and no explanations.

Four honest differentiators, in order of how hard they land in a live demo:

1. **Explainability is the headline feature.** Every SnapClassify prediction ships with a plain-English reason. Nyckel and Teachable Machine return a label and a number — never why. This is the single feature that makes a judge lean forward, and it's a direct product of using an LLM instead of a trained classifier head.
2. **Zero training, full stop.** Nyckel still trains a model per classifier, even if it takes only seconds — there's a job, a queue, a wait. SnapClassify has no training step at any point: the classifier exists the instant the examples are pasted in.
3. **Open-source MIT + self-hostable** vs. Nyckel's and Levity's closed SaaS. Same open-vs-closed story judges already respond to elsewhere in the AMD ecosystem (ROCm vs. CUDA).
4. **One multimodal model, not two pipelines.** Gemma 3 handles text and image classification through the same prompt-based path — no separate vision model bolted onto a separate text model.

## Architecture

```
UI (React/Next or plain HTML/JS against frozen FastAPI schema; Gradio = fallback)
      │
      ▼
FastAPI backend
      │  few-shot prompt builder (labeled text/image examples → structured prompt)
      ▼
Gemma 3 — 12B or 27B, SELF-HOSTED on AMD MI300X via vLLM + ROCm
 (AMD Developer Cloud)  ◄── primary path, THIS is the demonstrated GPU workload
 (Fireworks AI API = fallback only, gemma-3-12b-it — never the shown/primary path)
      │
      ▼
prediction + confidence + natural-language explanation
      │
      ├──► test-live console (immediate feedback in UI)
      └──► export as REST API endpoint (per-classifier route on the same backend)

                                              live GPU metrics panel
                                    (tokens/sec via vLLM metrics or rocm-smi)
```

Note on the fallback path: Fireworks AI has `gemma-3-4b-it` and `gemma-3-12b-it` confirmed live — not a confirmed 27B. So if the self-hosted primary path is running the 27B variant, a Fireworks fallback silently steps down to 12B. That's acceptable — the fallback is an outage safety net, never the demoed path, and the live demo only ever shows the self-hosted route.

## AMD integration

- **Primary inference path is self-hosted, not an API call.** Gemma 3 (12B or 27B) runs on AMD MI300X via vLLM + ROCm on AMD Developer Cloud. Fireworks is an outage fallback only — it is never what's on screen during the demo.
- **Live GPU metrics panel** in the app itself — tokens/sec (from vLLM metrics or `rocm-smi`) visible during every classification, so "runs on AMD" is a number judges watch update, not a line in a slide deck.
- **ROCm Docker container with GPU passthrough verified on Day 1** — before any feature work, so the riskiest infrastructure dependency is de-risked first.
- This does double duty: it's what "use of AMD platforms" is scored on, and it's also the strongest evidence for the separate **$6,000 "Best Use of Gemma Models" bonus** (see Judging alignment) — the entry isn't just calling a Gemma endpoint, it's running Gemma on AMD silicon as the core product loop.

## Judging alignment

Track 3 "Unicorn" is judged on creativity, originality, completeness, **use of AMD platforms**, and product/market potential — pitched as a startup, not benchmarked as a model. Submission must be containerized (Docker) and MIT-licensed.

- **Creativity / originality:** the honest move — name Nyckel, then win on explainability and zero-training, rather than pretend no competitor exists. A judge who already knows Nyckel sees a team that did its homework.
- **Completeness:** the full loop (define → label → classify-with-explanation → export endpoint) works live in the browser, not just in a slide.
- **Use of AMD platforms:** self-hosted Gemma 3 on MI300X via vLLM/ROCm is the primary compute path, with a live metrics panel proving it, not asserting it.
- **Product/market potential:** named, concrete use cases across education (assignment grading), healthcare (triage-note sorting), manufacturing (QA defect images), research (survey coding), and NGO field work — plus an open-source distribution model that undercuts closed SaaS incumbents on price and trust.
- **Bonus alignment:** separate from Track 3 scoring, there is **an additional $6,000 in prizes for "Best Use of Gemma Models," awarded across all three tracks** (source: lablab.ai event page). Self-hosting Gemma 3 as the primary inference engine — not just calling an API — is the strongest possible entry for that bonus.

## Team roles

Three people:

- **AI Engineer / Backend (user, lead):** few-shot prompt builder, self-hosted Gemma 3 on MI300X via vLLM/ROCm, FastAPI endpoints, classifier-export mechanism, Dockerization, GPU metrics endpoint.
- **Frontend:** the app UI — class definition, drag-drop labeling, live test console, results + explanation display, GPU metrics panel. The original draft specified Gradio; flagging that here because Gradio caps how polished the UI can look for a pitch demo. Recommendation: build a small React/Next (or plain HTML/JS) app against the FastAPI schema instead, with Gradio kept only as a time-pressure fallback. **The API schema must be frozen on Day 1** so frontend work never blocks on backend progress.
- **Pitcher:** startup-pitch deck, demo video, live-demo script; prepares 2–3 pre-built classifier examples (e.g. spam filter, defect detector) as a safety net, and separately rehearses the interactive judge-participation beat (see Demo script).

## 5-day milestones

- **Day 1 (Jul 6):** Enroll + credits + confirm submission rules. Text-classification spine working end-to-end with self-hosted Gemma 3 on MI300X (vLLM/ROCm). ROCm Docker skeleton verified — GPU visible inside the container. API schema frozen.
- **Day 2 (Jul 7):** Image classification path (multimodal). Frontend real UI built against the frozen schema. Explanation-with-every-prediction working end-to-end.
- **Day 3 (Jul 8):** Export-as-API-endpoint feature. Confidence scores surfaced in UI. GPU metrics endpoint + live panel.
- **Day 4 (Jul 9):** Polish, Dockerize final build, MIT LICENSE, README. Record demo video. Rehearse.
- **Day 5 (Jul 10):** Finalize backup video, complete submission package. **Jul 11:** submit early, keep buffer for disaster.

## Demo script

**Hook:** "Building a custom AI classifier still takes hundreds of labels and an ML engineer. We do it in 60 seconds with five examples."

**The interactive beat (the killer moment):** ask judges or the audience to name two categories on the spot. Build the classifier live in front of them — label a handful of examples, hit classify on a fresh input they didn't see coming, and show the model's natural-language explanation next to the live GPU metrics panel proving it's running on MI300X, not a hidden API call.

**Close:** open-source-vs-closed framing against Nyckel, then the Gemma-on-AMD story — one self-hosted multimodal model, no training pipeline, running on the flagship GPU the sponsor cares about.

## Deliverables

- Public repo, MIT LICENSE.
- Dockerized app (Dockerfile/compose) with verified GPU passthrough on AMD Developer Cloud.
- README: setup instructions, architecture diagram, screenshots/GIF of the live-build flow.
- Frozen API schema (FastAPI/OpenAPI docs) for the classify + export-endpoint routes.
- Live demo, deployed and reachable during judging.
- 2–3 pre-built example classifiers (spam filter, defect detector, etc.) as a fallback if the live-build beat can't run for time reasons.
- Recorded backup demo video (Day 5), in case the live demo fails.
- Pitch deck / submission write-up covering problem, honest differentiation vs. Nyckel, AMD usage, and market potential.

## Risks

- **Originality is the weakest judging axis** — Nyckel exists, and LLM-wrapper classifiers are common. Mitigated by leading with the explainability feature, the open-source angle, and the live-build demo rather than a claim of novelty the product can't back up.
- **Self-hosting Gemma 3 27B on ROCm/vLLM may hit compatibility friction** → fall back to 12B, then to the Fireworks API as a last resort. The fallback is never shown as the primary path in the demo.
- **Image upload + multimodal prompting latency** → pre-size/compress images client-side before they hit the backend.
- **"Export API endpoint" scope creep** → v1 is a per-classifier URL route on the existing backend, not real multi-tenant infrastructure. No auth, no billing, no isolation guarantees — that's explicitly out of scope (see `CLAUDE.md`).
