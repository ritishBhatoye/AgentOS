# 🧠 AgentOS — Post-MVP Roadmap

> **Transform AgentOS into a production-grade autonomous engineering platform.**
> Local-first · Open-source · Zero-cost · Cross-platform

---

## 📊 Current MVP Status (✅ Complete)

| Component | Status | Stack |
|-----------|--------|-------|
| Monorepo | ✅ Done | Turborepo |
| Web Dashboard | ✅ Done | Next.js 16 |
| Mobile Client | ✅ Done | Expo 55 + React Native |
| AI Backend | ✅ Done | Express + TypeScript |
| Model Router | ✅ Done | Ollama (llama3.2, mistral, deepseek-coder) |
| Multi-Agent System | ✅ Done | Planner, Coding, Research, Execution |
| Tool Registry | ✅ Done | web_search, code_executor, file_system |
| Task Queue | ✅ Done | In-memory queue with status tracking |
| Memory System | ✅ Done | Short-term (conversations) + Long-term (key-value) |
| SSE Streaming | ✅ Done | Real-time event bus |
| Chat API | ✅ Done | With auto model routing + fallback |
| Mobile Animations | ✅ Done | Moti + Reanimated |

---

## 🏗️ Architecture Evolution

```
Current (MVP)                          Target (v1.0)
─────────────                          ──────────────
In-Memory Store ────────────────────→  SQLite + Chroma + In-Memory Cache
4 Agents ───────────────────────────→  7 Agents + Plugin Agents
3 Tools ────────────────────────────→  10+ Tools + Plugin Tools
No Auth ────────────────────────────→  OAuth (GitHub + Google)
No Persistence ─────────────────────→  Full Persistence + Knowledge Graph
No Sandboxing ──────────────────────→  Isolated Execution + Worker Pool
Manual Deployment ──────────────────→  Docker Compose + Production Configs
```

---

## 🎯 Phase Overview

| Phase | Name | Duration | Priority |
|-------|------|----------|----------|
| **Phase 1** | Database & Persistence Layer | 3-4 days | 🔴 Critical |
| **Phase 2** | Codebase Intelligence Engine | 3-4 days | 🔴 Critical |
| **Phase 3** | Advanced Agent System | 4-5 days | 🟡 High |
| **Phase 4** | Security & Execution Sandbox | 2-3 days | 🟡 High |
| **Phase 5** | GitHub Repository Agent | 3-4 days | 🟢 Medium |
| **Phase 6** | Observability & Reasoning UI | 3-4 days | 🟢 Medium |
| **Phase 7** | Plugin Ecosystem | 3-4 days | 🟢 Medium |
| **Phase 8** | OAuth & User System | 2-3 days | 🟡 High |
| **Phase 9** | Deployment & Production | 2-3 days | 🔴 Critical |
| **Phase 10** | Autonomous Project Builder | 4-5 days | 🟢 Medium |

**Total Estimated Time: 30-40 days (2 senior devs)**

---

## 📁 Target Folder Structure

