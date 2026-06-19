from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

DEVIN_API_BASE = "https://api.devin.ai/v1"


def get_api_token() -> str:
    token = os.getenv("DEVIN_API_TOKEN", "")
    if not token:
        raise HTTPException(status_code=500, detail="DEVIN_API_TOKEN not configured")
    return token


def get_headers() -> dict:
    return {
        "Authorization": f"Bearer {get_api_token()}",
        "Content-Type": "application/json",
    }


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/sessions")
async def list_sessions(
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_email: Optional[str] = Query(default=None),
):
    async with httpx.AsyncClient(timeout=30.0) as client:
        params: dict = {"limit": limit, "offset": offset}
        if user_email:
            params["user_email"] = user_email
        resp = await client.get(
            f"{DEVIN_API_BASE}/sessions",
            headers=get_headers(),
            params=params,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        data = resp.json()
        sessions = data.get("sessions", [])
        users = sorted(set(
            s.get("requesting_user_email", "")
            for s in sessions
            if s.get("requesting_user_email")
        ))
        return {**data, "users": users}


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            f"{DEVIN_API_BASE}/sessions/{session_id}",
            headers=get_headers(),
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


class CreateSessionRequest(BaseModel):
    prompt: str
    title: Optional[str] = None


class SendMessageRequest(BaseModel):
    message: str


@app.post("/api/sessions")
async def create_session(req: CreateSessionRequest):
    async with httpx.AsyncClient(timeout=30.0) as client:
        body: dict = {"prompt": req.prompt}
        if req.title:
            body["title"] = req.title
        resp = await client.post(
            f"{DEVIN_API_BASE}/sessions",
            headers=get_headers(),
            json=body,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


@app.post("/api/sessions/{session_id}/message")
async def send_message(session_id: str, req: SendMessageRequest):
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{DEVIN_API_BASE}/sessions/{session_id}/message",
            headers=get_headers(),
            json={"message": req.message},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()
