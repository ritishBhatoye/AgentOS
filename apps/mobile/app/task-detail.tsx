// ============================================================
// AgentOS Mobile — Task Detail Modal Screen
// ============================================================

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fetchTasks } from '../lib/api';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);

  const loadTask = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    try {
      const res = await fetchTasks();
      if (res.success) {
        const found = res.data.tasks.find((t: any) => t.id === id);
        setTask(found || null);
      }
    } catch {
      // handle error
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  loadTask();

  const statusColor = useMemo(() => {
    if (!task) return '#64748b';
    const map: Record<string, string> = {
      pending: '#60a5fa',
      running: '#facc15',
      completed: '#4ade80',
      failed: '#f87171',
    };
    return map[task.status] || '#64748b';
  }, [task]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f14', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f14', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '700' }}>Task Not Found</Text>
        <Text style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>ID: {id}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0f0f14' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {/* Status Header */}
      <View
        style={{
          backgroundColor: '#16161e',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e1e2a',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#64748b', fontSize: 11, fontFamily: 'SpaceMono' }}>
            {task.id}
          </Text>
          <View
            style={{
              backgroundColor: `${statusColor}22`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' }}>
              {task.status}
            </Text>
          </View>
        </View>

        <Text style={{ color: '#e2e8f0', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
          {task.prompt}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#7c3aed22', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#a78bfa', fontSize: 11, fontWeight: '600' }}>
              Type: {task.type}
            </Text>
          </View>
          {task.assignedTo && (
            <View style={{ backgroundColor: '#06b6d422', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: '#22d3ee', fontSize: 11, fontWeight: '600' }}>
                Agent: {task.assignedTo}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Timestamps */}
      <View
        style={{
          backgroundColor: '#16161e',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1e1e2a',
        }}
      >
        <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 }}>
          Timeline
        </Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Created</Text>
            <Text style={{ color: '#e2e8f0', fontSize: 13 }}>
              {new Date(task.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#94a3b8', fontSize: 13 }}>Updated</Text>
            <Text style={{ color: '#e2e8f0', fontSize: 13 }}>
              {new Date(task.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Result */}
      {task.result && (
        <View
          style={{
            backgroundColor: '#16161e',
            borderRadius: 14,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#1e1e2a',
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 }}>
            Result
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 13, lineHeight: 20, fontFamily: 'SpaceMono' }}>
            {task.result}
          </Text>
        </View>
      )}

      {/* Error */}
      {task.error && (
        <View
          style={{
            backgroundColor: '#ef444415',
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: '#ef444433',
          }}
        >
          <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>
            Error
          </Text>
          <Text style={{ color: '#fca5a5', fontSize: 13, lineHeight: 20 }}>
            {task.error}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
