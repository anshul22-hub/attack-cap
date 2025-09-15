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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner message="Loading application..." />
      </div>
    );
  }

  // Show error if API is not available
  if (error && !currentUserIdentity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Error
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                checkApiHealth();
                loadAgents();
              }}
              className="btn-primary"
            >
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    healthStatus.status === 'healthy'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  API: {healthStatus.status}
                </span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    healthStatus.livekit_configured
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  LiveKit: {healthStatus.livekit_configured ? 'Ready' : 'Not configured'}
                </span>
              </div>
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    healthStatus.llm_configured
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm">
                  LLM: {healthStatus.llm_configured ? 'Ready' : 'Not configured'}
                </span>
              </div>
            </div>
            {healthStatus.twilio_available && (
              <div className="mt-2 flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-blue-500" />
                <span className="text-sm">Twilio: Available</span>
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