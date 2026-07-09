from pydantic import BaseModel, Field, model_validator


class LabeledExample(BaseModel):
    label: str
    text: str | None = None
    # http(s) URL or a data: URI (base64) — either works with the
    # OpenAI-compatible image_url content block.
    image_url: str | None = None

    @model_validator(mode="after")
    def _require_text_or_image(self) -> "LabeledExample":
        if not self.text and not self.image_url:
            raise ValueError("each example needs either 'text' or 'image_url'")
        return self


class ClassifyRequest(BaseModel):
    classes: list[str] = Field(..., min_length=2)
    examples: list[LabeledExample] = Field(..., min_length=1)
    input: str | None = None
    input_image_url: str | None = None

    @model_validator(mode="after")
    def _require_input(self) -> "ClassifyRequest":
        if not self.input and not self.input_image_url:
            raise ValueError("provide either 'input' text or 'input_image_url'")
        return self


class ClassifyResponse(BaseModel):
    label: str
    confidence: float
    explanation: str
    engine: str


class CreateClassifierRequest(BaseModel):
    name: str
    classes: list[str] = Field(..., min_length=2)
    examples: list[LabeledExample] = Field(..., min_length=1)


class CreateClassifierResponse(BaseModel):
    id: str
    endpoint: str


class ClassifyInputOnly(BaseModel):
    input: str | None = None
    input_image_url: str | None = None

    @model_validator(mode="after")
    def _require_input(self) -> "ClassifyInputOnly":
        if not self.input and not self.input_image_url:
            raise ValueError("provide either 'input' text or 'input_image_url'")
        return self
