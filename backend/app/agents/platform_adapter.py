import json
import logging
from typing import Any
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _llm(temperature: float = 0.8, max_tokens: int = 2048) -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _tone_context(tone: dict) -> str:
    traits = ", ".join(tone.get("traits", []))
    descriptors = ", ".join(tone.get("tone_descriptors", []))
    vocab = tone.get("vocabulary_level", "moderate")
    return f"Voice traits: {traits}. Tone: {descriptors}. Vocabulary: {vocab}."


def _parse_json(raw: str) -> Any:
    # Strip markdown code fences
    raw = raw.strip()
    if "```" in raw:
        parts = raw.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:]
            part = part.strip()
            if part.startswith("{") or part.startswith("["):
                raw = part
                break

    # Find the outermost JSON object/array in case there's surrounding text
    for start_char, end_char in [('{', '}'), ('[', ']')]:
        start = raw.find(start_char)
        end = raw.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            candidate = raw[start:end + 1]
            try:
                return json.loads(candidate)
            except json.JSONDecodeError:
                pass

    return json.loads(raw)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_twitter(state: dict) -> dict:
    topics = ", ".join(state.get("topics", []))
    hooks = state.get("hooks", [])
    hook = hooks[0] if hooks else ""
    tone = _tone_context(state.get("tone_profile", {}))
    content = state["raw_input"][:3000]

    system = SystemMessage(content=(
        f"You are a Twitter/X content expert. {tone} "
        "Write punchy, engaging tweets. Return ONLY valid JSON."
    ))
    human = HumanMessage(content=(
        f"Topics: {topics}\nHook: {hook}\n\nSource content:\n{content}\n\n"
        "Create a 7-tweet thread. Tweet 1 is the hook. Tweets 2-6 expand key ideas. "
        "Tweet 7 is a call to action. Each tweet max 280 chars.\n\n"
        'Return JSON: {"tweets": ["tweet1", "tweet2", ..., "tweet7"]}'
    ))

    resp = await _llm().ainvoke([system, human])
    result = _parse_json(resp.content)
    tweets = result.get("tweets", [])

    platform_outputs = dict(state.get("platform_outputs", {}))
    platform_outputs["twitter"] = {"tweets": tweets, "thread_count": len(tweets)}
    completed = list(state.get("completed_platforms", []))
    if "twitter" not in completed:
        completed.append("twitter")

    return {**state, "platform_outputs": platform_outputs, "completed_platforms": completed}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_linkedin(state: dict) -> dict:
    topics = ", ".join(state.get("topics", []))
    tone = _tone_context(state.get("tone_profile", {}))
    content = state["raw_input"][:4000]

    system = SystemMessage(content=(
        f"You are a LinkedIn content strategist. {tone} "
        "Return ONLY a valid JSON object. No prose outside the JSON."
    ))
    human = HumanMessage(content=(
        f"Topics: {topics}\n\nSource content:\n{content[:2000]}\n\n"
        "Write a LinkedIn post (~300 words) with a hook opening, 2-3 insight paragraphs, "
        "and a closing question to drive comments.\n\n"
        'Return ONLY this JSON (no extra text): {"title": "...", "article": "...", "word_count": 300}'
    ))

    resp = await _llm(temperature=0.7, max_tokens=1500).ainvoke([system, human])
    result = _parse_json(resp.content)

    platform_outputs = dict(state.get("platform_outputs", {}))
    platform_outputs["linkedin"] = result
    completed = list(state.get("completed_platforms", []))
    if "linkedin" not in completed:
        completed.append("linkedin")

    return {**state, "platform_outputs": platform_outputs, "completed_platforms": completed}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def generate_instagram(state: dict) -> dict:
    topics = ", ".join(state.get("topics", []))
    tone = _tone_context(state.get("tone_profile", {}))
    content = state["raw_input"][:2000]

    system = SystemMessage(content=(
        f"You are an Instagram content creator. {tone} "
        "Write captions that stop the scroll. Return ONLY valid JSON."
    ))
    human = HumanMessage(content=(
        f"Topics: {topics}\n\nSource content:\n{content}\n\n"
        "Create 3 caption options:\n"
        "- short: 1-2 sentences + 5 hashtags\n"
        "- medium: 3-5 sentences + 10 hashtags\n"
        "- long: storytelling format 8-10 sentences + 15 hashtags\n\n"
        'Return JSON: {"captions": {"short": "...", "medium": "...", "long": "..."}, '
        '"hashtags": ["#tag1", ..., "#tag15"]}'
    ))

    resp = await _llm().ainvoke([system, human])
    result = _parse_json(resp.content)

    platform_outputs = dict(state.get("platform_outputs", {}))
    platform_outputs["instagram"] = result
    completed = list(state.get("completed_platforms", []))
    if "instagram" not in completed:
        completed.append("instagram")

    return {**state, "platform_outputs": platform_outputs, "completed_platforms": completed}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=15))
async def generate_newsletter(state: dict) -> dict:
    topics = ", ".join(state.get("topics", []))
    hook = state.get("hooks", [""])[0]
    tone = _tone_context(state.get("tone_profile", {}))
    content = state["raw_input"][:1500]

    system = SystemMessage(content=(
        "You are a newsletter writer. Return ONLY a valid JSON object. No text outside the JSON."
    ))
    human = HumanMessage(content=(
        f"Topics: {topics}\nOpening hook: {hook}\n{tone}\n\n"
        f"Source:\n{content}\n\n"
        "Write a newsletter section. Keep body under 200 words.\n"
        'Return ONLY: {"subject_lines": ["A", "B", "C"], "preview_text": "90 chars max", "body": "..."}'
    ))

    resp = await _llm(temperature=0.7, max_tokens=700).ainvoke([system, human])
    result = _parse_json(resp.content)

    # Normalise — model occasionally returns a list or wraps in extra key
    if isinstance(result, list):
        result = result[0] if result else {}
    if "newsletter" in result:
        result = result["newsletter"]

    platform_outputs = dict(state.get("platform_outputs", {}))
    platform_outputs["newsletter"] = result
    completed = list(state.get("completed_platforms", []))
    if "newsletter" not in completed:
        completed.append("newsletter")

    return {**state, "platform_outputs": platform_outputs, "completed_platforms": completed}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=15))
async def generate_youtube(state: dict) -> dict:
    topics = ", ".join(state.get("topics", []))
    tone = _tone_context(state.get("tone_profile", {}))
    content = state["raw_input"][:1500]

    system = SystemMessage(content=(
        "You are a YouTube SEO expert. Return ONLY a valid JSON object. No text outside the JSON."
    ))
    human = HumanMessage(content=(
        f"Topics: {topics}\n{tone}\n\nSource:\n{content}\n\n"
        "Create YouTube metadata. Keep description under 150 words. Use 3 timestamps. Use 10 tags.\n"
        'Return ONLY: {"title": "...", "description": "...", '
        '"timestamps": [{"time": "0:00", "label": "..."}], "tags": ["..."]}'
    ))

    resp = await _llm(temperature=0.6, max_tokens=700).ainvoke([system, human])
    result = _parse_json(resp.content)

    # Normalise
    if isinstance(result, list):
        result = result[0] if result else {}
    if "youtube" in result:
        result = result["youtube"]

    platform_outputs = dict(state.get("platform_outputs", {}))
    platform_outputs["youtube"] = result
    completed = list(state.get("completed_platforms", []))
    if "youtube" not in completed:
        completed.append("youtube")

    return {**state, "platform_outputs": platform_outputs, "completed_platforms": completed}
