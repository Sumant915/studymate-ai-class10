import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from into_chunks import chunking

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

path = r"C:\Users\DELL\Desktop\ai_tutor\Books"
book_chunk = chunking(path)

subject_chunks = {}

for filename, documents in book_chunk.items():
    subject = filename.split("/")[0] 

    if subject not in subject_chunks:
        subject_chunks[subject] = []

    subject_chunks[subject].extend(documents)

for subject, documents in subject_chunks.items():
    print(subject, len(documents))

# Create and save separate FAISS indexes for each subject
for subject, documents in subject_chunks.items():

    if subject == "Science":
        continue

    index_path = os.path.join("faiss_indexes", subject)

    os.makedirs(index_path, exist_ok=True)

    vectorstore = FAISS.from_documents(
        documents,
        embeddings
    )

    vectorstore.save_local(index_path)

    print(f"{subject} index saved successfully!")