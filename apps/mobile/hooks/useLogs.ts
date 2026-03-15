// ============================================================
// AgentOS Mobile — useLogs Hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { connectSSE, SSEEvent } from '../lib/sse';

export function useLogs() {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const disconnectRef = useRef<(() => void) | null>(null);

  const connect = useCallback(() => {
    // Disconnect existing connection
    disconnectRef.current?.();

    const disconnect = connectSSE(
      (event) => {
        setEvents(prev => [...prev.slice(-200), event]);
      },
      () => {
        setIsConnected(false);
      },
    );

    disconnectRef.current = disconnect;
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    disconnectRef.current?.();
    disconnectRef.current = null;
    setIsConnected(false);
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, isConnected, connect, disconnect, clear };
}
