// ============================================================
// AgentOS — File System Tool
// Restricted file operations within workspace only
// ============================================================

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('FileSystemTool');

// Workspace root — agents can only access files within this directory
const WORKSPACE_ROOT = resolve(process.cwd(), 'workspace');

// Ensure workspace directory exists
if (!existsSync(WORKSPACE_ROOT)) {
  mkdirSync(WORKSPACE_ROOT, { recursive: true });
}

/**
 * Validate that a path is within the workspace (prevent path traversal)
 */
function validatePath(filePath: string): string {
  const resolved = resolve(WORKSPACE_ROOT, filePath);
  const rel = relative(WORKSPACE_ROOT, resolved);

  if (rel.startsWith('..') || resolve(resolved) !== resolved.replace(/\/$/, '')) {
    throw new Error(`Access denied: path "${filePath}" is outside the workspace`);
  }

  return resolved;
}

/**
 * Read a file from the workspace
 */
function readFile(filePath: string): { success: boolean; content?: string; error?: string } {
  try {
    const resolved = validatePath(filePath);
    if (!existsSync(resolved)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    const content = readFileSync(resolved, 'utf-8');
    logger.info(`File read: ${filePath}`, { size: content.length });
    return { success: true, content };
  } catch (err: any) {
    logger.error(`File read failed: ${filePath}`, { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * Write a file to the workspace
 */
function writeFile(filePath: string, content: string): { success: boolean; path?: string; error?: string } {
  try {
    const resolved = validatePath(filePath);
    // Create parent dirs if needed
    const dir = resolve(resolved, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(resolved, content, 'utf-8');
    logger.info(`File written: ${filePath}`, { size: content.length });
    return { success: true, path: filePath };
  } catch (err: any) {
    logger.error(`File write failed: ${filePath}`, { error: err.message });
    return { success: false, error: err.message };
  }
}

/**
 * List files in a workspace directory
 */
function listFiles(dirPath = '.'): { success: boolean; files?: Array<{ name: string; type: string; size: number }>; error?: string } {
  try {
    const resolved = validatePath(dirPath);
    if (!existsSync(resolved)) {
      return { success: false, error: `Directory not found: ${dirPath}` };
    }

    const entries = readdirSync(resolved);
    const files = entries.map(name => {
      const fullPath = join(resolved, name);
      const stat = statSync(fullPath);
      return {
        name,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.size,
      };
    });

    logger.info(`Listed ${files.length} items in ${dirPath}`);
    return { success: true, files };
  } catch (err: any) {
    logger.error(`List files failed: ${dirPath}`, { error: err.message });
    return { success: false, error: err.message };
  }
}

// ─── Tool Definition ──────────────────────────────────────

export const fileSystemTool = {
  name: 'file_system',
  description: 'Read, write, and list files within the agent workspace. All paths are relative to the workspace root.',
  parameters: {
    action: { type: 'string', description: 'Action: "read", "write", or "list"', required: true },
    path: { type: 'string', description: 'File or directory path (relative to workspace)', required: true },
    content: { type: 'string', description: 'File content (required for "write" action)', required: false },
  },
  execute: async (params: { action: string; path: string; content?: string }): Promise<any> => {
    switch (params.action) {
      case 'read':
        return readFile(params.path);
      case 'write':
        if (!params.content) return { success: false, error: 'Content is required for write action' };
        return writeFile(params.path, params.content);
      case 'list':
        return listFiles(params.path);
      default:
        return { success: false, error: `Unknown action: ${params.action}. Use "read", "write", or "list".` };
    }
  },
};
