// ============================================================
// AgentOS — Code Executor Tool (Sandboxed)
// Runs JS/TS code safely using Node.js vm module
// ============================================================

import { createContext, Script, runInNewContext } from 'node:vm';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('CodeExecutor');

const EXECUTION_TIMEOUT_MS = 5000; // 5 second max
const MAX_OUTPUT_LENGTH = 10000;   // truncate output

export interface CodeExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

/**
 * Execute JavaScript code in a sandboxed VM context.
 * No filesystem, network, or process access.
 */
function executeCode(code: string): CodeExecutionResult {
  const startTime = Date.now();
  const logs: string[] = [];

  // Build a safe sandbox with only console.log
  const sandbox = {
    console: {
      log: (...args: unknown[]) => {
        logs.push(args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
          catch { return String(a); }
        }).join(' '));
      },
      error: (...args: unknown[]) => logs.push(`[ERROR] ${args.map(String).join(' ')}`),
      warn: (...args: unknown[]) => logs.push(`[WARN] ${args.map(String).join(' ')}`),
    },
    JSON,
    Math,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    RegExp,
    Error,
    Promise,
    setTimeout: undefined,   // block
    setInterval: undefined,  // block
    fetch: undefined,        // block
    require: undefined,      // block
    process: undefined,      // block
    __dirname: undefined,    // block
    __filename: undefined,   // block
  };

  try {
    const context = createContext(sandbox);
    const script = new Script(code, { filename: 'agent-code.js' });

    const result = script.runInContext(context, {
      timeout: EXECUTION_TIMEOUT_MS,
    });

    // If the code returned a value, add it to logs
    if (result !== undefined) {
      const resultStr = typeof result === 'object'
        ? JSON.stringify(result, null, 2)
        : String(result);
      logs.push(resultStr);
    }

    const output = logs.join('\n').substring(0, MAX_OUTPUT_LENGTH);
    const duration = Date.now() - startTime;

    logger.info('Code executed successfully', { duration: `${duration}ms`, outputLength: output.length });

    return { success: true, output, duration };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const errorMessage = err.message || String(err);

    // Include any output captured before the error
    const partialOutput = logs.length > 0 ? logs.join('\n') + '\n\n' : '';

    logger.error('Code execution failed', { error: errorMessage, duration: `${duration}ms` });

    return {
      success: false,
      output: partialOutput,
      error: errorMessage,
      duration,
    };
  }
}

// ─── Tool Definition ──────────────────────────────────────

export const codeExecutorTool = {
  name: 'code_executor',
  description: 'Execute JavaScript code in a safe sandboxed environment. Returns stdout output and any errors. No filesystem or network access.',
  parameters: {
    code: { type: 'string', description: 'JavaScript code to execute', required: true },
    language: { type: 'string', description: 'Language (only "javascript" supported)', required: false },
  },
  execute: async (params: { code: string }): Promise<CodeExecutionResult> => {
    logger.info('Executing code snippet');
    return executeCode(params.code);
  },
};
