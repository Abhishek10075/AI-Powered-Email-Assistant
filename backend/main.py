"""Main FastAPI application for SmartMail AI assistant."""

import os
import smtplib
from typing import List

from dotenv import load_dotenv
from email_reader import (
    delete_inbox_email,
    fetch_inbox_emails,
    verify_user_credentials,
)
from email_sender import send_email_service
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, EmailStr
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


class LoginRequest(BaseModel):
    """Schema for user credentials verification."""

    email: EmailStr
    app_password: str


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
2. Decide the appropriate length yourself based on the description.
3. The subject line is already fixed above - do NOT generate or repeat a subject line in your output.
4. Use a professional greeting.
5. Write the main body based on the short description.
6. End with an appropriate closing phrase followed by a new line.
7. MANDATORY: After the closing phrase, add every item listed under "Contact Details" exactly as given.
8. If Contact Details is empty, skip the signature block entirely.
9. Return only the email body text - no extra labels.
"""


# --------------------------------------------------
# Auth Route
# --------------------------------------------------
@app.post("/api/auth/login")
async def login_endpoint(data: LoginRequest):
    """Validate Gmail ID and App Password by checking IMAP connection."""
    try:
        await run_in_threadpool(
            verify_user_credentials,
            user_email=data.email,
            user_app_password=data.app_password,
        )
        return {"success": True, "message": "Login successful!"}
    except Exception as err:
        raise HTTPException(
            status_code=401,
            detail="Invalid Gmail address or App Password. Make sure IMAP is enabled and 16-character App Password is correct.",
        ) from err


# --------------------------------------------------
# Email Generation (Uses Gemini API key)
# --------------------------------------------------
@app.post("/api/generate-email")
def generate_email_endpoint(data: EmailRequest):
    """Endpoint to generate an email body from prompt description."""
    client = get_client()
    prompt = EMAIL_PROMPT_TEMPLATE.format(
        subject=data.subject,
        short_description=data.short_description,
        contact_details=data.contact_details,
    )
    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        return {"success": True, "email": response.text}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


# --------------------------------------------------
# Email Sending (Uses User Credentials)
# --------------------------------------------------
@app.post("/api/send-email")
async def send_email_endpoint(
    sender_email: str = Form(...),
    sender_app_password: str = Form(...),
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    attachments: List[UploadFile] = File(default=[]),
):
    """Endpoint to dispatch email with attachments via SMTP using user credentials."""
    try:
        files_data = []
        for f in attachments:
            if f.filename:
                content = await f.read()
                files_data.append((f.filename, content))

        await run_in_threadpool(
            send_email_service,
            sender_email=sender_email,
            sender_app_password=sender_app_password,
            recipient_email=to,
            subject=subject,
            body=body,
            attachments=files_data,
        )
        return {"success": True}
    except smtplib.SMTPAuthenticationError as exc:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed. Please verify your Gmail App Password.",
        ) from exc
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


# --------------------------------------------------
# Email Reading & Deletion (Uses Headers)
# --------------------------------------------------
@app.get("/api/emails/inbox")
async def get_inbox_emails(
    x_user_email: str = Header(...),
    x_user_password: str = Header(...),
    limit: int = 10,
):
    """Endpoint to fetch latest emails from inbox using user headers."""
    try:
        emails = await run_in_threadpool(
            fetch_inbox_emails,
            user_email=x_user_email,
            user_app_password=x_user_password,
            limit=limit,
        )
        return {"success": True, "emails": emails}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err


@app.delete("/api/emails/inbox/{email_id}")
async def delete_email_endpoint(
    email_id: str,
    x_user_email: str = Header(...),
    x_user_password: str = Header(...),
):
    """Endpoint to permanently delete an email from inbox using user headers."""
    try:
        await run_in_threadpool(
            delete_inbox_email,
            user_email=x_user_email,
            user_app_password=x_user_password,
            email_id=email_id,
        )
        return {"success": True, "message": f"Email {email_id} deleted successfully."}
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err)) from err