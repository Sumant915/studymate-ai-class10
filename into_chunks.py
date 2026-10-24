from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os


def chunking(path):
    find = os.listdir(path)
    book_chunk = {}

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )

    for i in find:
        subject_path = os.path.join(path, i)

        if not os.path.isdir(subject_path):
            continue

        for j in os.listdir(subject_path):
            if not j.lower().endswith(".pdf"):
                continue

            pdf_path = os.path.join(subject_path, j)

            PDF = PyPDFLoader(pdf_path)
            document = PDF.load()

            chunks = splitter.split_documents(document)

            for chunk in chunks:
                chunk.metadata["subject"] = i
                chunk.metadata["pdf_name"] = j

            book_chunk[f"{i}/{j}"] = chunks

    return book_chunk


#if __name__ == "__main__":
    # path = r"C:\Users\DELL\Desktop\ai_tutor\Books"

    # book_chunk = chunking(path)

    # subject_chunks = {}

    # for filename, documents in book_chunk.items():
    #     subject = filename.split("/")[0]

    #     if subject not in subject_chunks:
    #         subject_chunks[subject] = []

    #     subject_chunks[subject].extend(documents)

    # for subject, documents in subject_chunks.items():
    #     print(subject, len(documents))

# Group all PDF chunks subject-wise into a single list.
# Each subject becomes a dictionary key, and its value contains
# all Document chunks from every PDF belonging to that subject.
# This makes it easier to create a separate FAISS index for each subject.

API_KEY = os.getenv("GROQ_API_KEY")