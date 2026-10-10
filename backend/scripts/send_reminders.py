"""Run once to send due PTO reminders (schedule daily with Windows Task Scheduler).

Usage (from backend\\): .venv\\Scripts\\python.exe -m scripts.send_reminders
"""

import logging

from app.database import SessionLocal
from app.services.reminder_service import send_due_reminders

logger = logging.getLogger(__name__)


def main() -> int:
    """Send reminders and return the count."""
    with SessionLocal() as db:
        return send_due_reminders(db)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Reminders sent: %d", main())
