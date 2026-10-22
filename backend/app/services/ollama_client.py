import time
import httpx
from ..core.config import settings
from ..models.schemas import ProviderConfig

async def test_ollama_connection(endpoint: str | None = None, model: str | None = None) -> ProviderConfig:
    target_url = (endpoint or settings.OLLAMA_ENDPOINT).rstrip("/")
    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(f"{target_url}/api/tags")
            latency_ms = int((time.time() - start_time) * 1000)

            if res.status_code == 200:
                data = res.json()
                models = [m.get("name") for m in data.get("models", []) if m.get("name")]
                selected_model = model or settings.OLLAMA_DEFAULT_MODEL
                if selected_model not in models:
                    return ProviderConfig(
                        provider="ollama",
                        endpoint=target_url,
                        model=selected_model,
                        status="error",
                        latencyMs=latency_ms,
                        models=models,
                        errorMessage=(
                            f"Model '{selected_model}' is not installed. Select an installed model. "
                            "SkillStress will not download models."
                        ),
                    )
                return ProviderConfig(
                    provider="ollama",
                    endpoint=target_url,
                    model=selected_model,
                    status="connected",
                    latencyMs=latency_ms,
                    models=models,
                )
            else:
                return ProviderConfig(
                    provider="ollama",
                    endpoint=target_url,
                    status="error",
                    latencyMs=latency_ms,
                    errorMessage=f"HTTP {res.status_code}: {res.text}",
                )
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return ProviderConfig(
            provider="ollama",
            endpoint=target_url,
            status="disconnected",
            latencyMs=latency_ms,
            errorMessage=f"Connection refused ({str(e)}). Ensure 'ollama serve' is active.",
        )
