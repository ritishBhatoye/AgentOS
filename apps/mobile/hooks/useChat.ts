// ============================================================
// AgentOS Mobile — useChat Hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { sendChatMessage } from '../lib/api';
import { safeStorage } from '../lib/storage';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
}

const CACHE_KEY = 'agentos_chat_history';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(null);

  const loadCachedMessages = useCallback(async () => {
    try {
      const cached = await safeStorage.getItem(CACHE_KEY);
      if (cached) setMessages(JSON.parse(cached));
    } catch {}
  }, []);

  const cacheMessages = useCallback(async (msgs: ChatMessage[]) => {
    try {
      await safeStorage.setItem(CACHE_KEY, JSON.stringify(msgs.slice(-50)));
    } catch {}
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      const next = [...prev, userMsg];
      cacheMessages(next);
      return next;
    });
    setIsLoading(true);

    try {
      const res = await sendChatMessage(text, conversationIdRef.current);
      if (res.success) {
        conversationIdRef.current = res.data.conversationId;
        const assistantMsg: ChatMessage = {
          id: res.data.message.id || `${Date.now()}-resp`,
          role: 'assistant',
          content: res.data.message.content,
          model: res.data.message.model,
          timestamp: res.data.message.timestamp,
        };
        setMessages(prev => {
          const next = [...prev, assistantMsg];
          cacheMessages(next);
          return next;
        });
      }
    } catch {
      const errMsg: ChatMessage = {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: '⚠️ Failed to connect. Check that the backend and Ollama are running.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, cacheMessages]);

  const clearChat = useCallback(async () => {
    setMessages([]);
    conversationIdRef.current = null;
    await safeStorage.removeItem(CACHE_KEY);
  }, []);

  return { messages, isLoading, send, clearChat, loadCachedMessages };
}
