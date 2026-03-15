// ============================================================
// AgentOS — Plugins API Routes
// ============================================================

import { Router } from 'express';
import { pluginSystem } from '../../plugins/loader.js';

const pluginsRouter = Router();

// Discover available plugins
pluginsRouter.get('/discover', (_req, res) => {
  const manifests = pluginSystem.discover();
  res.json({ success: true, data: manifests });
});

// List installed plugins
pluginsRouter.get('/', (_req, res) => {
  const installed = pluginSystem.getInstalled();
  const loaded = pluginSystem.getLoaded().map(p => p.manifest.name);
  res.json({ success: true, data: { installed, loaded } });
});

// Load a plugin
pluginsRouter.post('/load', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Plugin name required' });

  const loaded = await pluginSystem.load(name);
  if (!loaded) return res.status(404).json({ success: false, error: 'Plugin not found or failed to load' });

  res.json({ success: true, data: { name: loaded.manifest.name, version: loaded.manifest.version } });
});

// Unload a plugin
pluginsRouter.post('/unload', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Plugin name required' });

  const result = pluginSystem.unload(name);
  res.json({ success: true, data: { unloaded: result } });
});

// Enable/disable
pluginsRouter.post('/toggle', (req, res) => {
  const { name, enabled } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Plugin name required' });

  pluginSystem.setEnabled(name, enabled !== false);
  res.json({ success: true });
});

export { pluginsRouter };
