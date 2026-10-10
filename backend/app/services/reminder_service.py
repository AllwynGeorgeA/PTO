"""Email reminders for PTO plans starting tomorrow (SMTP, STARTTLS)."""

import logging
import smtplib
from datetime import date, datetime, timedelta, timezone
from email.message import EmailMessage

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PtoPlan, User

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> None:
    """Send one email via SMTP with STARTTLS. Raises on failure."""
    msg = EmailMessage()
    msg["From"] = settings.SMTP_USER or "noreply@ptoshield.ai"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
        smtp.starttls()
        if settings.SMTP_USER:
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.send_message(msg)


def send_due_reminders(db: Session, today: date | None = None) -> int:
    """Email owners of active users' plans starting tomorrow; return the number sent.

    Without SMTP config this only logs and returns 0 (reminder_sent_at stays null).
    Blocking: from async code call via asyncio.to_thread.
    """
    today = today or date.today()
    rows = db.execute(
        select(PtoPlan, User)
        .join(User, User.id == PtoPlan.user_id)
        .where(
            PtoPlan.start_date == today + timedelta(days=1),
            PtoPlan.reminder_sent_at.is_(None),
            User.is_active.is_(True),
        )
    ).all()
    if not settings.smtp_enabled:
        logger.info("SMTP not configured: %d reminder(s) due, none sent", len(rows))
        return 0
    sent = 0
    for plan, user in rows:
        body = (
            f"Hi {user.full_name or 'there'},\n\n"
            f"Your time off starts tomorrow ({plan.start_date}). "
            f"Backup: {plan.backup_person} ({plan.contact_email}).\n"
            "Make sure your handover tasks are done. Enjoy!\n\nPTOShield AI"
        )
        try:
            send_email(user.email, "Your PTO starts tomorrow", body)
        except (smtplib.SMTPException, OSError):
            logger.exception("Reminder failed for plan %s", plan.id)
            continue
        plan.reminder_sent_at = datetime.now(timezone.utc)
        db.commit()
        sent += 1
    logger.info("Sent %d reminder(s)", sent)
    return sent
