from typing import Any, Dict, Optional

class AppError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        detail: Optional[Any] = None,
        error_code: Optional[str] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

class AuthenticationError(AppError):
    def __init__(self, message: str = "Could not validate credentials", detail: Any = None):
        super().__init__(message, status_code=401, detail=detail, error_code="AUTH_ERROR")

class PermissionError(AppError):
    def __init__(self, message: str = "Not enough permissions", detail: Any = None):
        super().__init__(message, status_code=403, detail=detail, error_code="PERMISSION_DENIED")

class NotFoundError(AppError):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            f"{resource} with identifier {identifier} not found",
            status_code=404,
            error_code="NOT_FOUND",
        )

class ValidationError(AppError):
    def __init__(self, message: str, detail: Any = None):
        super().__init__(message, status_code=422, detail=detail, error_code="VALIDATION_ERROR")

class GitHubError(AppError):
    def __init__(self, message: str, detail: Any = None):
        super().__init__(message, status_code=502, detail=detail, error_code="GITHUB_API_ERROR")

class AIProviderError(AppError):
    def __init__(self, message: str, detail: Any = None):
        super().__init__(message, status_code=502, detail=detail, error_code="AI_PROVIDER_ERROR")
