// ============================================================
// AgentOS — Knowledge Graph API Routes
// ============================================================

import { Router } from 'express';
import { knowledgeGraph } from '../../memory/knowledgeGraph.js';

const knowledgeRouter = Router();

// Query relationships
knowledgeRouter.get('/query', (req, res) => {
  try {
    const { fromType, toType, relationship, limit } = req.query;
    const results = knowledgeGraph.queryRelationships({
      fromType: fromType as any,
      toType: toType as any,
      relationship: relationship as any,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get entity by ID
knowledgeRouter.get('/entity/:id', (req, res) => {
  const node = knowledgeGraph.getNode(req.params.id);
  if (!node) return res.status(404).json({ success: false, error: 'Entity not found' });

  const edges = knowledgeGraph.getEdges(req.params.id);
  res.json({ success: true, data: { node, edges } });
});

// Get subgraph
knowledgeRouter.get('/subgraph/:id', (req, res) => {
  const depth = req.query.depth ? parseInt(req.query.depth as string) : 1;
  const result = knowledgeGraph.getSubgraph(req.params.id, depth);
  res.json({ success: true, data: result });
});

// Search nodes
knowledgeRouter.get('/search', (req, res) => {
  const { type, name, filePath } = req.query;
  const results = knowledgeGraph.findNodes({
    type: type as any,
    name: name as string,
    filePath: filePath as string,
  });
  res.json({ success: true, data: results });
});

// Get statistics
knowledgeRouter.get('/stats', (_req, res) => {
  const stats = knowledgeGraph.getStats();
  res.json({ success: true, data: stats });
});

export { knowledgeRouter };
