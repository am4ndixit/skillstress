# Architecture and current implementation

SkillStress is a React 18, TypeScript, and Vite client backed by a Python 3.11+ FastAPI service. The client lives in `frontend/src`; the API and evaluation code live in `backend/app`.

## Request path

```text
Pages
  └─ WorkbenchContext (API client and local browser fallback)
       └─ Vite /api proxy
            └─ FastAPI
                 ├─ /api/skills       import, list, edit, and remove skills
                 ├─ /api/runs         evaluate, list, and compare runs
                 └─ /api/provider     check OpenAI or Ollama connectivity
```

The application entry is `frontend/src/main.tsx`; routes are in `frontend/src/App.tsx`. Pages use `WorkbenchContext` for workbench state. The context delegates HTTP operations to typed domain clients in `frontend/src/api`, which share JSON and error handling through `request.ts`. Backend startup and route registration are in `backend/app/main.py`.

## Evaluation path

`POST /api/runs/execute` accepts a task, skill text, provider, model, and approved rules. A live run sends the task and skill to the selected provider, then asks the same model to judge the response against each approved rule. The model has no tools or filesystem access through SkillStress. The run stores the answer, judge results, task, provider, model, endpoint, skill version and text, and approved rule IDs.

The judge returns a result and supporting quote for each rule. Missing or invalid judgments fail. This is model-generated evidence, not an independent behavioral test. The mock endpoint runs a small synthetic preflight and is labeled accordingly.

A repair proposal is based on a failed run and its saved skill snapshot. A person can edit and approve the proposed Markdown; applying it updates the SkillStress copy, not the imported source file. A rerun uses the same task, scenario, provider, model, endpoint, and approved rule IDs. The History page compares the per-rule results and keeps the baseline run visible.

## Persistence

Skills and runs are stored in SQLite at `backend/data/skillstress.sqlite3` by default. Set `SKILLSTRESS_DB_PATH` to choose a different database file. Runs and their comparison baselines survive backend restarts as long as the same database is used. The browser keeps a local copy for startup and offline display; the API is authoritative when it is reachable.

The database is local to one backend deployment. It does not synchronize across machines, and there is no export or guaranteed replay bundle. Provider settings are stored in the browser; the OpenAI key belongs in the backend environment.

## Source map

- `frontend/src/pages`: Home, Test, Skills, History, and Settings.
- `frontend/src/context/WorkbenchContext.tsx`: workbench state, local preferences, and page actions.
- `frontend/src/api`: typed skill, run, provider, and health requests; shared HTTP handling is in `request.ts`.
- `backend/app/api/endpoints`: skill, run, and provider routes.
- `backend/app/services/provider_runner.py`: provider requests, same-model judging, and repair proposals.
- `backend/app/services/evaluator.py`: mock preflight only.
- `backend/app/services/extractor.py`: candidate rule extraction from Markdown.
- `backend/app/services/storage.py`: SQLite persistence.
