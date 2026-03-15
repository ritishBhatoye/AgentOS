// ============================================================
// AgentOS Mobile — API Client
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL = 'http://localhost:4000';

async function getBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem('agentos_api_url');
  return stored || DEFAULT_URL;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Chat ────────────────────────────────────────────────

export async function sendChatMessage(message: string, conversationId?: string | null) {
  return request<{
    success: boolean;
    data: {
      conversationId: string;
      message: { id: string; role: string; content: string; model?: string; timestamp: string };
    };
  }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId }),
  });
}

// ─── Agents ──────────────────────────────────────────────

export async function fetchAgents() {
  return request<{ success: boolean; data: Record<string, any> }>('/api/agents/status');
}

export async function executeAgent(prompt: string, agentId?: string) {
  return request<{ success: boolean; data: any }>('/api/agents/execute', {
    method: 'POST',
    body: JSON.stringify({ prompt, agentId }),
  });
}

// ─── Tasks ───────────────────────────────────────────────

export async function fetchTasks() {
  return request<{ success: boolean; data: { tasks: any[]; stats: any } }>('/api/tasks');
}

// ─── Health ──────────────────────────────────────────────

export async function fetchHealth() {
  return request<{ success: boolean; data: any }>('/api/health');
}

// ─── Logs ────────────────────────────────────────────────

export async function fetchLogs(limit = 100) {
  return request<{ success: boolean; data: any[] }>(`/api/health/logs?limit=${limit}`);
}

// ─── Memory ──────────────────────────────────────────────

export async function fetchMemory(limit = 50) {
  return request<{ success: boolean; data: { entries: any[]; stats: any } }>(`/api/memory?limit=${limit}`);
}

export async function searchMemory(query: string) {
  return request<{ success: boolean; data: any[] }>(`/api/memory/search?q=${encodeURIComponent(query)}`);
}

// ─── Settings ────────────────────────────────────────────

export async function setApiUrl(url: string) {
  await AsyncStorage.setItem('agentos_api_url', url);
}

export async function getApiUrl(): Promise<string> {
  return getBaseUrl();
}
