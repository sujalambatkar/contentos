import json
import logging
from typing import List, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_llm() -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=0.7,
        max_tokens=2048,
    )


def chunk_text(text: str, chunk_size: int = 1500) -> List[str]:
    """Split text into overlapping chunks by word boundary."""
    words = text.split()
    chunks, current, count = [], [], 0

    for word in words:
        current.append(word)
        count += 1
        if count >= chunk_size:
            chunks.append(" ".join(current))
            # 10% overlap
            overlap = int(chunk_size * 0.1)
            current = current[-overlap:]
            count = len(current)

    if current:
        chunks.append(" ".join(current))

    return chunks


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def extract_topics_and_hooks(
    text: str, input_type: str
) -> Tuple[List[str], List[str]]:
    """Extract 5-7 key topics and 3 attention hooks from the input."""
    llm = get_llm()

    system = SystemMessage(content=(
        "You are an expert content strategist. Extract key topics and attention-grabbing hooks "
        "from the given content. Return ONLY valid JSON — no markdown, no explanation."
    ))
    human = HumanMessage(content=(
        f"Content type: {input_type}\n\n"
        f"Content:\n{text[:3000]}\n\n"
        "Extract:\n"
        "1. 5-7 key topics (short phrases)\n"
        "2. 3 attention-grabbing hooks (compelling opening lines or ideas)\n\n"
        'Return JSON: {"topics": [...], "hooks": [...]}'
    ))

    response = await llm.ainvoke([system, human])
    raw = response.content.strip()

    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    data = json.loads(raw)
    return data.get("topics", [])[:7], data.get("hooks", [])[:3]


async def parse_transcript(state: dict) -> dict:
    """LangGraph node: chunk input and extract topics/hooks."""
    text = state["raw_input"]
    input_type = state.get("input_type", "transcript")

    chunks = chunk_text(text)
    logger.info(f"[parse_transcript] {len(chunks)} chunks for job {state.get('job_id')}")

    # Use first 4k chars for topic extraction
    summary_text = " ".join(chunks[:3])[:4000]

    try:
        topics, hooks = await extract_topics_and_hooks(summary_text, input_type)
    except Exception as e:
        logger.error(f"[parse_transcript] failed: {e}")
        topics, hooks = [], []

    return {
        **state,
        "chunks": chunks,
        "topics": topics,
        "hooks": hooks,
        "status": "parsed",
    }
