'use client';

import { useAgent } from '../contexts/AgentContextHybrid';
import { APIRole } from '../lib/ciris-sdk';

export default function AgentSelector() {
  const { currentAgent, currentAgentRole } = useAgent();

  const getRoleBadge = (role: APIRole | undefined, isAuthority: boolean) => {
    if (!role) return null;

    const roleColors = {
      SYSTEM_ADMIN: 'bg-purple-100 text-purple-800',
      AUTHORITY: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-green-100 text-green-800',
      OBSERVER: 'bg-gray-100 text-gray-800'
    };

    const displayRole = isAuthority && role !== 'SYSTEM_ADMIN' ? 'AUTHORITY' : role;
    const color = roleColors[role] || roleColors.OBSERVER;

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {displayRole}
      </span>
    );
  };

  if (!currentAgent) return null;

  // Simplified selector for single-agent mode - just shows current agent
  return (
    <div className="relative w-full rounded-lg bg-white py-2 pl-3 pr-3 text-left shadow-md sm:text-sm">
      <span className="flex items-center justify-between">
        <span className="block truncate">{currentAgent.agent_name}</span>
        {currentAgentRole && getRoleBadge(currentAgentRole.apiRole, currentAgentRole.isAuthority)}
      </span>
    </div>
  );
}
