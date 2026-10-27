import os
from threading import Lock

import requests
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "faiss_index")
SUBJECT_INDEX_PATHS = {
    "Science": INDEX_PATH,
    "English": os.path.join(BASE_DIR, "faiss_indexes", "English"),
    "Maths": os.path.join(BASE_DIR, "faiss_indexes", "Maths"),
    "Social_Science": os.path.join(
        BASE_DIR, "faiss_indexes", "Social_Science"
    ),
}

MODEL = "openai/gpt-oss-120b"
RERANKER_MODEL_NAME = "disabled (memory optimization)"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

_embeddings = None
_embeddings_lock = Lock()
_retrieval_lock = Lock()
vectorstores = {}
_vectorstore_locks = {
    subject: Lock()
    for subject in SUBJECT_INDEX_PATHS
}

# Default history for CLI usage.
chat_history = []


def get_groq_headers() -> dict[str, str] | None:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None

    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


def get_embeddings():
    global _embeddings

    with _embeddings_lock:
        if _embeddings is not None:
            return _embeddings

        os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
        os.environ.setdefault("OMP_NUM_THREADS", "1")

        from langchain_huggingface import HuggingFaceEmbeddings

        print("Loading embedding model...")
        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
            encode_kwargs={"batch_size": 1},
        )
        return _embeddings


def is_embedding_model_loaded() -> bool:
    return _embeddings is not None


def get_vectorstore(subject: str = "Science"):
    if subject not in SUBJECT_INDEX_PATHS:
        raise ValueError(f"Unsupported subject: {subject}")

    with _vectorstore_locks[subject]:
        if subject in vectorstores:
            return vectorstores[subject]

        index_path = SUBJECT_INDEX_PATHS[subject]
        required_files = ("index.faiss", "index.pkl")
        if not all(
            os.path.isfile(os.path.join(index_path, filename))
            for filename in required_files
        ):
            raise FileNotFoundError(
                f"FAISS index files are not available for {subject}: {index_path}"
            )

        print(f"Loading {subject} FAISS index...")
        vectorstore = FAISS.load_local(
            index_path,
            get_embeddings(),
            allow_dangerous_deserialization=True,
        )
        vectorstores[subject] = vectorstore
        print(f"{subject} FAISS index loaded successfully!")
        return vectorstore


def rewrite_question(question: str, history: list[dict[str, str]]) -> str:
    if not history:
        return question

    headers = get_groq_headers()
    if headers is None:
        return question

    history_text = "\n".join(
        f"{message['role']}: {message['content']}"
        for message in history[-6:]
    )
    rewrite_prompt = f"""
You rewrite student questions for a textbook search system.
Use conversation history to understand the current question.
Rewrite it as a standalone search query, resolving references such as "it",
"this", "that", or "explain more". Preserve the student's intent, do not
answer the question, and return only the rewritten query.

Conversation History:
{history_text}

Current Question:
{question}

Standalone Search Query:
"""
    try:
        response = requests.post(
            GROQ_URL,
            headers=headers,
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": rewrite_prompt}],
                "temperature": 0,
                "max_completion_tokens": 150,
            },
            timeout=(3, 8),
        )
        if response.status_code == 200:
            rewritten = (
                response.json()["choices"][0]["message"]["content"].strip()
            )
            if rewritten:
                return rewritten
    except requests.RequestException as error:
        print("Question rewriting failed:", error)
    except (ValueError, KeyError, IndexError, TypeError):
        print("Question rewriting returned an invalid response.")

    return question


def _failure(message: str, error_type: str) -> dict:
    return {
        "answer": None,
        "sources": [],
        "error": message,
        "error_type": error_type,
    }


