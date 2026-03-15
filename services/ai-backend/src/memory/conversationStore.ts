// ============================================================
// AgentOS — In-Memory Conversation Store
// ============================================================

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  taskId?: string;
  taskStatus?: string;
  timestamp: string;
}

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
}

class ConversationStore {
  private conversations: Map<string, StoredConversation> = new Map();

  getOrCreate(id: string): StoredConversation {
    let conv = this.conversations.get(id);
    if (!conv) {
      conv = {
        id,
        title: 'New Conversation',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.conversations.set(id, conv);
    }
    return conv;
  }

  get(id: string): StoredConversation | undefined {
    return this.conversations.get(id);
  }

  listAll(): StoredConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  delete(id: string): boolean {
    return this.conversations.delete(id);
  }

  updateTitle(id: string, title: string): void {
    const conv = this.conversations.get(id);
    if (conv) {
      conv.title = title;
      conv.updatedAt = new Date().toISOString();
    }
  }

  getStats(): { total: number; totalMessages: number } {
    let totalMessages = 0;
    this.conversations.forEach(c => {
      totalMessages += c.messages.length;
    });
    return { total: this.conversations.size, totalMessages };
  }
}

export const conversationStore = new ConversationStore();
