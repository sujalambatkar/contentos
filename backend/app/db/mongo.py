from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from typing import Optional
from app.config import get_settings

settings = get_settings()

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db():
    return get_client()[settings.mongodb_db]


def _serialize(doc: dict) -> dict:
    """Convert MongoDB ObjectId to string id."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# ── Users ──────────────────────────────────────────────────────────────────

async def create_user(name: str, email: str, hashed_password: str) -> dict:
    db = get_db()
    doc = {
        "name": name,
        "email": email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "is_active": True,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


async def get_user_by_email(email: str) -> Optional[dict]:
    db = get_db()
    doc = await db.users.find_one({"email": email})
    return _serialize(doc) if doc else None


async def get_user_by_id(user_id: str) -> Optional[dict]:
    db = get_db()
    try:
        doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None
    return _serialize(doc) if doc else None


# ── Content Jobs ───────────────────────────────────────────────────────────

async def create_content_job(job_data: dict) -> str:
    db = get_db()
    result = await db.content_jobs.insert_one(job_data)
    return str(result.inserted_id)


async def get_content_job(job_id: str) -> Optional[dict]:
    db = get_db()
    try:
        doc = await db.content_jobs.find_one({"job_id": job_id})
    except Exception:
        return None
    return _serialize(doc) if doc else None


async def update_content_job(job_id: str, update: dict):
    db = get_db()
    update["updated_at"] = datetime.utcnow()
    await db.content_jobs.update_one(
        {"job_id": job_id},
        {"$set": update},
    )


async def get_user_history(user_id: str, limit: int = 20) -> list:
    db = get_db()
    cursor = db.content_jobs.find(
        {"user_id": user_id, "status": {"$in": ["complete", "partial"]}},
        sort=[("created_at", -1)],
        limit=limit,
    )
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


async def delete_content_job(job_id: str, user_id: str) -> bool:
    db = get_db()
    result = await db.content_jobs.delete_one({"job_id": job_id, "user_id": user_id})
    return result.deleted_count > 0