```
AgentOS/
├── apps/
│   ├── web/                          # Next.js Dashboard
│   │   ├── app/
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── agents/               # Agent management
│   │   │   ├── tasks/                # Task management
│   │   │   ├── codegraph/            # Codebase intelligence UI
│   │   │   ├── knowledge/            # Knowledge graph viewer
│   │   │   ├── reasoning/            # Agent reasoning visualizer
│   │   │   ├── metrics/              # Observability dashboard
│   │   │   ├── plugins/              # Plugin marketplace
│   │   │   ├── auth/                 # OAuth login
│   │   │   └── settings/             # System settings
│   │   └── lib/
│   │       ├── api.ts                # TanStack Query client
│   │       └── sse.ts                # SSE subscription
│   │
│   └── mobile/                       # Expo Mobile App
│       ├── app/(tabs)/
│       │   ├── chat.tsx
│       │   ├── tasks.tsx
│       │   ├── agents.tsx
│       │   ├── logs.tsx
│       │   └── settings.tsx
│       ├── hooks/
│       ├── lib/
│       └── components/
│
├── services/
│   ├── ai-backend/
│   │   └── src/
│   │       ├── agents/
│   │       │   ├── planner/          # ✅ Exists
│   │       │   ├── coding/           # ✅ Exists
│   │       │   ├── research/         # ✅ Exists
│   │       │   ├── execution/        # ✅ Exists
│   │       │   ├── architect/        # 🆕 System design agent
│   │       │   ├── reviewer/         # 🆕 Code review agent
│   │       │   └── debugger/         # 🆕 Bug detection agent
│   │       │
│   │       ├── api/
│   │       │   └── routes/
│   │       │       ├── chat.ts       # ✅ Exists
│   │       │       ├── agents.ts     # ✅ Exists
│   │       │       ├── tasks.ts      # ✅ Exists
│   │       │       ├── health.ts     # ✅ Exists
│   │       │       ├── events.ts     # ✅ Exists
│   │       │       ├── memory.ts     # ✅ Exists
│   │       │       ├── codegraph.ts  # 🆕
│   │       │       ├── knowledge.ts  # 🆕
│   │       │       ├── jobs.ts       # 🆕
│   │       │       ├── metrics.ts    # 🆕
│   │       │       ├── plugins.ts    # 🆕
│   │       │       └── auth.ts       # 🆕
│   │       │
│   │       ├── db/
│   │       │   ├── sqlite.ts         # 🆕 SQLite connection
│   │       │   ├── migrations/       # 🆕 Schema migrations
│   │       │   └── seed.ts           # 🆕 Seed data
│   │       │
│   │       ├── memory/
│   │       │   ├── conversationStore.ts  # ✅ Exists
│   │       │   ├── longTermMemory.ts     # ✅ Exists
│   │       │   ├── chromaClient.ts       # 🆕 Vector memory
│   │       │   └── knowledgeGraph.ts     # 🆕 Entity relationships
│   │       │
│   │       ├── codegraph/
│   │       │   ├── scanner.ts        # 🆕 File scanner
│   │       │   ├── parser.ts         # 🆕 AST parser
│   │       │   └── graphBuilder.ts   # 🆕 Dependency graph
│   │       │
│   │       ├── execution/
│   │       │   ├── sandbox.ts        # 🆕 Isolated execution
│   │       │   ├── workerPool.ts     # 🆕 Parallel workers
│   │       │   └── jobRunner.ts      # 🆕 Long-running jobs
│   │       │
│   │       ├── plugins/
│   │       │   ├── loader.ts         # 🆕 Dynamic plugin loader
│   │       │   ├── registry.ts       # 🆕 Plugin registry
│   │       │   └── marketplace/      # 🆕 Built-in plugins
│   │       │
│   │       ├── auth/
│   │       │   ├── oauth.ts          # 🆕 OAuth handlers
│   │       │   └── session.ts        # 🆕 Session management
│   │       │
│   │       └── tools/
│   │           ├── webSearch.ts      # ✅ Exists
│   │           ├── codeExecutor.ts   # ✅ Exists
│   │           ├── fileSystem.ts     # ✅ Exists
│   │           ├── gitOperations.ts  # 🆕
│   │           ├── browser.ts        # 🆕 Playwright
│   │           └── terminal.ts       # 🆕
│   │
│   └── github-agent/                 # 🆕 GitHub automation service
│       ├── src/
│       │   ├── cloner.ts
│       │   ├── analyzer.ts
│       │   ├── patchGenerator.ts
│       │   └── prCreator.ts
│       └── package.json
│
├── packages/
│   ├── agents/                       # Shared agent protocols
│   ├── tools/                        # Shared tool interfaces
│   ├── memory/                       # Shared memory interfaces
│   └── model-router/                 # Shared model routing
│
├── plugins/                          # 🆕 Plugin directory
│   ├── seo-agent/
│   ├── devops-agent/
│   └── finance-agent/
│
├── docker-compose.yml                # 🆕 Production deployment
├── Dockerfile                        # 🆕 Container config
├── ROADMAP.md                        # This file
└── README.md
```

---

## 🔴 Phase 1 — Database & Persistence Layer
**Duration: 3-4 days · Priority: Critical**

> [!IMPORTANT]
> This is the foundation for ALL subsequent features. Must be done first.

### 1.1 SQLite Setup
```
services/ai-backend/src/db/
├── sqlite.ts              # Connection manager (better-sqlite3)
├── migrations/
│   ├── 001_users.ts
│   ├── 002_tasks.ts
│   ├── 003_agents.ts
│   ├── 004_runs.ts
│   ├── 005_jobs.ts
│   ├── 006_logs.ts
│   ├── 007_plugins.ts
│   └── 008_repositories.ts
└── seed.ts
```

