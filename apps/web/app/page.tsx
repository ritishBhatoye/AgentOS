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
  memory?: { shortTerm: any; longTerm: { total: number; byType: Record<string, number> } };
  tools?: string[];
  sseClients?: number;
}

interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
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
type Page = "dashboard" | "chat" | "agents" | "tasks" | "models" | "events" | "memory" | "logs";

const NAV_ITEMS: Array<{ id: Page; icon: string; label: string }> = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "chat", icon: "💬", label: "AI Chat" },
  { id: "agents", icon: "🤖", label: "Agents" },
  { id: "tasks", icon: "📋", label: "Tasks" },
  { id: "models", icon: "🧠", label: "Models" },
  { id: "events", icon: "⚡", label: "Live Events" },
  { id: "memory", icon: "🧬", label: "Memory" },
  { id: "logs", icon: "📝", label: "Logs" },
];

// ─── Main App ──────────────────────────────────────────────
export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sseEvents, setSseEvents] = useState<SSEEvent[]>([]);

  // SSE Connection
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_BASE}/events`);
      const eventTypes = ['agent:status', 'agent:thought', 'agent:tool_call', 'agent:tool_result', 'agent:output', 'task:created', 'task:completed', 'task:failed', 'system:log', 'memory:stored'];
      eventTypes.forEach(type => {
        es!.addEventListener(type, (e: MessageEvent) => {
          try {
            const event = JSON.parse(e.data) as SSEEvent;
            setSseEvents(prev => [...prev.slice(-200), event]);
          } catch {}
        });
      });
      es.onerror = () => { /* reconnect handled by browser */ };
    } catch {}
    return () => { es?.close(); };
  }, []);

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
              {health?.status === "healthy" ? "System Healthy" : health ? "Degraded (no Ollama)" : "System Offline"}
            </div>
          </div>
        </header>

        <div className="page-content">
          {currentPage === "dashboard" && <DashboardPage health={health} isLoading={isLoading} />}
          {currentPage === "chat" && <ChatPage />}
          {currentPage === "agents" && <AgentsPage health={health} />}
          {currentPage === "tasks" && <TasksPage />}
          {currentPage === "models" && <ModelsPage health={health} />}
          {currentPage === "events" && <EventsPage events={sseEvents} />}
          {currentPage === "memory" && <MemoryPage />}
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
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch {}
  }, []);

  const selectConversation = async (id: string) => {
    setConversationId(id);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
      }
    } catch {}
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
        fetchConversations(); // Refresh list
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
    <div className="grid-chat" style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: "calc(100vh - 160px)", gap: 20 }}>
      {/* Search/History Sidebar */}
      <div className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>History</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {conversations.length === 0 ? (
             <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No history</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: conversationId === conv.id ? "var(--bg-tertiary)" : "transparent",
                  fontSize: 13
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  {conv.title || "New Chat"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {conv.messageCount} messages · {new Date(conv.updatedAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
        <button
          className="btn"
          style={{ margin: 12, background: "var(--bg-tertiary)" }}
          onClick={() => { setConversationId(null); setMessages([]); }}
        >
          + New Chat
        </button>
      </div>

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
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<any>(null);

  const fetchTasks = useCallback(async () => {
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
  }, []);

  const fetchTaskDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`);
      const data = await res.json();
      if (data.success) {
        setTaskDetail(data.data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskDetail(selectedTaskId);
    } else {
      setTaskDetail(null);
    }
  }, [selectedTaskId, fetchTaskDetail]);

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

      <div className="grid-chat" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: 16 }}>
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
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{ cursor: "pointer", background: selectedTaskId === task.id ? "var(--bg-tertiary)" : "transparent" }}
                    >
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

        {/* Task Detail Pane */}
        <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div className="card-header">
            <div>
              <div className="card-title">🔍 Task Detail</div>
              <div className="card-subtitle">{selectedTaskId ? `Inspecting ${selectedTaskId.substring(0, 8)}` : "Select a task to see details"}</div>
            </div>
          </div>
          {taskDetail ? (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Prompt</div>
                <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>{taskDetail.prompt}</div>
              </div>

              {taskDetail.subtaskIds?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Subtasks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {taskDetail.subtaskIds.map((sid: string) => (
                      <div key={sid} style={{ padding: 10, background: "var(--bg-tertiary)", borderRadius: 6, fontSize: 12 }}>
                        🆔 {sid.substring(0, 8)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Results / Output</div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  background: "var(--bg-primary)",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontFamily: "var(--font-mono)"
                }}>
                  {taskDetail.finalOutput || taskDetail.error || "No output yet..."}
                </div>
              </div>

              {taskDetail.metadata && Object.keys(taskDetail.metadata).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Metadata</div>
                  <pre style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: 8, borderRadius: 4 }}>
                    {JSON.stringify(taskDetail.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ height: "100%", justifyContent: "center" }}>
              <div className="empty-state-icon" style={{ fontSize: 32 }}>📝</div>
              <p className="empty-state-text">No task selected</p>
            </div>
          )}
        </div>
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

// ─── Events Page (SSE Live Feed) ──────────────────────────
function EventsPage({ events }: { events: SSEEvent[] }) {
  const getEventIcon = (type: string) => {
    if (type.startsWith('agent:thought')) return '💭';
    if (type.startsWith('agent:tool')) return '🔧';
    if (type.startsWith('agent:output')) return '📤';
    if (type.startsWith('agent:status')) return '🤖';
    if (type.startsWith('task:created')) return '📋';
    if (type.startsWith('task:completed')) return '✅';
    if (type.startsWith('task:failed')) return '❌';
    if (type.startsWith('memory')) return '🧬';
    return '⚡';
  };

  const getEventColor = (type: string) => {
    if (type.includes('completed')) return 'badge-success';
    if (type.includes('failed')) return 'badge-danger';
    if (type.includes('tool')) return 'badge-warning';
    if (type.includes('thought')) return 'badge-info';
    return 'badge-purple';
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">⚡ Live Agent Events</div>
          <div className="card-subtitle">Real-time SSE stream from the AI backend ({events.length} events)</div>
        </div>
      </div>
      {events.length > 0 ? (
        <div style={{ maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}>
          {[...events].reverse().map((event, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span style={{ marginRight: 8 }}>{getEventIcon(event.type)}</span>
              <span className={`badge ${getEventColor(event.type)}`} style={{ marginRight: 8 }}>
                {event.type}
              </span>
              <span className="log-message" style={{ fontSize: 12 }}>
                {JSON.stringify(event.data).substring(0, 200)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <p className="empty-state-text">Waiting for events...</p>
          <p className="empty-state-subtext">Events stream in real-time when agents process requests</p>
        </div>
      )}
    </div>
  );
}

// ─── Memory Page ──────────────────────────────────────────
function MemoryPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch(`${API_BASE}/memory`);
        const data = await res.json();
        if (data.success) {
          setEntries(data.data.entries);
          setStats(data.data.stats);
        }
      } catch {}
    };
    fetchMemory();
    const interval = setInterval(fetchMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    try {
      const res = await fetch(`${API_BASE}/memory/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setSearchResults(data.data);
    } catch {}
  };

  const displayEntries = searchResults || entries;

  return (
    <>
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">🧬</div>
            <div className="stat-info">
              <div className="stat-value">{stats.longTerm?.total || 0}</div>
              <div className="stat-label">Total Memories</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan">💬</div>
            <div className="stat-info">
              <div className="stat-value">{stats.shortTerm?.conversations || 0}</div>
              <div className="stat-label">Active Conversations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">📝</div>
            <div className="stat-info">
              <div className="stat-value">{stats.shortTerm?.totalTurns || 0}</div>
              <div className="stat-label">Conversation Turns</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, padding: 4 }}>
          <input
            style={{
              flex: 1, background: "var(--bg-tertiary)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--text-primary)",
              fontSize: 14, outline: "none"
            }}
            placeholder="Search memory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
          {searchResults && (
            <button className="btn" style={{ background: "var(--bg-tertiary)" }} onClick={() => setSearchResults(null)}>Clear</button>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">🧬 Memory Entries</div>
            <div className="card-subtitle">{searchResults ? `${searchResults.length} search results` : `${entries.length} stored memories`}</div>
          </div>
        </div>
        {displayEntries.length > 0 ? (
          <div style={{ maxHeight: "calc(100vh - 400px)", overflowY: "auto" }}>
            {displayEntries.map((entry: any) => (
              <div key={entry.id} style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                fontSize: 13
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className={`badge ${entry.type === 'conversation' ? 'badge-info' : entry.type === 'task' ? 'badge-warning' : 'badge-purple'}`}>
                    {entry.type}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {entry.content.substring(0, 300)}{entry.content.length > 300 ? "..." : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🧬</div>
            <p className="empty-state-text">No memories stored yet</p>
            <p className="empty-state-subtext">Memories are created when agents process tasks and conversations</p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Helpers ───────────────────────────────────────────────
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
