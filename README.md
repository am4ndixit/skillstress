# SkillStress

SkillStress is a React and FastAPI prototype for inspecting skill obligations, running a provider-backed response and same-model judge, reviewing repair proposals, and rerunning a task for an observed before/after comparison.

## Current capabilities

- Extract candidate obligations from imported Markdown and let a person approve them.
- Run a task through OpenAI or an already-installed Ollama model. No tools or filesystem access are given to the model.
- Store the response, judge report, provider/model, task, approved obligation IDs, and duration in the run trace.
- Request a minimal repair proposal from a failed provider run, edit it, approve or reject it, and rerun the same task.
- Compare assertion outcomes by obligation ID. The same selected model judges both runs, so the result is an observation rather than independent proof or deterministic causation.
- Run a clearly labeled mock preflight. It is not a behavioral model evaluation.

SQLite provides durable skill and run history. This version does not execute tools, mutate skills automatically, or prove that a model will behave consistently; the mock preflight checks only its labeled local scenario. A same-model judge and before/after score are review aids, not independent proof of causation.

## Run locally

Start Ollama separately if you plan to use it; install a model yourself and select it in Settings. SkillStress does not download models. For OpenAI, set `OPENAI_API_KEY` only in the backend process environment.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal:

```bash
cd frontend
pnpm install
pnpm run dev
```

Open <http://localhost:5173>. The backend API docs are at <http://localhost:8000/docs>.

## Verify

```bash
cd frontend && pnpm run build
cd backend && pytest
```

See [architecture](docs/architecture.md), [evaluation methodology](docs/evaluation_methodology.md), and [setup](docs/setup.md) for implementation details and limits.
