'use client';

import { useState, useEffect } from 'react';
import { useCallStore } from '@/store/callStore';
import { ApiClient } from '@/utils/api';
import CallInterface from '@/components/CallInterface';
import AgentDashboard from '@/components/AgentDashboard';
import WelcomeScreen from '@/components/WelcomeScreen';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function HomePage() {
  const {
    currentSession,
    currentUserIdentity,
    currentUserRole,
    isLoading,
    error,
    setLoading,
    setError,
    setAgents,
  } = useCallStore();

  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    // Check API health on mount
    checkApiHealth();
    // Load agents
    loadAgents();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await ApiClient.healthCheck();
      setHealthStatus(health);
      
      if (!health.livekit_configured) {
        toast.error('LiveKit not configured');
      }
      if (!health.llm_configured) {
        toast.error('LLM provider not configured');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Backend connection failed');
    }
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const agents = await ApiClient.listAgents();
      setAgents(agents);
    } catch (error) {
      console.error('Failed to load agents:', error);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner during initial load
  if (isLoading && !currentUserIdentity) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="card-modern text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <LoadingSpinner message="Loading application..." />
        </div>
      </div>
    );
  }

  // Show error if API is not available
  if (error && !currentUserIdentity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-modern">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-8 text-lg">{error}</p>
            <button
              onClick={() => {
                setError(null);
                checkApiHealth();
                loadAgents();
              }}
              className="btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome screen if no active session
  if (!currentSession || !currentUserIdentity) {
    return (
      <div className="space-y-6">
        {/* Health Status */}
        {healthStatus && (
          <div className="card-modern mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                System Status
              </h3>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div
                  className={`w-4 h-4 rounded-full mr-3 ${
                    healthStatus.status === 'healthy'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                      : 'bg-gradient-to-r from-red-400 to-rose-500'
                  }`}
                />
                <span className="font-semibold text-gray-900">
                  API: <span className="text-green-700">{healthStatus.status}</span>
                </span>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div
                  className={`w-4 h-4 rounded-full mr-3 ${
                    healthStatus.livekit_configured
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                      : 'bg-gradient-to-r from-red-400 to-rose-500'
                  }`}
                />
                <span className="font-semibold text-gray-900">
                  LiveKit: <span className="text-blue-700">{healthStatus.livekit_configured ? 'Ready' : 'Not configured'}</span>
                </span>
              </div>
              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                <div
                  className={`w-4 h-4 rounded-full mr-3 ${
                    healthStatus.llm_configured
                      ? 'bg-gradient-to-r from-purple-400 to-violet-500'
                      : 'bg-gradient-to-r from-red-400 to-rose-500'
                  }`}
                />
                <span className="font-semibold text-gray-900">
                  LLM: <span className="text-purple-700">{healthStatus.llm_configured ? 'Ready' : 'Not configured'}</span>
                </span>
              </div>
            </div>
            {healthStatus.twilio_available && (
              <div className="mt-6 flex items-center p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl border border-cyan-200">
                <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full mr-3" />
                <span className="font-semibold text-gray-900">Twilio: <span className="text-cyan-700">Available</span></span>
              </div>
            )}
          </div>
        )}

        <WelcomeScreen />
      </div>
    );
  }

  // Show appropriate interface based on user role
  if (currentUserRole === 'caller' || currentUserRole === 'agent_a' || currentUserRole === 'agent_b') {
    return <CallInterface />;
  }

  // Show agent dashboard for agents
  return <AgentDashboard />;
}