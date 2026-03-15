// ============================================================
// AgentOS Mobile — useTasks Hook
// ============================================================

import { useState, useCallback } from 'react';
import { fetchTasks } from '../lib/api';

export interface TaskItem {
  id: string;
  type: string;
  prompt: string;
  assignedTo?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchTasks();
      if (res.success) {
        setTasks(res.data.tasks);
        setStats(res.data.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tasks, stats, isLoading, error, refresh };
}
