import logging
import sys

from app.core.config import get_settings

SECRET_KEYS = {
    "aws_secret_access_key",
    "aws_access_key_id",
    "aws_session_token",
    "bedrock_api_key",
    "api_key",
    "secret",
    "token",
    "password",
}


class RedactingFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = str(record.getMessage())
        lowered = message.lower()
        if any(key in lowered for key in SECRET_KEYS):
            record.msg = "[redacted log message containing a sensitive key name]"
            record.args = ()
        return True


def configure_logging() -> None:
    settings = get_settings()
    root = logging.getLogger()
    if root.handlers:
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")
    )
    handler.addFilter(RedactingFilter())
    root.addHandler(handler)
    root.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("apscheduler").setLevel(logging.INFO)
