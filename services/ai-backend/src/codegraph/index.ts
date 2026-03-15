// ============================================================
// AgentOS — CodeGraph Engine
// Codebase intelligence: scan, parse, and build dependency graphs
// ============================================================

import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/sqlite.js';
import { knowledgeGraph } from '../memory/knowledgeGraph.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('CodeGraph');

// ─── Types ─────────────────────────────────────────────────

export interface FileAnalysis {
  id: string;
  path: string;
  language: string;
  lineCount: number;
  functions: SymbolInfo[];
  classes: SymbolInfo[];
  interfaces: SymbolInfo[];
  imports: ImportInfo[];
  exports: string[];
}

export interface SymbolInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum';
  line: number;
  isExported: boolean;
  isAsync: boolean;
  params?: string;
  returnType?: string;
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  isRelative: boolean;
}

export interface ScanResult {
  scanId: string;
  rootPath: string;
  totalFiles: number;
  totalFunctions: number;
  totalClasses: number;
  totalImports: number;
  languages: Record<string, number>;
  scannedAt: string;
}

// ─── File Scanner ──────────────────────────────────────────

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.expo', 'dist', 'build', '.next',
  '.turbo', 'coverage', '__pycache__', '.vscode', '.idea',
]);

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript',
  '.json': 'json', '.md': 'markdown',
  '.py': 'python', '.css': 'css',
  '.html': 'html', '.sql': 'sql',
};

function walkDirectory(dir: string, files: string[] = []): string[] {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.isDirectory()) continue;
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDirectory(fullPath, files);
      } else {
        const ext = path.extname(entry.name);
        if (LANGUAGE_MAP[ext]) files.push(fullPath);
      }
    }
  } catch (err) {
    logger.warn(`Cannot read directory: ${dir}`);
  }
  return files;
}

// ─── TypeScript/JavaScript Parser ──────────────────────────

function parseFile(filePath: string): FileAnalysis {
  const id = uuid();
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const ext = path.extname(filePath);
  const language = LANGUAGE_MAP[ext] || 'unknown';

  const functions: SymbolInfo[] = [];
  const classes: SymbolInfo[] = [];
  const interfaces: SymbolInfo[] = [];
  const imports: ImportInfo[] = [];
  const exports: string[] = [];

  if (language === 'typescript' || language === 'javascript') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Functions: function name(...) or const name = (...) =>
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/);
      const arrowMatch = line.match(/(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/);
      if (funcMatch) {
        functions.push({
          name: funcMatch[1],
          type: 'function',
          line: lineNum,
          isExported: line.includes('export'),
          isAsync: line.includes('async'),
        });
      } else if (arrowMatch && (line.includes('=>') || lines[i + 1]?.includes('=>'))) {
        functions.push({
          name: arrowMatch[1],
          type: 'function',
          line: lineNum,
          isExported: line.includes('export'),
          isAsync: line.includes('async'),
        });
      }

      // Classes
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        classes.push({
          name: classMatch[1],
          type: 'class',
          line: lineNum,
          isExported: line.includes('export'),
          isAsync: false,
        });
      }

      // Interfaces
      const ifaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
      if (ifaceMatch) {
        interfaces.push({
          name: ifaceMatch[1],
          type: 'interface',
          line: lineNum,
          isExported: line.includes('export'),
          isAsync: false,
        });
      }

      // Imports
      const importMatch = line.match(/import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const specifiers = (importMatch[1] || importMatch[2] || '').split(',').map(s => s.trim()).filter(Boolean);
        const source = importMatch[3];
        imports.push({
          source,
          specifiers,
          isRelative: source.startsWith('.'),
        });
      }

      // Exports
      if (line.match(/^export\s+(default\s+)?(function|class|const|let|interface|type|enum)\s+(\w+)/)) {
        const m = line.match(/(?:default\s+)?(?:function|class|const|let|interface|type|enum)\s+(\w+)/);
        if (m) exports.push(m[1]);
      }
    }
  }

  return { id, path: filePath, language, lineCount: lines.length, functions, classes, interfaces, imports, exports };
}

// ─── CodeGraph Engine ──────────────────────────────────────

