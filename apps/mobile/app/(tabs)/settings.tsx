// ============================================================
// AgentOS Mobile — Settings Screen
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { safeStorage } from '../../lib/storage';
import { setApiUrl, getApiUrl } from '../../lib/api';
import { registerForPushNotifications } from '../../lib/notifications';

// ─── Section ───────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          color: '#6B7280',
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: '#121826',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#1F2937',
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onPress,
  danger,
  rightElement,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !rightElement}
      style={({ pressed }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: danger ? '#f87171' : '#E5E7EB', fontSize: 15, fontWeight: '500' }}>
        {label}
      </Text>
      {value && <Text style={{ color: '#6B7280', fontSize: 13 }}>{value}</Text>}
      {rightElement}
    </Pressable>
  );
}

// ─── Settings Screen ───────────────────────────────────────

export default function SettingsScreen() {
  const [apiUrlInput, setApiUrlInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const hasLoaded = useRef(false);

  const loadSettings = useCallback(async () => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    const url = await getApiUrl();
    setApiUrlInput(url);
    const notifPref = await safeStorage.getItem('agentos_notifications');
    setNotificationsEnabled(notifPref !== 'false');
  }, []);
  loadSettings();

  const saveApiUrl = useCallback(async () => {
    if (apiUrlInput.trim()) {
      await setApiUrl(apiUrlInput.trim());
      setIsEditing(false);
      Alert.alert('✅ Saved', `Backend URL updated to:\n${apiUrlInput.trim()}`);
    }
  }, [apiUrlInput]);

  const toggleNotifications = useCallback(async (val: boolean) => {
    setNotificationsEnabled(val);
    await safeStorage.setItem('agentos_notifications', val.toString());
    if (val) {
      const granted = await registerForPushNotifications();
      if (!granted) {
        Alert.alert('Permissions', 'Enable notifications in your device settings');
        setNotificationsEnabled(false);
      }
    }
  }, []);

  const clearChatHistory = useCallback(() => {
    Alert.alert('Clear Chat History', 'This will delete all cached messages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await safeStorage.removeItem('agentos_chat_history');
          Alert.alert('✅ Done', 'Chat history cleared');
        },
      },
    ]);
  }, []);

  const clearMemoryCache = useCallback(() => {
    Alert.alert('Clear Memory Cache', 'This will clear locally cached memory entries.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await safeStorage.removeItem('agentos_memory_cache');
          Alert.alert('✅ Done', 'Memory cache cleared');
        },
      },
    ]);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B0F19' }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* App Header */}
      <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 8 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            backgroundColor: '#0EA5E9',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800' }}>A</Text>
        </View>
        <Text style={{ color: '#E5E7EB', fontSize: 22, fontWeight: '800' }}>AgentOS</Text>
        <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>v0.1.0 Alpha · Mobile Client</Text>
      </View>

      {/* Backend URL */}
      <Section title="Connection">
        {isEditing ? (
          <View style={{ padding: 12, gap: 8 }}>
            <TextInput
              style={{
                backgroundColor: '#121826',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: '#E5E7EB',
                fontSize: 14,
                borderWidth: 1,
                borderColor: '#1F2937',
              }}
              value={apiUrlInput}
              onChangeText={setApiUrlInput}
              placeholder="http://localhost:4000"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={saveApiUrl}
                style={{
                  flex: 1,
                  backgroundColor: '#0EA5E9',
                  borderRadius: 10,
                  padding: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Save</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#1F2937',
                  borderRadius: 10,
                  padding: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <SettingRow
            label="Backend URL"
            value={apiUrlInput || 'localhost:4000'}
            onPress={() => setIsEditing(true)}
          />
        )}
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <SettingRow
          label="Push Notifications"
          rightElement={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#1F2937', true: '#0EA5E955' }}
              thumbColor={notificationsEnabled ? '#0EA5E9' : '#6B7280'}
            />
          }
        />
      </Section>

      {/* Data */}
      <Section title="Data Management">
        <SettingRow label="Clear Chat History" onPress={clearChatHistory} danger />
        <SettingRow label="Clear Memory Cache" onPress={clearMemoryCache} danger />
      </Section>

      {/* About */}
      <Section title="About">
        <SettingRow label="Version" value="0.1.0" />
        <SettingRow label="Platform" value="Expo + Ollama" />
        <SettingRow label="License" value="MIT" />
      </Section>
    </ScrollView>
  );
}
