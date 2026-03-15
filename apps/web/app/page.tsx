"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────
interface HealthData {
  status: string;
  version: string;
  uptime: number;
  ollama: { connected: boolean; models: string[] };
  agents: Record<string, { id: string; name: string; status: string; description: string; capabilities: string[] }>;
  tasks: { total: number; pending: number; running: number; completed: number; failed: number };
  conversations: { total: number; totalMessages: number };
}

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  timestamp: string;
}

// ─── Config ────────────────────────────────────────────────
const API_BASE = "http://localhost:4000/api";

// ─── Navigation ────────────────────────────────────────────
type Page = "dashboard" | "chat" | "agents" | "tasks" | "models" | "logs";

const NAV_ITEMS: Array<{ id: Page; icon: string; label: string }> = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "agents", icon: "🤖", label: "Agents" },
  { id: "tasks", icon: "📋", label: "Tasks" },
  { id: "models", icon: "🧠", label: "Models" },
  { id: "logs", icon: "📝", label: "Logs" },
];

// ─── Main App ──────────────────────────────────────────────
export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      if (data.success) {
        setHealth(data.data);
      }
    } catch {
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">A</div>
            <div>
              <div className="sidebar-logo-text">AgentOS</div>
              <div className="sidebar-logo-version">v0.1.0 Alpha</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Overview</div>
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <a
              key={item.id}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}

          <div className="sidebar-section-label">Management</div>
          {NAV_ITEMS.slice(2).map((item) => (
            <a
              key={item.id}
              className={`nav-item ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
              {item.id === "tasks" && health?.tasks && health.tasks.running > 0 && (
                <span className="nav-item-badge">{health.tasks.running}</span>
              )}
            </a>
          ))}
        </nav>

        {/* Connection Status */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
          <div className="header-status" style={{ width: "100%", justifyContent: "center" }}>
            <span className={`status-dot ${health?.ollama?.connected ? "online" : "offline"}`} />
            {health?.ollama?.connected ? "Ollama Connected" : "Ollama Offline"}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">
            {NAV_ITEMS.find((n) => n.id === currentPage)?.icon}{" "}
            {NAV_ITEMS.find((n) => n.id === currentPage)?.label}
          </h1>
          <div className="header-actions">
            <div className="header-status">
              <span className={`status-dot ${health ? "online" : "offline"}`} />
              {health?.status === "healthy" ? "System Healthy" : "System Offline"}
            </div>
          </div>
        </header>

        <div className="page-content">
          {currentPage === "dashboard" && <DashboardPage health={health} isLoading={isLoading} />}
          {currentPage === "chat" && <ChatPage />}
          {currentPage === "agents" && <AgentsPage health={health} />}
          {currentPage === "tasks" && <TasksPage />}
          {currentPage === "models" && <ModelsPage health={health} />}
          {currentPage === "logs" && <LogsPage />}
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Page ────────────────────────────────────────
function DashboardPage({ health, isLoading }: { health: HealthData | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="loading-spinner" />
        <p className="empty-state-text" style={{ marginTop: 16 }}>Loading dashboard...</p>
      </div>
    );
  }

  const agentCount = health ? Object.keys(health.agents).length : 0;
  const modelCount = health?.ollama?.models?.length || 0;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">🤖</div>
          <div className="stat-info">
            <div className="stat-value">{agentCount}</div>
            <div className="stat-label">Active Agents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🧠</div>
          <div className="stat-info">
            <div className="stat-value">{modelCount}</div>
            <div className="stat-label">AI Models</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="stat-value">{health?.tasks?.completed || 0}</div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{health?.tasks?.running || 0}</div>
            <div className="stat-label">Running Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan">💬</div>
          <div className="stat-info">
            <div className="stat-value">{health?.conversations?.total || 0}</div>
            <div className="stat-label">Conversations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{health ? formatUptime(health.uptime) : "—"}</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Agent Status */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🤖 Agent Fleet</div>
              <div className="card-subtitle">Status of all registered agents</div>
            </div>
          </div>
          {health?.agents ? (
            Object.values(health.agents).map((agent: any) => (
              <div key={agent.id} className="agent-card" style={{ marginBottom: 12 }}>
                <div className="agent-header">
                  <div className="agent-avatar">
                    {agent.id === "planner" ? "🧠" :
                     agent.id === "coding" ? "💻" :
                     agent.id === "research" ? "🔍" : "⚙️"}
                  </div>
                  <div>
                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-description">{agent.description}</div>
                  </div>
                </div>
                <span className={`agent-status ${agent.status}`}>
                  <span className={`status-dot ${agent.status === "idle" ? "online" : "offline"}`} />
                  {agent.status}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">No agents connected</p>
            </div>
          )}
        </div>

        {/* Models */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🧠 Available Models</div>
              <div className="card-subtitle">Ollama models ready for inference</div>
            </div>
          </div>
          {health?.ollama?.models?.length ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {health.ollama.models.map((model: string) => (
                    <tr key={model}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{model}</td>
                      <td><span className="badge badge-success">● Available</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🧠</div>
              <p className="empty-state-text">No models found</p>
              <p className="empty-state-subtext">Install models with: ollama pull llama3</p>
            </div>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">⚡ System Information</div>
            <div className="card-subtitle">Backend configuration and status</div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <tbody>
              <tr><td style={{ fontWeight: 600, width: 200 }}>Status</td><td><span className={`badge ${health?.status === "healthy" ? "badge-success" : "badge-danger"}`}>{health?.status || "offline"}</span></td></tr>
              <tr><td style={{ fontWeight: 600 }}>Version</td><td>{health?.version || "—"}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Ollama Host</td><td style={{ fontFamily: "var(--font-mono)" }}>{health?.ollama ? "http://localhost:11434" : "—"}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Ollama Connected</td><td><span className={`badge ${health?.ollama?.connected ? "badge-success" : "badge-danger"}`}>{health?.ollama?.connected ? "Yes" : "No"}</span></td></tr>
              <tr><td style={{ fontWeight: 600 }}>Total Tasks</td><td>{health?.tasks?.total || 0}</td></tr>
              <tr><td style={{ fontWeight: 600 }}>Total Conversations</td><td>{health?.conversations?.total || 0}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Chat Page ─────────────────────────────────────────────
function ChatPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMsg: ConversationMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationId: conversationId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConversationId(data.data.conversationId);
        setMessages((prev) => [...prev, data.data.message]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "⚠️ Failed to connect to AI backend. Make sure Ollama is running.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <p className="empty-state-text">Start a conversation with AgentOS</p>
            <p className="empty-state-subtext">Your messages are routed to the best AI model automatically</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            {msg.content}
            {msg.model && (
              <div className="chat-message-meta">
                via {msg.model}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="chat-message assistant">
            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows={1}
            disabled={isStreaming}
          />
          <button
            className="btn btn-primary btn-icon"
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            style={{ width: 50, height: 50, fontSize: 20 }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Agents Page ───────────────────────────────────────────
function AgentsPage({ health }: { health: HealthData | null }) {
  if (!health?.agents) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🤖</div>
        <p className="empty-state-text">Backend offline</p>
        <p className="empty-state-subtext">Start the AI backend to see agents</p>
      </div>
    );
  }

  return (
    <div className="grid-2">
      {Object.values(health.agents).map((agent: any) => (
        <div key={agent.id} className="card">
          <div className="agent-header">
            <div className="agent-avatar" style={{ width: 56, height: 56, fontSize: 28 }}>
              {agent.id === "planner" ? "🧠" :
               agent.id === "coding" ? "💻" :
               agent.id === "research" ? "🔍" : "⚙️"}
            </div>
            <div>
              <div className="agent-name" style={{ fontSize: 18 }}>{agent.name}</div>
              <span className={`agent-status ${agent.status}`}>
                <span className={`status-dot ${agent.status === "idle" ? "online" : "offline"}`} />
                {agent.status}
              </span>
            </div>
          </div>
          <p className="agent-description" style={{ margin: "12px 0", fontSize: 13 }}>
            {agent.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {agent.capabilities?.map((cap: string) => (
              <span key={cap} className="badge badge-purple">{cap}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tasks Page ────────────────────────────────────────────
function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE}/tasks`);
        const data = await res.json();
        if (data.success) {
          setTasks(data.data.tasks);
          setStats(data.data.stats);
        }
      } catch {
        // Backend offline
      }
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📋</div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">⏳</div>
            <div className="stat-info">
              <div className="stat-value">{stats.running}</div>
              <div className="stat-label">Running</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✅</div>
            <div className="stat-info">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">❌</div>
            <div className="stat-info">
              <div className="stat-value">{stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 Task Queue</div>
            <div className="card-subtitle">All agent tasks and their status</div>
          </div>
        </div>
        {tasks.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Type</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => (
                  <tr key={task.id}>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{task.id.substring(0, 8)}...</td>
                    <td><span className="badge badge-info">{task.type}</span></td>
                    <td>{task.assignedTo || "—"}</td>
                    <td>
                      <span className={`badge ${
                        task.status === "completed" ? "badge-success" :
                        task.status === "running" ? "badge-warning" :
                        task.status === "failed" ? "badge-danger" : "badge-info"
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No tasks yet</p>
            <p className="empty-state-subtext">Tasks appear when agents process requests</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Models Page ───────────────────────────────────────────
function ModelsPage({ health }: { health: HealthData | null }) {
  const models = health?.ollama?.models || [];

  const MODEL_INFO: Record<string, { desc: string; routing: string; color: string }> = {
    "llama3": { desc: "General-purpose reasoning model", routing: "Reasoning, Analysis, Planning", color: "var(--accent-blue)" },
    "mistral": { desc: "Fast conversational model", routing: "Conversation, General", color: "var(--accent-cyan)" },
    "deepseek-coder": { desc: "Code-specialized model", routing: "Coding, Debugging, Code Review", color: "var(--accent-purple)" },
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">🔀 Model Router</div>
            <div className="card-subtitle">Intelligent model selection based on task type</div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Task Type</th>
                <th>Primary Model</th>
                <th>Fallback</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>💻 Coding</td><td>deepseek-coder</td><td>llama3</td></tr>
              <tr><td>🧠 Reasoning</td><td>llama3</td><td>mistral</td></tr>
              <tr><td>💬 Conversation</td><td>mistral</td><td>llama3</td></tr>
              <tr><td>📊 Analysis</td><td>llama3</td><td>deepseek-coder</td></tr>
              <tr><td>📋 Planning</td><td>llama3</td><td>mistral</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-3">
        {Object.entries(MODEL_INFO).map(([id, info]) => {
          const isAvailable = models.some((m) => m.startsWith(id));
          return (
            <div key={id} className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-md)",
                  background: `${info.color}15`, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 20
                }}>
                  🧠
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{id}</div>
                  <span className={`badge ${isAvailable ? "badge-success" : "badge-danger"}`}>
                    {isAvailable ? "Available" : "Not Installed"}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 10 }}>{info.desc}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <strong>Routes:</strong> {info.routing}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Logs Page ─────────────────────────────────────────────
function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/health/logs?limit=100`);
        const data = await res.json();
        if (data.success) {
          setLogs(data.data);
        }
      } catch {
        // Backend offline
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">📝 System Logs</div>
          <div className="card-subtitle">Real-time server activity</div>
        </div>
      </div>
      {logs.length > 0 ? (
        <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          {logs.map((log: any, i: number) => (
            <div key={i} className="log-entry">
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`log-level ${log.level}`}>{log.level}</span>
              <span className="log-source">[{log.source}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">No logs yet</p>
          <p className="empty-state-subtext">Logs appear when the backend processes requests</p>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
