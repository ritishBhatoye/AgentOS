// ============================================================
// AgentOS Mobile — Not Found Screen
// ============================================================

import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, backgroundColor: '#0f0f14', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
        <Text style={{ color: '#e2e8f0', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
          Screen Not Found
        </Text>
        <Link href="/(tabs)/chat" style={{ color: '#7c3aed', fontSize: 15, fontWeight: '600' }}>
          Go to Chat →
        </Link>
      </View>
    </>
  );
}
