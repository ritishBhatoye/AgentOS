// ============================================================
// AgentOS — Knowledge Graph Memory
// Entity relationships for agent reasoning over codebases
// ============================================================

import { v4 as uuid } from 'uuid';
import { getDb } from '../db/sqlite.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('KnowledgeGraph');

export type NodeType = 'function' | 'file' | 'module' | 'class' | 'interface' | 'library' | 'api' | 'database' | 'route' | 'component';
export type RelationType = 'belongs_to' | 'imports' | 'depends_on' | 'calls' | 'implements' | 'extends' | 'exports' | 'uses_tool' | 'routes_to';

export interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  filePath?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id?: number;
  sourceId: string;
  targetId: string;
  relationship: RelationType;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface GraphQueryResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

class KnowledgeGraphMemory {
  // ─── Node Operations ────────────────────────────────

  addNode(node: Omit<GraphNode, 'id'>): GraphNode {
    const id = uuid();
    getDb().prepare(`
      INSERT OR REPLACE INTO knowledge_nodes (id, type, name, file_path, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, node.type, node.name, node.filePath || null, node.metadata ? JSON.stringify(node.metadata) : null);
    return { id, ...node };
  }

  getNode(id: string): GraphNode | null {
    const row: any = getDb().prepare('SELECT * FROM knowledge_nodes WHERE id = ?').get(id);
    return row ? this.rowToNode(row) : null;
  }

  findNodes(query: { type?: NodeType; name?: string; filePath?: string }): GraphNode[] {
    let sql = 'SELECT * FROM knowledge_nodes WHERE 1=1';
    const params: any[] = [];

    if (query.type) { sql += ' AND type = ?'; params.push(query.type); }
    if (query.name) { sql += ' AND name LIKE ?'; params.push(`%${query.name}%`); }
    if (query.filePath) { sql += ' AND file_path LIKE ?'; params.push(`%${query.filePath}%`); }

    sql += ' LIMIT 100';
    return getDb().prepare(sql).all(...params).map((r: any) => this.rowToNode(r));
  }

  // ─── Edge Operations ────────────────────────────────

  addEdge(edge: GraphEdge): void {
    getDb().prepare(`
      INSERT INTO knowledge_edges (source_id, target_id, relationship, weight, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(edge.sourceId, edge.targetId, edge.relationship, edge.weight ?? 1.0, edge.metadata ? JSON.stringify(edge.metadata) : null);
  }

  getEdges(nodeId: string, direction: 'outgoing' | 'incoming' | 'both' = 'both'): GraphEdge[] {
    const db = getDb();
    const edges: GraphEdge[] = [];

    if (direction === 'outgoing' || direction === 'both') {
      edges.push(...db.prepare('SELECT * FROM knowledge_edges WHERE source_id = ?').all(nodeId).map((r: any) => this.rowToEdge(r)));
    }
    if (direction === 'incoming' || direction === 'both') {
      edges.push(...db.prepare('SELECT * FROM knowledge_edges WHERE target_id = ?').all(nodeId).map((r: any) => this.rowToEdge(r)));
    }

    return edges;
  }

  // ─── Graph Queries ──────────────────────────────────

  /**
   * Get a subgraph around a specific entity, including connected nodes
   */
  getSubgraph(entityId: string, depth = 1): GraphQueryResult {
    const visited = new Set<string>();
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const traverse = (nodeId: string, currentDepth: number) => {
      if (visited.has(nodeId) || currentDepth > depth) return;
      visited.add(nodeId);

      const node = this.getNode(nodeId);
      if (node) nodes.push(node);

      const nodeEdges = this.getEdges(nodeId);
      for (const edge of nodeEdges) {
        edges.push(edge);
        const nextId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        traverse(nextId, currentDepth + 1);
      }
    };

    traverse(entityId, 0);
    return { nodes, edges };
  }

  /**
   * Find paths between two entities
   */
  queryRelationships(params: {
    fromType?: NodeType;
    toType?: NodeType;
    relationship?: RelationType;
    limit?: number;
  }): Array<{ source: GraphNode; edge: GraphEdge; target: GraphNode }> {
    let sql = `
      SELECT e.*, 
             s.id as s_id, s.type as s_type, s.name as s_name, s.file_path as s_file_path, s.metadata as s_metadata,
             t.id as t_id, t.type as t_type, t.name as t_name, t.file_path as t_file_path, t.metadata as t_metadata
      FROM knowledge_edges e
      JOIN knowledge_nodes s ON e.source_id = s.id
      JOIN knowledge_nodes t ON e.target_id = t.id
      WHERE 1=1
    `;
    const p: any[] = [];

    if (params.fromType) { sql += ' AND s.type = ?'; p.push(params.fromType); }
    if (params.toType) { sql += ' AND t.type = ?'; p.push(params.toType); }
    if (params.relationship) { sql += ' AND e.relationship = ?'; p.push(params.relationship); }

    sql += ` LIMIT ${params.limit || 50}`;

    return getDb().prepare(sql).all(...p).map((r: any) => ({
      source: { id: r.s_id, type: r.s_type, name: r.s_name, filePath: r.s_file_path, metadata: r.s_metadata ? JSON.parse(r.s_metadata) : undefined },
      edge: this.rowToEdge(r),
      target: { id: r.t_id, type: r.t_type, name: r.t_name, filePath: r.t_file_path, metadata: r.t_metadata ? JSON.parse(r.t_metadata) : undefined },
    }));
  }

  /**
   * Get graph statistics
   */
  getStats(): { totalNodes: number; totalEdges: number; nodesByType: Record<string, number>; edgesByType: Record<string, number> } {
    const db = getDb();
    const totalNodes = (db.prepare('SELECT COUNT(*) as c FROM knowledge_nodes').get() as any).c;
    const totalEdges = (db.prepare('SELECT COUNT(*) as c FROM knowledge_edges').get() as any).c;

    const nodesByType: Record<string, number> = {};
    for (const row of db.prepare('SELECT type, COUNT(*) as c FROM knowledge_nodes GROUP BY type').all() as any[]) {
      nodesByType[row.type] = row.c;
    }

    const edgesByType: Record<string, number> = {};
    for (const row of db.prepare('SELECT relationship, COUNT(*) as c FROM knowledge_edges GROUP BY relationship').all() as any[]) {
      edgesByType[row.relationship] = row.c;
    }

    return { totalNodes, totalEdges, nodesByType, edgesByType };
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    getDb().exec('DELETE FROM knowledge_edges; DELETE FROM knowledge_nodes;');
    logger.info('Knowledge graph cleared');
  }

  // ─── Internal ───────────────────────────────────────

  private rowToNode(row: any): GraphNode {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      filePath: row.file_path || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  private rowToEdge(row: any): GraphEdge {
    return {
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      relationship: row.relationship,
      weight: row.weight,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}

export const knowledgeGraph = new KnowledgeGraphMemory();
