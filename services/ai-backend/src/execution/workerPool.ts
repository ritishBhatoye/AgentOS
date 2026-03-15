// ============================================================
// AgentOS — Execution Sandbox & Worker Pool
// Isolated task execution with resource limits
// ============================================================

import { fork, ChildProcess } from 'child_process';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SystemLogger } from '../utils/logger.js';
import { eventBus } from '../events/eventBus.js';

const logger = new SystemLogger('WorkerPool');

// ─── Sandbox ───────────────────────────────────────────────

export interface SandboxConfig {
  timeout: number;       // ms
  maxMemory: number;     // bytes
  workDir?: string;
  networkAccess: boolean;
}

export interface SandboxResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

export async function executeSandboxed(
  code: string,
  config: Partial<SandboxConfig> = {},
): Promise<SandboxResult> {
  const timeout = config.timeout || 30000;
  const workDir = config.workDir || path.join(os.tmpdir(), `agentos-sandbox-${uuid()}`);
  const startTime = Date.now();

  // Create isolated workspace
  fs.mkdirSync(workDir, { recursive: true });
  const scriptPath = path.join(workDir, 'script.js');
  fs.writeFileSync(scriptPath, code);

  return new Promise<SandboxResult>((resolve) => {
    const child = fork(scriptPath, [], {
      cwd: workDir,
      timeout,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, NODE_ENV: 'sandbox' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => { stdout += data.toString(); });
    child.stderr?.on('data', (data) => { stderr += data.toString(); });

    child.on('exit', (code) => {
      const duration = Date.now() - startTime;
      cleanup(workDir);
      resolve({
        success: code === 0,
        output: stdout || 'No output',
        error: stderr || undefined,
        duration,
      });
    });

    child.on('error', (err) => {
      const duration = Date.now() - startTime;
      cleanup(workDir);
      resolve({
        success: false,
        output: '',
        error: err.message,
        duration,
      });
    });

    // Force kill after timeout
    setTimeout(() => {
      child.kill('SIGKILL');
    }, timeout + 1000);
  });
}

function cleanup(dir: string): void {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
}

// ─── Worker Pool ───────────────────────────────────────────

export type WorkerTaskFn = () => Promise<any>;

interface WorkerJob {
  id: string;
  fn: WorkerTaskFn;
  priority: number;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  createdAt: number;
}

export interface PoolStatus {
  maxWorkers: number;
  activeWorkers: number;
  queuedJobs: number;
  completedJobs: number;
  failedJobs: number;
}

class TaskWorkerPool {
  private maxWorkers: number;
  private activeCount = 0;
  private queue: WorkerJob[] = [];
  private completedCount = 0;
  private failedCount = 0;

  constructor(maxWorkers?: number) {
    this.maxWorkers = maxWorkers || Math.max(os.cpus().length - 1, 2);
    logger.info(`Worker pool initialized (max: ${this.maxWorkers} workers)`);
  }

  async submit<T>(fn: WorkerTaskFn, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const job: WorkerJob = {
        id: uuid(),
        fn,
        priority,
        resolve,
        reject,
        createdAt: Date.now(),
      };

      // Insert by priority (higher first)
      const idx = this.queue.findIndex(j => j.priority < priority);
      if (idx === -1) this.queue.push(job);
      else this.queue.splice(idx, 0, job);

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (this.activeCount < this.maxWorkers && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.activeCount++;

      eventBus.emit('system:log', { message: `Worker executing job ${job.id}`, workers: this.activeCount });

      job.fn()
        .then((result) => {
          this.completedCount++;
          job.resolve(result);
        })
        .catch((error) => {
          this.failedCount++;
          job.reject(error);
        })
        .finally(() => {
          this.activeCount--;
          this.processQueue();
        });
    }
  }

  getStatus(): PoolStatus {
    return {
      maxWorkers: this.maxWorkers,
      activeWorkers: this.activeCount,
      queuedJobs: this.queue.length,
      completedJobs: this.completedCount,
      failedJobs: this.failedCount,
    };
  }
}

export const workerPool = new TaskWorkerPool();

// ─── Job Runner (Long-running jobs) ───────────────────────

export interface Job {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  checkpoint?: any;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

class JobRunner {
  private activeJobs: Map<string, { cancel: () => void }> = new Map();

  async create(name: string, executeFn: (job: Job, updateProgress: (p: number, checkpoint?: any) => void) => Promise<any>): Promise<Job> {
    const job: Job = {
      id: uuid(),
      name,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in SQLite
    const { getDb } = await import('../db/sqlite.js');
    getDb().prepare(`
      INSERT INTO jobs (id, name, status, progress, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(job.id, job.name, job.status, job.progress, job.createdAt, job.updatedAt);

    eventBus.emit('system:log', { message: `Job created: ${name}`, jobId: job.id });

    // Execute asynchronously
    let cancelled = false;
    this.activeJobs.set(job.id, { cancel: () => { cancelled = true; } });

    const updateProgress = (progress: number, checkpoint?: any) => {
      if (cancelled) throw new Error('Job cancelled');
      const now = new Date().toISOString();
      getDb().prepare('UPDATE jobs SET progress = ?, checkpoint = ?, updated_at = ? WHERE id = ?')
        .run(progress, checkpoint ? JSON.stringify(checkpoint) : null, now, job.id);
      eventBus.emit('system:log', { message: `Job ${job.id} progress: ${progress}%`, jobId: job.id });
    };

    // Run in background
    (async () => {
      try {
        getDb().prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run('running', new Date().toISOString(), job.id);
        const result = await executeFn(job, updateProgress);
        getDb().prepare('UPDATE jobs SET status = ?, result = ?, progress = 100, updated_at = ? WHERE id = ?')
          .run('completed', JSON.stringify(result), new Date().toISOString(), job.id);
        eventBus.emit('system:log', { message: `Job ${job.id} completed`, jobId: job.id });
      } catch (err) {
        getDb().prepare('UPDATE jobs SET status = ?, error = ?, updated_at = ? WHERE id = ?')
          .run('failed', String(err), new Date().toISOString(), job.id);
        eventBus.emit('system:log', { message: `Job ${job.id} failed: ${err}`, jobId: job.id });
      } finally {
        this.activeJobs.delete(job.id);
      }
    })();

    return job;
  }

  getJob(id: string): Job | null {
    const { getDb } = require('../db/sqlite.js');
    const row: any = getDb().prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!row) return null;
    return {
      id: row.id, name: row.name, status: row.status, progress: row.progress,
      checkpoint: row.checkpoint ? JSON.parse(row.checkpoint) : undefined,
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error, createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }

  listJobs(): Job[] {
    const { getDb } = require('../db/sqlite.js');
    return getDb().prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50').all().map((row: any) => ({
      id: row.id, name: row.name, status: row.status, progress: row.progress,
      error: row.error, createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  }

  cancel(id: string): boolean {
    const active = this.activeJobs.get(id);
    if (active) { active.cancel(); return true; }
    return false;
  }
}

export const jobRunner = new JobRunner();