class CodeGraphEngine {
  /**
   * Scan a repository and build the code graph
   */
  scan(rootPath: string): ScanResult {
    const scanId = uuid();
    const absRoot = path.resolve(rootPath);
    logger.info(`Scanning repository: ${absRoot}`);

    const files = walkDirectory(absRoot);
    const db = getDb();
    const languages: Record<string, number> = {};
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalImports = 0;

    // Clear old scan data for this root
    db.exec(`DELETE FROM codegraph_imports WHERE file_id IN (SELECT id FROM codegraph_files WHERE path LIKE '${absRoot}%')`);
    db.exec(`DELETE FROM codegraph_symbols WHERE file_id IN (SELECT id FROM codegraph_files WHERE path LIKE '${absRoot}%')`);
    db.exec(`DELETE FROM codegraph_files WHERE path LIKE '${absRoot}%'`);

    const insertFile = db.prepare(`
      INSERT INTO codegraph_files (id, path, language, line_count, complexity, scan_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSymbol = db.prepare(`
      INSERT INTO codegraph_symbols (id, file_id, name, type, line_number, is_exported, is_async, params, return_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertImport = db.prepare(`
      INSERT INTO codegraph_imports (file_id, source, specifiers, is_relative)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((analysisResults: FileAnalysis[]) => {
      for (const analysis of analysisResults) {
        const relPath = path.relative(absRoot, analysis.path);
        const complexity = (analysis.functions.length + analysis.classes.length) / Math.max(analysis.lineCount / 100, 1);

        insertFile.run(analysis.id, relPath, analysis.language, analysis.lineCount, complexity, scanId);

        // Track language stats
        languages[analysis.language] = (languages[analysis.language] || 0) + 1;

        // Insert symbols
        for (const fn of analysis.functions) {
          insertSymbol.run(uuid(), analysis.id, fn.name, fn.type, fn.line, fn.isExported ? 1 : 0, fn.isAsync ? 1 : 0, fn.params || null, fn.returnType || null);
          totalFunctions++;
        }
        for (const cls of analysis.classes) {
          insertSymbol.run(uuid(), analysis.id, cls.name, cls.type, cls.line, cls.isExported ? 1 : 0, 0, null, null);
          totalClasses++;
        }
        for (const iface of analysis.interfaces) {
          insertSymbol.run(uuid(), analysis.id, iface.name, iface.type, iface.line, iface.isExported ? 1 : 0, 0, null, null);
        }

        // Insert imports
        for (const imp of analysis.imports) {
          insertImport.run(analysis.id, imp.source, JSON.stringify(imp.specifiers), imp.isRelative ? 1 : 0);
          totalImports++;
        }

        // Build knowledge graph nodes
        knowledgeGraph.addNode({ type: 'file', name: relPath, filePath: relPath });
        for (const fn of analysis.functions) {
          const fnNode = knowledgeGraph.addNode({ type: 'function', name: fn.name, filePath: relPath });
          // Link function → belongs_to → file
          const fileNodes = knowledgeGraph.findNodes({ type: 'file', name: relPath });
          if (fileNodes.length > 0) {
            knowledgeGraph.addEdge({ sourceId: fnNode.id, targetId: fileNodes[0].id, relationship: 'belongs_to' });
          }
        }
      }
    });

    // Parse all files
    const results = files.map(f => {
      try { return parseFile(f); } catch { return null; }
    }).filter(Boolean) as FileAnalysis[];

    insertMany(results);

    const result: ScanResult = {
      scanId,
      rootPath: absRoot,
      totalFiles: results.length,
      totalFunctions,
      totalClasses,
      totalImports,
      languages,
      scannedAt: new Date().toISOString(),
    };

    logger.info('Scan complete', result as any);
    return result;
  }

  /**
   * Get project overview
   */
  getOverview(): any {
    const db = getDb();
    const totalFiles = (db.prepare('SELECT COUNT(*) as c FROM codegraph_files').get() as any).c;
    const totalSymbols = (db.prepare('SELECT COUNT(*) as c FROM codegraph_symbols').get() as any).c;
    const totalImports = (db.prepare('SELECT COUNT(*) as c FROM codegraph_imports').get() as any).c;

    const langStats = db.prepare('SELECT language, COUNT(*) as c FROM codegraph_files GROUP BY language').all();
    const symbolStats = db.prepare('SELECT type, COUNT(*) as c FROM codegraph_symbols GROUP BY type').all();
    const topFiles = db.prepare('SELECT path, line_count, complexity FROM codegraph_files ORDER BY complexity DESC LIMIT 10').all();

    return { totalFiles, totalSymbols, totalImports, langStats, symbolStats, topFiles };
  }

  /**
   * Get analysis for a specific file
   */
  getFile(filePath: string): any {
    const db = getDb();
    const file: any = db.prepare('SELECT * FROM codegraph_files WHERE path = ? OR path LIKE ?').get(filePath, `%${filePath}`);
    if (!file) return null;

    const symbols = db.prepare('SELECT * FROM codegraph_symbols WHERE file_id = ?').all(file.id);
    const imports = db.prepare('SELECT * FROM codegraph_imports WHERE file_id = ?').all(file.id);

    return { ...file, symbols, imports };
  }

  /**
   * Search functions, classes, etc.
   */
  search(query: string, type?: string): any[] {
    const db = getDb();
    let sql = `
      SELECT s.*, f.path as file_path 
      FROM codegraph_symbols s 
      JOIN codegraph_files f ON s.file_id = f.id 
      WHERE s.name LIKE ?
    `;
    const params: any[] = [`%${query}%`];

    if (type) { sql += ' AND s.type = ?'; params.push(type); }
    sql += ' LIMIT 50';

    return db.prepare(sql).all(...params);
  }

  /**
   * Get dependency graph (file → imports)
   */
  getDependencyGraph(): { nodes: any[]; edges: any[] } {
    const db = getDb();
    const files = db.prepare('SELECT id, path FROM codegraph_files').all() as any[];
    const imports = db.prepare(`
      SELECT f.path as from_file, i.source, i.is_relative
      FROM codegraph_imports i
      JOIN codegraph_files f ON i.file_id = f.id
      WHERE i.is_relative = 1
    `).all() as any[];

    const nodes = files.map(f => ({ id: f.id, label: f.path }));
    const edges = imports.map(i => ({ from: i.from_file, to: i.source }));

    return { nodes, edges };
  }
}

export const codeGraph = new CodeGraphEngine();
