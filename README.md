# studymate-ai-class10

## Backend deployment

The FastAPI application is started from the repository root with:

```text
uvicorn api:app --host 0.0.0.0 --port $PORT
```

Configure these Render environment variables:

- `GROQ_API_KEY`: the Groq API key, entered as a secret in Render (never commit
  it or put it in frontend code).
- `CORS_ORIGINS`: comma-separated allowed origins, including
  `https://studymate-ai-class10-frontend.vercel.app`. Origins may include a
  trailing slash; the API removes it. The API also retains the existing local
  development origins.

Use `/health` as a liveness check. Its `status` reports whether the process is
serving requests; `ready` and `readiness` separately report whether the Groq
key, all subject indexes, and the lazily initialized embedding model are ready.
`/subjects` reports index-file availability without loading the embedding
model.

### Free-instance memory and cold-start limitation

FAISS indexes and the sentence-transformer are loaded on the first chat request,
not at process startup. This avoids eagerly loading PyTorch during startup, but
the first request must download or initialize the embedding model. The current
512 MB Render instance is not a guaranteed fit for PyTorch, Transformers, the
embedding model, and request-time inference; a cold request may be slow or the
worker may be terminated for memory pressure. The code serializes embedding and
index initialization, uses CPU inference with a batch size of one, and bounds
Groq request timeouts, but these measures cannot guarantee reliable inference
within 512 MB. Verify a real `POST /chat` after every deployment and after
Render sleeps; a healthy liveness response alone does not prove that inference
works.

## Run backend tests

Install the project requirements and the HTTP client used by Starlette's test
client, then run:

```text
python -m pip install -r requirements.txt httpx
python -m unittest discover -s tests -v
```

The chat tests mock tutor results and do not require a Groq API key or download
the embedding model.