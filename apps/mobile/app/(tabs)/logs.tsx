// ============================================================
// AgentOS Mobile — Live Events / Logs Screen
// ============================================================

import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native';
import { useLogs } from '../../hooks/useLogs';
import { SSEEvent } from '../../lib/sse';

// ─── Event Config ──────────────────────────────────────────

const EVENT_CONFIG: Record<string, { icon: string; color: string }> = {
  'agent:status': { icon: '🤖', color: '#7c3aed' },
  'agent:thought': { icon: '💭', color: '#60a5fa' },
  'agent:tool_call': { icon: '🔧', color: '#eab308' },
  'agent:tool_result': { icon: '📦', color: '#22c55e' },
  'agent:output': { icon: '📤', color: '#06b6d4' },
  'task:created': { icon: '📋', color: '#60a5fa' },
  'task:completed': { icon: '✅', color: '#4ade80' },
  'task:failed': { icon: '❌', color: '#f87171' },
  'memory:stored': { icon: '🧬', color: '#a78bfa' },
  'system:log': { icon: '📝', color: '#64748b' },
};

function getConfig(type: string) {
  return EVENT_CONFIG[type] || { icon: '⚡', color: '#64748b' };
}

// ─── Event Row ─────────────────────────────────────────────

function EventRow({ event }: { event: SSEEvent }) {
  const cfg = getConfig(event.type);
  const summary = useMemo(() => {
    const d = event.data;
    if (d.message) return String(d.message).substring(0, 120);
    if (d.agentId) return `Agent: ${d.agentId}`;
    if (d.taskId) return `Task: ${String(d.taskId).substring(0, 8)}...`;
    if (d.tool) return `Tool: ${d.tool}`;
    return JSON.stringify(d).substring(0, 100);
  }, [event.data]);

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a24',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Text style={{ fontSize: 16, marginTop: 1 }}>{cfg.icon}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <View
            style={{
              backgroundColor: `${cfg.color}22`,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}
          >
            <Text style={{ color: cfg.color, fontSize: 10, fontWeight: '700' }}>
              {event.type}
            </Text>
          </View>
          <Text style={{ color: '#475569', fontSize: 9 }}>
            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>
        <Text style={{ color: '#94a3b8', fontSize: 12, lineHeight: 16 }} numberOfLines={2}>
          {summary}
        </Text>
      </View>
    </View>
  );
}

// ─── Logs Screen ───────────────────────────────────────────

export default function LogsScreen() {
  const { events, isConnected, connect, disconnect, clear } = useLogs();
  const hasInited = useRef(false);

  const init = useCallback(() => {
    if (!hasInited.current) {
      hasInited.current = true;
      connect();
    }
  }, [connect]);
  init();

  const renderEvent = useCallback(
    ({ item }: { item: SSEEvent }) => <EventRow event={item} />,
    [],
  );

  const reversedEvents = useMemo(() => [...events].reverse(), [events]);

  const keyExtractor = useCallback((_: SSEEvent, i: number) => `${i}`, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f14' }}>
      {/* Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: '#1e1e2a',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isConnected ? '#4ade80' : '#f87171',
            }}
          />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            {isConnected ? 'Live' : 'Disconnected'} · {events.length} events
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={isConnected ? disconnect : connect}
            style={{
              backgroundColor: '#1e1e2a',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
              {isConnected ? 'Pause' : 'Resume'}
            </Text>
          </Pressable>
          <Pressable
            onPress={clear}
            style={{
              backgroundColor: '#1e1e2a',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>Clear</Text>
          </Pressable>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>⚡</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
            Waiting for Events
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
            Real-time events stream here when agents process requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={reversedEvents}
          renderItem={renderEvent}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
