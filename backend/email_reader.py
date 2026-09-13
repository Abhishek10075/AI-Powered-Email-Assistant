"""Email reading and HTML parsing service for SmartMail AI."""

import os
import imaplib
from email import policy
from email.parser import BytesParser
from bs4 import BeautifulSoup

IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993


def clean_html_to_text(html_content: str) -> str:
    """HTML tags, styles aur scripts hata kar clean readable text banata hai."""
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        for tag in soup(["script", "style", "head", "title", "meta", "[document]"]):
            tag.decompose()
        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines()]
        return "\n".join([line for line in lines if line])
    except (ValueError, TypeError, AttributeError):
        return html_content


def fetch_inbox_emails(limit: int = 10):
    """Fetch the latest emails from the Gmail inbox via IMAP."""
    sender_email = os.getenv("SENDER_EMAIL")
    sender_app_password = os.getenv("SENDER_APP_PASSWORD")

    if not sender_email or not sender_app_password:
        raise ValueError("SENDER_EMAIL ya SENDER_APP_PASSWORD missing hai.")

    emails_list = []

    with imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT) as mail:
        mail.login(sender_email, sender_app_password)
        mail.select("INBOX")

        status, messages = mail.search(None, "ALL")
        if status != "OK" or not messages[0]:
            return []

        email_ids = messages[0].split()
        latest_ids = email_ids[-limit:]
        latest_ids.reverse()

        for e_id in latest_ids:
            status, data = mail.fetch(e_id, "(RFC822)")
            if status != "OK" or not data or not data[0]:
                continue

            raw_email = data[0][1]
            msg = BytesParser(policy=policy.default).parsebytes(raw_email)

            subject = str(msg["Subject"] or "No Subject")
            from_ = str(msg["From"] or "Unknown")
            date_ = str(msg["Date"] or "")

            body_text = ""
            html_fallback = ""

            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition", ""))

                    if "attachment" in content_disposition:
                        continue

                    if content_type == "text/plain" and not body_text:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body_text = payload.decode(
                                part.get_content_charset() or "utf-8",
                                errors="ignore",
                            )
                    elif content_type == "text/html" and not html_fallback:
                        payload = part.get_payload(decode=True)
                        if payload:
                            html_fallback = payload.decode(
                                part.get_content_charset() or "utf-8",
                                errors="ignore",
                            )
            else:
                content_type = msg.get_content_type()
                payload = msg.get_payload(decode=True)
                if payload:
                    decoded = payload.decode(
                        msg.get_content_charset() or "utf-8", errors="ignore"
                    )
                    if content_type == "text/html":
                        html_fallback = decoded
                    else:
                        body_text = decoded

            if not body_text and html_fallback:
                body_text = clean_html_to_text(html_fallback)
            elif body_text and "<html" in body_text.lower():
                body_text = clean_html_to_text(body_text)

            emails_list.append({
                "id": e_id.decode(),
                "from": from_,
                "subject": subject,
                "date": date_,
                "body": body_text.strip(),
            })

    return emails_list
