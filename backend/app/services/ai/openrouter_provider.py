import openai
from typing import Optional, AsyncGenerator
from app.services.ai.openai_provider import OpenAIProvider
from app.core.config import settings

class OpenRouterProvider(OpenAIProvider):
    def __init__(self, api_key: str, model: str = "openai/gpt-4-turbo"):
        # OpenRouter is OpenAI-compatible, but needs a different base URL
        self.client = openai.AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = model
        
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        # OpenRouter sometimes requires extra headers like Referer or X-Title, 
        # but the standard openai-python client might not expose them easily in the constructor
        # for simple usage, the standard call usually works.
        return await super().generate_response(prompt, system_prompt)
