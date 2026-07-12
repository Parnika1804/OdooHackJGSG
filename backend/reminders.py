"""
License-expiry email reminder.

- Runs a daily background job (APScheduler, no Redis/Celery needed) inside
  the same FastAPI process.
- Finds drivers whose license_expiry_date is within LICENSE_EXPIRY_THRESHOLD_DAYS
  (or already expired).
- Emails each such driver directly (if they have an email on file), and
  sends a single digest email to every Safety Officer user.
- Sends over plain Gmail SMTP with an App Password — no third-party email API.

Setup:
  pip install apscheduler
  Run add_driver_email.sql once against your DB (adds drivers.email column)
  Add to .env:
    GMAIL_ADDRESS=youraddress@gmail.com
    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (Google Account -> Security -> App Passwords)
    LICENSE_EXPIRY_THRESHOLD_DAYS=30         (optional, defaults to 30)

Wire into main.py:
    from reminders import router as reminders_router, start_scheduler
    app.include_router(reminders_router)

    @app.on_event("startup")
    def _start_reminder_scheduler():
        start_scheduler()
"""

import os
import smtplib
from datetime import date, timedelta
from email.mime.text import MIMEText

from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import APIRouter
from sqlalchemy import text

from database import engine

load_dotenv()

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
THRESHOLD_DAYS = int(os.getenv("LICENSE_EXPIRY_THRESHOLD_DAYS", "30"))

router = APIRouter(prefix="/reminders", tags=["Reminders"])


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        print("⚠️  GMAIL_ADDRESS/GMAIL_APP_PASSWORD not set in .env — skipping send.")
        return False

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
        return False


def _get_expiring_drivers(conn):
    cutoff = date.today() + timedelta(days=THRESHOLD_DAYS)
    rows = conn.execute(text("""
        SELECT id, name, email, license_number, license_expiry_date
        FROM drivers
        WHERE license_expiry_date <= :cutoff
        ORDER BY license_expiry_date ASC
    """), {"cutoff": cutoff}).mappings().all()
    return list(rows)


def _get_safety_officer_emails(conn):
    rows = conn.execute(text("""
        SELECT email FROM users WHERE role = 'Safety Officer'
    """)).mappings().all()
    return [r["email"] for r in rows]


def _status_label(expiry_date: date) -> str:
    return "EXPIRED" if expiry_date < date.today() else "expiring soon"


def check_expiring_licenses():
    """Core job: finds expiring/expired licenses, emails drivers + Safety Officers."""
    with engine.connect() as conn:
        expiring = _get_expiring_drivers(conn)
        officer_emails = _get_safety_officer_emails(conn)

    if not expiring:
        print("✅ License check ran — no expiring or expired licenses found.")
        return {"expiring_count": 0, "driver_emails_sent": 0, "officer_digest_sent": False}

    driver_emails_sent = 0
    for d in expiring:
        if d["email"]:
            body = (
                f"Hi {d['name']},\n\n"
                f"Your driving license ({d['license_number']}) "
                f"{_status_label(d['license_expiry_date'])} on {d['license_expiry_date']}.\n"
                f"Please renew it as soon as possible to remain eligible for trip assignments.\n\n"
                f"— TransitOps"
            )
            if _send_email(d["email"], "License Renewal Reminder — TransitOps", body):
                driver_emails_sent += 1

    officer_digest_sent = False
    if officer_emails:
        lines = [
            f"- {d['name']} (License {d['license_number']}): "
            f"{_status_label(d['license_expiry_date'])} on {d['license_expiry_date']}"
            for d in expiring
        ]
        digest_body = (
            f"The following {len(expiring)} driver(s) have licenses expiring within "
            f"{THRESHOLD_DAYS} days or already expired:\n\n"
            + "\n".join(lines)
            + "\n\n— TransitOps automated compliance check"
        )
        for officer_email in officer_emails:
            if _send_email(officer_email, "Driver License Expiry Digest — TransitOps", digest_body):
                officer_digest_sent = True

    print(f"✅ License check complete: {len(expiring)} driver(s) flagged, "
          f"{driver_emails_sent} direct emails sent, "
          f"digest sent to {len(officer_emails)} Safety Officer(s).")

    return {
        "expiring_count": len(expiring),
        "driver_emails_sent": driver_emails_sent,
        "officer_digest_sent": officer_digest_sent,
    }


@router.post("/check-licenses")
def run_check_now():
    """Manually trigger the license-expiry check immediately — for demo purposes,
    so you don't have to wait for the daily schedule to fire."""
    result = check_expiring_licenses()
    return {"message": "License check completed", **result}


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(check_expiring_licenses, "cron", hour=8, minute=0)
    scheduler.start()
    print(f"📅 License-expiry reminder scheduler started (daily 8:00 AM, "
          f"threshold {THRESHOLD_DAYS} days).")