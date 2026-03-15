// ============================================================
// AgentOS Mobile — Task Detail Modal Screen
// ============================================================

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Platform,
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

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const statusColor = useMemo(() => {
    if (!task) return '#6B7280';
    const map: Record<string, string> = {
      pending: '#38BDF8',
      running: '#fbbf24',
      completed: '#00FF9C',
      failed: '#f87171',
    };
    return map[task.status] || '#6B7280';
  }, [task]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F19', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
        <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: '700' }}>Task Not Found</Text>
        <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>ID: {id}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0F19' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {/* Status Header */}
      <View
        style={{
          backgroundColor: '#121826',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1F2937',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#6B7280', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
            ID: {task.id.substring(0, 16)}...
          </Text>
          <View
            style={{
              backgroundColor: `${statusColor}22`,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>
              {task.status}
            </Text>
          </View>
        </View>

        <Text style={{ color: '#E5E7EB', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          {task.prompt}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ backgroundColor: '#0EA5E922', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
              {task.type}
            </Text>
          </View>
          {task.assignedTo && (
            <View style={{ backgroundColor: '#22D3EE22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: '#22D3EE', fontSize: 11, fontWeight: '700' }}>
                Agent: {task.assignedTo}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Subtasks */}
      {task.subtaskIds?.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginLeft: 4 }}>
            Execution Steps
          </Text>
          <View style={{ gap: 8 }}>
            {task.subtaskIds.map((sid: string) => (
              <View key={sid} style={{ backgroundColor: '#121826', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1F2937', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9' }} />
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  Subtask: {sid.substring(0, 12)}...
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Result */}
      <View
        style={{
          backgroundColor: '#121826',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#1F2937',
        }}
      >
        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 }}>
          Final Output
        </Text>
        <Text style={{ color: '#E5E7EB', fontSize: 14, lineHeight: 24, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
          {task.finalOutput || task.error || 'No output available yet.'}
        </Text>
      </View>

      {/* Timeline */}
      <View
        style={{
          backgroundColor: '#121826',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#1F2937',
        }}
      >
        <Text style={{ color: '#6B7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 }}>
          Timeline
        </Text>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Created At</Text>
            <Text style={{ color: '#E5E7EB', fontSize: 13 }}>
              {new Date(task.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>Last Update</Text>
            <Text style={{ color: '#E5E7EB', fontSize: 13 }}>
              {new Date(task.updatedAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