def get_answer(
    question: str,
    chat_history: list[dict[str, str]],
    subject: str = "Science",
) -> dict:
    headers = get_groq_headers()
    if headers is None:
        return _failure(
            "Groq API authorization is not configured.",
            "configuration",
        )

    if subject not in SUBJECT_INDEX_PATHS:
        return _failure(f"Unsupported subject: {subject}", "unsupported_subject")

    history_text = "\n".join(
        f"{message['role']}: {message['content']}"
        for message in chat_history[-6:]
    )
    search_query = rewrite_question(question, chat_history)

    try:
        with _retrieval_lock:
            vectorstore = get_vectorstore(subject)
            retrieved_docs = vectorstore.max_marginal_relevance_search(
                search_query,
                k=5,
                fetch_k=10,
                lambda_mult=0.5,
            )
    except FileNotFoundError as error:
        return _failure(str(error), "index_unavailable")
    except Exception as error:
        return _failure(
            f"Textbook retrieval failed. Details: {error}",
            "retrieval",
        )

    sources = []
    context = []
    for doc in retrieved_docs:
        pdf_name = doc.metadata.get("pdf_name", "Unknown PDF")
        page = doc.metadata.get(
            "page_label",
            doc.metadata.get("page", "Unknown"),
        )
        source = {
            "pdf_name": pdf_name,
            "page": page,
            "subject": doc.metadata.get("subject", subject),
            "source_text": doc.page_content,
        }
        chapter = doc.metadata.get("chapter")
        if chapter is not None:
            source["chapter"] = chapter

        existing_source = next(
            (
                existing
                for existing in sources
                if existing["pdf_name"] == pdf_name
                and existing["page"] == page
            ),
            None,
        )
        if existing_source is None:
            sources.append(source)
        elif doc.page_content not in existing_source["source_text"].split("\n\n"):
            existing_source["source_text"] += f"\n\n{doc.page_content}"

        context.append(
            f"Source: {pdf_name}, Page: {page}\nContent: {doc.page_content}"
        )

    subject_name = subject.replace("_", " ")
    prompt = f"""
You are an expert Class 10 {subject_name} AI Tutor designed to help
students understand their textbook concepts clearly and accurately.

## Core Instructions
- Use only the retrieved textbook context for factual answers.
- Use conversation history to understand follow-up questions.
- Never invent textbook facts, examples, page numbers or citations.
- If the context is insufficient, say:
  "I could not find sufficient information in the provided books."
- If only part of the question is answerable, answer that part
  and state what information is missing.
- Distinguish explicitly stated textbook facts from interpretations and
  inferences. Never present an inference as an explicit textbook conclusion.

## Follow-up Questions
- Resolve references such as "it", "this", "that", "why",
  "explain more" and "give an example" using conversation history.
- Do not treat conversation history as proof of textbook facts.
- If the topic changes, focus on the new question.
- Ask for clarification if the intended question is unclear.

## Answering Style
- Use simple English suitable for Class 10.
- Explain concepts step by step when necessary.
- Keep simple answers concise.
- Include examples, equations and other details only when
  supported by the retrieved textbook context.

## Citations
- Cite the PDF name and page number provided in the context.
- Never invent citations.
- Clearly state when requested information is missing.

## Selected Subject
{subject_name}

## Conversation History
{history_text}

## Retrieved Textbook Context
{"\n\n".join(context)}

## Current Student Question
{question}

Before answering, verify that factual claims are supported by the retrieved
context and that citations are accurate.

Answer:
"""
    try:
        response = requests.post(
            GROQ_URL,
            headers=headers,
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_completion_tokens": 2048,
            },
            timeout=(3, 18),
        )
        if response.status_code != 200:
            print("Groq API returned status:", response.status_code)
            if response.status_code in (401, 403):
                return _failure(
                    "Groq API authorization failed.",
                    "configuration",
                )
            if response.status_code == 429:
                return _failure(
                    "Groq is temporarily rate limited.",
                    "groq_rate_limited",
                )
            if response.status_code == 504:
                return _failure("Groq request timed out.", "groq_timeout")
            return _failure(
                "Groq did not return an answer.",
                "groq_failure",
            )

        answer = response.json()["choices"][0]["message"]["content"]
        if not isinstance(answer, str) or not answer.strip():
            return _failure("Groq returned an empty answer.", "groq_failure")
    except requests.Timeout as error:
        print("Groq request timed out:", error)
        return _failure("Groq request timed out.", "groq_timeout")
    except requests.RequestException as error:
        print("Groq request failed:", error)
        return _failure("Groq request failed.", "groq_failure")
    except (ValueError, KeyError, IndexError, TypeError):
        print("Groq returned an invalid response.")
        return _failure("Groq returned an invalid response.", "groq_failure")

    chat_history.extend(
        [
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer},
        ]
    )
    del chat_history[:-6]

    return {"answer": answer, "sources": sources}


def main():
    print("Available subjects:")
    print("1. Science")
    print("2. Maths")
    print("3. English")
    print("4. Social Science")

    subject_options = {
        "1": "Science",
        "2": "Maths",
        "3": "English",
        "4": "Social_Science",
    }
    choice = input("Select subject (1-4): ").strip()
    if choice not in subject_options:
        print("Invalid subject selection.")
        return

    selected_subject = subject_options[choice]
    while True:
        question = input(
            f"\n[{selected_subject}] What is your doubt? "
            "(type 'exit' to quit): "
        ).strip()
        if question.lower() in ["exit", "quit", "bye"]:
            print("AI Tutor: Goodbye!")
            break
        if not question:
            continue

        result = get_answer(question, chat_history, subject=selected_subject)
        if result.get("error"):
            print(result["error"])
            continue
        print("AI Tutor:", result["answer"])


if __name__ == "__main__":
    main()
