'use client';

import React, { useState } from 'react';
import { useCallStore } from '@/store/callStore';
import { ApiClient, handleApiError } from '@/utils/api';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const WelcomeScreen: React.FC = () => {
  const {
    setCurrentSession,
    setConnectionInfo,
    setCurrentUser,
    setLoading,
    isLoading,
  } = useCallStore();

  const [callerName, setCallerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedRole, setSelectedRole] = useState<'caller' | 'agent_a' | 'agent_b'>('caller');

  const handleStartCall = async () => {
    if (!callerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      
      const callerIdentity = `caller_${callerName.replace(/\s+/g, '_').toLowerCase()}`;
      
      // Create new call session
      const callInfo = await ApiClient.createCall(callerIdentity);
      
      // Join the call
      const connectionInfo = await ApiClient.joinCall(
        callInfo.session_id,
        callerIdentity,
        'caller'
      );
      
      // Get session details
      const session = await ApiClient.getCallInfo(callInfo.session_id);
      
      // Update store
      setCurrentSession(session);
      setConnectionInfo(connectionInfo);
      setCurrentUser(callerIdentity, 'caller');
      
      toast.success('Call started! Connecting to Agent A...');
      
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinAsAgent = async () => {
    if (!callerName.trim()) {
      toast.error('Please enter your agent name');
      return;
    }

    const agentIdentity = `${selectedRole}_${callerName.replace(/\s+/g, '_').toLowerCase()}`;
    
    // For demo purposes, we'll show the agent interface
    setCurrentUser(agentIdentity, selectedRole);
    toast.success(`Logged in as ${selectedRole.replace('_', ' ').toUpperCase()}`);
  };

  const handleTwilioCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setLoading(true);
      
      const callerIdentity = `phone_caller_${Date.now()}`;
      
      // Create call session first
      const callInfo = await ApiClient.createCall(callerIdentity);
      
      // Initiate Twilio call
      await ApiClient.initiateTwilioCall({
        phone_number: phoneNumber,
        session_id: callInfo.session_id,
        agent_identity: callInfo.agent_a_identity,
        context: 'Inbound phone call'
      });
      
      toast.success('Phone call initiated! Please answer your phone.');
      
    } catch (error) {
      console.error('Failed to initiate phone call:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <LoadingSpinner message="Setting up your call..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Demo Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Call */}
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">📞</div>
            <h2 className="text-xl font-bold text-gray-900">Start Customer Call</h2>
            <p className="text-gray-600 mt-2">
              Experience the warm transfer flow as a customer
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <button
              onClick={handleStartCall}
              disabled={!callerName.trim() || isLoading}
              className="w-full btn-primary"
            >
              Start Call with Agent A
            </button>
          </div>
        </div>

        {/* Agent Login */}
        <div className="card">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎧</div>
            <h2 className="text-xl font-bold text-gray-900">Agent Dashboard</h2>
            <p className="text-gray-600 mt-2">
              Login as an agent to handle calls and transfers
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Enter agent name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'caller' | 'agent_a' | 'agent_b')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="agent_a">Agent A (Initial Handler)</option>
                <option value="agent_b">Agent B (Specialist)</option>
              </select>
            </div>
            
            <button
              onClick={handleJoinAsAgent}
              disabled={!callerName.trim()}
              className="w-full btn-secondary"
            >
              Login as Agent
            </button>
          </div>
        </div>
      </div>

      {/* Twilio Integration */}
      <div className="card">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="text-xl font-bold text-gray-900">Twilio Phone Integration</h2>
          <p className="text-gray-600 mt-2">
            Call a real phone number (Optional Extension)
          </p>
        </div>
        
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <button
            onClick={handleTwilioCall}
            disabled={!phoneNumber.trim()}
            className="w-full btn-warning"
          >
            Call This Number
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Requires Twilio configuration in backend
          </p>
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          🎯 Demo Flow Instructions
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>1. Start as Customer:</strong> Enter your name and start a call</p>
          <p><strong>2. Talk to Agent A:</strong> Mention "billing" or "technical" issues</p>
          <p><strong>3. Transfer Initiated:</strong> Agent A will initiate warm transfer</p>
          <p><strong>4. Context Shared:</strong> Agent A explains the situation to Agent B</p>
          <p><strong>5. Transfer Complete:</strong> Agent A leaves, you continue with Agent B</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;