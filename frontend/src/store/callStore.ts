import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  CallSession,
  Agent,
  CallState,
  AgentState,
  LiveKitConnectionInfo
} from '@/types';

export interface CallStore {
  // Current call state
  currentSession: CallSession | null;
  connectionInfo: LiveKitConnectionInfo | null;
  isConnected: boolean;
  
  // Agents
  agents: Agent[];
  currentUserIdentity: string | null;
  currentUserRole: 'caller' | 'agent_a' | 'agent_b' | null;
  
  // Transfer state
  isTransferring: boolean;
  transferStep: 'idle' | 'initiating' | 'explaining' | 'completing' | 'completed';
  transferError: string | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSession: (session: CallSession | null) => void;
  setConnectionInfo: (info: LiveKitConnectionInfo | null) => void;
  setConnected: (connected: boolean) => void;
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agent: Agent) => void;
  setCurrentUser: (identity: string, role: 'caller' | 'agent_a' | 'agent_b') => void;
  setTransferring: (transferring: boolean) => void;
  setTransferStep: (step: 'idle' | 'initiating' | 'explaining' | 'completing' | 'completed') => void;
  setTransferError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentSession: null,
    connectionInfo: null,
    isConnected: false,
    agents: [],
    currentUserIdentity: null,
    currentUserRole: null,
    isTransferring: false,
    transferStep: 'idle',
    transferError: null,
    isLoading: false,
    error: null,

    // Actions
    setCurrentSession: (session) => set({ currentSession: session }),
    
    setConnectionInfo: (info) => set({ connectionInfo: info }),
    
    setConnected: (connected) => set({ isConnected: connected }),
    
    setAgents: (agents) => set({ agents }),
    
    updateAgent: (updatedAgent) => set((state) => ({
      agents: state.agents.map(agent => 
        agent.identity === updatedAgent.identity ? updatedAgent : agent
      )
    })),
    
    setCurrentUser: (identity, role) => set({ 
      currentUserIdentity: identity,
      currentUserRole: role 
    }),
    
    setTransferring: (transferring) => set({ isTransferring: transferring }),
    
    setTransferStep: (step) => set({ transferStep: step }),
    
    setTransferError: (error) => set({ transferError: error }),
    
    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error }),
    
    reset: () => set({
      currentSession: null,
      connectionInfo: null,
      isConnected: false,
      currentUserIdentity: null,
      currentUserRole: null,
      isTransferring: false,
      transferStep: 'idle',
      transferError: null,
      isLoading: false,
      error: null,
    }),
  }))
);

// Selectors
export const useCurrentSession = () => useCallStore(state => state.currentSession);
export const useConnectionInfo = () => useCallStore(state => state.connectionInfo);
export const useIsConnected = () => useCallStore(state => state.isConnected);
export const useAgents = () => useCallStore(state => state.agents);
export const useCurrentUser = () => useCallStore(state => ({
  identity: state.currentUserIdentity,
  role: state.currentUserRole
}));
export const useTransferState = () => useCallStore(state => ({
  isTransferring: state.isTransferring,
  step: state.transferStep,
  error: state.transferError
}));
export const useLoadingState = () => useCallStore(state => ({
  isLoading: state.isLoading,
  error: state.error
}));