### Schema Design

```sql
-- Users (for OAuth later)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  provider TEXT,          -- 'github' | 'google'
  provider_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks (replace in-memory task queue)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,      -- 'coding' | 'research' | 'planning'
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  assigned_to TEXT,        -- agent id
  result TEXT,
  error TEXT,
  parent_task_id TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Agent Runs (execution history)
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id),
  agent_id TEXT NOT NULL,
  model TEXT,
  prompt TEXT,
  plan TEXT,              -- JSON: agent's plan
  tools_used TEXT,        -- JSON: list of tools
  output TEXT,
  error TEXT,
  duration_ms INTEGER,
  token_count INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System Logs
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT,             -- 'info' | 'warn' | 'error' | 'debug'
  source TEXT,            -- 'agent:planner' | 'tool:web_search'
  message TEXT,
  metadata TEXT,          -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Jobs (long-running)
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  progress REAL DEFAULT 0,
  checkpoint TEXT,        -- JSON: resume data
  result TEXT,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Plugins
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  entry_point TEXT,
  enabled BOOLEAN DEFAULT 1,
  config TEXT,            -- JSON
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Repositories
CREATE TABLE repositories (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT,
  local_path TEXT,
  last_scanned_at DATETIME,
  scan_result TEXT,       -- JSON: CodeGraph summary
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Chroma Vector Memory
```
services/ai-backend/src/memory/
├── chromaClient.ts        # Chroma connection
└── embeddings.ts          # Ollama embedding generation
```

**Collections:**
| Collection | Purpose |
|-----------|---------|
| `conversations` | Chat history embeddings |
| `research` | Research knowledge |
| `task_insights` | Task execution learnings |
| `project_docs` | Documentation embeddings |
| `agent_learning` | Agent self-improvement data |

### 1.3 Knowledge Graph Memory
```typescript
// knowledgeGraph.ts — Entity relationship store

interface GraphNode {
  id: string;
  type: 'function' | 'file' | 'module' | 'library' | 'api' | 'database';
  name: string;
  metadata: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  relationship: 'belongs_to' | 'imports' | 'depends_on' | 'calls' | 'implements';
}
```

**SQL tables:**
```sql
CREATE TABLE knowledge_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT REFERENCES knowledge_nodes(id),
  target_id TEXT REFERENCES knowledge_nodes(id),
  relationship TEXT NOT NULL,
  weight REAL DEFAULT 1.0,
  metadata TEXT
);
```

**APIs:**
```
GET /api/knowledge-graph/query?type=function&module=auth
GET /api/knowledge-graph/entity/:id
POST /api/knowledge-graph/scan     # Trigger scan
```

### Deliverables
- [ ] `better-sqlite3` integration with WAL mode
- [ ] All migration scripts
- [ ] Chroma Docker setup
- [ ] Embedding pipeline (Ollama → Chroma)
- [ ] Knowledge graph CRUD APIs
- [ ] Migrate existing in-memory stores to SQLite
- [ ] Data access layer with type-safe queries

---

## 🔴 Phase 2 — Codebase Intelligence Engine (CodeGraph)
**Duration: 3-4 days · Priority: Critical**

> [!NOTE]
> CodeGraph enables agents to understand and navigate codebases intelligently.

### Architecture
```
services/ai-backend/src/codegraph/
├── scanner.ts          # Walk directory tree
├── parser.ts           # TypeScript AST analysis
├── graphBuilder.ts     # Build dependency graph
├── queryEngine.ts      # Graph query interface
└── index.ts            # Public API
```

### Scanner Capabilities
| Feature | Implementation |
|---------|---------------|
| File Discovery | `fs.walk` with gitignore support |
| Language Detection | Extension mapping |
| TS/JS Parsing | `typescript` compiler API |
| Function Detection | AST `FunctionDeclaration` nodes |
| Import/Export Detection | AST `ImportDeclaration` nodes |
| Dependency Graph | Adjacency list from imports |
| Module Boundaries | Directory-level clustering |

### Parser Output
```typescript
interface FileAnalysis {
  path: string;
  language: 'typescript' | 'javascript' | 'json' | 'markdown';
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  classes: ClassInfo[];
  lineCount: number;
  complexity: number;    // Cyclomatic complexity score
}

