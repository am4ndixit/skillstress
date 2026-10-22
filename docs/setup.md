# Local development setup

## Requirements

- Python 3.11 or newer
- Node.js and pnpm
- Ollama only if using a local model

## Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API and interactive docs are available at `http://127.0.0.1:8000` and `/docs`.

## Start the frontend

In a second terminal:

```bash
cd frontend
pnpm install
pnpm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the local FastAPI service.

## Configure a provider

In Settings, choose OpenAI or Ollama and select a model. For OpenAI, set `OPENAI_API_KEY` in the backend process environment and restart FastAPI; the key is not sent to the browser. For Ollama, start the local server and select a model already installed on the configured endpoint. SkillStress checks the installed model list and does not download models.

Use **Test Connection** before a run. Each live evaluation sends one generation request and one judge request to the selected provider. The same model judges its response, so treat results as evidence to inspect rather than ground truth.

## Tests

```bash
cd frontend && pnpm run build
cd backend && pytest
```

The backend tests require the `dev` extra in `backend/pyproject.toml`. A successful frontend build does not verify provider connectivity or a live evaluation.
