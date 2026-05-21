from typing import List, Dict, Any, Optional
import json
from app.services.ai.base import AIProvider
from app.services.ai.agents import ReviewAgent
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.openrouter_provider import OpenRouterProvider
from app.core.config import settings

class ReviewOrchestrator:
    def __init__(self, provider: Optional[AIProvider] = None):
        if provider:
            self.provider = provider
        elif settings.OPENROUTER_API_KEY:
            self.provider = OpenRouterProvider(api_key=settings.OPENROUTER_API_KEY)
        else:
            self.provider = OpenAIProvider(api_key=settings.OPENAI_API_KEY or "")
        
        self.agents = [
            ReviewAgent(self.provider, "Security", "Detect SQL injection, XSS, hardcoded secrets, SSRF, and other security vulnerabilities."),
            ReviewAgent(self.provider, "Performance", "Detect expensive loops, N+1 queries, memory issues, and inefficient algorithms."),
            ReviewAgent(self.provider, "Architecture", "Detect layer violations, tight coupling, and bad abstractions."),
            ReviewAgent(self.provider, "Testing", "Detect missing tests and weak test coverage."),
            ReviewAgent(self.provider, "Clean Code", "Detect code complexity, bad naming, and duplication.")
        ]

    async def run_review(self, diff: str) -> List[Dict[str, Any]]:
        all_findings = []
        # In a more advanced implementation, these could run in parallel
        for agent in self.agents:
            findings = await agent.review_diff(diff)
            for finding in findings:
                finding["agent_name"] = agent.name
            all_findings.extend(findings)
        return all_findings

    async def generate_summary(self, findings: List[Dict[str, Any]]) -> str:
        if not findings:
            return "No significant issues found. Great job!"
        
        findings_json = json.dumps(findings, indent=2)
        prompt = f"Summarize the following code review findings and provide an overall risk score (0-100):\n\n{findings_json}"
        summary = await self.provider.generate_response(prompt, system_prompt="You are a senior lead engineer summarizing code review findings.")
        return summary
