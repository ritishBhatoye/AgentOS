// ============================================================
// AgentOS Mobile — Root Layout
// ============================================================

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const AGENTOS_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#7c3aed',
    background: '#0f0f14',
    card: '#16161e',
    text: '#e2e8f0',
    border: '#1e1e2a',
    notification: '#7c3aed',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onLayoutReady = useCallback(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (error) throw error;
  if (!loaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutReady}>
      <ThemeProvider value={AGENTOS_THEME}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="task-detail"
            options={{
              title: 'Task Detail',
              presentation: 'modal',
              headerStyle: { backgroundColor: '#16161e' },
              headerTintColor: '#e2e8f0',
            }}
          />
        </Stack>
      </ThemeProvider>
    </View>
  );
}
