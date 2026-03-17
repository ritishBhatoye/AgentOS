// ============================================================
// AgentOS — CodeGraph API Routes
// ============================================================

import { Router } from 'express';
import { codeGraph } from '../../codegraph/index.js';
import path from 'path';

const codegraphRouter = Router();

// Scan repository
codegraphRouter.post('/scan', (req, res) => {
  try {
    const rootPath = req.body.path || path.join(process.cwd(), '..', '..');
    const result = codeGraph.scan(rootPath);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get overview
codegraphRouter.get('/overview', (_req, res) => {
  try {
    const overview = codeGraph.getOverview();
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get file analysis
codegraphRouter.get('/file', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ success: false, error: 'path query required' });

  const result = codeGraph.getFile(filePath);
  if (!result) return res.status(404).json({ success: false, error: 'File not found in codegraph' });

  res.json({ success: true, data: result });
});

// Search symbols
codegraphRouter.get('/search', (req, res) => {
  const query = req.query.q as string;
  const type = req.query.type as string | undefined;
  if (!query) return res.status(400).json({ success: false, error: 'q query required' });

  const results = codeGraph.search(query, type);
  res.json({ success: true, data: results });
});

// Get dependency graph
codegraphRouter.get('/dependencies', (_req, res) => {
  try {
    const graph = codeGraph.getDependencyGraph();
    res.json({ success: true, data: graph });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export { codegraphRouter };
