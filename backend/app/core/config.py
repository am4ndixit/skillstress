import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SkillStress Backend"
    VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    OLLAMA_ENDPOINT: str = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434")
    OLLAMA_DEFAULT_MODEL: str = os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5-coder:7b")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
