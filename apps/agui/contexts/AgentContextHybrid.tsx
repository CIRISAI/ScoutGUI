'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { cirisClient } from '../lib/ciris-sdk';
import { AgentInfo } from '../lib/ciris-sdk/resources/manager';
import type { APIRole, WARole } from '../lib/ciris-sdk';
import { sdkConfigManager } from '../lib/sdk-config-manager';
import { AuthStore } from '../lib/ciris-sdk/auth-store';

interface AgentRole {
  agentId: string;
  apiRole: APIRole;
  waRole?: WARole;
  isAuthority: boolean;
  lastChecked: Date;
}

interface AgentContextType {
  currentAgent: AgentInfo;
  currentAgentRole: AgentRole | null;
  refreshAgentRole: () => Promise<void>;
  isLoadingRole: boolean;
  error: Error | null;
}

const AgentContext = createContext<AgentContextType | null>(null);

// Scout agent configuration - points to Vultr server
const SCOUT_AGENT: AgentInfo = {
  agent_id: 'scout',
  agent_name: 'Scout',
  status: 'running',
  health: 'healthy',
  api_url: process.env.NEXT_PUBLIC_SCOUT_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost',
  api_port: parseInt(process.env.NEXT_PUBLIC_SCOUT_API_PORT || '8080'),
  api_endpoint: process.env.NEXT_PUBLIC_SCOUT_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  container_name: 'scout-agent',
  created_at: new Date().toISOString(),
  started_at: new Date().toISOString(),
  update_available: false,
};

export function AgentProvider({ children }: { children: ReactNode }) {
  const [currentAgentRole, setCurrentAgentRole] = useState<AgentRole | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  // Initialize SDK configuration for Scout agent
  useEffect(() => {
    const authToken = AuthStore.getAccessToken();
    console.log('[AgentContext] Configuring SDK for Scout agent');
    sdkConfigManager.configure(SCOUT_AGENT.agent_id, authToken || undefined);
  }, []);

  // Fetch role for Scout agent
  const refreshAgentRole = async () => {
    if (!user) return;

    setIsLoadingRole(true);
    setError(null);

    try {
      const userInfo = await cirisClient.auth.getCurrentUser();

      if (userInfo) {
        const newRole: AgentRole = {
          agentId: SCOUT_AGENT.agent_id,
          apiRole: userInfo.api_role,
          waRole: userInfo.wa_role,
          isAuthority: userInfo.wa_role === 'authority' || userInfo.api_role === 'SYSTEM_ADMIN',
          lastChecked: new Date()
        };

        setCurrentAgentRole(newRole);
      }
    } catch (error) {
      console.error(`Failed to fetch role for Scout agent:`, error);
      setError(error instanceof Error ? error : new Error('Failed to fetch role'));
    } finally {
      setIsLoadingRole(false);
    }
  };

  // Refresh role when user changes
  useEffect(() => {
    if (user) {
      refreshAgentRole();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: AgentContextType = {
    currentAgent: SCOUT_AGENT,
    currentAgentRole,
    refreshAgentRole,
    isLoadingRole,
    error,
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}
