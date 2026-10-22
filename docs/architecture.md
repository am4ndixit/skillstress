# Architecture and current implementation

SkillStress has a React 18 + TypeScript + Vite client and a Python 3.11+ FastAPI backend. The frontend is under `frontend/src`; the API is under `backend/app`.

## Request path

```text
Workbench pages
  └─ WorkbenchContext (browser localStorage state, fetch client)
       └─ Vite /api proxy
            └─ FastAPI endpoints
                 ├─ /api/skills       imports and lists skills
                 ├─ /api/runs         mock preflight, provider runs, repair proposals
                 └─ /api/provider     Ollama/OpenAI status checks
```

The main UI entry is `frontend/src/main.tsx`, with routes in `frontend/src/App.tsx`. `WorkbenchContext` owns browser-side skills, runs, settings, and repair application. Backend route registration and health are in `backend/app/main.py`.

## Evaluation path

`POST /api/runs/execute` accepts a task, skill content, provider, model, and approved obligations. Provider runs make one generation request and a second judge request to the same selected model. OpenAI credentials stay in the backend environment. Ollama requests target the configured local endpoint and must use an installed model. Neither provider receives tools or file access from this application.

The judge returns pass/fail, a quote, and a reason for each obligation. A missing/invalid judgment is not silently counted as a pass. The trace records the generated response and raw judge report. This is LLM-as-judge evidence, not independent ground truth. The mock path only performs a labeled preflight and must not be described as behavioral evaluation.

For a comparison rerun, the backend checks provider, model, skill ID, scenario, task prompt, and evaluated obligation IDs against the original in-memory run. The repair flow proposes revised Markdown from a failed run, leaves approval to the user, applies the approved text to the browser workbench copy, then reruns the same task. It does not overwrite a source `SKILL.md` file.

## State and persistence limits

Runs are held in backend process memory and browser workbench history is saved in localStorage. There is no database, durable run artifact export, or cross-session comparison guarantee. A backend restart loses the baseline required by comparison and repair APIs. Browser history alone cannot restore that backend run. These limits prevent calling the current prototype fully reproducible.

The interface keeps the workflow to Home, Test, Skills, History, and Settings. A suggested repair can be reviewed from History and rerun against the same task and rules. There is no separate mutation-testing or graph view in the interface.

## Source map

- `frontend/src/pages`: Home, Test, Skills, History, Settings. Repair review is part of History.
- `frontend/src/context/WorkbenchContext.tsx`: client state and API calls.
- `backend/app/api/endpoints`: skills, runs, provider, and placeholder mutation routes.
- `backend/app/services/provider_runner.py`: provider request, judge, and repair proposal logic.
- `backend/app/services/evaluator.py`: mock preflight only.
- `backend/app/services/extractor.py`: candidate obligation extraction.