interface FunctionInfo {
  name: string;
  line: number;
  params: string[];
  returnType: string;
  isAsync: boolean;
  isExported: boolean;
  complexity: number;
}
```

### APIs
```
GET  /api/codegraph/overview          # Full project summary
GET  /api/codegraph/file?path=...     # Single file analysis
GET  /api/codegraph/search?q=...      # Search functions/modules
GET  /api/codegraph/dependencies      # Dependency graph
POST /api/codegraph/scan              # Trigger repository scan
```

### Deliverables
- [ ] File scanner with gitignore support
- [ ] TypeScript/JavaScript AST parser
- [ ] Dependency graph builder
- [ ] SQL storage for scan results
- [ ] Knowledge graph integration
- [ ] Search API with fuzzy matching
- [ ] Dashboard visualization (tree + graph view)

---

## 🟡 Phase 3 — Advanced Agent System
**Duration: 4-5 days · Priority: High**

### 3.1 New Agents

| Agent | Role | Key Capabilities |
|-------|------|------------------|
| **ArchitectAgent** | System design | Generate architecture docs, component diagrams, tech stack selection |
| **ReviewerAgent** | Code review | Validate code quality, detect anti-patterns, suggest improvements |
| **DebuggerAgent** | Bug detection | Analyze error logs, trace root causes, suggest fixes |
| **ReflectionAgent** | Self-improvement | Analyze past runs, detect failure patterns, optimize prompts |

### 3.2 Multi-Agent Collaboration Protocol

```typescript
interface AgentMessage {
  id: string;
  from: string;        // agent ID
  to: string;          // agent ID or 'broadcast'
  type: 'request' | 'response' | 'handoff' | 'feedback';
  task_id: string;
  payload: {
    action: string;
    context: Record<string, any>;
    artifacts: Artifact[];
  };
  timestamp: string;
}
```

### 3.3 Collaboration Workflow
```
User Prompt
    │
    ▼
┌─────────────┐
│ PlannerAgent │ ──→ Creates execution plan
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ArchitectAgent│ ──→ Designs system architecture
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ResearchAgent │ ──→ Gathers requirements & context
└──────┬───────┘
       │
       ▼
┌─────────────┐
│ CodingAgent │ ──→ Generates code
└──────┬──────┘
       │
       ▼
┌──────────────┐
│ReviewerAgent │ ──→ Reviews code quality ──→ (loop to CodingAgent if needed)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│DebuggerAgent │ ──→ Validates & fixes errors
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ExecutionAgent│ ──→ Runs tests & validates
└──────────────┘
```

### 3.4 Self-Improving Agents (RunHistory + ReflectionAgent)

```typescript
// Every agent run stores:
interface RunRecord {
  id: string;
  agent_id: string;
  task_id: string;
  prompt: string;
  plan: string;
  tools_used: string[];
  output: string;
  success: boolean;
  failure_reason?: string;
  duration_ms: number;
  token_count: number;
  improvements_applied: string[];
}
```

**ReflectionAgent cycle:**
```
1. Query: "Get last 20 failed runs for CodingAgent"
2. Analyze: Common failure patterns
3. Generate: Improved system prompts
4. Store: Improvements in long-term memory
5. Apply: Auto-inject improvements into future runs
```

### Deliverables
- [ ] ArchitectAgent implementation
- [ ] ReviewerAgent implementation
- [ ] DebuggerAgent implementation
- [ ] ReflectionAgent implementation
- [ ] Agent message protocol
- [ ] Run history storage (SQLite)
- [ ] Agent collaboration orchestrator
- [ ] Self-improvement loop

---

## 🟡 Phase 4 — Security & Execution Sandbox
**Duration: 2-3 days · Priority: High**

### 4.1 Sandboxed Execution
```typescript
interface SandboxConfig {
  timeout: number;       // Max execution time (ms)
  maxMemory: number;     // Memory limit (bytes)
  allowedModules: string[];
  workDir: string;       // Isolated temp directory
  networkAccess: boolean;
}

