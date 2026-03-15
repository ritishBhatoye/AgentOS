// ============================================================
// AgentOS — Task Queue
// In-memory task queue for agent task management
// ============================================================

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskType = 'coding' | 'reasoning' | 'conversation' | 'analysis' | 'planning';

export interface QueuedTask {
  id: string;
  type: TaskType;
  prompt: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  result?: string;
  error?: string;
  parentTaskId?: string;
  subtaskIds: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

class TaskQueue {
  private tasks: Map<string, QueuedTask> = new Map();

  add(task: QueuedTask): void {
    this.tasks.set(task.id, task);
  }

  getTask(id: string): QueuedTask | undefined {
    return this.tasks.get(id);
  }

  updateStatus(id: string, status: TaskStatus, result?: string, error?: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = status;
      task.updatedAt = new Date().toISOString();
      if (result) task.result = result;
      if (error) task.error = error;
      if (status === 'completed' || status === 'failed') {
        task.completedAt = new Date().toISOString();
      }
    }
  }

  getAllTasks(): QueuedTask[] {
    return Array.from(this.tasks.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getTasksByStatus(status: TaskStatus): QueuedTask[] {
    return this.getAllTasks().filter(t => t.status === status);
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
    };
  }

  clear(): void {
    this.tasks.clear();
  }
}

export const taskQueue = new TaskQueue();
