from fastapi import APIRouter, Depends, HTTPException
from app.auth.utils import get_current_user
from app.db.mongo import get_user_history, delete_content_job, get_content_job
from app.db.chroma import store_tone_sample
import uuid

router = APIRouter(prefix="/content", tags=["history"])


@router.get("/history")
async def list_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    history = await get_user_history(current_user["id"], limit=limit)
    # Return lightweight summaries
    summaries = []
    for job in history:
        summaries.append({
            "job_id": job.get("job_id"),
            "input_type": job.get("input_type"),
            "platforms": job.get("platforms", []),
            "completed_platforms": job.get("completed_platforms", []),
            "topics": job.get("topics", []),
            "status": job.get("status"),
            "created_at": job.get("created_at"),
            "preview": job.get("input_text", "")[:200],
        })
    return {"history": summaries}


@router.get("/history/{job_id}")
async def get_history_item(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    job = await get_content_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Not found")
    if job.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return job


@router.delete("/history/{job_id}", status_code=204)
async def delete_history_item(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    deleted = await delete_content_job(job_id, current_user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found or not yours")


router_tone = APIRouter(prefix="/tone", tags=["tone"])


@router_tone.post("/upload")
async def upload_tone_sample(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    """Upload past content to build the user's tone profile in ChromaDB."""
    text = body.get("text", "").strip()
    if not text or len(text) < 50:
        raise HTTPException(status_code=400, detail="Text too short (min 50 chars)")

    doc_id = str(uuid.uuid4())
    try:
        await store_tone_sample(current_user["id"], text, doc_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store sample: {e}")

    return {"message": "Tone sample stored", "doc_id": doc_id}
