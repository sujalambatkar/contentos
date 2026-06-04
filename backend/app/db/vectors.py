"""
Lightweight MongoDB-backed vector store to replace ChromaDB.
Stores embeddings as plain float arrays in a MongoDB collection.
Cosine similarity is computed in pure Python/math — no onnxruntime,
no heavy ML deps, safe for Render free tier (512 MB RAM).
"""

import math
import httpx
import logging
from typing import List, Optional
from app.config import get_settings
from app.db.mongo import get_db

logger = logging.getLogger(__name__)
settings = get_settings()


# ── Embedding via HuggingFace Inference API ───────────────────────────────

async def embed_texts(texts: List[str]) -> List[List[float]]:
    """Call HuggingFace Inference API — never loads a local model."""
    url = (
        "https://api-inference.huggingface.co/pipeline/feature-extraction/"
        f"{settings.hf_embedding_model}"
    )
    headers = {"Authorization": f"Bearer {settings.hf_api_key}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json={"inputs": texts})
        resp.raise_for_status()
        data = resp.json()

    if isinstance(data, list) and data and isinstance(data[0], list):
        return data
    return [data]


# ── Cosine similarity (pure Python) ──────────────────────────────────────

def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ── Public interface (matches old chroma.py signatures) ───────────────────

async def store_tone_sample(user_id: str, text: str, doc_id: str):
    """Store a writing sample + its embedding in MongoDB."""
    db = get_db()
    embeddings = await embed_texts([text])
    embedding = embeddings[0]

    await db.tone_profiles.update_one(
        {"user_id": user_id, "doc_id": doc_id},
        {"$set": {
            "user_id": user_id,
            "doc_id": doc_id,
            "text": text,
            "embedding": embedding,
        }},
        upsert=True,
    )
    logger.info(f"[vectors] stored tone sample {doc_id} for user {user_id}")


async def query_tone_samples(
    user_id: str, query_text: str, n_results: int = 5
) -> List[str]:
    """Return the n most similar past writing samples for this user."""
    db = get_db()

    # Fetch all samples for this user
    cursor = db.tone_profiles.find({"user_id": user_id})
    samples = await cursor.to_list(length=200)

    if not samples:
        return []

    # Embed the query
    try:
        query_emb = (await embed_texts([query_text]))[0]
    except Exception as e:
        logger.warning(f"[vectors] embed query failed: {e}")
        return [s["text"] for s in samples[:n_results]]

    # Rank by cosine similarity
    scored = [
        (s["text"], _cosine(query_emb, s["embedding"]))
        for s in samples
        if s.get("embedding")
    ]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [text for text, _ in scored[:n_results]]
