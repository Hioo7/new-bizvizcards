# Card Reader — Development Rules

These rules govern all work in this folder — a Python microservice that extracts
structured contact details from a business-card photo (Tesseract OCR + Pillow +
spaCy NER + regex). Read this before writing any code here.

## Stack

- **Language:** Python 3.12 (`requires-python = "==3.12.*"`)
- **Framework:** FastAPI, served by gunicorn + uvicorn workers
- **Project / deps:** `uv` (managed project, `src/` layout)
- **Validation / config:** `pydantic` v2, `pydantic-settings`
- **Logging:** `structlog`
- **Lint / format:** `ruff`
- **Types:** `mypy --strict`
- **Tests:** `pytest` + `pytest-asyncio`

## Package management — `uv` only

- Add / remove / bump dependencies **only** with `uv add`, `uv add --dev`,
  `uv remove`, `uv lock --upgrade-package <pkg>`. Never hand-edit
  `[project.dependencies]`, `[dependency-groups]`, `[tool.uv.sources]`, or
  `uv.lock`.
- The `[tool.ruff]`, `[tool.pytest.ini_options]`, `[tool.mypy]` blocks are
  hand-authored config — those are fine to edit directly.
- Install / update the venv with `uv sync`. Run everything through
  `uv run <cmd>` (`uv run uvicorn …`, `uv run pytest`, `uv run ruff check .`).
- `uv.lock` and `.python-version` are committed.

## Folder structure

Concern-per-module under `src/card_reader/`:

```
main.py            create_app() factory + module-level `app`
dependencies.py    FastAPI Depends providers — the ONLY way routes reach singletons
constants/         fixed values (regexes, limits, tesseract config, token sets)
schemas/           pydantic request/response models
routes/            thin APIRouter handlers — no logic
services/          all the work (preprocessor, ocr, parser, pipeline, nlp)
core/              config, logging, errors, lifespan
middleware/        pure-ASGI middleware
```

- **App factory** `create_app(settings: Settings | None = None)`; `app =
  create_app()` at module scope for gunicorn.
- **No module globals for state, no `app.state` for logic.** Heavy singletons
  (spaCy model, executors) are built once per worker in `core/lifespan.py` and
  reached only via the `Depends` providers in `dependencies.py`. `app.state`
  holds them purely as the DI source.
- One responsibility per file; if you can't name a file's job in a sentence,
  split it.

## No magic values inline

Every fixed value lives in `constants/` or on `Settings`. A route reads the
`Settings` field, not the constant, so deployments can override without a code
change. `constants/` holds the default that setting falls back to.

## Configuration

- All environment config is read, parsed and validated **once** by `Settings`
  (`core/config.py`, `pydantic-settings`, env prefix `CARD_READER_`).
- Nothing else touches `os.environ`. Inject `Settings` via
  `dependencies.get_settings` (or `SettingsDep`).
- `.env` (git-ignored) holds real values; `.env.template` documents every key
  and must be kept in sync — update both in the same change.

## Type safety

- `uv run mypy src` must pass under `strict = true`.
- No bare `except` — catch specific exceptions; domain failures are typed
  exceptions in `core/errors.py` that map to HTTP status codes.
- Avoid `Any`. If a third-party lib forces it, add a one-line comment and, if
  it's a missing-stubs issue, a `[[tool.mypy.overrides]]` entry.

## Logging

- `structlog` only — never `print`.
- Every request is tagged with a request id (`X-Request-ID`, honoured if the
  caller sends one) by `middleware/request_context.py`; one structured access
  log line per request.

## Concurrency & load

- CPU-bound work (Pillow, Tesseract, spaCy) runs **off the event loop** in the
  bounded per-worker `ThreadPoolExecutor`.
- Load shedding lives in `services/pipeline.py`: an admission semaphore sized
  `ocr_max_concurrency + ocr_max_queue` returns **503** when the queue is full;
  a wall-clock timeout returns **504**.
- **Never set `preload_app` in gunicorn** — forking after importing
  spaCy/thinc/BLAS is not fork-safe. The model loads per worker in the lifespan.

## HTTP contract (stable)

`POST /extract` (multipart field `file`) → `ExtractionResponse`, and
`GET /health` → `{"status": "ok"}` are the public contract. Changing a field
name, nullability, or the multipart field name is a breaking API change —
coordinate with the frontend (`frontend/src/features/card-scan/`).

## Definition of done

A change is complete only when all four pass with zero errors:

```
uv run ruff check .
uv run ruff format --check .
uv run mypy src
uv run pytest
```

Tests seed and clean up their own fixtures. Tests that need the real
`tesseract` binary are marked `@pytest.mark.requires_tesseract` and skip when it
is absent (CI installs it and runs them).
