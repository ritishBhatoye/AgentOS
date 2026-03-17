import { describe, it, expect, beforeEach } from "vitest";
import { taskQueue, QueuedTask, TaskStatus } from "@/agents/taskQueue";
import { v4 as uuidv4 } from "uuid";

describe("Task Queue - TQ-001: Add task", () => {
  beforeEach(() => {
    taskQueue.clear();
  });

  it("should add a new task to the queue", () => {
    const task: QueuedTask = {
      id: uuidv4(),
      type: "coding",
      prompt: "Write a hello world function",
      status: "pending",
      priority: "medium",
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    taskQueue.add(task);
    const allTasks = taskQueue.getAllTasks();
    expect(allTasks).toHaveLength(1);
    expect(allTasks[0].id).toBe(task.id);
  });
});

describe("Task Queue - TQ-002: Update status", () => {
  beforeEach(() => {
    taskQueue.clear();
  });

  it("should update task status to completed", () => {
    const taskId = uuidv4();
    const task: QueuedTask = {
      id: taskId,
      type: "coding",
      prompt: "Write a function",
      status: "pending",
      priority: "medium",
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    taskQueue.add(task);
    taskQueue.updateStatus(
      taskId,
      "completed",
      "Function written successfully",
    );

    const updatedTask = taskQueue.getTask(taskId);
    expect(updatedTask?.status).toBe("completed");
    expect(updatedTask?.result).toBe("Function written successfully");
    expect(updatedTask?.completedAt).toBeDefined();
  });

  it("should update task status to failed with error", () => {
    const taskId = uuidv4();
    const task: QueuedTask = {
      id: taskId,
      type: "coding",
      prompt: "Write a function",
      status: "running",
      priority: "medium",
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    taskQueue.add(task);
    taskQueue.updateStatus(taskId, "failed", undefined, "Task failed");

    const updatedTask = taskQueue.getTask(taskId);
    expect(updatedTask?.status).toBe("failed");
    expect(updatedTask?.error).toBe("Task failed");
    expect(updatedTask?.completedAt).toBeDefined();
  });
});

describe("Task Queue - TQ-003: Get by status", () => {
  beforeEach(() => {
    taskQueue.clear();
  });

  it("should filter tasks by running status", () => {
    const runningTask: QueuedTask = {
      id: uuidv4(),
      type: "coding",
      prompt: "Task 1",
      status: "running",
      priority: "medium",
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const completedTask: QueuedTask = {
      id: uuidv4(),
      type: "reasoning",
      prompt: "Task 2",
      status: "completed",
      priority: "medium",
      subtaskIds: [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    taskQueue.add(runningTask);
    taskQueue.add(completedTask);

    const runningTasks = taskQueue.getTasksByStatus("running");
    expect(runningTasks).toHaveLength(1);
    expect(runningTasks[0].id).toBe(runningTask.id);
  });
});

describe("Task Queue - TQ-004: Task statistics", () => {
  beforeEach(() => {
    taskQueue.clear();
  });

  it("should return accurate task counts", () => {
    const tasks: QueuedTask[] = [
      {
        id: uuidv4(),
        type: "coding",
        prompt: "Task 1",
        status: "pending",
        priority: "low",
        subtaskIds: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        type: "coding",
        prompt: "Task 2",
        status: "running",
        priority: "medium",
        subtaskIds: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        type: "coding",
        prompt: "Task 3",
        status: "completed",
        priority: "high",
        subtaskIds: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        type: "coding",
        prompt: "Task 4",
        status: "completed",
        priority: "critical",
        subtaskIds: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        type: "coding",
        prompt: "Task 5",
        status: "failed",
        priority: "low",
        subtaskIds: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    tasks.forEach((task) => taskQueue.add(task));

    const stats = taskQueue.getStats();
    expect(stats.total).toBe(5);
    expect(stats.pending).toBe(1);
    expect(stats.running).toBe(1);
    expect(stats.completed).toBe(2);
    expect(stats.failed).toBe(1);
  });
});
