// ============================================================
// AgentOS — SQLite Memory System
// ============================================================

import { SystemLogger } from '../utils/logger.js';
import { v4 as uuid } from 'uuid';

const logger = new SystemLogger('MemorySystem');

// For MVP, we use a simple in-memory cache that mirrors SQLite structure
// This allows us to scale to persistent storage later in Phase 5.

export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'task' | 'embedding';
  content: string;
  metadata: any;
  createdAt: string;
}

class MemorySystem {
  private memCache: Map<string, MemoryEntry> = new Map();

  async store(type: 'conversation' | 'task' | 'embedding', content: string, metadata: any = {}) {
    const id = uuid();
    const entry: MemoryEntry = {
      id,
      type,
      content,
      metadata,
      createdAt: new Date().toISOString(),
    };
    
    this.memCache.set(id, entry);
    logger.info(`Memory stored: ${type} - ${id}`);
    return id;
  }

  async retrieve(query: string): Promise<MemoryEntry[]> {
    // Basic keyword search for now. Vector search comes in late Phase 5.
    const results = Array.from(this.memCache.values())
      .filter(entry => entry.content.toLowerCase().includes(query.toLowerCase()));
    
    return results;
  }

  async getConversationHistory(limit = 10): Promise<MemoryEntry[]> {
    return Array.from(this.memCache.values())
      .filter(e => e.type === 'conversation')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const memorySystem = new MemorySystem();
