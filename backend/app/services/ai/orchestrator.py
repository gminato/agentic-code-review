from typing import List, Dict, Any, Optional, Callable
import json
from app.services.ai.base import AIProvider
from app.services.ai.agents import ReviewAgent
from app.services.ai.openai_provider import OpenAIProvider
from app.services.ai.openrouter_provider import OpenRouterProvider
from app.core.config import settings

class ReviewOrchestrator:
    def __init__(
        self, 
        provider: Optional[AIProvider] = None,
        llm_config: Optional[dict] = None,
        db_agents: Optional[List[Any]] = None
    ):
        if provider:
            self.provider = provider
        elif llm_config and llm_config.get("api_key"):
            self.provider = OpenRouterProvider(
                api_key=llm_config["api_key"],
                model=llm_config.get("model", "openai/gpt-4o-mini")
            )
        elif settings.OPENROUTER_API_KEY:
            self.provider = OpenRouterProvider(
                api_key=settings.OPENROUTER_API_KEY,
                model=settings.OPENROUTER_MODEL
            )
        else:
            self.provider = OpenAIProvider(
                api_key=settings.OPENAI_API_KEY or "",
                model=settings.OPENAI_MODEL
            )
        
        if db_agents:
            self.agents = []
            for db_agent in db_agents:
                if not db_agent.enabled:
                    continue
                
                agent_model = db_agent.model
                if agent_model == "use-global-default" or not agent_model:
                    if llm_config:
                        agent_model = llm_config.get("model", "openai/gpt-4o-mini")
                    else:
                        agent_model = settings.OPENROUTER_MODEL or "openai/gpt-4o-mini"
                
                agent_model = self.map_model_name(agent_model)
                
                if llm_config and llm_config.get("api_key"):
                    agent_provider = OpenRouterProvider(
                        api_key=llm_config["api_key"],
                        model=agent_model
                    )
                elif settings.OPENROUTER_API_KEY:
                    agent_provider = OpenRouterProvider(
                        api_key=settings.OPENROUTER_API_KEY,
                        model=agent_model
                    )
                else:
                    agent_provider = OpenAIProvider(
                        api_key=settings.OPENAI_API_KEY or "",
                        model=agent_model
                    )
                
                self.agents.append(
                    ReviewAgent(
                        provider=agent_provider,
                        name=db_agent.name,
                        role_description=db_agent.prompt
                    )
                )
        else:
            self.agents = [
                ReviewAgent(self.provider, "Security", "Detect SQL injection, XSS, hardcoded secrets, SSRF, and other security vulnerabilities."),
                ReviewAgent(self.provider, "Performance", "Detect expensive loops, N+1 queries, memory issues, and inefficient algorithms."),
                ReviewAgent(self.provider, "Architecture", "Detect layer violations, tight coupling, and bad abstractions."),
                ReviewAgent(self.provider, "Testing", "Detect missing tests and weak test coverage."),
                ReviewAgent(self.provider, "Clean Code", "Detect code complexity, bad naming, and duplication.")
            ]

    def map_model_name(self, model: str) -> str:
        mapping = {
            "claude-3-5-sonnet": "anthropic/claude-3.5-sonnet",
            "gpt-4o": "openai/gpt-4o",
            "gpt-4o-mini": "openai/gpt-4o-mini",
            "gemini-1.5-pro": "google/gemini-pro-1.5",
            "llama-3-70b": "meta-llama/llama-3-70b-instruct"
        }
        return mapping.get(model, model)

    async def run_review(self, diff: str, on_thinking: Optional[Callable] = None) -> List[Dict[str, Any]]:
        all_findings = []
        for agent in self.agents:
            if on_thinking:
                await on_thinking(
                    agent.name,
                    "running",
                    f"Analyzing code to {agent.role_description.lower()}"
                )
            
            findings = await agent.review_diff(diff)
            for finding in findings:
                finding["agent_name"] = agent.name
            all_findings.extend(findings)
            
            if on_thinking:
                await on_thinking(
                    agent.name,
                    "completed",
                    f"Completed analysis. Found {len(findings)} issues.",
                    len(findings)
                )
        return all_findings

    async def generate_summary(self, findings: List[Dict[str, Any]], on_thinking: Optional[Callable] = None) -> str:
        if on_thinking:
            await on_thinking(
                "Summary",
                "running",
                "Synthesizing findings to generate overall risk score and summary..."
            )
            
        if not findings:
            summary = "No significant issues found. Great job!"
        else:
            findings_json = json.dumps(findings, indent=2)
            prompt = f"Summarize the following code review findings and provide an overall risk score (0-100):\n\n{findings_json}"
            summary = await self.provider.generate_response(prompt, system_prompt="You are a senior lead engineer summarizing code review findings.")
            
        if on_thinking:
            await on_thinking(
                "Summary",
                "completed",
                "Generated overall risk assessment and summary."
            )
        return summary
