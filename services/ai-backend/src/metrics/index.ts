// ============================================================
// AgentOS — Metrics Collector
// System observability: agent usage, task latency, tool/model tracking
// ============================================================

import { getDb, recordMetric } from '../db/sqlite.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('Metrics');

// ─── In-memory counters (fast path) ───────────────────────

const counters: Map<string, number> = new Map();
const histograms: Map<string, number[]> = new Map();

export function incrementCounter(name: string, labels?: Record<string, string>): void {
  const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
  counters.set(key, (counters.get(key) || 0) + 1);
  recordMetric(name, (counters.get(key) || 0), labels);
}

export function recordLatency(name: string, durationMs: number, labels?: Record<string, string>): void {
  const key = labels ? `${name}:${JSON.stringify(labels)}` : name;
  const hist = histograms.get(key) || [];
  hist.push(durationMs);
  if (hist.length > 1000) hist.splice(0, 500); // Keep last 500
  histograms.set(key, hist);
  recordMetric(name, durationMs, labels);
}

// ─── Query Functions ──────────────────────────────────────

export function getMetricsSummary(): {
  agents: Record<string, number>;
  tools: Record<string, number>;
  models: Record<string, number>;
  taskLatency: { p50: number; p95: number; p99: number; avg: number };
  errorRate: number;
  totalRuns: number;
} {
  const db = getDb();

  // Agent usage from runs table
  const agentUsage: Record<string, number> = {};
  for (const row of db.prepare('SELECT agent_id, COUNT(*) as c FROM runs GROUP BY agent_id').all() as any[]) {
    agentUsage[row.agent_id] = row.c;
  }

  // Model usage
  const modelUsage: Record<string, number> = {};
  for (const row of db.prepare('SELECT model, COUNT(*) as c FROM runs WHERE model IS NOT NULL GROUP BY model').all() as any[]) {
    modelUsage[row.model] = row.c;
  }

  // Tool usage from runs
  const toolUsage: Record<string, number> = {};
  for (const row of db.prepare('SELECT tools_used FROM runs WHERE tools_used IS NOT NULL').all() as any[]) {
    try {
      const tools = JSON.parse(row.tools_used);
      for (const t of tools) { toolUsage[t] = (toolUsage[t] || 0) + 1; }
    } catch {}
  }

  // Task latency
  const latencies = db.prepare('SELECT duration_ms FROM runs WHERE duration_ms IS NOT NULL ORDER BY duration_ms').all().map((r: any) => r.duration_ms);
  const percentile = (arr: number[], p: number) => arr.length > 0 ? arr[Math.floor(arr.length * p / 100)] : 0;
  const avg = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  // Error rate
  const totalRuns = (db.prepare('SELECT COUNT(*) as c FROM runs').get() as any).c;
  const failedRuns = (db.prepare('SELECT COUNT(*) as c FROM runs WHERE success = 0').get() as any).c;
  const errorRate = totalRuns > 0 ? failedRuns / totalRuns : 0;

  return {
    agents: agentUsage,
    tools: toolUsage,
    models: modelUsage,
    taskLatency: {
      p50: percentile(latencies, 50),
      p95: percentile(latencies, 95),
      p99: percentile(latencies, 99),
      avg: Math.round(avg),
    },
    errorRate: Math.round(errorRate * 10000) / 100,
    totalRuns,
  };
}

export function getMetricsTimeline(hours = 24): any[] {
  const db = getDb();
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  return db.prepare(`
    SELECT 
      strftime('%Y-%m-%dT%H:00:00', created_at) as hour,
      COUNT(*) as runs,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
      AVG(duration_ms) as avg_latency
    FROM runs 
    WHERE created_at >= ?
    GROUP BY hour
    ORDER BY hour
  `).all(since);
}
