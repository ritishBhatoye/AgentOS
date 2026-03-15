// ============================================================
// AgentOS Mobile — SSE Client
// ============================================================

import { safeStorage } from './storage';

const DEFAULT_URL = 'http://localhost:4000';

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export type SSECallback = (event: SSEEvent) => void;

/**
 * Create an SSE connection to AgentOS backend.
 * Returns an abort function to close the connection.
 */
export function connectSSE(onEvent: SSECallback, onError?: (err: Error) => void): () => void {
  const controller = new AbortController();

  (async () => {
    const base = (await safeStorage.getItem('agentos_api_url')) || DEFAULT_URL;
    const url = `${base}/api/events`;

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'text/event-stream' },
      });

      if (!response.ok || !response.body) {
        onError?.(new Error(`SSE connection failed: ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ') && currentEventType) {
            try {
              const parsed = JSON.parse(line.slice(6)) as SSEEvent;
              onEvent(parsed);
            } catch {
              // skip malformed data
            }
            currentEventType = '';
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    }
  })();

  return () => controller.abort();
}
