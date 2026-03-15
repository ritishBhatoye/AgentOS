import React from 'react';
import { View, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const GlassHeader = ({ title, subtitle, leftElement, rightElement }: GlassHeaderProps) => {
  return (
    <View style={{ width: '100%', height: 100, position: 'absolute', top: 0, zIndex: 10 }}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={{ flex: 1, paddingTop: 48, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {leftElement || <View style={{ width: 40 }} />}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#E5E7EB', fontSize: 17, fontWeight: '700' }}>{title}</Text>
              {subtitle && <Text style={{ color: '#6B7280', fontSize: 11 }}>{subtitle}</Text>}
            </View>
            {rightElement || <View style={{ width: 40 }} />}
          </View>
        </BlurView>
      ) : (
        <View style={{ flex: 1, backgroundColor: '#0B0F19ee', paddingTop: 40, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937' }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {leftElement || <View style={{ width: 40 }} />}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#E5E7EB', fontSize: 17, fontWeight: '700' }}>{title}</Text>
              {subtitle && <Text style={{ color: '#6B7280', fontSize: 11 }}>{subtitle}</Text>}
            </View>
            {rightElement || <View style={{ width: 40 }} />}
          </View>
        </View>
      )}
    </View>
  );
};
