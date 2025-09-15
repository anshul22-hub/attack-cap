export enum CallState {
  WAITING = "waiting",
  CONNECTED = "connected", 
  TRANSFERRING = "transferring",
  TRANSFERRED = "transferred",
  ENDED = "ended"
}

export enum AgentRole {
  AGENT_A = "agent_a",
  AGENT_B = "agent_b"
}

export enum AgentState {
  IDLE = "idle",
  IN_CALL = "in_call",
  IN_TRANSFER = "in_transfer",
  OFFLINE = "offline"
}

export interface Participant {
  identity: string;
  name: string;
  role?: AgentRole;
  is_agent: boolean;
  joined_at: string;
  room_sid: string;
}

export interface CallSession {
  session_id: string;
  caller_identity: string;
  agent_a_identity?: string;
  agent_b_identity?: string;
  original_room_sid: string;
  transfer_room_sid?: string;
  state: CallState;
  call_summary?: string;
  transfer_reason?: string;
  created_at: string;
  participants: Participant[];
}

export interface Agent {
  identity: string;
  name: string;
  role: AgentRole;
  state: AgentState;
  current_session?: string;
  conversation_length: number;
  specialty?: string;
}

export interface TransferRequest {
  session_id: string;
  agent_a_identity: string;
  agent_b_identity: string;
  reason?: string;
  context?: Record<string, any>;
}

export interface LiveKitConnectionInfo {
  access_token: string;
  livekit_url: string;
  room_name: string;
}

export interface TransferResponse {
  transfer_room_sid: string;
  tokens: {
    agent_a?: string;
    agent_b?: string;
  };
  agent_b_identity: string;
}

export interface CallExplanation {
  explanation: string;
  call_summary?: string;
}

export interface TwilioCallRequest {
  phone_number: string;
  session_id: string;
  agent_identity: string;
  context?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}