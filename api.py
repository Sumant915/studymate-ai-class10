import logging
import os
from pathlib import Path
from threading import Lock
from typing import Any, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from Tutor import (
    MODEL,
    RERANKER_MODEL_NAME,
    SUBJECT_INDEX_PATHS,
    get_answer,
    is_embedding_model_loaded,
)


logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://studymate-ai-class10-frontend.vercel.app",
]


def parse_cors_origins(configured_origins: str | None) -> list[str]:
    origins = DEFAULT_CORS_ORIGINS.copy()
    if configured_origins:
        origins.extend(configured_origins.split(","))

    normalized_origins = []
    for origin in origins:
        normalized = origin.strip().rstrip("/")
        if normalized and normalized not in normalized_origins:
            normalized_origins.append(normalized)
    return normalized_origins


CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS"))

SUBJECT_DISPLAY_NAMES = {
    "Science": "Science",
    "Maths": "Maths",
    "English": "English",
    "Social_Science": "Social Science",
}
SUBJECT_ALIASES = {
    **{subject: subject for subject in SUBJECT_INDEX_PATHS},
    "Social Science": "Social_Science",
}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=12000)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=12000)
    subject: str = Field(default="Science", max_length=100)
    chat_history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=100,
    )
    session_id: str | None = Field(default=None, max_length=200)


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=12000)
    session_id: str = Field(min_length=1, max_length=200)


class TutorResponse(BaseModel):
    answer: str
    subject: str
    subject_id: str
    sources: list[dict[str, Any]]
    session_id: str | None = None


class AskResponse(BaseModel):
    answer: str
    sources: list[dict[str, Any]]
    session_id: str


api = FastAPI(title="Class 10 AI Tutor API", version="1.0.0")


@api.get("/")
def root() -> dict[str, str]:
    return {"status": "running", "message": "Class 10 AI Tutor backend is running."}


@api.get("/health")
def health() -> dict[str, Any]:
    indexes = {
        subject: index_is_available(subject)
        for subject in SUBJECT_INDEX_PATHS
    }
    api_key_configured = bool(os.getenv("GROQ_API_KEY", "").strip())
    embedding_loaded = is_embedding_model_loaded()
    ready = (
        api_key_configured
        and all(indexes.values())
        and embedding_loaded
    )
    return {
        "status": "ok",
        "ready": ready,
        "readiness": "ready" if ready else "not_ready",
        "configuration": {
            "model": MODEL,
            "reranker_model": RERANKER_MODEL_NAME,
            "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
            "embedding_model_loaded": embedding_loaded,
            "groq_api_key_configured": api_key_configured,
            "indexes_available": indexes,
            "cors_origins": CORS_ORIGINS,
        },
    }


@api.get("/subjects")
def subjects() -> dict[str, list[dict[str, Any]]]:
    return {
        "subjects": [
            {
                "id": subject,
                "name": SUBJECT_DISPLAY_NAMES[subject],
                "index_available": index_is_available(subject),
            }
            for subject in SUBJECT_INDEX_PATHS
        ]
    }


@api.post("/chat", response_model=TutorResponse)
def chat(request: ChatRequest) -> TutorResponse:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    subject_id = normalize_subject(request.subject)
    session_id = request.session_id.strip() if request.session_id else None
    if request.session_id is not None and not session_id:
        raise HTTPException(status_code=422, detail="Session ID must not be empty.")

    history = [message.model_dump() for message in request.chat_history]
    session_lock = get_session_lock(subject_id, session_id)
    if session_lock is None:
        result = run_tutor(question, subject_id, history)
    else:
        with session_lock:
            result = run_tutor(question, subject_id, history)

    if result.get("error"):
        raise_tutor_error(result)

    answer = result.get("answer")
    if not isinstance(answer, str):
        raise HTTPException(
            status_code=502,
            detail="The tutor did not receive an answer. Please try again.",
        )

    return TutorResponse(
        answer=answer,
        subject=SUBJECT_DISPLAY_NAMES[subject_id],
        subject_id=subject_id,
        sources=result.get("sources", []),
        session_id=session_id,
    )


