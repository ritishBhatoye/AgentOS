// ============================================================
// AgentOS — System Logger
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

// In-memory log store for dashboard consumption
const logStore: LogEntry[] = [];
const MAX_LOGS = 1000;

export class SystemLogger {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      source: this.source,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Store in memory
    logStore.push(entry);
    if (logStore.length > MAX_LOGS) {
      logStore.shift();
    }

    // Console output with colors
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',  // cyan
      info: '\x1b[32m',   // green
      warn: '\x1b[33m',   // yellow
      error: '\x1b[31m',  // red
    };
    const reset = '\x1b[0m';
    const color = colors[level];

    console.log(
      `${color}[${level.toUpperCase()}]${reset} [${this.source}] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    );
  }

  static getLogs(limit = 100, level?: LogLevel): LogEntry[] {
    let filtered = logStore;
    if (level) {
      filtered = logStore.filter(l => l.level === level);
    }
    return filtered.slice(-limit);
  }

  static clearLogs(): void {
    logStore.length = 0;
  }
}
