// ============================================================
// AgentOS Mobile — Icon System (SVG-free, Emoji + Text based)
// ============================================================

import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

const ICON_MAP: Record<string, string> = {
  chat: '💬',
  agents: '🤖',
  tasks: '📋',
  memory: '🧬',
  logs: '📝',
  settings: '⚙️',
  notifications: '🔔',
  send: '↑',
  microphone: '🎤',
  refresh: '↻',
  menu: '☰',
  home: '🏠',
  planner: '🧠',
  coding: '💻',
  research: '🔍',
  execution: '⚡',
  search: '🔎',
  clear: '✕',
  back: '←',
  check: '✓',
  warning: '⚠️',
  error: '❌',
  success: '✅',
  pending: '⏳',
  running: '🔄',
  tool: '🔧',
  thought: '💭',
  star: '⭐',
};

interface AgentIconProps {
  name: keyof typeof ICON_MAP | string;
  size?: number;
  color?: string;
}

export function AgentIcon({ name, size = 24, color }: AgentIconProps) {
  const icon = useMemo(() => ICON_MAP[name] || '●', [name]);

  return (
    <Text
      style={{ fontSize: size, color, lineHeight: size * 1.2, textAlign: 'center' }}
      accessibilityLabel={name}
    >
      {icon}
    </Text>
  );
}

interface IconBadgeProps {
  name: string;
  size?: number;
  bgColor?: string;
}

export function IconBadge({ name, size = 40, bgColor = '#0EA5E922' }: IconBadgeProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AgentIcon name={name} size={size * 0.5} />
    </View>
  );
}
