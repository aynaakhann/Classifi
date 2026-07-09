import json
import re

SYSTEM_PROMPT = """You are a precise classifier. You will be given a fixed set of \
categories, a few labeled examples for each category (each is text, an image, or \
both), and one new input to classify.

Choose exactly one category for the new input. Respond with ONLY a single JSON \
object, no other text, no markdown formatting, in this exact shape:
{"label": "<one of the category names, exactly as given>", "confidence": <number \
between 0 and 1>, "explanation": "<one sentence, plain language, explaining why \
this label fits>"}
"""


def build_messages(
    classes: list[str],
    examples: list[dict],
    input_text: str | None = None,
    input_image_url: str | None = None,
) -> list[dict]:
    """Builds a chat payload. Falls back to a plain string `content` when nothing
    in the request is an image (cheaper, and identical to the original text-only
    shape); switches to OpenAI/Fireworks-style multimodal content blocks the
    moment any example or the input carries an image_url."""
    has_images = input_image_url or any(ex.get("image_url") for ex in examples)

    if not has_images:
        class_list = ", ".join(classes)
        example_lines = "\n".join(
            f'- Text: "{ex["text"]}" -> Label: {ex["label"]}' for ex in examples
        )
        user_prompt = (
            f"Categories: {class_list}\n\n"
            f"Labeled examples:\n{example_lines}\n\n"
            f'New input to classify:\n"{input_text}"'
        )
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

    content: list[dict] = [
        {"type": "text", "text": f"Categories: {', '.join(classes)}\n\nLabeled examples:"}
    ]
    for ex in examples:
        content.append({"type": "text", "text": f"Example labeled \"{ex['label']}\":"})
        if ex.get("text"):
            content.append({"type": "text", "text": ex["text"]})
        if ex.get("image_url"):
            content.append({"type": "image_url", "image_url": {"url": ex["image_url"]}})

    content.append({"type": "text", "text": "New input to classify:"})
    if input_text:
        content.append({"type": "text", "text": input_text})
    if input_image_url:
        content.append({"type": "image_url", "image_url": {"url": input_image_url}})

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]


def parse_classification(raw: str) -> dict:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    for candidate in (text, _extract_json_block(text)):
        if not candidate:
            continue
        try:
            data = json.loads(candidate)
            return {
                "label": str(data["label"]),
                "confidence": float(data.get("confidence", 0.0)),
                "explanation": str(data.get("explanation", "")),
            }
        except (json.JSONDecodeError, KeyError, ValueError):
            continue

    return {"label": "unknown", "confidence": 0.0, "explanation": raw}


def _extract_json_block(text: str) -> str | None:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    return match.group(0) if match else None
