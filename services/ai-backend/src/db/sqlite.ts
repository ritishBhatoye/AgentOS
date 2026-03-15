// ============================================================
// AgentOS — SQLite Database Layer
// Persistent storage with WAL mode for production performance
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('SQLite');

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'agentos.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const dir = path.dirname(DB_PATH);
    const fs = require('fs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    logger.info(`Database opened at ${DB_PATH}`);
  }
  return db;
}

// ─── Migration Runner ──────────────────────────────────────

export function runMigrations(): void {
  const db = getDb();

  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map((r: any) => r.name),
  );

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.name)) {
      logger.info(`Running migration: ${migration.name}`);
      db.exec(migration.sql);
      db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
    }
  }

  logger.info(`Database ready (${MIGRATIONS.length} migrations, ${applied.size} already applied)`);
}

// ─── Migrations ────────────────────────────────────────────

const MIGRATIONS = [
  {
    name: '001_users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        avatar_url TEXT,
        provider TEXT,
        provider_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '002_tasks',
    sql: `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 0,
        assigned_to TEXT,
        result TEXT,
        error TEXT,
        parent_task_id TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
    `,
  },
  {
    name: '003_runs',
    sql: `
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id),
        agent_id TEXT NOT NULL,
        model TEXT,
        prompt TEXT,
        plan TEXT,
        tools_used TEXT,
        output TEXT,
        error TEXT,
        success INTEGER DEFAULT 0,
        duration_ms INTEGER,
        token_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_runs_agent ON runs(agent_id);
      CREATE INDEX IF NOT EXISTS idx_runs_task ON runs(task_id);
    `,
  },
  {
    name: '004_logs',
    sql: `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT,
        source TEXT,
        message TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source);
    `,
  },
  {
    name: '005_jobs',
    sql: `
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'queued',
        progress REAL DEFAULT 0,
        checkpoint TEXT,
        result TEXT,
        error TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '006_plugins',
    sql: `
      CREATE TABLE IF NOT EXISTS plugins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        version TEXT,
        description TEXT,
        entry_point TEXT,
        enabled INTEGER DEFAULT 1,
        config TEXT,
        installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '007_repositories',
    sql: `
      CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        name TEXT,
        local_path TEXT,
        last_scanned_at DATETIME,
        scan_result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '008_knowledge_graph',
    sql: `
      CREATE TABLE IF NOT EXISTS knowledge_nodes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        file_path TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kn_type ON knowledge_nodes(type);
      CREATE INDEX IF NOT EXISTS idx_kn_name ON knowledge_nodes(name);

      CREATE TABLE IF NOT EXISTS knowledge_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        target_id TEXT REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        relationship TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_ke_source ON knowledge_edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_ke_target ON knowledge_edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_ke_rel ON knowledge_edges(relationship);
    `,
  },
  {
    name: '009_metrics',
    sql: `
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        labels TEXT,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
      CREATE INDEX IF NOT EXISTS idx_metrics_time ON metrics(recorded_at);
    `,
  },
  {
    name: '010_codegraph',
    sql: `
      CREATE TABLE IF NOT EXISTS codegraph_files (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        language TEXT,
        line_count INTEGER,
        complexity REAL,
        scan_id TEXT,
        metadata TEXT,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_cg_path ON codegraph_files(path);

      CREATE TABLE IF NOT EXISTS codegraph_symbols (
        id TEXT PRIMARY KEY,
        file_id TEXT REFERENCES codegraph_files(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        line_number INTEGER,
        is_exported INTEGER DEFAULT 0,
        is_async INTEGER DEFAULT 0,
        params TEXT,
        return_type TEXT,
        metadata TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_cgs_file ON codegraph_symbols(file_id);
      CREATE INDEX IF NOT EXISTS idx_cgs_name ON codegraph_symbols(name);
      CREATE INDEX IF NOT EXISTS idx_cgs_type ON codegraph_symbols(type);

      CREATE TABLE IF NOT EXISTS codegraph_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT REFERENCES codegraph_files(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        specifiers TEXT,
        is_relative INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_cgi_file ON codegraph_imports(file_id);
    `,
  },
];

// ─── Helper: Record a metric ───────────────────────────────

export function recordMetric(name: string, value: number, labels?: Record<string, string>): void {
  try {
    getDb().prepare(
      'INSERT INTO metrics (metric_name, metric_value, labels) VALUES (?, ?, ?)',
    ).run(name, value, labels ? JSON.stringify(labels) : null);
  } catch {}
}

// ─── Helper: Record a run ──────────────────────────────────

export function recordRun(run: {
  id: string;
  taskId?: string;
  agentId: string;
  model?: string;
  prompt?: string;
  plan?: string;
  toolsUsed?: string[];
  output?: string;
  error?: string;
  success: boolean;
  durationMs: number;
}): void {
  try {
    getDb().prepare(`
      INSERT INTO runs (id, task_id, agent_id, model, prompt, plan, tools_used, output, error, success, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      run.id,
      run.taskId || null,
      run.agentId,
      run.model || null,
      run.prompt || null,
      run.plan || null,
      run.toolsUsed ? JSON.stringify(run.toolsUsed) : null,
      run.output || null,
      run.error || null,
      run.success ? 1 : 0,
      run.durationMs,
    );
  } catch {}
}

export function closeDb(): void {
  if (db) {
    db.close();
    logger.info('Database closed');
  }
}
