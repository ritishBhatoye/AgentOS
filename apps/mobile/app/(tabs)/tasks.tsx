// ============================================================
// AgentOS Mobile — Tasks Screen
// ============================================================

import React, { useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTasks, TaskItem } from '../../hooks/useTasks';

// ─── Status Badge ──────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#3b82f622', text: '#60a5fa', icon: '⏳' },
  running: { bg: '#eab30822', text: '#facc15', icon: '🔄' },
  completed: { bg: '#22c55e22', text: '#4ade80', icon: '✅' },
  failed: { bg: '#ef444422', text: '#f87171', icon: '❌' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: config.bg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 10 }}>{config.icon}</Text>
      <Text style={{ color: config.text, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
        {status}
      </Text>
    </View>
  );
}

// ─── Task Card ─────────────────────────────────────────────

function TaskCard({ task, onPress }: { task: TaskItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#16161e',
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#1e1e2a',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#64748b', fontSize: 11, fontFamily: 'SpaceMono' }}>
          {task.id.substring(0, 8)}...
        </Text>
        <StatusBadge status={task.status} />
      </View>
      <Text style={{ color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 6 }} numberOfLines={2}>
        {task.prompt}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ backgroundColor: '#7c3aed22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '600' }}>
              {task.type}
            </Text>
          </View>
          {task.assignedTo && (
            <View style={{ backgroundColor: '#06b6d422', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: '#22d3ee', fontSize: 10, fontWeight: '600' }}>
                {task.assignedTo}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ color: '#475569', fontSize: 10 }}>
          {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Stats Bar ─────────────────────────────────────────────

function StatsRow({ stats }: { stats: { total: number; running: number; completed: number; failed: number } }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      {[
        { label: 'Total', value: stats.total, color: '#60a5fa' },
        { label: 'Running', value: stats.running, color: '#facc15' },
        { label: 'Done', value: stats.completed, color: '#4ade80' },
        { label: 'Failed', value: stats.failed, color: '#f87171' },
      ].map(s => (
        <View
          key={s.label}
          style={{
            flex: 1,
            backgroundColor: '#16161e',
            borderRadius: 10,
            padding: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#1e1e2a',
          }}
        >
          <Text style={{ color: s.color, fontSize: 18, fontWeight: '800' }}>{s.value}</Text>
          <Text style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Tasks Screen ──────────────────────────────────────────

export default function TasksScreen() {
  const { tasks, stats, isLoading, refresh } = useTasks();
  const router = useRouter();
  const hasLoaded = useRef(false);

  const init = useCallback(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      refresh();
    }
  }, [refresh]);
  init();

  const renderTask = useCallback(
    ({ item }: { item: TaskItem }) => (
      <TaskCard
        task={item}
        onPress={() => router.push({ pathname: '/task-detail', params: { id: item.id } })}
      />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: TaskItem) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f14' }}>
      {stats && <StatsRow stats={stats} />}

      {tasks.length === 0 && !isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
            No Tasks Yet
          </Text>
          <Text style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
            Tasks appear here when AI agents process your requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor="#7c3aed"
              colors={['#7c3aed']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
