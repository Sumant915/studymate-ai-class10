
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

import os
import time
import random
import requests
from dotenv import load_dotenv

load_dotenv()

# ---------------- CONFIGURATION ----------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INDEX_PATH = os.path.join(BASE_DIR, "faiss_index")

SUBJECT_INDEX_PATHS = {
    "Science": INDEX_PATH,
    "English": os.path.join(BASE_DIR, "faiss_indexes", "English"),
    "Maths": os.path.join(BASE_DIR, "faiss_indexes", "Maths"),
    "Social_Science": os.path.join(
        BASE_DIR, "faiss_indexes", "Social_Science"
    )
}

MODEL = "openai/gpt-oss-120b"


# ---------------- EMBEDDING MODEL ----------------

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# ---------------- SUBJECT INDEX MANAGEMENT ----------------

# Cache loaded indexes so they do not need to be loaded repeatedly.
vectorstores = {}


def get_vectorstore(subject="Science"):

    if subject not in SUBJECT_INDEX_PATHS:
        raise ValueError(f"Unsupported subject: {subject}")

    if subject not in vectorstores:

        index_path = SUBJECT_INDEX_PATHS[subject]

        if not os.path.exists(
            os.path.join(index_path, "index.faiss")
        ):
            raise FileNotFoundError(
                f"FAISS index not found for {subject}: {index_path}"
            )

        print(f"Loading {subject} FAISS index...")

        vectorstores[subject] = FAISS.load_local(
            index_path,
            embeddings,
            allow_dangerous_deserialization=True
        )

        print(f"{subject} FAISS index loaded successfully!")

    return vectorstores[subject]


# ---------------- CONVERSATION MEMORY ----------------

# Default history for CLI usage.
chat_history = []


# ---------------- GROQ API ----------------

url = "https://api.groq.com/openai/v1/chat/completions"

# Set GROQ_API_KEY in your environment before running this file.
API_KEY = os.getenv("GROQ_API_KEY", "").strip()

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


# ---------------- REWRITE FOLLOW-UP QUESTION ----------------

def rewrite_question(question, chat_history):

    if not chat_history:
        return question

    history_text = ""

    for chat in chat_history[-6:]:
        history_text += f"{chat['role']}: {chat['content']}\n"

    rewrite_prompt = f"""
You rewrite student questions for a textbook search system.

Use the conversation history to understand the current question.

Rules:
- Rewrite the current question as a standalone search query.
- Resolve references like "it", "this", "that", and "explain more".
- Preserve the student's original intent.
- Do not answer the question.
- Do not add new topics or unsupported details.
- If the question already stands alone or changes topic, keep its
  meaning unchanged.
- Return only the rewritten question, without explanations.

Conversation History:
{history_text}

Current Question:
{question}

Standalone Search Query:
"""

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": rewrite_prompt}
        ],
        "temperature": 0,
        "max_completion_tokens": 150
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            rewritten = (
                result["choices"][0]["message"]["content"].strip()
            )

            if rewritten:
                print("\nRewritten Search Query:", rewritten)
                return rewritten

    except requests.RequestException as error:
        print("Question rewriting failed:", error)

    print("Using original question for retrieval.")
    return question


# ---------------- GET ANSWER ----------------

