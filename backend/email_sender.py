"""Email sending service for SmartMail AI.

Adapted from the Streamlit version: sender credentials now come from
environment variables (SENDER_EMAIL / SENDER_APP_PASSWORD) instead of
being passed in as function arguments, since this runs behind an API
that a browser talks to — the app password must never travel over the
frontend network request.
"""

import os
import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_email_service(
    recipient_email: str,
    subject: str,
    body: str,
    attachments: list[tuple[str, bytes]] | None = None,
) -> None:
    """
    Send an email via Gmail SMTP using credentials from the environment.

    Args:
        recipient_email: The address to send to.
        subject: Email subject line.
        body: Email body text.
        attachments: Optional list of (filename, file_bytes) tuples.

    Raises:
        ValueError: If SENDER_EMAIL / SENDER_APP_PASSWORD aren't configured.
        smtplib.SMTPException: If sending fails (bad login, refused, etc).
    """
    sender_email = os.getenv("SENDER_EMAIL")
    sender_app_password = os.getenv("SENDER_APP_PASSWORD")

    if not sender_email or not sender_app_password:
        raise ValueError(
            "SENDER_EMAIL and SENDER_APP_PASSWORD must be set in the backend's "
            "environment (.env file) before emails can be sent."
        )

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    if attachments:
        for filename, file_bytes in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(file_bytes)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={filename}",
            )
            msg.attach(part)

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(sender_email, sender_app_password)
        server.sendmail(sender_email, recipient_email, msg.as_string())
        