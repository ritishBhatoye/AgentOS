// ============================================================
// AgentOS — Complete Memory System
// Short-term + Long-term + Persistent memory
// ============================================================

import { v4 as uuid } from 'uuid';
import { SystemLogger } from '../utils/logger.js';
import { eventBus } from '../events/eventBus.js';

const logger = new SystemLogger('MemorySystem');

// ─── Types ─────────────────────────────────────────────────

export type MemoryType = 'conversation' | 'task' | 'fact' | 'embedding';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: string;
  expiresAt?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: string;
}

// ─── Short-Term Memory ────────────────────────────────────

class ShortTermMemory {
  private buffers: Map<string, ConversationTurn[]> = new Map();
  private readonly MAX_TURNS = 20;

  add(conversationId: string, turn: ConversationTurn): void {
    if (!this.buffers.has(conversationId)) {
      this.buffers.set(conversationId, []);
    }
    const buffer = this.buffers.get(conversationId)!;
    buffer.push(turn);

    // Keep last N turns
    if (buffer.length > this.MAX_TURNS) {
      buffer.splice(0, buffer.length - this.MAX_TURNS);
    }
  }

  get(conversationId: string): ConversationTurn[] {
    return this.buffers.get(conversationId) || [];
  }

  clear(conversationId: string): void {
    this.buffers.delete(conversationId);
  }

  getStats(): { conversations: number; totalTurns: number } {
    let totalTurns = 0;
    this.buffers.forEach(b => totalTurns += b.length);
    return { conversations: this.buffers.size, totalTurns };
  }
}

// ─── Long-Term Memory (Vector-like) ──────────────────────

class LongTermMemory {
  private entries: MemoryEntry[] = [];
  private readonly MAX_ENTRIES = 5000;

  async store(content: string, type: MemoryType, metadata: Record<string, unknown> = {}): Promise<string> {
    const id = uuid();
    const entry: MemoryEntry = {
      id,
      type,
      content,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.entries.push(entry);

    // Prune if too many
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries = this.entries.slice(-this.MAX_ENTRIES);
    }

    return id;
  }

  /**
   * Simple keyword-based search (upgradeable to vector search with Chroma)
   */
  search(query: string, topK = 5): MemoryEntry[] {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (queryWords.length === 0) return [];

    // Score each entry by keyword overlap
    const scored = this.entries.map(entry => {
      const contentLower = entry.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (contentLower.includes(word)) score++;
      }
      return { entry, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.entry);
  }

  getByType(type: MemoryType, limit = 20): MemoryEntry[] {
    return this.entries
      .filter(e => e.type === type)
      .slice(-limit);
  }

  getAll(limit = 50): MemoryEntry[] {
    return this.entries.slice(-limit);
  }

  getStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    this.entries.forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + 1;
    });
    return { total: this.entries.length, byType };
  }
}

// ─── Unified Memory System ────────────────────────────────

class MemorySystem {
  public shortTerm = new ShortTermMemory();
  public longTerm = new LongTermMemory();

  /**
   * Store a memory entry (auto-detects short-term vs long-term)
   */
  async store(type: MemoryType, content: string, metadata: Record<string, unknown> = {}): Promise<string> {
    const id = await this.longTerm.store(content, type, metadata);

    eventBus.emit('memory:stored', {
      id,
      type,
      contentPreview: content.substring(0, 100),
    });

    logger.info(`Memory stored: ${type}`, { id, size: content.length });
    return id;
  }

  /**
   * Search across all memory layers
   */
  async search(query: string, topK = 5): Promise<MemoryEntry[]> {
    return this.longTerm.search(query, topK);
  }

  /**
   * Add a conversation turn to short-term memory
   */
  addConversationTurn(conversationId: string, turn: ConversationTurn): void {
    this.shortTerm.add(conversationId, turn);
  }

  /**
   * Get recent conversation context
   */
  getConversationContext(conversationId: string): ConversationTurn[] {
    return this.shortTerm.get(conversationId);
  }

  /**
   * Get combined stats
   */
  getStats() {
    return {
      shortTerm: this.shortTerm.getStats(),
      longTerm: this.longTerm.getStats(),
    };
  }

  /**
   * Get all memory entries for dashboard display
   */
  getAllEntries(limit = 50): MemoryEntry[] {
    return this.longTerm.getAll(limit);
  }
}

export const memorySystem = new MemorySystem();
