# card-reader

Business-card OCR microservice. Give it a photo of a business card, get back
structured contact details (name, job title, company, emails, phones, websites,
address). Tesseract OCR + Pillow preprocessing + spaCy NER + regex — no external
APIs, no secrets.

## API

| Method | Path       | Body                                   | Response              |
|--------|------------|----------------------------------------|-----------------------|
| `GET`  | `/health`  | –                                      | `{"status": "ok"}`    |
| `POST` | `/extract` | `multipart/form-data`, field **`file`** | `ExtractionResponse`  |

`ExtractionResponse`:

```json
{
  "success": true,
  "confidence": 0.81,
  "message": null,
  "contact": {
    "name": "Jane Doe",
    "job_title": "Chief Technology Officer",
    "company": "Acme Corp",
    "emails": ["jane@acme.com"],
    "phones": ["+14155550123"],
    "websites": ["www.acme.com"],
    "address": "123 Main St, San Francisco",
    "raw_text": ["Jane Doe", "..."]
  }
}
```

Accepts `image/jpeg|png|webp|bmp|tiff`, 10 MB max. Errors: `413` too large,
`415` wrong type, `422` undecodable / no text, `503` overloaded (with
`Retry-After`), `504` timed out.

In the wider stack this sits behind nginx at `/scanner` (`/scanner/extract`,
`/scanner/health`); the frontend calls it directly.

## Local development

Needs the `tesseract` binary on `PATH` (`winget install UB-Mannheim.TesseractOCR`
/ `apt-get install tesseract-ocr tesseract-ocr-eng` / `brew install tesseract`).

```bash
uv sync
cp .env.template .env                       # optional — defaults are fine
uv run uvicorn card_reader.main:app --reload --port 8000
curl -F 'file=@card.jpg' http://localhost:8000/extract
```

## Checks

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy src
uv run pytest                     # add -m "not requires_tesseract" without the binary
```

## Docker

```bash
docker build -t card-reader .
docker run --rm -p 8000:8000 --env-file .env card-reader
```

Config is entirely via `CARD_READER_*` env vars — see `.env.template`.

## Rules

See `CLAUDE.md` in this folder.
