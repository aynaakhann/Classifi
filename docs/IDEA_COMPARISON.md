# HYDRA vs. SnapClassify — Decision Record

Why the team evaluated two ideas, what we learned from each, and why SnapClassify was chosen. Kept for the team's own reference and as a model for how we vet ideas going forward.

---

## Side-by-side

| | **HYDRA** (AI scambaiting network) | **SnapClassify** (no-code few-shot classifier) |
|---|---|---|
| **Problem** | Elder fraud, $7.7B lost in 2025 (FBI IC3) | Building a classifier still needs ML skills + hundreds of labels |
| **Core mechanism** | Voice AI persona wastes scammers' time, harvests intel | Few-shot prompt over Gemma 3 replaces a training pipeline |
| **Proof it works** | Real 5-month academic deployment, 32% info-disclosure (arXiv:2509.08493) | Gemma 3 confirmed multimodal + hosted on Fireworks/AMD |
| **Closest competitors** | Apate.ai (CommBank-backed), O2 "Daisy" — both closed, single-operator | Nyckel — near-identical, closed SaaS |
| **Our differentiation** | Open-source, voice-first, self-hostable by anyone | Zero-training, per-prediction explanation, open-source, multimodal-in-one-model |
| **AMD/GPU story** | Real-time voice pipeline (STT→LLM→TTS) is a genuine GPU workload if self-hosted | Self-hosted Gemma 3 on MI300X is a genuine GPU workload; also targets the **$6,000 Gemma bonus** directly |
| **Hardest technical risk** | Real-time voice + ROCm audio-stack compatibility, discovered late = demo-killing | Self-hosting Gemma 3 12B/27B on ROCm/vLLM; otherwise low-risk |
| **Team fit for 5 days** | Backend solo owns voice pipeline + intel extraction + AMD deploy — heavy solo load | Backend workload is narrower (prompting + inference + endpoints) — more parallelizable |
| **Demo theater** | Very high — live scammer vs. AI grandma is genuinely funny and memorable | High — building a working classifier live in 60 seconds in front of judges is a strong interactive beat, but less emotionally sticky than HYDRA's |
| **Originality (judging criterion)** | Higher — nobody else at this hackathon is likely building this | Lower — "AI classifier wrapper" is a common hackathon genre, and Nyckel is a near-exact existing product |
| **Completeness (judging criterion)** | Lower — voice pipeline is the single riskiest thing to finish in 5 days | Higher — very likely to be fully working end-to-end by Day 4 |
| **Ceiling if it lands perfectly** | Highest possible score — big emotional problem + theatrical demo + real originality | Solid, respectable score — but capped below HYDRA's ceiling because originality is weaker |
| **Floor if things go wrong** | Low — a broken voice demo has no good fallback story | High — even a rough version still "works" and is easy to demo safely |

---

## Pros / Cons — HYDRA

**Pros**
- Strongest, most emotional problem statement (real government fraud data)
- Highest originality — no comparable project found on lablab.ai
- Best possible live demo if it works ("watch a scammer get trolled by an AI")
- Open-source-vs-closed narrative maps perfectly onto AMD's own ROCm-vs-CUDA identity

**Cons**
- Real-time voice (STT→LLM→TTS) is the hardest thing to ship reliably in 5 days
- ROCm audio-stack compatibility is an unknown that could eat a full day if discovered late
- One person (backend) owns three hard workstreams at once — a single point of failure
- Legal/ethical framing (scambaiting) needs a rehearsed answer, adds pitch complexity

## Pros / Cons — SnapClassify

**Pros**
- Much more likely to be fully complete and working by demo day
- Directly targets a named $6,000 bonus prize (Best Use of Gemma Models)
- Backend workload is narrower and easier to parallelize across the team
- Explainability feature (reason for every prediction) is a genuine, demoable differentiator
- Lower legal/ethical surface area — nothing to defend in Q&A

**Cons**
- Weakest judging axis is originality — Nyckel is an existing, near-identical closed product
- "No-code AI classifier" is a common hackathon genre; harder to stand out in a crowd
- AMD story only becomes strong if we actually self-host on MI300X — if we fall back to Fireworks-only, the story collapses back to "API wrapper"
- Demo is impressive but less emotionally memorable than HYDRA's

---

## Why SnapClassify was chosen

Not because it's "better" in every dimension — HYDRA has a higher ceiling. The team (led by the leader's call, backed by majority preference) chose the idea with the **higher floor**: for a 3-person team building together for the first time in 5 days, a project that reliably finishes and works end-to-end scores better on average than a higher-upside project with a real chance of an unfinished or broken core feature. Completeness and product/market potential are explicit judging criteria — SnapClassify scores safely on both; HYDRA gambles on both.

## Lessons learned (apply to future idea decisions)

1. **Every real idea already has a competitor.** Both HYDRA (Apate.ai, O2) and SnapClassify (Nyckel) turned out to have close existing products once we actually searched. "Nobody's doing this" is almost always a research gap, not a fact — verify before pitching originality as a strength.
2. **"Uses AMD hardware" must be shown, not asserted.** Both drafts initially had the LLM living behind a third-party API (Fireworks) with AMD only touching minor components. For a track that explicitly scores "use of AMD platforms," self-hosting the core model on MI300X (with API as fallback only) is the difference between a real GPU story and a bolted-on one.
3. **Check the sponsor's own claims before repeating them.** The original SnapClassify draft cited a "$2,000 Best AMD-Hosted Gemma Project" bonus that doesn't exist — the real bonus ($6,000, Best Use of Gemma Models) was better, but wrong facts in a pitch are a fast way to lose judge trust.
4. **Floor vs. ceiling is a legitimate way to choose between two good ideas.** When both ideas are viable, ask: which one is more likely to actually be finished and working in the time we have? A team's first hackathon together is not the moment to bet everything on the highest-ceiling option.
