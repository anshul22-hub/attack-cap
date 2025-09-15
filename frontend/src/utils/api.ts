import axios, { AxiosResponse } from 'axios';
import {
  CallSession,
  Agent,
  TransferRequest,
  LiveKitConnectionInfo,
  TransferResponse,
  CallExplanation,
  TwilioCallRequest,
  ApiResponse
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error:`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiClient {
  // Health check
  static async healthCheck(): Promise<any> {
    const response = await api.get('/health');
    return response.data;
  }

  // Call management
  static async createCall(
    callerIdentity: string,
    agentAIdentity?: string
  ): Promise<{ session_id: string; room_name: string; agent_a_identity: string }> {
    const response = await api.post('/api/calls/create', null, {
      params: {
        caller_identity: callerIdentity,
        agent_a_identity: agentAIdentity,
      },
    });
    return response.data;
  }

  static async joinCall(
    sessionId: string,
    identity: string,
    role?: string
  ): Promise<LiveKitConnectionInfo> {
    const response = await api.post(`/api/calls/${sessionId}/join`, {
      identity,
      role,
    });
    return response.data;
  }

  static async initiateTransfer(
    sessionId: string,
    transferRequest: TransferRequest
  ): Promise<TransferResponse> {
    const response = await api.post(
      `/api/calls/${sessionId}/transfer`,
      transferRequest
    );
    return response.data;
  }

  static async explainTransfer(
    sessionId: string,
    agentAIdentity: string,
    agentBIdentity: string
  ): Promise<CallExplanation> {
    const response = await api.post(`/api/calls/${sessionId}/explain`, {
      agent_a_identity: agentAIdentity,
      agent_b_identity: agentBIdentity,
    });
    return response.data;
  }

  static async completeTransfer(
    sessionId: string,
    agentAIdentity: string
  ): Promise<{ success: boolean; final_room_sid: string; message: string }> {
    const response = await api.post(`/api/calls/${sessionId}/complete`, {
      agent_a_identity: agentAIdentity,
    });
    return response.data;
  }

  static async getCallInfo(sessionId: string): Promise<CallSession> {
    const response = await api.get(`/api/calls/${sessionId}`);
    return response.data;
  }

  // Agent management
  static async listAgents(): Promise<Agent[]> {
    const response = await api.get('/api/agents');
    return response.data;
  }

  static async getAgentStatus(identity: string): Promise<Agent> {
    const response = await api.get(`/api/agents/${identity}`);
    return response.data;
  }

  // Twilio integration
  static async initiateTwilioCall(
    callRequest: TwilioCallRequest
  ): Promise<{ call_sid: string; phone_number: string; session_id: string }> {
    const response = await api.post('/api/twilio/call', callRequest);
    return response.data;
  }
}

// Utility functions for error handling
export function handleApiError(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function isApiError(error: any): boolean {
  return error.response?.status >= 400;
}

export default api;