import os
import time
import httpx
from fastapi import APIRouter
from ...models.schemas import ProviderConfig
from ...services.ollama_client import test_ollama_connection

router = APIRouter(prefix="/provider", tags=["provider"])

@router.get("/status", response_model=ProviderConfig)
async def check_provider_status(
    provider: str = "ollama",
    endpoint: str | None = None,
    model: str | None = None,
):
    if provider == "ollama":
        return await test_ollama_connection(endpoint, model)
    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return ProviderConfig(
                provider="openai",
                endpoint="https://api.openai.com",
                model=model or "",
                status="disconnected",
                errorMessage="OPENAI_API_KEY is not set in the backend environment.",
            )
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {api_key}"},
                )
            latency = round((time.perf_counter() - started) * 1000)
            if response.status_code != 200:
                return ProviderConfig(
                    provider="openai",
                    endpoint="https://api.openai.com",
                    model=model or "",
                    status="error",
                    latencyMs=latency,
                    errorMessage=("OpenAI rejected the server-side API key." if response.status_code == 401 else
                                  "OpenAI denied the request; check API access." if response.status_code == 403 else
                                  "OpenAI rate limit reached; try again later." if response.status_code == 429 else
                                  f"OpenAI status check failed (HTTP {response.status_code})."),
                )
            try:
                models = [item.get("id", "") for item in response.json().get("data", []) if item.get("id")]
            except (ValueError, TypeError, AttributeError) as exc:
                return ProviderConfig(
                    provider="openai", endpoint="https://api.openai.com", model=model or "",
                    status="error", errorMessage="OpenAI returned an invalid model list. Try again later.",
                )
            return ProviderConfig(
                provider="openai",
                endpoint="https://api.openai.com",
                model=model or "",
                status="connected",
                latencyMs=latency,
                models=models,
            )
        except httpx.TimeoutException:
            return ProviderConfig(provider="openai", endpoint="https://api.openai.com", model=model or "", status="error", errorMessage="OpenAI status check timed out.")
        except httpx.HTTPError:
            return ProviderConfig(provider="openai", endpoint="https://api.openai.com", model=model or "", status="disconnected", errorMessage="Cannot reach OpenAI. Check network connectivity.")
    return ProviderConfig(provider="ollama", status="error", errorMessage="Unsupported provider. Choose OpenAI or Ollama.")

@router.post("/test", response_model=ProviderConfig)
async def test_provider(config: ProviderConfig):
    if config.provider == "openai":
        return await check_provider_status(provider="openai", model=config.model)
    return await test_ollama_connection(config.endpoint, config.model)
