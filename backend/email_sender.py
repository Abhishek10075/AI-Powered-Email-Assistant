"""Email sending service for SmartMail AI using dynamic user credentials."""

import smtplib
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587


def send_email_service(
    sender_email: str,
    sender_app_password: str,
    recipient_email: str,
    subject: str,
    body: str,
    attachments: list[tuple[str, bytes]] | None = None,
) -> None:
    """Send an email via Gmail SMTP using user-provided credentials."""
    # Saare spaces remove karein
    clean_email = sender_email.strip()
    clean_password = "".join(sender_app_password.split())

    if not clean_email or not clean_password:
        raise ValueError("User email and App Password are required.")

    msg = MIMEMultipart()
    msg["From"] = clean_email
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
        server.login(clean_email, clean_password)
        server.sendmail(clean_email, recipient_email, msg.as_string())