@api.post("/ask", response_model=AskResponse)
def ask(request: AskRequest) -> AskResponse:
    question = request.question.strip()
    session_id = request.session_id.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question must not be empty.")
    if not session_id:
        raise HTTPException(status_code=422, detail="Session ID must not be empty.")

    subject_id = "Science"
    session_history, session_lock = get_session_state(subject_id, session_id)
    with session_lock:
        result = run_tutor(question, subject_id, session_history)

    if result.get("error"):
        raise_tutor_error(result)

    answer = result.get("answer")
    if not isinstance(answer, str):
        raise HTTPException(
            status_code=502,
            detail="The tutor did not receive an answer. Please try again.",
        )

    return AskResponse(
        answer=answer,
        sources=result.get("sources", []),
        session_id=session_id,
    )


app = CORSMiddleware(
    app=api,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
    ],
)


session_histories: dict[tuple[str, str], list[dict[str, str]]] = {}
session_locks: dict[tuple[str, str], Lock] = {}
session_locks_guard = Lock()


def normalize_subject(subject: str) -> str:
    normalized = SUBJECT_ALIASES.get(subject.strip())
    if normalized is None:
        raise HTTPException(
            status_code=400,
            detail="Unsupported subject. Choose Science, Maths, English, or Social Science.",
        )
    return normalized


def get_session_state(
    subject: str,
    session_id: str,
) -> tuple[list[dict[str, str]], Lock]:
    key = (subject, session_id)
    with session_locks_guard:
        if key not in session_histories:
            session_histories[key] = []
            session_locks[key] = Lock()

        return session_histories[key], session_locks[key]


def get_session_lock(subject: str, session_id: str | None) -> Lock | None:
    if not session_id:
        return None

    key = (subject, session_id)
    with session_locks_guard:
        if key not in session_locks:
            session_locks[key] = Lock()
        return session_locks[key]


def index_is_available(subject: str) -> bool:
    index_path = Path(SUBJECT_INDEX_PATHS[subject])
    return (
        (index_path / "index.faiss").is_file()
        and (index_path / "index.pkl").is_file()
    )


def run_tutor(
    question: str,
    subject: str,
    chat_history: list[dict[str, str]],
) -> dict[str, Any]:
    try:
        return get_answer(question, chat_history, subject)
    except Exception:
        logger.exception("Tutor failed while processing a question.")
        raise HTTPException(
            status_code=500,
            detail="The tutor could not process this question.",
        ) from None


def raise_tutor_error(result: dict[str, Any]) -> None:
    error_type = result.get("error_type")
    if error_type == "configuration":
        raise HTTPException(
            status_code=503,
            detail="The tutor service is not configured correctly.",
        )
    if error_type == "unsupported_subject":
        raise HTTPException(status_code=400, detail="Unsupported subject.")
    if error_type == "index_unavailable":
        raise HTTPException(
            status_code=503,
            detail="The selected subject's textbook index is not available.",
        )
    if error_type == "groq_timeout":
        raise HTTPException(
            status_code=504,
            detail="The tutor did not receive a response in time. Please try again.",
        )
    if error_type == "groq_rate_limited":
        raise HTTPException(
            status_code=503,
            detail="The tutor is temporarily busy. Please try again shortly.",
        )
    if error_type == "groq_failure":
        raise HTTPException(
            status_code=502,
            detail="The tutor could not generate an answer. Please try again.",
        )
    if error_type == "retrieval":
        logger.error("Tutor retrieval or reranking failed: %s", result.get("error"))
        raise HTTPException(
            status_code=500,
            detail="The tutor could not retrieve textbook information.",
        )
    logger.error("Tutor returned an unexpected error: %s", result.get("error"))
    raise HTTPException(
        status_code=500,
        detail="The tutor could not process this question.",
    )
