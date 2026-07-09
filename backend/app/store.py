import uuid

from .schemas import CreateClassifierRequest

# In-memory only — v1 export scope per docs/SNAPCLASSIFY.md: a per-classifier
# route on this backend, not multi-tenant infra. Resets on restart.
_classifiers: dict[str, CreateClassifierRequest] = {}


def save_classifier(payload: CreateClassifierRequest) -> str:
    classifier_id = uuid.uuid4().hex[:8]
    _classifiers[classifier_id] = payload
    return classifier_id


def get_classifier(classifier_id: str) -> CreateClassifierRequest | None:
    return _classifiers.get(classifier_id)
