from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError
from app.core.logging import logger
import traceback

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        logger.error(
            "app_error",
            message=exc.message,
            status_code=exc.status_code,
            error_code=exc.error_code,
            detail=exc.detail,
            path=request.url.path
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "error_code": exc.error_code,
                "detail": exc.detail,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(
            "unhandled_exception",
            error=str(exc),
            traceback=traceback.format_exc(),
            path=request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={
                "message": "Internal server error",
                "error_code": "INTERNAL_SERVER_ERROR",
            },
        )
