// ============================================================
// AgentOS Mobile — AI Chat Screen
// ============================================================

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useChat, ChatMessage } from '../../hooks/useChat';
import { AgentIcon } from '../../components/icons/AgentIcon';
import { AnimateEntrance } from '../../components/AnimateEntrance';
import { GlassHeader } from '../../components/GlassHeader';
import { MotiView, AnimatePresence } from 'moti';
import { View as MotiPlainView } from 'moti';

// ─── Message Bubble ────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <AnimateEntrance initialY={20} duration={400}>
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '82%',
          marginVertical: 4,
          marginHorizontal: 12,
        }}
      >
        <View
          style={{
            backgroundColor: isUser ? '#7c3aed' : '#1e1e2a',
            borderRadius: 16,
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: isUser ? '#9061f9' : '#2a2a3a',
          }}
        >
          <Text style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 22 }}>
            {message.content}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            marginTop: 4,
            paddingHorizontal: 4,
            gap: 6,
          }}
        >
          {message.model && (
            <View
              style={{
                backgroundColor: '#7c3aed22',
                borderRadius: 8,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '600' }}>
                {message.model}
              </Text>
            </View>
          )}
          <Text style={{ color: '#64748b', fontSize: 10 }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </AnimateEntrance>
  );
}

// ─── Empty State ───────────────────────────────────────────

function EmptyChat() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <AnimateEntrance delay={200} initialScale={0.5}>
        <Text style={{ fontSize: 64, marginBottom: 24 }}>💬</Text>
      </AnimateEntrance>
      <AnimateEntrance delay={400}>
        <Text style={{ color: '#e2e8f0', fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' }}>
          AgentOS Intelligence
        </Text>
      </AnimateEntrance>
      <AnimateEntrance delay={600}>
        <Text style={{ color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          Your message is routed to the best AI model automatically. Try asking it to write code, research a topic, or plan a project.
        </Text>
      </AnimateEntrance>
    </View>
  );
}

// ─── Chat Screen ───────────────────────────────────────────

export default function ChatScreen() {
  const { messages, isLoading, send, loadCachedMessages } = useChat();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const hasLoaded = useRef(false);

  // Load cached messages on first render
  const initCache = useCallback(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      loadCachedMessages();
    }
  }, [loadCachedMessages]);
  initCache();

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    send(input.trim());
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, send]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f14' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <GlassHeader 
        title="Intelligence" 
        subtitle={isLoading ? 'Agent is thinking...' : 'Model: Llama 3.2'} 
      />

      {messages.length === 0 ? (
        <EmptyChat />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingVertical: 110 }} // Account for glass header
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 34 : 12,
          backgroundColor: '#16161e',
          borderTopWidth: 1,
          borderTopColor: '#1e1e2a',
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#1a1a24',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: '#e2e8f0',
            fontSize: 15,
            maxHeight: 100,
            borderWidth: 1,
            borderColor: '#2a2a3a',
          }}
          value={input}
          onChangeText={setInput}
          placeholder="Message AgentOS..."
          placeholderTextColor="#64748b"
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isLoading}
        />
        <Pressable
          onPress={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <MotiView
            animate={{
              scale: input.trim() ? 1 : 0.9,
              backgroundColor: input.trim() ? '#7c3aed' : '#2a2a3a',
            }}
            transition={{ type: 'spring', damping: 15 }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <AnimatePresence exitBeforeEnter>
              {isLoading ? (
                <MotiView
                  key="loading"
                  from={{ opacity: 0, rotate: '0deg' }}
                  animate={{ opacity: 1, rotate: '360deg' }}
                  exit={{ opacity: 0 }}
                  transition={{ loop: true, type: 'timing', duration: 1000 }}
                >
                  <ActivityIndicator size="small" color="#e2e8f0" />
                </MotiView>
              ) : (
                <MotiView
                  key="send"
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 }}>↑</Text>
                </MotiView>
              )}
            </AnimatePresence>
          </MotiView>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
