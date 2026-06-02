from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class InputType(str, Enum):
    transcript = "transcript"
    blog = "blog"
    notes = "notes"


class Platform(str, Enum):
    twitter = "twitter"
    linkedin = "linkedin"
    instagram = "instagram"
    newsletter = "newsletter"
    youtube = "youtube"


class ProcessRequest(BaseModel):
    input_text: str = Field(..., min_length=50)
    input_type: InputType = InputType.transcript
    platforms: List[Platform] = Field(default_factory=lambda: list(Platform))


class PlatformOutput(BaseModel):
    platform: str
    content: Dict[str, Any]
    status: str = "complete"
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ContentJob(BaseModel):
    job_id: str
    user_id: str
    input_text: str
    input_type: str
    platforms: List[str]
    status: str = "pending"  # pending | processing | complete | error
    completed_platforms: List[str] = []
    platform_outputs: Dict[str, Any] = {}
    tone_profile: Dict[str, Any] = {}
    topics: List[str] = []
    hooks: List[str] = []
    errors: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    completed_platforms: List[str]
    errors: Dict[str, str]


class ScheduleSuggestion(BaseModel):
    platform: str
    suggested_times: List[str]
    confidence: float
    reasoning: str


class ToneProfile(BaseModel):
    user_id: str
    traits: List[str]
    vocabulary_level: str
    avg_sentence_length: str
    common_phrases: List[str]
    tone_descriptors: List[str]
    updated_at: datetime = Field(default_factory=datetime.utcnow)