def get_answer(question, chat_history, subject="Science"):

    if not headers.get("Authorization", "").removeprefix("Bearer ").strip():
        return {
            "answer": None,
            "sources": [],
            "error": "Groq API authorization is not configured."
        }

    # ---------------- VALIDATE SUBJECT ----------------

    if subject not in SUBJECT_INDEX_PATHS:
        return {
            "answer": None,
            "sources": [],
            "error": f"Unsupported subject: {subject}"
        }

    # ---------------- BUILD CONVERSATION HISTORY ----------------

    history_text = ""

    for chat in chat_history[-6:]:
        history_text += f"{chat['role']}: {chat['content']}\n"

    # ---------------- REWRITE QUESTION ----------------

    search_query = rewrite_question(question, chat_history)

    # ---------------- RETRIEVE RELEVANT CHUNKS ----------------

    
    # ---------------- RETRIEVE RELEVANT CHUNKS ----------------

    try:
        selected_vectorstore = get_vectorstore(subject)

        # Original query + targeted queries
        search_queries = [
            search_query,
            (
                "Rich peasants and high land revenue during "
                "the Civil Disobedience Movement"
            ),
            (
                "Poor peasants, small tenants, rent payment "
                "and rent remission during the movement"
            ),
            (
                "Business classes, merchants, industrialists "
                "and protection against foreign imports"
            ),
            (
                "Industrial workers, low wages, working "
                "conditions and participation in the movement"
            ),
            (
                "Women participation in nationalist processions "
                "during the Civil Disobedience Movement"
            ),
            (
                "Dalits, untouchability and political "
                "representation during the movement"
            )
        ]

        # Retrieve chunks for every query
        all_docs = []

        for query_text in search_queries:
            docs = selected_vectorstore.similarity_search(
                query_text,
                k=5
            )
            all_docs.extend(docs)

        # Remove duplicate chunks
        unique_docs = []
        seen_chunks = set()

        for doc in all_docs:
            chunk_key = (
                doc.metadata.get("pdf_name", ""),
                doc.metadata.get("page", ""),
                doc.page_content.strip()
            )

            if chunk_key not in seen_chunks:
                seen_chunks.add(chunk_key)
                unique_docs.append(doc)

        # Keep the retrieved chunks for context construction
        retrieved_docs = unique_docs

    except (FileNotFoundError, ValueError) as error:
        return {
            "answer": None,
            "sources": [],
            "error": str(error)
        }

    # ---------------- BUILD CONTEXT AND SOURCES ----------------

    actual_result = []
    sources = []

    for doc in retrieved_docs:
        pdf_name = doc.metadata.get("pdf_name", "Unknown PDF")

        page = doc.metadata.get(
            "page_label",
            doc.metadata.get("page", "Unknown")
        )

        source = {
            "pdf_name": pdf_name,
            "page": page
        }

        if source not in sources:
            sources.append(source)

        actual_result.append(
            f"Source: {pdf_name}, Page: {page}\n"
            f"Content: {doc.page_content}"
        )

    actual_result = "\n\n".join(actual_result)

    print("\n========== RETRIEVED CONTEXT ==========\n")
    print(actual_result)
    print("\n========== END OF CONTEXT ==========\n")


    # ---------------- BUILD SUBJECT-AWARE PROMPT ----------------

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
- Do not claim information is absent from the entire book merely
  because it is missing from the retrieved passages.

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
{actual_result}

## Current Student Question
{question}

Before answering, verify that factual claims are supported
by the retrieved context and that citations are accurate.

Answer:
"""

    # ---------------- PREPARE GROQ REQUEST ----------------

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_completion_tokens": 2048
    }

    # ---------------- GENERATE ANSWER ----------------

    answer = None

    for attempt in range(5):

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=60
            )

            if response.status_code == 200:

                api_result = response.json()
                answer = (
                    api_result["choices"][0]["message"]["content"]
                )

                break

            if response.status_code in (429, 500, 502, 503, 504):

                if attempt == 4:
                    print("Groq API Error:", response.status_code)
                    print(response.text)
                    break

                delay = min(2 ** attempt, 16) + random.uniform(0, 1)

                print(f"Retrying in {delay:.1f} seconds...")
                time.sleep(delay)
                continue

            print("Groq API Error:", response.status_code)
            print(response.text)
            break

        except requests.RequestException as error:

            if attempt == 4:
                print("Request failed:", error)
                break

            delay = min(2 ** attempt, 16)
            print(f"Request failed. Retrying in {delay} seconds...")
            time.sleep(delay)

    # ---------------- SAVE CONVERSATION ----------------

    if answer is not None:

        chat_history.append({
            "role": "user",
            "content": question
        })

        chat_history.append({
            "role": "assistant",
            "content": answer
        })

        # Keep only the latest 6 messages.
        chat_history[:] = chat_history[-6:]

    return {
        "answer": answer,
        "sources": sources
    }


# ---------------- COMMAND LINE INTERFACE ----------------

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
        "4": "Social_Science"
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

        result = get_answer(
            question,
            chat_history,
            subject=selected_subject
        )

        if result.get("error"):
            print(result["error"])
            continue

        print("\nRetrieved Sources:")

        for source in result["sources"]:
            print(
                f"- {source['pdf_name']} | Page: {source['page']}"
            )

        if result["answer"] is not None:
            print("\nAI Tutor:\n")
            print(result["answer"])


if __name__ == "__main__":
    main()
