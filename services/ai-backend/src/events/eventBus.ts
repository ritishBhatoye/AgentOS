// ============================================================
// AgentOS — SSE Event Bus
// Real-time server-sent events for dashboard integration
// ============================================================

import { Response } from 'express';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('EventBus');

export type EventType =
  | 'agent:status'
  | 'agent:thought'
  | 'agent:decision'
  | 'agent:tool_call'
  | 'agent:tool_result'
  | 'agent:output'
  | 'task:created'
  | 'task:updated'
  | 'task:completed'
  | 'task:failed'
  | 'system:log'
  | 'system:health'
  | 'memory:stored'
  | 'chat:message';

export interface AgentEvent {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: string;
}

class EventBus {
  private clients: Set<Response> = new Set();
  private eventHistory: AgentEvent[] = [];
  private readonly MAX_HISTORY = 500;

  /**
   * Register a new SSE client
   */
  addClient(res: Response): void {
    this.clients.add(res);
    logger.info(`SSE client connected (total: ${this.clients.size})`);

    res.on('close', () => {
      this.clients.delete(res);
      logger.info(`SSE client disconnected (total: ${this.clients.size})`);
    });

    // Send recent events to new client
    const recent = this.eventHistory.slice(-20);
    for (const event of recent) {
      this.sendToClient(res, event);
    }
  }

  /**
   * Emit an event to all connected SSE clients
   */
  emit(type: EventType, data: Record<string, unknown>): void {
    const event: AgentEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory = this.eventHistory.slice(-this.MAX_HISTORY);
    }

    // Broadcast to all clients
    for (const client of this.clients) {
      this.sendToClient(client, event);
    }
  }

  private sendToClient(res: Response, event: AgentEvent): void {
    try {
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // Client likely disconnected
      this.clients.delete(res);
    }
  }

  /**
   * Get recent events
   */
  getHistory(limit = 100, type?: EventType): AgentEvent[] {
    let events = this.eventHistory;
    if (type) events = events.filter(e => e.type === type);
    return events.slice(-limit);
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

export const eventBus = new EventBus();
