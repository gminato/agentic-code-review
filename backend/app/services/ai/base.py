from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, AsyncGenerator

class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        pass

    @abstractmethod
    async def stream_response(self, prompt: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        pass

class AIAgent(ABC):
    def __init__(self, provider: AIProvider, name: str, prompt_template: str):
        self.provider = provider
        self.name = name
        self.prompt_template = prompt_template

    @abstractmethod
    async def review_diff(self, diff: str) -> List[Dict[str, Any]]:
        pass
