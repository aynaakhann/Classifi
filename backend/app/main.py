from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import ENGINE_LABEL
from .gpu_metrics import get_gpu_metrics
from .llm_client import call_llm
from .prompt_builder import build_messages, parse_classification
from .schemas import (
    ClassifyInputOnly,
    ClassifyRequest,
    ClassifyResponse,
    CreateClassifierRequest,
    CreateClassifierResponse,
    LabeledExample,
)
from .store import get_classifier, save_classifier

app = FastAPI(title="Classifi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "engine": ENGINE_LABEL}


@app.get("/gpu-metrics")
def gpu_metrics():
    return get_gpu_metrics()


def _run_classification(
    classes: list[str],
    examples: list[LabeledExample],
    input_text: str | None,
    input_image_url: str | None = None,
) -> ClassifyResponse:
    if not any(ex.label in classes for ex in examples):
        raise HTTPException(400, "No example matches any of the given classes")
    messages = build_messages(
        classes, [ex.model_dump() for ex in examples], input_text, input_image_url
    )
    raw = call_llm(messages)
    result = parse_classification(raw)
    return ClassifyResponse(**result, engine=ENGINE_LABEL)


@app.post("/classify", response_model=ClassifyResponse)
def classify(payload: ClassifyRequest):
    return _run_classification(
        payload.classes, payload.examples, payload.input, payload.input_image_url
    )


@app.post("/classifiers", response_model=CreateClassifierResponse)
def create_classifier(payload: CreateClassifierRequest):
    classifier_id = save_classifier(payload)
    return CreateClassifierResponse(
        id=classifier_id, endpoint=f"/classifiers/{classifier_id}/classify"
    )


@app.get("/classifiers/{classifier_id}")
def read_classifier(classifier_id: str):
    classifier = get_classifier(classifier_id)
    if not classifier:
        raise HTTPException(404, "Classifier not found")
    return classifier


@app.post("/classifiers/{classifier_id}/classify", response_model=ClassifyResponse)
def classify_with_classifier(classifier_id: str, payload: ClassifyInputOnly):
    classifier = get_classifier(classifier_id)
    if not classifier:
        raise HTTPException(404, "Classifier not found")
    return _run_classification(
        classifier.classes, classifier.examples, payload.input, payload.input_image_url
    )
