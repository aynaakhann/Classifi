# Classifi

```text
 ██████╗██╗      █████╗ ███████╗███████╗██╗███████╗██╗
██╔════╝██║     ██╔══██╗██╔════╝██╔════╝██║██╔════╝██║
██║     ██║     ███████║███████╗███████╗██║█████╗  ██║
██║     ██║     ██╔══██║╚════██║╚════██║██║██╔══╝  ██║
╚██████╗███████╗██║  ██║███████║███████║██║██║     ██║
 ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝╚═╝     ╚═╝
```

No-code AI classifier via few-shot LLM inference. Define 2+ categories, label ~5–10 examples each, get a working text or image classifier — with a natural-language explanation for every prediction. No training step, ever.

[Live Demo Deployment](https://github.com/aynaakhann/Classifi)

![Gemma 3](https://img.shields.io/badge/Gemma%203-Multimodal%20LLM-646CFF)
![FastAPI](https://img.shields.io/badge/FastAPI-Inference%20Backend-009688)
![React + Vite](https://img.shields.io/badge/React%20%2B%20Vite-Frontend-646CFF)
![AMD ROCm](https://img.shields.io/badge/AMD%20ROCm-MI300X%20Accelerated-ED1C24)
![Explainable](https://img.shields.io/badge/Explainability-Every%20Prediction-F5A623)
![License](https://img.shields.io/badge/License-MIT-B44FFF)

Classifi sits at the intersection of zero-shot visual/text understanding and few-shot in-context learning, allowing non-technical users to build and deploy high-performance classifiers in minutes.

This is a **hackathon project built for the AMD Developer Hackathon: ACT II** (lablab.ai, July 6–11 2026), Track 3 "Unicorn."

## Team

**Team Name:** Vizminds V2

| Member | Role |
| --- | --- |
| Ayna Khan | Team Lead |
| Syuja Dewa | Team Member |
| Abdullah | Team Member |

## Problem Statement

Building a custom AI classifier (e.g., "is this support ticket urgent," "is this X-ray note normal," "is this part defective") usually means collecting hundreds of labeled examples and either training a model or hiring an ML engineer. That cost is fine for a company with an ML team and a data pipeline, but not for a teacher grading essays, a clinic triaging intake notes, a QA line spotting defective parts, a researcher coding survey responses, or an NGO field team sorting reports.

The gap isn't "can an LLM classify text/images" — it obviously can. It's "can a non-technical person go from zero to a working, explainable, shareable classifier in minutes, without labeling hundreds of examples or touching a training pipeline."

## Hackathon Pitch

**Classifi lets anyone build and deploy a text or image classifier in under 5 minutes with just 5 examples.**

Instead of launching a multi-hour model training job, Classifi leverages the few-shot visual and language capability of Gemma 3. Labeled examples become in-context exemplars in a prompt, and the model classifies new inputs while giving a natural-language explanation of its reasoning.

The one-line pitch:
```text
Classifi makes custom AI classification instant, explainable, and production-ready with zero training.
```

## Our Solution

Classifi combines an intuitive web dashboard, a fast few-shot inference API, and self-hosted Gemma 3 acceleration on AMD MI300X.

The system provides:
- **Zero Training, Full Stop:** No training queue or fine-tuning runs. Your classifier exists the instant you define your classes and examples.
- **Multimodal by Design:** Handle text and image classification through the same pipeline using a single model.
- **Natural-Language Explainability:** Every prediction returns a clear, plain-English reason for the classification.
- **One-Click REST API Export:** Export any classifier as a stable endpoint that other applications can query instantly.
- **AMD MI300X Acceleration:** Runs self-hosted inference on AMD hardware via vLLM and ROCm with live performance metrics.

## How It Works

1. **Define classes:** The user names 2+ categories (e.g., "urgent" vs. "normal").
2. **Label examples:** Drag-and-drop ~5–10 example texts or images per class.
3. **Few-shot prompt built automatically:** The FastAPI backend assembles the labeled examples into a structured prompt.
4. **Classify:** The prompt plus a new input is sent to Gemma 3. The model returns the predicted label, a confidence score, and a one-sentence reason.
5. **Test live:** The user pastes or uploads a fresh input and watches the classifier work in real time.
6. **Export as REST API:** Generate a stable endpoint to integrate the classifier into third-party apps.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| UI styling | Tailwind CSS, Shadcn theme |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Inference Engine | Gemma 3 (12B/27B) |
| Compute Platform | AMD MI300X (via AMD Developer Cloud) |
| Runtime Environment | vLLM, ROCm, Docker |

## Architecture

```mermaid
flowchart LR
  A[User Input] --> UI[React Frontend]
  UI -->|1. Classes & Examples| BE[FastAPI Backend]
  BE -->|2. Multimodal Few-Shot Prompt| G[Gemma 3 IT]
  subgraph AMD MI300X Cloud
    G
  end
  G -->|3. Classification + Explanation| BE
  BE -->|4. Live Console Feed| UI
  BE -->|5. Export Endpoint| EX[REST API Client]
  
  classDef ui fill:#646CFF,stroke:#4E54C8,color:#ffffff;
  classDef be fill:#009688,stroke:#00796B,color:#ffffff;
  classDef amd fill:#ED1C24,stroke:#9F0F12,color:#ffffff;
  classDef text fill:#111111,stroke:#333333,color:#ffffff;
  
  class UI ui;
  class BE,EX be;
  class G amd;
```

## Differentiation

Any judge who has seen a no-code classifier before will think of Nyckel, Teachable Machine, or Lobe. Classifi differentiates against these head-on:

| Feature | **Classifi** | Nyckel | Teachable Machine | Lobe |
|---|---|---|---|---|
| **Method** | Few-shot LLM prompting — **zero training step** | Trains a small model per classifier ("seconds") | Trains an on-device model (transfer learning) | Trains a local image model (transfer learning) |
| **Modality** | **One model, text AND image** | Text + image | Image / audio / pose — no text | Image only |
| **Explanation** | **Yes — natural-language reason with every result** | No | No | No |
| **License** | **Open-source MIT, self-hostable** | Closed SaaS | Closed | Closed |
| **API Export** | Per-classifier REST endpoint | Yes | Edge export only | Edge export only |

## Repository Structure

```text
Classifi/
|-- backend/      FastAPI app, few-shot prompt builder, prediction endpoints, GPU metrics API
|-- frontend/     React/Vite application for class definition, labeling, and live testing
|-- deploy/       Inference deployment configuration (vLLM, Docker, AMD ROCm templates)
|-- docs/         Detailed specifications, guides, and comparison studies
```

## Local Setup

### 1. Python Environment (Backend)

Navigate to the `backend/` directory:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Backend Environment Config

Create your `.env` file from the example:

```bash
cp .env.example .env
```

Add your `LLM_API_KEY` (or configure your self-hosted vLLM endpoint URL):

```text
LLM_API_KEY=your-api-key
LLM_MODEL=accounts/fireworks/models/kimi-k2p6
LLM_BASE_URL=https://api.fireworks.ai/inference/v1/chat/completions
ENGINE_LABEL=fireworks-fallback
```

### 3. Start the Backend

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. You can inspect the interactive OpenAPI documentation at `http://localhost:8000/docs`.

### 4. Start the Frontend

Navigate to the `frontend/` directory in a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The application will be running locally at `http://localhost:5173`.

## Deploy to Vercel

Deploy this repository as two Vercel projects from the same GitHub repository.

### 1. Deploy the backend

1. In Vercel, choose **Add New > Project** and import this repository.
2. Set **Root Directory** to `backend` and deploy it as a Python project.
3. Add `LLM_API_KEY` under **Settings > Environment Variables**. The optional
   `LLM_MODEL`, `LLM_BASE_URL`, and `ENGINE_LABEL` values are documented in
   `backend/.env.example`.
4. Deploy, then verify `https://<backend-domain>/health` returns status `ok`.

### 2. Deploy the frontend

1. Import the same repository again as a second Vercel project.
2. Set **Root Directory** to `frontend`; its `vercel.json` supplies the Vite
   build settings.
3. Add `VITE_BACKEND_URL=https://<backend-domain>` under **Environment
   Variables**. Do not include a trailing slash.
4. Deploy the frontend and run a sample classification from its public URL.

When the backend domain changes, update `VITE_BACKEND_URL` in the frontend
project and redeploy the frontend.

Classifier exports are currently held in server memory. They can disappear when
a serverless instance restarts or when requests reach another instance; use a
persistent database before treating exported classifier URLs as durable storage.

## Demo Test Scenarios

### Scenario 1: Text Spam Classification
- **Classes:** `Spam`, `Inbox`
- **Examples:**
  - `Spam`: "Buy cheap medications now! Special discount codes inside!"
  - `Spam`: "Congratulations, you won a free vacation to Hawaii! Click this link."
  - `Inbox`: "Hey, are we still meeting up for coffee at 3:00 PM today?"
  - `Inbox`: "Please review the attached invoice for project milestones."
- **Input:** "Urgent: unclaimed funds detected. Verify your bank account immediately."
- **Expected Outcome:** Classified as `Spam` with a natural-language reason highlighting urgency and bank verification requests.

### Scenario 2: Image Classification (Pets)
- **Classes:** `Cat`, `Dog`
- **Examples:** Drag and drop 5 cat pictures and 5 dog pictures.
- **Input:** A new, unseen photo of a puppy.
- **Expected Outcome:** Classified as `Dog` with an explanation referencing canine features (ears, snout, coat structure).

## License

MIT — see [LICENSE](LICENSE).
