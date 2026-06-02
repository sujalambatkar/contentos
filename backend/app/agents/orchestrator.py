"""
LangGraph state machine for the ContentOS multi-agent pipeline.

State keys (all JSON-serializable):
  raw_input, input_type, chunks, topics, hooks, tone_profile,
  platform_outputs, completed_platforms, schedule, job_id, user_id,
  platforms, status, error
"""

import asyncio
import logging
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

from app.agents.transcript_parser import parse_transcript
from app.agents.tone_calibrator import load_tone_profile
from app.agents.platform_adapter import (
    generate_twitter,
    generate_linkedin,
    generate_instagram,
    generate_newsletter,
    generate_youtube,
)
from app.agents.scheduler_agent import suggest_schedule
from app.db.mongo import update_content_job

logger = logging.getLogger(__name__)

PLATFORM_GENERATORS = {
    "twitter": generate_twitter,
    "linkedin": generate_linkedin,
    "instagram": generate_instagram,
    "newsletter": generate_newsletter,
    "youtube": generate_youtube,
}


class AgentState(TypedDict):
    raw_input: str
    input_type: str
    chunks: List[str]
    topics: List[str]
    hooks: List[str]
    tone_profile: Dict[str, Any]
    platform_outputs: Dict[str, Any]
    completed_platforms: List[str]
    schedule: Dict[str, Any]
    job_id: str
    user_id: str
    platforms: List[str]
    status: str
    error: Optional[str]


async def _run_platform_generator(platform: str, state: dict) -> dict:
    """Run one platform generator and persist partial result to MongoDB."""
    gen_fn = PLATFORM_GENERATORS.get(platform)
    if not gen_fn:
        logger.warning(f"No generator for platform: {platform}")
        return state

    try:
        new_state = await gen_fn(state)
        await update_content_job(
            state["job_id"],
            {
                f"platform_outputs.{platform}": new_state["platform_outputs"].get(platform),
                "completed_platforms": new_state["completed_platforms"],
                "status": "processing",
            },
        )
        return new_state
    except Exception as e:
        logger.error(f"[{platform}] generation failed: {e}")
        errors = dict(state.get("errors", {}))
        errors[platform] = str(e)
        return {**state, "errors": errors}


async def _run_with_stagger(platform: str, state: dict, delay: float) -> dict:
    """Add a small stagger delay before each call to avoid Groq rate-limit bursts."""
    if delay > 0:
        await asyncio.sleep(delay)
    return await asyncio.wait_for(
        _run_platform_generator(platform, state),
        timeout=90,  # 90-second hard cap per platform
    )


async def run_parallel_generators(state: dict) -> dict:
    """Run all requested platform generators with staggered starts to respect Groq free-tier limits."""
    platforms = state.get("platforms", [])
    requested = [p for p in platforms if p in PLATFORM_GENERATORS]

    if not requested:
        return state

    # Stagger by 2s per platform — keeps parallel but avoids token-burst rate limiting
    tasks = [
        _run_with_stagger(p, state, delay=i * 2)
        for i, p in enumerate(requested)
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Treat exceptions from gather as errors so one failure doesn't kill others
    clean_results = []
    for platform, result in zip(requested, results):
        if isinstance(result, Exception):
            logger.error(f"[{platform}] timed out or failed: {result}")
            err_state = dict(state)
            err_state.setdefault("errors", {})[platform] = str(result)
            clean_results.append(err_state)
        else:
            clean_results.append(result)
    results = clean_results

    # Merge all partial states into one
    merged = dict(state)
    for result in results:
        merged["platform_outputs"] = {
            **merged.get("platform_outputs", {}),
            **result.get("platform_outputs", {}),
        }
        merged["completed_platforms"] = list(
            set(merged.get("completed_platforms", [])) |
            set(result.get("completed_platforms", []))
        )
        errors = {**merged.get("errors", {}), **result.get("errors", {})}
        if errors:
            merged["errors"] = errors

    return merged


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node("parse_transcript", parse_transcript)
    graph.add_node("load_tone_profile", load_tone_profile)
    graph.add_node("generate_platforms", run_parallel_generators)
    graph.add_node("suggest_schedule", suggest_schedule)

    graph.set_entry_point("parse_transcript")
    graph.add_edge("parse_transcript", "load_tone_profile")
    graph.add_edge("load_tone_profile", "generate_platforms")
    graph.add_edge("generate_platforms", "suggest_schedule")
    graph.add_edge("suggest_schedule", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_pipeline(
    job_id: str,
    user_id: str,
    raw_input: str,
    input_type: str,
    platforms: List[str],
) -> dict:
    """Entry point: run the full agent pipeline for a content job."""
    initial_state: AgentState = {
        "raw_input": raw_input,
        "input_type": input_type,
        "chunks": [],
        "topics": [],
        "hooks": [],
        "tone_profile": {},
        "platform_outputs": {},
        "completed_platforms": [],
        "schedule": {},
        "job_id": job_id,
        "user_id": user_id,
        "platforms": platforms,
        "status": "processing",
        "error": None,
    }

    await update_content_job(job_id, {"status": "processing"})

    try:
        graph = get_graph()
        final_state = await graph.ainvoke(initial_state)
        await update_content_job(
            job_id,
            {
                "status": "complete",
                "platform_outputs": final_state.get("platform_outputs", {}),
                "completed_platforms": final_state.get("completed_platforms", []),
                "topics": final_state.get("topics", []),
                "hooks": final_state.get("hooks", []),
                "tone_profile": final_state.get("tone_profile", {}),
                "schedule": final_state.get("schedule", {}),
                "errors": final_state.get("errors", {}),
            },
        )
        return final_state
    except Exception as e:
        logger.error(f"[run_pipeline] job {job_id} failed: {e}")
        await update_content_job(job_id, {"status": "error", "error": str(e)})
        raise
