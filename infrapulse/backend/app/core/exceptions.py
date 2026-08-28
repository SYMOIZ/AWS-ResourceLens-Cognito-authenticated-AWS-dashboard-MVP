from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError


class InfraPulseError(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class NotFoundError(InfraPulseError):
    status_code = 404
    code = "not_found"


class ConflictError(InfraPulseError):
    status_code = 409
    code = "conflict"


class GenerationInProgressError(InfraPulseError):
    status_code = 409
    code = "generation_in_progress"

    def __init__(self) -> None:
        super().__init__("An insight generation is already running.")


class GenerationFailedError(InfraPulseError):
    status_code = 502
    code = "generation_failed"


class ValidationAppError(InfraPulseError):
    status_code = 422
    code = "validation_error"


def error_payload(code: str, message: str, details: object | None = None) -> dict:
    payload: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return payload


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(InfraPulseError)
    async def handle_app_error(_request: Request, exc: InfraPulseError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(exc.code, exc.message),
        )

    @app.exception_handler(PydanticValidationError)
    async def handle_pydantic_error(
        _request: Request, exc: PydanticValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_payload("validation_error", "Request validation failed", exc.errors()),
        )
