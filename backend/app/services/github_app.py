import httpx
from github import GithubIntegration, Auth
from app.core.config import settings
from typing import Optional

class GitHubAppService:
    def __init__(self):
        self.app_id = settings.GITHUB_APP_ID
        self.private_key = settings.GITHUB_PRIVATE_KEY
        # In a real app, private_key might need to be decoded if it's base64 encoded in env
        self.auth = Auth.AppAuth(self.app_id, self.private_key)
        self.gi = GithubIntegration(auth=self.auth)

    async def get_installation_token(self, installation_id: int) -> str:
        # get_access_token is a synchronous call in PyGithub
        # We can run it in a thread pool to avoid blocking the event loop
        import asyncio
        loop = asyncio.get_event_loop()
        access_token = await loop.run_in_executor(
            None, lambda: self.gi.get_access_token(installation_id)
        )
        return access_token.token

    async def get_repo_diff(self, installation_id: int, repo_full_name: str, base: str, head: str) -> Optional[str]:
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{repo_full_name}/compare/{base}...{head}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3.diff",
                    "User-Agent": "Agentic-Code-Review",
                },
            )
            if response.status_code == 200:
                return response.text
            return None

    async def post_comment(self, installation_id: int, repo_full_name: str, pr_number: int, body: str):
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.github.com/repos/{repo_full_name}/issues/{pr_number}/comments",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
                json={"body": body},
            )

    async def post_review_comment(self, installation_id: int, repo_full_name: str, pr_number: int, commit_id: str, path: str, line: int, body: str):
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}/comments",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
                json={
                    "body": body,
                    "commit_id": commit_id,
                    "path": path,
                    "line": line,
                    "side": "RIGHT"
                },
            )

    async def get_pull_requests(self, installation_id: int, repo_full_name: str) -> list:
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{repo_full_name}/pulls",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
            )
            if response.status_code == 200:
                return response.json()
            return []

    async def get_pull_request_files(self, installation_id: int, repo_full_name: str, pr_number: int) -> list:
        token = await self.get_installation_token(installation_id)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{repo_full_name}/pulls/{pr_number}/files",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
            )
            if response.status_code == 200:
                return response.json()
            return []

    async def get_user_installations(self, user_token: str) -> list:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/installations",
                headers={
                    "Authorization": f"Bearer {user_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
            )
            print(f"DEBUG: get_user_installations status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"DEBUG: installations found: {data.get('total_count', 0)}")
                return data.get("installations", [])
            print(f"DEBUG: error body: {response.text}")
            return []

    async def get_user_installation_repositories(self, user_token: str, installation_id: int) -> list:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/user/installations/{installation_id}/repositories",
                headers={
                    "Authorization": f"Bearer {user_token}",
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "Agentic-Code-Review",
                },
            )
            print(f"DEBUG: get_user_installation_repositories status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"DEBUG: repositories found: {data.get('total_count', 0)}")
                return data.get("repositories", [])
            return []

    async def get_installations(self) -> list:
        # This returns all installations of the app globally
        # Useful for some administrative tasks
        import asyncio
        loop = asyncio.get_event_loop()
        installations = await loop.run_in_executor(
            None, lambda: self.gi.get_installations()
        )
        return [i.raw_data for i in installations]

github_app_service = GitHubAppService()
