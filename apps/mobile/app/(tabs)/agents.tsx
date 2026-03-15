// ============================================================
// AgentOS Mobile — Agents Screen
// ============================================================

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useAgents, AgentInfo } from '../../hooks/useAgents';

// ─── Agent Icons ───────────────────────────────────────────

const AGENT_META: Record<string, { icon: string; gradient: string }> = {
  planner: { icon: '🧠', gradient: '#7c3aed' },
  coding: { icon: '💻', gradient: '#3b82f6' },
  research: { icon: '🔍', gradient: '#06b6d4' },
  execution: { icon: '⚙️', gradient: '#22c55e' },
};

// ─── Agent Card ────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentInfo }) {
  const meta = AGENT_META[agent.id] || { icon: '🤖', gradient: '#7c3aed' };
  const isIdle = agent.status === 'idle';

  return (
    <View
      style={{
        backgroundColor: '#16161e',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e1e2a',
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: `${meta.gradient}22`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 24 }}>{meta.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '700' }}>
            {agent.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isIdle ? '#4ade80' : agent.status === 'busy' ? '#facc15' : '#f87171',
              }}
            />
            <Text
              style={{
                color: isIdle ? '#4ade80' : agent.status === 'busy' ? '#facc15' : '#f87171',
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {agent.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18, marginBottom: 12 }}>
        {agent.description}
      </Text>

      {/* Capabilities */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {agent.capabilities.map(cap => (
          <View
            key={cap}
            style={{
              backgroundColor: `${meta.gradient}15`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ color: meta.gradient, fontSize: 10, fontWeight: '600' }}>
              {cap}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Agents Screen ─────────────────────────────────────────

export default function AgentsScreen() {
  const { agents, isLoading, refresh } = useAgents();
  const hasLoaded = useRef(false);

  const init = useCallback(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      refresh();
    }
  }, [refresh]);
  init();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0f0f14' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#7c3aed" />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header stat */}
      <View
        style={{
          backgroundColor: '#16161e',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e1e2a',
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#7c3aed', fontSize: 24, fontWeight: '800' }}>{agents.length}</Text>
          <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Agents</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#4ade80', fontSize: 24, fontWeight: '800' }}>
            {agents.filter(a => a.status === 'idle').length}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Idle</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#facc15', fontSize: 24, fontWeight: '800' }}>
            {agents.filter(a => a.status === 'busy').length}
          </Text>
          <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Busy</Text>
        </View>
      </View>

      {/* Agent Cards */}
      {agents.length === 0 && !isLoading ? (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🤖</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
            No Agents Found
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
            Start the AI backend to connect agents
          </Text>
        </View>
      ) : (
        agents.map(agent => <AgentCard key={agent.id} agent={agent} />)
      )}
    </ScrollView>
  );
}
