from concurrent.futures import ThreadPoolExecutor
import os
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

import api
import Tutor


PRODUCTION_ORIGIN = "https://studymate-ai-class10-frontend.vercel.app"
CHAT_PAYLOAD = {
    "question": "What is a chemical reaction?",
    "subject": "Science",
    "chat_history": [],
    "session_id": "test-session",
}


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(api.app, raise_server_exceptions=False)

    def test_cors_preflight_allows_production_origin(self):
        response = self.client.options(
            "/chat",
            headers={
                "Origin": PRODUCTION_ORIGIN,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            PRODUCTION_ORIGIN,
        )
        self.assertIn("POST", response.headers["access-control-allow-methods"])
        self.assertIn("content-type", response.headers["access-control-allow-headers"].lower())

    def test_cors_preflight_rejects_disallowed_origin(self):
        response = self.client.options(
            "/chat",
            headers={
                "Origin": "https://not-allowed.example",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_cors_origins_normalize_slashes_and_keep_local_defaults(self):
        origins = api.parse_cors_origins(
            " https://custom.example/, https://custom.example///, "
        )

        self.assertIn("https://custom.example", origins)
        self.assertEqual(origins.count("https://custom.example"), 1)
        self.assertIn(PRODUCTION_ORIGIN, origins)
        self.assertIn("http://localhost:5500", origins)

    def test_health_is_live_and_reports_model_readiness_separately(self):
        with (
            patch.dict(os.environ, {"GROQ_API_KEY": ""}),
            patch.object(api, "is_embedding_model_loaded", return_value=False),
        ):
            response = self.client.get(
                "/health",
                headers={"Origin": PRODUCTION_ORIGIN},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertFalse(response.json()["ready"])
        self.assertEqual(response.json()["readiness"], "not_ready")
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            PRODUCTION_ORIGIN,
        )

    def test_subjects_reports_all_four_indexes(self):
        response = self.client.get("/subjects")

        self.assertEqual(response.status_code, 200)
        subjects = response.json()["subjects"]
        self.assertEqual(
            {subject["id"] for subject in subjects},
            {"Science", "Maths", "English", "Social_Science"},
        )
        self.assertTrue(all(subject["index_available"] for subject in subjects))

    def test_root_reports_service_running(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "running")

    def test_chat_accepts_valid_input_without_calling_real_tutor(self):
        with patch.object(
            api,
            "run_tutor",
            return_value={
                "answer": "A chemical reaction forms new substances.",
                "sources": [{"pdf_name": "jesc101.pdf", "page": "1"}],
            },
        ) as run_tutor:
            response = self.client.post(
                "/chat",
                json=CHAT_PAYLOAD,
                headers={"Origin": PRODUCTION_ORIGIN},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["subject_id"], "Science")
        self.assertEqual(response.json()["answer"], "A chemical reaction forms new substances.")
        self.assertEqual(response.json()["session_id"], "test-session")
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            PRODUCTION_ORIGIN,
        )
        run_tutor.assert_called_once()

    def test_chat_rejects_invalid_input(self):
        response = self.client.post(
            "/chat",
            json={"question": "", "subject": "Science"},
            headers={"Origin": PRODUCTION_ORIGIN},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("access-control-allow-origin", response.headers)

    def test_chat_returns_safe_application_error_with_cors(self):
        with patch.object(
            api,
            "run_tutor",
            return_value={
                "answer": None,
                "sources": [],
                "error": "authorization failed",
                "error_type": "configuration",
            },
        ):
            response = self.client.post(
                "/chat",
                json=CHAT_PAYLOAD,
                headers={"Origin": PRODUCTION_ORIGIN},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json()["detail"],
            "The tutor service is not configured correctly.",
        )
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            PRODUCTION_ORIGIN,
        )

    def test_unhandled_application_error_keeps_cors_header(self):
        with patch.object(api, "run_tutor", side_effect=RuntimeError("test failure")):
            response = self.client.post(
                "/chat",
                json=CHAT_PAYLOAD,
                headers={"Origin": PRODUCTION_ORIGIN},
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.headers["access-control-allow-origin"],
            PRODUCTION_ORIGIN,
        )

    def test_ask_keeps_legacy_response_shape(self):
        with patch.object(
            api,
            "run_tutor",
            return_value={"answer": "Mock answer", "sources": []},
        ):
            response = self.client.post(
                "/ask",
                json={"question": "Explain this.", "session_id": "ask-test-session"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["answer"], "Mock answer")
        self.assertEqual(response.json()["session_id"], "ask-test-session")


class FrontendConfigurationTests(unittest.TestCase):
    def test_production_api_uses_render_and_localhost_is_development_only(self):
        script_path = Path(__file__).parents[1] / "frontend" / "script.js"
        script = script_path.read_text(encoding="utf-8")

        self.assertIn(
            ': "https://studymate-ai-class10.onrender.com";',
            script,
        )
        self.assertIn(
            '["localhost", "127.0.0.1"].includes(window.location.hostname)',
            script,
        )
        self.assertIn('fetch(`${API_BASE_URL}/chat`', script)
        self.assertNotIn(
            'fetch("http://localhost:8000',
            script,
        )
        self.assertNotIn(
            'fetch("http://127.0.0.1:8000',
            script,
        )


class TutorConfigurationTests(unittest.TestCase):
    def test_groq_key_is_used_as_bearer_authorization(self):
        with patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}, clear=False):
            headers = Tutor.get_groq_headers()

        self.assertEqual(headers["Authorization"], "Bearer test-key")

    def test_missing_groq_key_fails_before_model_initialization(self):
        with (
            patch.dict(os.environ, {"GROQ_API_KEY": ""}),
            patch.object(Tutor, "get_vectorstore") as get_vectorstore,
        ):
            result = Tutor.get_answer("Question", [], "Science")

        self.assertEqual(result["error_type"], "configuration")
        get_vectorstore.assert_not_called()

    def test_tutor_uses_groq_key_and_returns_mocked_answer(self):
        document = type(
            "Document",
            (),
            {
                "metadata": {
                    "pdf_name": "jesc101.pdf",
                    "page_label": "1",
                },
                "page_content": "A chemical reaction forms new substances.",
            },
        )()
        vectorstore = type(
            "VectorStore",
            (),
            {
                "max_marginal_relevance_search": lambda *_args, **_kwargs: [
                    document
                ],
            },
        )()
        response = type(
            "Response",
            (),
            {
                "status_code": 200,
                "json": lambda _self: {
                    "choices": [{"message": {"content": "Mocked answer."}}],
                },
            },
        )()
        history = []

        with (
            patch.dict(os.environ, {"GROQ_API_KEY": "test-key"}, clear=False),
            patch.object(Tutor, "get_vectorstore", return_value=vectorstore),
            patch("Tutor.requests.post", return_value=response) as post,
        ):
            result = Tutor.get_answer(
                "What is a chemical reaction?",
                history,
                "Science",
            )

        self.assertEqual(result["answer"], "Mocked answer.")
        self.assertEqual(result["sources"][0]["pdf_name"], "jesc101.pdf")
        self.assertEqual(history[-1], {"role": "assistant", "content": "Mocked answer."})
        self.assertEqual(
            post.call_args.kwargs["headers"]["Authorization"],
            "Bearer test-key",
        )

    def test_embedding_model_initialization_is_single_flight(self):
        sentinel = object()
        with (
            patch.object(Tutor, "_embeddings", None),
            patch(
                "langchain_huggingface.HuggingFaceEmbeddings",
                return_value=sentinel,
            ) as embedding_constructor,
            ThreadPoolExecutor(max_workers=8) as executor,
        ):
            results = list(executor.map(lambda _: Tutor.get_embeddings(), range(8)))

        self.assertTrue(all(result is sentinel for result in results))
        embedding_constructor.assert_called_once()

    def test_faiss_index_is_loaded_once_under_concurrent_requests(self):
        sentinel = object()
        with (
            patch.dict(Tutor.vectorstores, {}, clear=True),
            patch.object(Tutor, "get_embeddings", return_value=object()),
            patch.object(Tutor.FAISS, "load_local", return_value=sentinel) as loader,
            ThreadPoolExecutor(max_workers=8) as executor,
        ):
            results = list(
                executor.map(
                    lambda _: Tutor.get_vectorstore("Science"),
                    range(8),
                )
            )

        self.assertTrue(all(result is sentinel for result in results))
        loader.assert_called_once()


if __name__ == "__main__":
    unittest.main()
