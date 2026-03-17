// ============================================================
// AgentOS Mobile — useAgents Hook
// ============================================================

import { useState, useCallback } from 'react';
import { fetchAgents } from '../lib/api';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'busy' | 'error';
  capabilities: string[];
  currentTaskId?: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAgents();
      if (res.success) {
        setAgents(Object.values(res.data) as AgentInfo[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { agents, isLoading, error, refresh };
}
