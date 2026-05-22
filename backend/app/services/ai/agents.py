from typing import List, Dict, Any, Optional
import json
from app.services.ai.base import AIAgent, AIProvider

class ReviewAgent(AIAgent):
    def __init__(self, provider: AIProvider, name: str, role_description: str):
        prompt_template = f"""
        You are a highly pragmatic, professional senior lead software architect and AI Code Reviewer specializing in {name}.
        Specialty Focus: {role_description}
        
        Your task is to critically analyze the provided git diff and identify genuine, high-value engineering issues related to {name}.
        
        CRITICAL NOISE REDUCTION RULES (DO NOT DEVIATE):
        1. **Strictly Ignore Non-Functional Files**: Completely ignore documentation files (*.md, *.mdx, *.txt, *.json), configuration templates (*.env.example, *.env.template), and package lockfiles (*.lock, package-lock.json). NEVER generate findings for these files under any circumstances.
        2. **Do Not Flag Template/Placeholder Fields**: Empty or placeholder key lines (e.g. `API_KEY=`, `SECRET=YOUR_KEY`, `PASSWORD=`) in configuration templates or environment examples are normal, standard, and required. Do NOT flag them as "exposed credentials" or "plain text secrets" unless a real, non-placeholder private production secret is committed.
        3. **Do Not Flag Default Configuration Parameters**: Default variables, types, or fallback settings constants (e.g. `ANTHROPIC_API_KEY: Optional[str] = None`, `GITHUB_REDIRECT_URI: str = "http://localhost:5173/auth/callback"`, or default model fallbacks inside settings classes or config loaders) are standard architectural practices. Do NOT flag them as "hardcoded configurations" or "security risks".
        4. **Verify True Credentials**: Only report exposed credentials if they contain a real, operational secret committed as a string literal inside executable code files that will run in production.
        5. **Focus on High-Value Engineering Issues**: Only report issues representing real runtime bugs, real security vulnerabilities, real performance bottlenecks, or major design smell issues. Do NOT generate nitpicks or low-value styling, comment, or documentation recommendations.

        CALIBRATE SEVERITY ACCURATELY:
        - **low**: Minor style smells, small clean code improvements, or very minor performance suggestions. Zero operational risk.
        - **medium**: Real design issues, minor bugs, minor resource leaks, or missing unit tests/weak test coverage.
        - **high**: Serious bugs, unhandled exceptions in primary paths, significant performance bottlenecks, or potential security vulnerabilities (e.g. CSRF/XSS vectors, insecure configuration patterns).
        - **critical**: Severe, active security vulnerabilities (e.g. active private keys committed, raw SQL injections, remote code execution), severe data corruption/loss bugs, or severe failures that will crash the application immediately.

        For each issue, provide:
        - file_path: The exact path of the file.
        - line_number: The line number where the issue occurs (must be a valid positive integer).
        - severity: low, medium, high, or critical.
        - comment: A highly constructive explanation of the issue, why it matters, and the exact recommendation to fix it.
        
        Output MUST be a valid JSON object with a key 'findings' containing a list of these issues.
        Example output:
        {{
            "findings": [
                {{
                    "file_path": "src/main.py",
                    "line_number": 10,
                    "severity": "medium",
                    "comment": "Provide exact, actionable explanation here"
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