class ExecutionSandbox {
  async execute(code: string, config: SandboxConfig): Promise<SandboxResult>;
  async cleanup(): void;
}
```

### 4.2 Worker Pool
```typescript
class TaskWorkerPool {
  constructor(maxWorkers: number);
  async submit(task: WorkerTask): Promise<WorkerResult>;
  async submitPriority(task: WorkerTask): Promise<WorkerResult>;
  async getStatus(): Promise<PoolStatus>;
}
```

### 4.3 Tool Permission System
```typescript
interface ToolPermissions {
  filesystem: 'read' | 'write' | 'none';
  network: boolean;
  subprocess: boolean;
  dangerousOperations: string[];
}
```

### Deliverables
- [ ] Node `child_process` sandbox with `vm2`
- [ ] Temporary workspace directories
- [ ] Worker pool with concurrency control
- [ ] Tool permission enforcement
- [ ] Rate limiting middleware
- [ ] Input sanitization for all APIs

---

## 🟢 Phase 5 — GitHub Repository Agent
**Duration: 3-4 days · Priority: Medium**

### Module Structure
```
services/github-agent/
├── src/
│   ├── cloner.ts           # Clone repos securely
│   ├── analyzer.ts         # Analyze project structure
│   ├── issueParser.ts      # Parse GitHub issues
│   ├── patchGenerator.ts   # Generate code patches
│   ├── prCreator.ts        # Create pull requests
│   └── index.ts
├── package.json
└── tsconfig.json
```

### APIs
```
POST /api/github/analyze        # Analyze a repository
POST /api/github/fix-issue      # Auto-fix a GitHub issue
POST /api/github/generate-pr    # Generate a pull request
GET  /api/github/repositories   # List scanned repos
```

### Workflow
```
1. User provides GitHub URL + issue number
2. Clone repository to temp workspace
3. Run CodeGraph scan
4. Analyze issue context
5. PlannerAgent creates fix plan
6. CodingAgent generates code changes
7. ReviewerAgent validates changes
8. Generate diff patch
9. Create pull request
```

### Deliverables
- [ ] Repository cloner with SSH/HTTPS support
- [ ] Project structure analyzer
- [ ] Issue context parser
- [ ] Code patch generator
- [ ] PR creation via GitHub API
- [ ] Dashboard UI for repository management

---

## 🟢 Phase 6 — Observability & Reasoning Visualization
**Duration: 3-4 days · Priority: Medium**

### 6.1 System Metrics

**Tracked metrics:**
| Metric | Type | Example |
|--------|------|---------|
| Agent usage | Counter | `planner: 45 runs` |
| Task latency | Histogram | `p50: 2.1s, p99: 8.4s` |
| Tool usage | Counter | `web_search: 120 calls` |
| Model usage | Counter | `llama3.2:1b: 200 calls` |
| Error rate | Rate | `3.2% failure rate` |
| Token throughput | Gauge | `450 tokens/sec` |

**API:**
```
GET /api/metrics                          # All metrics
GET /api/metrics/agents                   # Agent-specific
GET /api/metrics/tools                    # Tool-specific
GET /api/metrics/timeline?range=24h       # Time series
```

### 6.2 Agent Reasoning Graph

**Dashboard visualization:**
```
Task: "Build a REST API for user management"
    │
    ├── 🧠 PlannerAgent
    │   ├── Thought: "Need CRUD endpoints for users"
    │   ├── Plan: [design, implement, test]
    │   └── Handoff → ArchitectAgent
    │
    ├── 📐 ArchitectAgent
    │   ├── Thought: "Express + SQLite + Zod validation"
    │   ├── Design: { routes, schema, middleware }
    │   └── Handoff → CodingAgent
    │
    ├── 💻 CodingAgent
    │   ├── Tool: file_system.write("routes/users.ts")
    │   ├── Tool: file_system.write("schema/users.ts")
    │   ├── Output: 3 files created
    │   └── Handoff → ReviewerAgent
    │
    └── ✅ ReviewerAgent
        ├── Check: "Input validation ✓"
        ├── Check: "Error handling ✓"
        ├── Check: "Type safety ✓"
        └── Result: APPROVED
