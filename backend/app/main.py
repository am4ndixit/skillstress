from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api.endpoints.skills import router as skills_router
from .api.endpoints.runs import router as runs_router
from .api.endpoints.mutations import router as mutations_router
from .api.endpoints.provider import router as provider_router
from .api.endpoints.skills import seed_builtin_skills
from .services.storage import initialize_storage


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_storage()
    seed_builtin_skills()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Evaluation harness and API backend for SkillStress AI agent workbench",
    lifespan=lifespan,
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints
app.include_router(skills_router, prefix=settings.API_PREFIX)
app.include_router(runs_router, prefix=settings.API_PREFIX)
app.include_router(mutations_router, prefix=settings.API_PREFIX)
app.include_router(provider_router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "storage": "sqlite",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
