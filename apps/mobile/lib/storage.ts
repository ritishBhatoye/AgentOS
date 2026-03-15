// ============================================================
// AgentOS Mobile — Safe AsyncStorage Wrapper
// Gracefully handles cases where native module is unavailable
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

class SafeStorage {
  private fallback: Map<string, string> = new Map();
  private nativeAvailable: boolean | null = null;

  private async isNativeAvailable(): Promise<boolean> {
    if (this.nativeAvailable !== null) return this.nativeAvailable;
    try {
      await AsyncStorage.getItem('__test__');
      this.nativeAvailable = true;
    } catch {
      this.nativeAvailable = false;
    }
    return this.nativeAvailable;
  }

  async getItem(key: string): Promise<string | null> {
    if (await this.isNativeAvailable()) {
      return AsyncStorage.getItem(key);
    }
    return this.fallback.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (await this.isNativeAvailable()) {
      return AsyncStorage.setItem(key, value);
    }
    this.fallback.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (await this.isNativeAvailable()) {
      return AsyncStorage.removeItem(key);
    }
    this.fallback.delete(key);
  }
}

export const safeStorage = new SafeStorage();
