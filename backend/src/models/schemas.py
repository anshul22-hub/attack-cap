from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class TransferStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class AgentRole(Enum):
    AGENT_A = "agent_a"
    AGENT_B = "agent_b"


class CallState(Enum):
    WAITING = "waiting"
    CONNECTED = "connected"
    TRANSFERRING = "transferring"
    TRANSFERRED = "transferred"
    ENDED = "ended"


class Participant(BaseModel):
    identity: str
    name: str
    role: Optional[AgentRole] = None
    is_agent: bool = False
    joined_at: datetime
    room_sid: str


class CallSession(BaseModel):
    session_id: str
    caller_identity: str
    agent_a_identity: Optional[str] = None
    agent_b_identity: Optional[str] = None
    original_room_sid: str
    transfer_room_sid: Optional[str] = None
    state: CallState = CallState.WAITING
    call_summary: Optional[str] = None
    transfer_reason: Optional[str] = None
    created_at: datetime
    participants: List[Participant] = []


class TransferRequest(BaseModel):
    session_id: str
    agent_a_identity: str
    agent_b_identity: str
    reason: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class LLMResponse(BaseModel):
    content: str
    model: str
    tokens_used: Optional[int] = None
    processing_time: Optional[float] = None


class TwilioCallRequest(BaseModel):
    phone_number: str
    session_id: str
    agent_identity: str
    context: Optional[str] = None