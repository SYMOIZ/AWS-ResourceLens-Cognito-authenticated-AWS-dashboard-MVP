import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.routes import router
from app.core.config import get_settings
from app.core.exceptions import error_payload, register_exception_handlers
from app.core.logging import configure_logging
from app.db.seed import seed_database
from app.db.session import get_session_factory, init_db
from app.scheduler.manager import manager

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    configure_logging()
    settings = get_settings()
    logger.info(
        "InfraPulse starting env=%s demo_mode=%s ai_provider=%s scheduler_enabled=%s",
        settings.app_env,
        settings.demo_mode,
        settings.ai_provider,
        settings.scheduler_enabled,
    )
    init_db()
    SessionLocal = get_session_factory()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    if settings.scheduler_enabled:
        manager.start()
    else:
        logger.info("Scheduler disabled by configuration")
    yield
    manager.shutdown()
    logger.info("InfraPulse stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="InfraPulse",
        description="Always-On Infrastructure Agent — local MVP",
        version=__version__,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(application)

    @application.exception_handler(RequestValidationError)
    async def handle_request_validation(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_payload("validation_error", "Request validation failed", exc.errors()),
        )

    application.include_router(router, prefix="/api")
    return application


app = create_app()
