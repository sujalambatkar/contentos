import json
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.db.vectors import query_tone_samples
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def analyze_tone(samples: list[str], current_text: str) -> dict:
    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=0.3,
        max_tokens=1024,
    )

    sample_block = "\n---\n".join(samples[:5]) if samples else "No past samples available."

    system = SystemMessage(content=(
        "You are a voice and tone analyst. Analyze writing samples and identify the creator's "
        "unique voice traits. Return ONLY valid JSON."
    ))
    human = HumanMessage(content=(
        f"Past writing samples:\n{sample_block}\n\n"
        f"Current content:\n{current_text[:1500]}\n\n"
        "Analyze the creator's voice and return:\n"
        '{"traits": [...5 traits...], "vocabulary_level": "simple|moderate|advanced", '
        '"avg_sentence_length": "short|medium|long", "common_phrases": [...3 phrases...], '
        '"tone_descriptors": [...4 words...]}'
    ))

    response = await llm.ainvoke([system, human])
    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def load_tone_profile(state: dict) -> dict:
    """LangGraph node: query ChromaDB for user's past tone, build profile."""
    user_id = state.get("user_id", "")
    current_text = state.get("raw_input", "")[:2000]

    tone_profile = {
        "traits": ["conversational", "informative"],
        "vocabulary_level": "moderate",
        "avg_sentence_length": "medium",
        "common_phrases": [],
        "tone_descriptors": ["clear", "engaging", "professional", "authentic"],
    }

    try:
        samples = await query_tone_samples(user_id, current_text, n_results=5)
        if samples:
            tone_profile = await analyze_tone(samples, current_text)
    except Exception as e:
        logger.warning(f"[load_tone_profile] tone analysis failed, using defaults: {e}")

    logger.info(f"[load_tone_profile] profile loaded for user {user_id}")
    return {**state, "tone_profile": tone_profile, "status": "tone_loaded"}