```

Render using **ReactFlow** or **d3-force** node-graph.

### Deliverables
- [ ] Metrics collection service
- [ ] Time-series storage in SQLite
- [ ] Metrics API endpoints
- [ ] Dashboard: Agent activity timeline
- [ ] Dashboard: Task execution charts
- [ ] Dashboard: System performance overview
- [ ] Agent reasoning graph component
- [ ] Real-time metrics via SSE

---

## 🟢 Phase 7 — Plugin Ecosystem
**Duration: 3-4 days · Priority: Medium**

### Plugin Structure
```
plugins/seo-agent/
├── plugin.json
├── index.ts
├── tools/
│   └── seoAnalyzer.ts
└── prompts/
    └── system.txt
```

### plugin.json Schema
```json
{
  "name": "seo-agent",
  "version": "1.0.0",
  "description": "SEO analysis and optimization agent",
  "author": "AgentOS Community",
  "type": "agent",
  "entry": "index.ts",
  "provides": {
    "agents": ["SEOAgent"],
    "tools": ["seo_analyzer", "keyword_research"],
    "skills": ["seo_audit", "meta_tag_generator"]
  },
  "requires": {
    "agentos": ">=0.1.0",
    "tools": ["web_search"]
  }
}
```

### Plugin Loader
```typescript
class PluginLoader {
  async discover(pluginDir: string): Promise<PluginManifest[]>;
  async load(plugin: PluginManifest): Promise<LoadedPlugin>;
  async unload(pluginId: string): void;
  async enable(pluginId: string): void;
  async disable(pluginId: string): void;
}
```

### Built-in Plugin Examples
| Plugin | Type | Purpose |
|--------|------|---------|
| `seo-agent` | Agent | Website SEO analysis |
| `devops-agent` | Agent | Infrastructure automation |
| `finance-agent` | Agent | Financial data analysis |
| `playwright-tool` | Tool | Browser automation |
| `terminal-tool` | Tool | Shell command execution |

### Deliverables
- [ ] Plugin manifest schema
- [ ] Dynamic plugin loader
- [ ] Plugin registry API
- [ ] Plugin enable/disable
- [ ] Dashboard plugin management UI
- [ ] 3 example plugins
- [ ] Plugin development documentation

---

## 🟡 Phase 8 — OAuth Authentication
**Duration: 2-3 days · Priority: High**

### Supported Providers
| Provider | Strategy | Scope |
|----------|----------|-------|
| GitHub | OAuth 2.0 | `user:email`, `repo` |
| Google | OAuth 2.0 | `email`, `profile` |

### Auth Flow
```
1. User clicks "Login with GitHub"
2. Redirect to GitHub OAuth
3. GitHub redirects back with code
4. Backend exchanges code for token
5. Fetch user profile from GitHub API
6. Create/update user in SQLite
7. Generate session token (JWT)
8. Return token to client
9. Client stores in secure storage
```

### APIs
```
GET  /api/auth/providers          # List available providers
GET  /api/auth/github             # Initiate GitHub OAuth
GET  /api/auth/github/callback    # OAuth callback
GET  /api/auth/google             # Initiate Google OAuth
GET  /api/auth/google/callback    # OAuth callback
POST /api/auth/logout             # Destroy session
GET  /api/auth/me                 # Current user
```

### Mobile Auth
- Use `expo-auth-session` for OAuth redirects
- Store JWT in `expo-secure-store`
- Auto-refresh tokens

### Deliverables
- [ ] GitHub OAuth integration
- [ ] Google OAuth integration
- [ ] JWT session management
- [ ] User CRUD in SQLite
- [ ] Auth middleware (protect routes)
- [ ] Web login page
- [ ] Mobile login screen
- [ ] Token refresh logic

---

## 🔴 Phase 9 — Deployment & Production
**Duration: 2-3 days · Priority: Critical**

### Docker Compose
```yaml
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    depends_on: [backend]

  backend:
    build: ./services/ai-backend
    ports: ["4000:4000"]
    volumes:
      - ./data/sqlite:/app/data
      - ./plugins:/app/plugins
    depends_on: [ollama, chroma]

  ollama:
    image: ollama/ollama:latest
    ports: ["11434:11434"]
    volumes:
      - ollama-models:/root/.ollama

  chroma:
    image: chromadb/chroma:latest
    ports: ["8000:8000"]
    volumes:
      - chroma-data:/chroma/chroma

volumes:
  ollama-models:
  chroma-data:
