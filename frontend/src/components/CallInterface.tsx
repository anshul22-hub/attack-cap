'use client';

import React, { useEffect, useState } from 'react';
import { useCallStore } from '@/store/callStore';
import { ApiClient, handleApiError } from '@/utils/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const CallInterface: React.FC = () => {
  const {
    currentSession,
    currentUserRole,
    currentUserIdentity,
    connectionInfo,
    isConnected,
    isTransferring,
    transferStep,
    setTransferStep,
    setError,
  } = useCallStore();

  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [selectedAgentB, setSelectedAgentB] = useState('');

  useEffect(() => {
    loadAvailableAgents();
  }, []);

  const loadAvailableAgents = async () => {
    try {
      const agents = await ApiClient.listAgents();
      const agentBList = agents.filter(agent => agent.role === 'agent_b' && agent.state === 'idle');
      setAvailableAgents(agentBList);
      if (agentBList.length > 0) {
        setSelectedAgentB(agentBList[0].identity);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!currentSession || !currentUserIdentity || !selectedAgentB) {
      toast.error('Missing required information for transfer');
      return;
    }

    try {
      setTransferStep('initiating');
      
      // Step 1: Initiate transfer
      await ApiClient.initiateTransfer(currentSession.session_id, {
        session_id: currentSession.session_id,
        agent_a_identity: currentUserIdentity,
        agent_b_identity: selectedAgentB,
        reason: 'Customer requires specialized assistance',
      });

      setTransferStep('explaining');
      
      // Step 2: Explain to Agent B
      await ApiClient.explainTransfer(
        currentSession.session_id,
        currentUserIdentity,
        selectedAgentB
      );

      setTransferStep('completing');
      
      // Step 3: Complete transfer
      await ApiClient.completeTransfer(currentSession.session_id, currentUserIdentity);
      
      setTransferStep('completed');
      toast.success('Transfer completed successfully!');
      
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(handleApiError(error));
      setTransferStep('idle');
    }
  };

  if (!currentSession) {
    return (
      <div className="card">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">No Active Session</h2>
          <p className="text-gray-600">Please start a call first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Call Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Call Session</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Session ID</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">{currentSession.session_id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Your Role</label>
            <p className="text-sm font-semibold">{currentUserRole?.replace('_', ' ').toUpperCase()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Call State</label>
            <span className={`status-${currentSession.state}`}>
              {currentSession.state.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* LiveKit Video/Audio Interface */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Call Interface</h3>
        
        {connectionInfo ? (
          <div className="bg-gray-100 p-6 rounded-lg text-center">
            <div className="text-4xl mb-4">🎥</div>
            <p className="text-lg mb-2">LiveKit Room: {connectionInfo.room_name}</p>
            <p className="text-sm text-gray-600 mb-4">
              In a real implementation, this would show the LiveKit video/audio interface
            </p>
            <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                LiveKit Audio/Video Component would be rendered here
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Room: {connectionInfo.room_name}<br/>
                URL: {connectionInfo.livekit_url}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <LoadingSpinner message="Connecting to call..." />
          </div>
        )}
      </div>

      {/* Transfer Controls (for Agent A) */}
      {currentUserRole === 'agent_a' && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Warm Transfer Controls</h3>
          
          {transferStep === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Specialist Agent
                </label>
                <select
                  value={selectedAgentB}
                  onChange={(e) => setSelectedAgentB(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {availableAgents.map(agent => (
                    <option key={agent.identity} value={agent.identity}>
                      {agent.name} - {agent.specialty || 'General'}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleInitiateTransfer}
                disabled={!selectedAgentB || isTransferring}
                className="btn-warning"
              >
                Initiate Warm Transfer
              </button>
            </div>
          )}
          
          {transferStep !== 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {transferStep === 'completed' ? (
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  ) : (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">Transfer in Progress</h4>
                  <p className="text-sm text-gray-600">
                    {transferStep === 'initiating' && 'Creating transfer room...'}
                    {transferStep === 'explaining' && 'Explaining context to Agent B...'}
                    {transferStep === 'completing' && 'Completing transfer...'}
                    {transferStep === 'completed' && 'Transfer completed successfully!'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Summary (for agents) */}
      {(currentUserRole === 'agent_a' || currentUserRole === 'agent_b') && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Call Summary</h3>
          
          {currentSession.call_summary ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm">{currentSession.call_summary}</p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No call summary available yet</p>
            </div>
          )}
        </div>
      )}

      {/* Demo Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Demo Instructions
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          {currentUserRole === 'caller' && (
            <>
              <p><strong>As a Customer:</strong></p>
              <p>• You are now connected with Agent A</p>
              <p>• Mention billing or technical issues to trigger a transfer</p>
              <p>• You'll be transferred to a specialist who has context about your call</p>
            </>
          )}
          {currentUserRole === 'agent_a' && (
            <>
              <p><strong>As Agent A:</strong></p>
              <p>• Listen to customer's issue</p>
              <p>• Use the transfer controls to connect them with a specialist</p>
              <p>• The system will generate a summary and explain to Agent B</p>
            </>
          )}
          {currentUserRole === 'agent_b' && (
            <>
              <p><strong>As Agent B:</strong></p>
              <p>• You'll receive transfers with full context</p>
              <p>• Review the call summary before taking over</p>
              <p>• Continue helping the customer with your specialization</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallInterface;