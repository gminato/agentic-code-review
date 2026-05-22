from typing import List, Dict, Any, Optional
import json
from app.services.ai.base import AIAgent, AIProvider

class ReviewAgent(AIAgent):
    def __init__(self, provider: AIProvider, name: str, role_description: str):
        prompt_template = f"""
        You are an AI Code Reviewer specializing in {name}.
        Role Description: {role_description}
        
        Your task is to review the following git diff and identify issues related to {name}.
        For each issue, provide:
        - file_path: The path to the file.
        - line_number: The line number where the issue occurs.
        - severity: low, medium, high, or critical.
        - comment: A concise explanation of the issue and how to fix it.
        
        Output MUST be a valid JSON object with a key 'findings' which is a list of these issues.
        Example output:
        {{
            "findings": [
                {{
                    "file_path": "src/main.py",
                    "line_number": 10,
                    "severity": "high",
                    "comment": "Description of the issue"
                }}
            ]
        }}
        """
        self.role_description = role_description
        super().__init__(provider, name, prompt_template)

    async def review_diff(self, diff: str) -> List[Dict[str, Any]]:
        prompt = f"Review the following diff:\n\n{diff}"
        response = await self.provider.generate_response(prompt, system_prompt=self.prompt_template)
        try:
            data = json.loads(response)
            return data.get("findings", [])
        except json.JSONDecodeError:
            # Fallback or retry logic could be added here
            return []
