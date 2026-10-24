
import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(
    BASE_DIR, "faiss_indexes", "Social_Science"
)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.load_local(
    INDEX_PATH,
    embeddings,
    allow_dangerous_deserialization=True
)

query = (
    "Why did different social groups participate in the "
    "Civil Disobedience Movement in India? Explain with examples."
)

# Experiment 1: Normal FAISS retrieval
normal_results = vectorstore.similarity_search(
    query,
    k=15
)

# Experiment 2: MMR selection
mmr_results = vectorstore.max_marginal_relevance_search(
    query,
    k=5,
    fetch_k=15,
    lambda_mult=0.5
)


def display_results(title, results):
    print(f"\n\n{'#' * 70}")
    print(title)
    print(f"{'#' * 70}")

    for i, doc in enumerate(results, start=1):
        print(f"\n{'=' * 60}")
        print(f"RESULT {i}")
        print("PDF:", doc.metadata.get("pdf_name"))
        print(
            "Page:",
            doc.metadata.get(
                "page_label",
                doc.metadata.get("page")
            )
        )
        print(doc.page_content)


display_results(
    "NORMAL FAISS: TOP 15 CANDIDATES",
    normal_results
)

display_results(
    "MMR: FINAL 5 SELECTED CHUNKS",
    mmr_results
)
targeted_query = (
    "Rich peasants and poor peasants participation in the "
    "Civil Disobedience Movement, high land revenue, "
    "rent remission and their demands"
)

targeted_results = vectorstore.similarity_search(
    targeted_query,
    k=5
)

display_results(
    "TARGETED RETRIEVAL: PEASANTS",
    targeted_results
)