import asyncio
import json
import uuid
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from app.auth.utils import get_current_user, decode_token
from app.db.mongo import get_user_by_id
from app.schemas.content import ProcessRequest
from app.db.mongo import (
    create_content_job,
    get_content_job,
    update_content_job,
)
from app.agents.orchestrator import run_pipeline

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/content", tags=["content"])


async def _resolve_sse_user(token: Optional[str]) -> dict:
    """Resolve user from query-param token (EventSource can't send headers)."""
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/process", status_code=202)
async def process_content(
    body: ProcessRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    job_id = str(uuid.uuid4())
    platforms = [p.value for p in body.platforms]

    job_doc = {
        "job_id": job_id,
        "user_id": current_user["id"],
        "input_text": body.input_text[:10000],
        "input_type": body.input_type.value,
        "platforms": platforms,
        "status": "pending",
        "completed_platforms": [],
        "platform_outputs": {},
        "topics": [],
        "hooks": [],
        "tone_profile": {},
        "schedule": {},
        "errors": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await create_content_job(job_doc)

    background_tasks.add_task(
        run_pipeline,
        job_id=job_id,
        user_id=current_user["id"],
        raw_input=body.input_text,
        input_type=body.input_type.value,
        platforms=platforms,
    )

    return {"job_id": job_id, "status": "pending"}


@router.get("/stream/{job_id}")
async def stream_job(
    job_id: str,
    token: Optional[str] = Query(default=None),
):
    """SSE endpoint — streams platform outputs as they complete.
    Auth via query-param token because EventSource cannot set headers.
    """
    current_user = await _resolve_sse_user(token)

    async def event_generator():
        seen_platforms: set = set()
        poll_count = 0
        max_polls = 120  # 2 minutes at 1s intervals

        while poll_count < max_polls:
            job = await get_content_job(job_id)

            if not job:
                yield f"data: {json.dumps({'error': 'job not found'})}\n\n"
                break

            if job.get("user_id") != current_user["id"]:
                yield f"data: {json.dumps({'error': 'unauthorized'})}\n\n"
                break

            # Stream newly completed platforms
            completed = job.get("completed_platforms", [])
            outputs = job.get("platform_outputs", {})

            for platform in completed:
                if platform not in seen_platforms and platform in outputs:
                    seen_platforms.add(platform)
                    schedule = job.get("schedule", {}).get(platform, {})
                    payload = {
                        "platform": platform,
                        "content": outputs[platform],
                        "schedule": schedule,
                        "status": "complete",
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

            status = job.get("status")

            if status == "complete":
                # Send topics/hooks/tone as final meta event
                meta = {
                    "type": "meta",
                    "topics": job.get("topics", []),
                    "hooks": job.get("hooks", []),
                    "tone_profile": job.get("tone_profile", {}),
                    "status": "complete",
                }
                yield f"data: {json.dumps(meta)}\n\n"
                yield "data: [DONE]\n\n"
                break

            if status == "error":
                yield f"data: {json.dumps({'error': job.get('error', 'pipeline failed'), 'status': 'error'})}\n\n"
                yield "data: [DONE]\n\n"
                break

            await asyncio.sleep(1)
            poll_count += 1

        if poll_count >= max_polls:
            yield f"data: {json.dumps({'error': 'timeout', 'status': 'error'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/status/{job_id}")
async def job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    job = await get_content_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "job_id": job_id,
        "status": job.get("status"),
        "completed_platforms": job.get("completed_platforms", []),
        "errors": job.get("errors", {}),
    }
