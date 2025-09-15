'use client';

import React, { useEffect, useState } from 'react';
import { useCallStore } from '@/store/callStore';
import { ApiClient } from '@/utils/api';
import LoadingSpinner from './LoadingSpinner';

const AgentDashboard: React.FC = () => {
  const { agents, setAgents, currentUserIdentity } = useCallStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const agentsData = await ApiClient.listAgents();
      setAgents(agentsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <LoadingSpinner message="Loading agent dashboard..." />
      </div>
    );
  }

  const currentAgent = agents.find(agent => agent.identity === currentUserIdentity);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Agent Status */}
      {currentAgent && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Your Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="font-semibold">{currentAgent.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <p className="font-semibold">{currentAgent.role.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">State</label>
              <span className={`status-${currentAgent.state}`}>
                {currentAgent.state.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Session</label>
              <p className="text-sm font-mono">
                {currentAgent.current_session || 'None'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Agents Status */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">All Agents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Session
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.identity}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.identity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {agent.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-${agent.state}`}>
                      {agent.state.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {agent.current_session || 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          🎯 Agent Instructions
        </h3>
        <div className="space-y-2 text-sm text-green-800">
          <p><strong>As an Agent:</strong></p>
          <p>• Monitor incoming calls and transfers</p>
          <p>• Use the call interface when handling customers</p>
          <p>• Agent A: Initiate transfers when customers need specialists</p>
          <p>• Agent B: Receive transfers with full context and continue assistance</p>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;