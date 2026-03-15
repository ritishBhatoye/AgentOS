# 🚀 AgentOS — AI Agent Platform

> A multi-agent AI operating system built with Next.js, Expo, and Ollama.  
> Open-source, local-first, zero infrastructure cost.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-FF6F00?style=for-the-badge&logo=data:image/png;base64,&logoColor=white)

## ✨ Features

- 🤖 **Multi-Agent System** — Planner, Coding, Research, and Execution agents
- 🔀 **Intelligent Model Router** — Auto-selects the best model per task type
- 💬 **AI Chat Interface** — Conversational AI with context memory
- 📊 **Monitoring Dashboard** — Real-time agent status, task queue, and system logs
- 🧠 **Memory System** — Short-term, long-term, and persistent memory
- 🛠️ **Tool System** — Web search, code execution, file I/O, browser automation
- 📱 **Mobile App** — Expo React Native companion app
- ⚡ **Local-First** — Runs entirely on your machine with Ollama

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 Clients                      │
│  ┌──────────┐          ┌──────────────┐     │
│  │ Next.js  │          │ Expo Mobile  │     │
│  │ Dashboard │          │    App       │     │
│  └─────┬────┘          └──────┬───────┘     │
│        └──────────┬───────────┘             │
│              REST API                        │
├─────────────────────────────────────────────┤
│            AI Backend (Express)              │
│  ┌──────┐  ┌──────┐  ┌────────┐  ┌──────┐ │
│  │Router│  │Agents│  │ Tools  │  │Memory│ │
│  └──┬───┘  └──┬───┘  └──┬─────┘  └──┬───┘ │
├─────┼─────────┼─────────┼───────────┼──────┤
│     │    Ollama (Local LLMs)         │      │
│  ┌──┴────┐ ┌──┴────┐ ┌──┴────────┐ │      │
│  │Llama3 │ │Mistral│ │DeepSeek   │ │      │
│  │       │ │       │ │  Coder    │ │      │
│  └───────┘ └───────┘ └───────────┘ │      │
│                              ┌─────┴────┐  │
│                              │SQLite +   │  │
│                              │Chroma     │  │
│                              └──────────┘  │
└─────────────────────────────────────────────┘
```

## 📁 Project Structure

```
AgentOS/
├── apps/
│   ├── web/           → Next.js Dashboard
│   └── mobile/        → Expo Mobile App
├── services/
│   └── ai-backend/    → Express AI Server
├── packages/
│   ├── types/         → Shared TypeScript types
│   ├── ui/            → Shared UI components
│   └── config/        → Shared configs
├── turbo.json         → Turborepo config
└── package.json       → Root workspace
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai/) installed and running
- Git

### 1. Install Ollama Models

```bash
ollama pull llama3
ollama pull mistral
ollama pull deepseek-coder
```

### 2. Clone & Install

```bash
git clone <your-repo-url> AgentOS
cd AgentOS
npm install
```

### 3. Start Development

```bash
# Start all services (web + backend)
npm run dev
```

- 🌐 **Web Dashboard**: http://localhost:3000
- ⚡ **AI Backend**: http://localhost:4000
- 📱 **Mobile**: Start separately with `cd apps/mobile && npx expo start`

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Send a chat message |
| `POST` | `/api/chat/stream` | Streaming chat response |
| `POST` | `/api/agents/execute` | Execute agent task |
| `GET`  | `/api/agents/status` | Get agent statuses |
| `GET`  | `/api/tasks` | List all tasks |
| `GET`  | `/api/models` | List available models |
| `GET`  | `/api/health` | System health check |
| `GET`  | `/api/health/logs` | Get system logs |

## 🤖 Agents

| Agent | Specialization | Default Model |
|-------|---------------|---------------|
| 🧠 Planner | Task decomposition & planning | Llama3 |
| 💻 Coding | Code generation & debugging | DeepSeek-Coder |
| 🔍 Research | Information gathering & analysis | Llama3/Mistral |
| ⚙️ Execution | Command execution & automation | Llama3 |

## 🔀 Model Routing

The model router automatically selects the best AI model based on task type:

| Task Type | Primary Model | Fallback |
|-----------|--------------|----------|
| Coding | deepseek-coder | llama3 |
| Reasoning | llama3 | mistral |
| Conversation | mistral | llama3 |
| Analysis | llama3 | deepseek-coder |

## 📋 License

MIT License — Build amazing things.

---

Built with ❤️ by Ritish Bhatoye
