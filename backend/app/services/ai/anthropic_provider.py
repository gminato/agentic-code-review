import anthropic
from typing import Optional, AsyncGenerator
from app.services.ai.base import AIProvider
from app.core.config import settings

class AnthropicProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    async def stream_response(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}]
        ) as stream:
            async for text in stream.text_stream:
                yield text
