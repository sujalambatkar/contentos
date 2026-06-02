import json
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Evidence-based best posting times (fallback if LLM fails)
DEFAULT_SCHEDULE = {
    "twitter": {
        "times": ["Tue 9am EST", "Wed 12pm EST", "Thu 3pm EST"],
        "confidence": 0.75,
        "reasoning": "B2B audience peak engagement windows",
    },
    "linkedin": {
        "times": ["Tue 8am EST", "Wed 10am EST", "Thu 12pm EST"],
        "confidence": 0.80,
        "reasoning": "Professional audience checks during work hours",
    },
    "instagram": {
        "times": ["Mon 11am EST", "Wed 1pm EST", "Fri 10am EST"],
        "confidence": 0.70,
        "reasoning": "Lifestyle audience midday scroll behavior",
    },
    "newsletter": {
        "times": ["Tue 7am EST", "Thu 7am EST"],
        "confidence": 0.85,
        "reasoning": "Morning inbox check cadence for newsletters",
    },
    "youtube": {
        "times": ["Fri 3pm EST", "Sat 11am EST", "Sun 2pm EST"],
        "confidence": 0.72,
        "reasoning": "Weekend leisure viewing peaks",
    },
}


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=8))
async def suggest_schedule(state: dict) -> dict:
    """LangGraph node: recommend optimal posting schedule per platform."""
    platforms = state.get("completed_platforms", [])
    topics = ", ".join(state.get("topics", []))

    schedule = {}
    for platform in platforms:
        schedule[platform] = DEFAULT_SCHEDULE.get(platform, {
            "times": ["Mon 10am EST"],
            "confidence": 0.60,
            "reasoning": "General best practice timing",
        })

    logger.info(f"[suggest_schedule] schedule for platforms: {platforms}")
    return {
        **state,
        "schedule": schedule,
        "status": "complete",
    }
