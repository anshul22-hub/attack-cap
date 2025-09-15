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
        <div className="card-modern text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <LoadingSpinner message="Setting up your call..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
          Experience Seamless Call Transfers
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Powered by LiveKit and advanced LLM technology for intelligent conversation handoffs
        </p>
      </div>

      {/* Main Demo Options */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Customer Call */}
        <div className="card-modern">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Start Customer Call</h2>
            <p className="text-gray-600">
              Experience the warm transfer flow as a customer
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Enter your name"
                className="input-modern"
              />
            </div>
            
            <button
              onClick={handleStartCall}
              disabled={!callerName.trim() || isLoading}
              className="w-full btn-primary"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start Call with Agent A
              </div>
            </button>
          </div>
        </div>

        {/* Agent Login */}
        <div className="card-modern">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Agent Dashboard</h2>
            <p className="text-gray-600">
              Login as an agent to handle calls and transfers
            </p>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                placeholder="Enter agent name"
                className="input-modern"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Agent Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'caller' | 'agent_a' | 'agent_b')}
                className="select-modern"
              >
                <option value="agent_a">Agent A (Initial Handler)</option>
                <option value="agent_b">Agent B (Specialist)</option>
              </select>
            </div>
            
            <button
              onClick={handleJoinAsAgent}
              disabled={!callerName.trim()}
              className="w-full btn-success"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login as Agent
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Twilio Integration */}
      <div className="card-modern max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Twilio Phone Integration</h2>
          <p className="text-gray-600">
            Call a real phone number (Optional Extension)
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="input-modern"
            />
          </div>
          
          <button
            onClick={handleTwilioCall}
            disabled={!phoneNumber.trim()}
            className="w-full btn-warning"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call This Number
            </div>
          </button>
          
          <p className="text-sm text-gray-500 text-center px-4 py-2 bg-amber-50 rounded-lg border border-amber-200">
            💡 Requires Twilio configuration in backend
          </p>
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="card-modern bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
            🎯 Demo Flow Instructions
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-0.5">1</div>
              <div>
                <p className="font-semibold text-blue-900">Start as Customer</p>
                <p className="text-blue-700 text-sm">Enter your name and start a call</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-0.5">2</div>
              <div>
                <p className="font-semibold text-blue-900">Talk to Agent A</p>
                <p className="text-blue-700 text-sm">Mention "billing" or "technical" issues</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-0.5">3</div>
              <div>
                <p className="font-semibold text-blue-900">Transfer Initiated</p>
                <p className="text-blue-700 text-sm">Agent A will initiate warm transfer</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-0.5">4</div>
              <div>
                <p className="font-semibold text-blue-900">Context Shared</p>
                <p className="text-blue-700 text-sm">Agent A explains the situation to Agent B</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 mt-0.5">5</div>
              <div>
                <p className="font-semibold text-blue-900">Transfer Complete</p>
                <p className="text-blue-700 text-sm">Agent A leaves, you continue with Agent B</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;