"""Main FastAPI application for SmartMail AI assistant."""

import os
import smtplib
from typing import List

from dotenv import load_dotenv
from email_reader import fetch_inbox_emails
from email_sender import send_email_service
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

load_dotenv()

app = FastAPI(title="SmartMail AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmailRequest(BaseModel):
    """Schema for incoming email generation request."""

    subject: str
    short_description: str
    contact_details: str = ""


def get_client():
    """Initialize and return the Google Gemini client."""
    api_key = os.getenv("GEMINIAI_API_KEY")
    if not api_key:
        raise ValueError("GEMINIAI_API_KEY environment variable set nahi hai.")
    return genai.Client(api_key=api_key)


EMAIL_PROMPT_TEMPLATE = """
You are a professional email writing assistant.

Your task is to write a professional and natural email body
based on the information provided by the user.

Subject:
{subject}

Short Description / Purpose of Email:
{short_description}

Contact Details:
{contact_details}

Instructions:

1. Understand the purpose of the email from the short description.
2. Decide the appropriate length yourself based on the description -
   if the description is short, keep the email short but still
   complete and meaningful. If the description has more detail,
   write a longer, properly structured email.
3. The subject line is already fixed above - do NOT generate or
   repeat a subject line in your output.
4. Use a professional greeting.
5. Write the main body based on the short description.
6. End with an appropriate closing phrase (e.g. "Best regards," /
   "Sincerely,") followed by a new line.
7. MANDATORY: After the closing phrase, add every item listed under
   "Contact Details" above, each on its own line, exactly as a
   signature block. Do not skip this even if the description already
   mentions similar information. Do not paraphrase or reword the
   contact details - reproduce them exactly as given.
8. If Contact Details is empty, skip the signature block entirely -
   do not invent any contact information.
9. Do not explain how you generated the email.
10. Return only the email body text - no "Subject:" line, no extra labels.
"""


def generate_email_service(
    subject: str, short_description: str, contact_details: str
) -> str:
    """Generate professional email draft using Gemini AI."""
    client = get_client()

    prompt = EMAIL_PROMPT_TEMPLATE.format(
        subject=subject,
        short_description=short_description,
        contact_details=contact_details,
    )

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        raise RuntimeError(f"Gemini API error: {str(e)}") from e


@app.post("/api/generate-email")
def generate_email_endpoint(data: EmailRequest):
    """Endpoint to generate an email body from prompt description."""
    try:
        email_body = generate_email_service(
            subject=data.subject,
            short_description=data.short_description,
            contact_details=data.contact_details,
        )
        return {"success": True, "email": email_body}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.post("/api/send-email")
async def send_email_endpoint(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
):
    """Endpoint to dispatch email with attachments via SMTP."""
    try:
        files_data = []
        for f in attachments:
            if f.filename:
                content = await f.read()
                files_data.append((f.filename, content))

        await run_in_threadpool(
            send_email_service,
            recipient_email=to,
            subject=subject,
            body=body,
            attachments=files_data,
        )
        return {"success": True}
    except ValueError as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
    except smtplib.SMTPAuthenticationError as exc:
        raise HTTPException(
            status_code=502,
            detail="Gmail login fail hua. Kripya apna 16-character App Password check karein.",
        ) from exc
    except smtplib.SMTPException as err:
        raise HTTPException(status_code=502, detail=f"SMTP error: {err}") from err
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.get("/api/emails/inbox")
async def get_inbox_emails(limit: int = 10):
    """Endpoint to fetch latest emails from inbox."""
    try:
        emails = await run_in_threadpool(fetch_inbox_emails, limit=limit)
        return {"success": True, "emails": emails}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err
    