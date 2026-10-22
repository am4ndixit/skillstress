# SkillStress backend

FastAPI service for SkillStress. From this directory, run `uv run uvicorn app.main:app --reload`.
The API stores skills and evaluation runs in `data/skillstress.sqlite3` by default. Set
`SKILLSTRESS_DB_PATH` to choose another local SQLite file. Provider credentials are read
from the backend environment and are never sent to the browser.
