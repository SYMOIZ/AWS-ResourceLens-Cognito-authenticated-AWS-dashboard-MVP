import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.db.session import get_session_factory
from app.services.generation_service import run_scheduled_generation
from app.services.settings_service import get_public_settings

logger = logging.getLogger(__name__)


class SchedulerManager:
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        self.last_run_at: datetime | None = None
        self.last_run_status: str | None = None
        self.last_error: str | None = None
        self._started = False

    @property
    def running(self) -> bool:
        return self.scheduler.running

    def start(self) -> None:
        if not self._started:
            self.scheduler.start()
            self._started = True
            logger.info("Scheduler started")
        self.refresh_job()

    def shutdown(self) -> None:
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            self._started = False
            logger.info("Scheduler stopped")

    def refresh_job(self) -> None:
        SessionLocal = get_session_factory()
        db = SessionLocal()
        try:
            settings = get_public_settings(db)
        finally:
            db.close()

        job_id = "daily_insight"
        existing = self.scheduler.get_job(job_id)
        if existing:
            self.scheduler.remove_job(job_id)

        if not settings.scheduler_enabled:
            logger.info("Scheduler job not registered; scheduler_enabled=false")
            return

        hour, minute = [int(part) for part in settings.schedule_time.split(":")]
        trigger = CronTrigger(hour=hour, minute=minute, timezone=ZoneInfo(settings.timezone))
        self.scheduler.add_job(
            self.run_daily_job,
            trigger=trigger,
            id=job_id,
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        logger.info(
            "Scheduler job registered time=%s timezone=%s",
            settings.schedule_time,
            settings.timezone,
        )

    def next_run_at(self) -> datetime | None:
        job = self.scheduler.get_job("daily_insight")
        if job is None or job.next_run_time is None:
            return None
        next_time = job.next_run_time
        if next_time.tzinfo is None:
            return next_time.replace(tzinfo=timezone.utc)
        return next_time

    async def run_daily_job(self) -> dict:
        logger.info("Scheduled generation tick")
        SessionLocal = get_session_factory()
        db = SessionLocal()
        try:
            result = await run_scheduled_generation(db)
            self.last_run_at = datetime.now(timezone.utc)
            self.last_run_status = "skipped" if result.get("skipped") else "success"
            self.last_error = None
            return result
        except Exception as exc:
            logger.exception("Scheduled generation failed")
            self.last_run_at = datetime.now(timezone.utc)
            self.last_run_status = "failed"
            self.last_error = str(exc)
            raise
        finally:
            db.close()


manager = SchedulerManager()
