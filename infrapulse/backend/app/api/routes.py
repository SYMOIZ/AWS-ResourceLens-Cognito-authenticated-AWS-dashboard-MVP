from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import __version__
from app.core.config import get_settings
from app.db.session import get_db
from app.scheduler.manager import manager
from app.schemas.insight import GenerateInsightResponse, InsightListOut, InsightOut
from app.schemas.status import (
    AppStatus,
    HealthResponse,
    PublicSettings,
    SchedulerRunResponse,
    SchedulerStatus,
    SettingsUpdate,
)
from app.schemas.topic import TopicCreate, TopicOut, TopicUpdate
from app.services.generation_service import generate_insight, generation_in_progress
from app.services.insight_service import (
    count_insights,
    get_insight,
    get_today_insight,
    insight_to_out,
    last_successful_generation,
    list_insights,
)
from app.services.settings_service import get_public_settings, update_settings
from app.services.topic_service import create_topic, get_topic, list_topics, update_topic

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", service=settings.app_name, version=__version__)


@router.get("/status", response_model=AppStatus)
def status(db: Session = Depends(get_db)) -> AppStatus:
    settings = get_settings()
    public = get_public_settings(db)
    return AppStatus(
        status="ok",
        app=settings.app_name,
        version=settings.app_version,
        environment=settings.app_env,
        demo_mode=public.demo_mode,
        ai_provider=public.ai_provider if not public.demo_mode else "demo",
        scheduler=SchedulerStatus(
            enabled=public.scheduler_enabled,
            running=manager.running,
            schedule_time=public.schedule_time,
            timezone=public.timezone,
            next_run_at=manager.next_run_at(),
            last_run_at=manager.last_run_at,
            last_run_status=manager.last_run_status,
            last_error=manager.last_error,
        ),
        generation_in_progress=generation_in_progress(),
        total_insights=count_insights(db),
        last_successful_generation=last_successful_generation(db),
    )


@router.post("/insights/generate", response_model=GenerateInsightResponse)
async def generate(db: Session = Depends(get_db)) -> GenerateInsightResponse:
    insight = await generate_insight(db, trigger="manual")
    return GenerateInsightResponse(insight=insight, message="Generated successfully")


@router.get("/insights/today", response_model=InsightOut | None)
def today(db: Session = Depends(get_db)) -> InsightOut | None:
    row = get_today_insight(db)
    if row is None:
        return None
    return insight_to_out(row)


@router.get("/insights", response_model=InsightListOut)
def insights(
    q: str | None = Query(default=None, description="Search title, summary, topic"),
    category: str | None = None,
    topic: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> InsightListOut:
    rows, total = list_insights(
        db, query=q, category=category, topic=topic, limit=limit, offset=offset
    )
    return InsightListOut(items=[insight_to_out(row) for row in rows], total=total)


@router.get("/insights/{insight_id}", response_model=InsightOut)
def insight_detail(insight_id: int, db: Session = Depends(get_db)) -> InsightOut:
    return insight_to_out(get_insight(db, insight_id))


@router.get("/topics", response_model=list[TopicOut])
def topics(db: Session = Depends(get_db)) -> list[TopicOut]:
    return [TopicOut.model_validate(item) for item in list_topics(db)]


@router.post("/topics", response_model=TopicOut, status_code=201)
def add_topic(payload: TopicCreate, db: Session = Depends(get_db)) -> TopicOut:
    return create_topic(db, payload.name, payload.category, payload.enabled)


@router.patch("/topics/{topic_id}", response_model=TopicOut)
def patch_topic(topic_id: int, payload: TopicUpdate, db: Session = Depends(get_db)) -> TopicOut:
    get_topic(db, topic_id)
    return update_topic(
        db,
        topic_id,
        enabled=payload.enabled,
        name=payload.name,
        category=payload.category,
    )


@router.get("/settings", response_model=PublicSettings)
def read_settings(db: Session = Depends(get_db)) -> PublicSettings:
    return get_public_settings(db)


@router.patch("/settings", response_model=PublicSettings)
def patch_settings(payload: SettingsUpdate, db: Session = Depends(get_db)) -> PublicSettings:
    updated = update_settings(db, payload)
    manager.refresh_job()
    return updated


@router.post("/scheduler/run", response_model=SchedulerRunResponse)
async def scheduler_run() -> SchedulerRunResponse:
    """Development helper: execute the same job the daily scheduler would run."""
    result = await manager.run_daily_job()
    return SchedulerRunResponse(**result)
