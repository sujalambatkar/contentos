import httpx
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Optional
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

_chroma_client: Optional[chromadb.PersistentClient] = None


def get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        import os
        os.makedirs(settings.chroma_path, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
    return _chroma_client


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Call HuggingFace Inference API for embeddings — never use local models."""
    url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.hf_embedding_model}"
    headers = {"Authorization": f"Bearer {settings.hf_api_key}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json={"inputs": texts})
        resp.raise_for_status()
        data = resp.json()

    # HF returns list of lists (one per input)
    if isinstance(data, list) and len(data) > 0:
        if isinstance(data[0], list):
            return data
        # single text: wrap
        return [data]
    return data


def get_tone_collection(user_id: str):
    client = get_chroma_client()
    collection_name = f"tone_{user_id[:32]}"  # chroma name length limit
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


async def store_tone_sample(user_id: str, text: str, doc_id: str):
    collection = get_tone_collection(user_id)
    embeddings = await embed_texts([text])
    collection.upsert(
        ids=[doc_id],
        embeddings=embeddings,
        documents=[text],
    )


async def query_tone_samples(user_id: str, query_text: str, n_results: int = 5) -> List[str]:
    collection = get_tone_collection(user_id)
    count = collection.count()
    if count == 0:
        return []

    query_embedding = await embed_texts([query_text])
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(n_results, count),
    )
    return results.get("documents", [[]])[0]
