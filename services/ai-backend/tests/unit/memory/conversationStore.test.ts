import { describe, it, expect, beforeEach } from "vitest";
import { conversationStore } from "@/memory/conversationStore";

describe("Conversation Store - CS-001: Create conversation", () => {
  beforeEach(() => {
    conversationStore.listAll().forEach((c) => conversationStore.delete(c.id));
  });

  it("should create a new conversation with empty messages", () => {
    const testId = "test-conversation-123";
    const conversation = conversationStore.getOrCreate(testId);

    expect(conversation.id).toBe(testId);
    expect(conversation.messages).toHaveLength(0);
    expect(conversation.title).toBe("New Conversation");
    expect(conversation.createdAt).toBeDefined();
    expect(conversation.updatedAt).toBeDefined();
  });
});

describe("Conversation Store - CS-002: Get existing conversation", () => {
  beforeEach(() => {
    conversationStore.listAll().forEach((c) => conversationStore.delete(c.id));
  });

  it("should retrieve an existing conversation", () => {
    const testId = "test-conversation-456";
    conversationStore.getOrCreate(testId);

    const conversation = conversationStore.get(testId);
    expect(conversation).toBeDefined();
    expect(conversation?.id).toBe(testId);
  });

  it("should return undefined for non-existent conversation", () => {
    const conversation = conversationStore.get("non-existent-id");
    expect(conversation).toBeUndefined();
  });
});

describe("Conversation Store - CS-003: List all conversations", () => {
  beforeEach(() => {
    conversationStore.listAll().forEach((c) => conversationStore.delete(c.id));
  });

  it("should return conversations sorted by updatedAt DESC", () => {
    const conv1 = conversationStore.getOrCreate("conv-1");
    conv1.messages.push({
      id: "1",
      role: "user",
      content: "Hello",
      timestamp: new Date().toISOString(),
    });
    conv1.updatedAt = new Date(Date.now() - 10000).toISOString();

    const conv2 = conversationStore.getOrCreate("conv-2");
    conv2.messages.push({
      id: "2",
      role: "user",
      content: "Hi",
      timestamp: new Date().toISOString(),
    });
    conv2.updatedAt = new Date().toISOString();

    const conversations = conversationStore.listAll();
    expect(conversations).toHaveLength(2);
    expect(conversations[0].id).toBe("conv-2");
    expect(conversations[1].id).toBe("conv-1");
  });
});

describe("Conversation Store - Additional tests", () => {
  beforeEach(() => {
    conversationStore.listAll().forEach((c) => conversationStore.delete(c.id));
  });

  it("MS-001: should store conversation entries and allow retrieval", () => {
    const conv = conversationStore.getOrCreate("test-conv");
    conv.messages.push({
      id: "msg-1",
      role: "user",
      content: "Hello there!",
      timestamp: new Date().toISOString(),
    });

    const retrieved = conversationStore.get("test-conv");
    expect(retrieved?.messages).toHaveLength(1);
    expect(retrieved?.messages[0].content).toBe("Hello there!");
  });

  it("MS-002: should handle conversation history with multiple messages", () => {
    const conv = conversationStore.getOrCreate("test-conv-2");
    for (let i = 0; i < 5; i++) {
      conv.messages.push({
        id: `msg-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      });
    }

    const retrieved = conversationStore.get("test-conv-2");
    expect(retrieved?.messages).toHaveLength(5);
  });

  it("should update conversation title", () => {
    const conv = conversationStore.getOrCreate("test-conv-3");
    conversationStore.updateTitle("test-conv-3", "My Updated Title");

    const retrieved = conversationStore.get("test-conv-3");
    expect(retrieved?.title).toBe("My Updated Title");
  });

  it("should delete conversation", () => {
    conversationStore.getOrCreate("test-conv-4");
    const deleted = conversationStore.delete("test-conv-4");

    expect(deleted).toBe(true);
    expect(conversationStore.get("test-conv-4")).toBeUndefined();
  });

  it("should return accurate stats", () => {
    conversationStore.getOrCreate("conv-stat-1");
    const conv2 = conversationStore.getOrCreate("conv-stat-2");
    conv2.messages.push({
      id: "1",
      role: "user",
      content: "Hello",
      timestamp: new Date().toISOString(),
    });
    conv2.messages.push({
      id: "2",
      role: "assistant",
      content: "Hi there",
      timestamp: new Date().toISOString(),
    });

    const stats = conversationStore.getStats();
    expect(stats.total).toBe(2);
    expect(stats.totalMessages).toBe(2);
  });
});