```

### Production Configs
```
.env.production
├── DATABASE_PATH=/app/data/agentos.db
├── CHROMA_HOST=chroma:8000
├── OLLAMA_HOST=ollama:11434
├── JWT_SECRET=<generated>
├── GITHUB_CLIENT_ID=<your-id>
├── GITHUB_CLIENT_SECRET=<your-secret>
├── NODE_ENV=production
└── PORT=4000
```

### Deliverables
- [ ] Multi-stage Dockerfile for backend
- [ ] Dockerfile for web
- [ ] docker-compose.yml (all services)
- [ ] Production environment configs
- [ ] Health check endpoints
- [ ] Graceful shutdown handling
- [ ] Volume persistence for data
- [ ] README setup instructions

---

## 🟢 Phase 10 — Autonomous Project Builder
**Duration: 4-5 days · Priority: Medium**

### Workflow
```
User: "Build a SaaS analytics dashboard"
    │
    ├── PlannerAgent
    │   └── Generate project plan with milestones
    │
    ├── ResearchAgent
    │   └── Analyze requirements, find best practices
    │
    ├── ArchitectAgent
    │   └── Design system architecture + schema
    │
    ├── CodingAgent
    │   └── Generate project file-by-file
    │
    ├── ReviewerAgent
    │   └── Review each generated file
    │
    └── ExecutionAgent
        └── Run build + tests + validate
```

### API
```
POST /api/projects/generate
  Body: { prompt: "Build a SaaS analytics dashboard" }
  
  Returns SSE stream of progress:
  → Planning...
  → Researching...
  → Designing architecture...
  → Generating code... (file: src/components/Dashboard.tsx)
  → Running tests...
  → ✅ Project complete! 24 files generated.
```

### Deliverables
- [ ] Project generation orchestrator
- [ ] Template system for common project types
- [ ] File writing pipeline
- [ ] Build validation
- [ ] Test execution
- [ ] Dashboard UI for project generation
- [ ] Download as ZIP

---

## 📈 Long-Term Vision (v2.0+)

| Feature | Description | Timeline |
|---------|-------------|----------|
| **Multi-user workspaces** | Teams share agents and projects | Q3 |
| **Agent training** | Fine-tune models on user data | Q3 |
| **Visual agent builder** | Drag-and-drop agent pipeline designer | Q4 |
| **Mobile agent execution** | Run lightweight agents on-device | Q4 |
| **Marketplace** | Community plugin store | Q4 |
| **Agent networking** | Cross-instance agent communication | Q4+ |
| **Browser automation** | Full Playwright integration | Q3 |
| **Voice interface** | Speech-to-text agent control | Q3 |

---

## 🛠️ Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend (Web) | Next.js 16, TanStack Query, ReactFlow | Dashboard |
| Frontend (Mobile) | Expo 55, Moti, React Native | Mobile client |
| Backend | Express, TypeScript, Zod | API server |
| Database | better-sqlite3 (WAL mode) | System database |
| Vector DB | ChromaDB | Embeddings & similarity search |
| AI Models | Ollama (llama3.2, mistral, deepseek-coder) | Local inference |
| Auth | passport-github2, passport-google-oauth20 | OAuth |
| Sandbox | Node child_process, vm2 | Isolated execution |
| Container | Docker, docker-compose | Deployment |
| Code Analysis | TypeScript Compiler API | AST parsing |
| Browser | Playwright | Web automation |

---

## ✅ Quick Start (After MVP)

```bash
# Phase 1: Database
npm install better-sqlite3 chromadb

# Phase 2: CodeGraph — Pure TypeScript, no new deps

# Phase 3: New Agents — Extend existing framework

# Phase 4: Sandbox
npm install vm2

# Phase 5: GitHub Agent
npm install @octokit/rest simple-git

# Phase 6: Observability — d3/reactflow for dashboard

# Phase 7: Plugins — Dynamic import(), no new deps

# Phase 8: Auth
npm install passport passport-github2 passport-google-oauth20 jsonwebtoken

# Phase 9: Docker
docker-compose up --build
```

---

> [!TIP]
> **Execution strategy for 2 developers:**
> - **Dev 1**: Phases 1 → 2 → 4 → 9 (infrastructure track)
> - **Dev 2**: Phases 3 → 5 → 6 → 7 (features track)
> - **Both**: Phase 8 (auth) + Phase 10 (project builder)

---

*Last updated: March 15, 2026*
*Version: Post-MVP Roadmap v1.0*
