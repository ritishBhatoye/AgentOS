// ============================================================
// AgentOS — Plugin System
// Dynamic loading of agents, tools, and skills at runtime
// ============================================================

import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/sqlite.js';
import { SystemLogger } from '../utils/logger.js';

const logger = new SystemLogger('PluginLoader');

// ─── Types ─────────────────────────────────────────────────

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  type: 'agent' | 'tool' | 'skill' | 'mixed';
  entry: string;
  provides?: {
    agents?: string[];
    tools?: string[];
    skills?: string[];
  };
  requires?: {
    agentos?: string;
    tools?: string[];
  };
}

export interface LoadedPlugin {
  id: string;
  manifest: PluginManifest;
  module: any;
  enabled: boolean;
  loadedAt: string;
}

// ─── Plugin Loader ─────────────────────────────────────────

class PluginSystem {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private pluginDirs: string[];

  constructor() {
    this.pluginDirs = [
      path.join(process.cwd(), 'plugins'),
      path.join(process.cwd(), '..', '..', 'plugins'),
    ];
  }

  /**
   * Discover all plugins in plugin directories
   */
  discover(): PluginManifest[] {
    const manifests: PluginManifest[] = [];

    for (const dir of this.pluginDirs) {
      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const manifestPath = path.join(dir, entry.name, 'plugin.json');
        if (!fs.existsSync(manifestPath)) continue;

        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as PluginManifest;
          manifests.push(manifest);
          logger.info(`Discovered plugin: ${manifest.name} v${manifest.version}`);
        } catch (err) {
          logger.warn(`Invalid plugin manifest: ${manifestPath}`);
        }
      }
    }

    return manifests;
  }

  /**
   * Load a plugin dynamically
   */
  async load(pluginName: string): Promise<LoadedPlugin | null> {
    for (const dir of this.pluginDirs) {
      const pluginDir = path.join(dir, pluginName);
      const manifestPath = path.join(pluginDir, 'plugin.json');

      if (!fs.existsSync(manifestPath)) continue;

      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as PluginManifest;
        const entryPath = path.join(pluginDir, manifest.entry);

        // Dynamic import
        const module = await import(entryPath);

        const id = uuid();
        const loaded: LoadedPlugin = {
          id,
          manifest,
          module,
          enabled: true,
          loadedAt: new Date().toISOString(),
        };

        this.plugins.set(pluginName, loaded);

        // Store in database
        getDb().prepare(`
          INSERT OR REPLACE INTO plugins (id, name, version, description, entry_point, enabled, config)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, manifest.name, manifest.version, manifest.description, manifest.entry, 1, JSON.stringify(manifest));

        logger.info(`Plugin loaded: ${manifest.name}`);
        return loaded;
      } catch (err) {
        logger.error(`Failed to load plugin: ${pluginName}`, { error: String(err) });
        return null;
      }
    }

    return null;
  }

  /**
   * Unload a plugin
   */
  unload(pluginName: string): boolean {
    if (this.plugins.has(pluginName)) {
      this.plugins.delete(pluginName);
      getDb().prepare('UPDATE plugins SET enabled = 0 WHERE name = ?').run(pluginName);
      logger.info(`Plugin unloaded: ${pluginName}`);
      return true;
    }
    return false;
  }

  /**
   * Get all loaded plugins
   */
  getLoaded(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all installed plugins from database
   */
  getInstalled(): any[] {
    return getDb().prepare('SELECT * FROM plugins ORDER BY installed_at DESC').all();
  }

  /**
   * Enable/disable a plugin
   */
  setEnabled(pluginName: string, enabled: boolean): void {
    getDb().prepare('UPDATE plugins SET enabled = ? WHERE name = ?').run(enabled ? 1 : 0, pluginName);
    const loaded = this.plugins.get(pluginName);
    if (loaded) loaded.enabled = enabled;
  }
}

export const pluginSystem = new PluginSystem();
