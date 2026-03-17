import { describe, it, expect } from "vitest";
import {
  classifyTask,
  selectModel,
  isModelRegistered,
  getModelProfiles,
} from "@/router/selectModel";

describe("Model Router - classifyTask", () => {
  it("MR-001: should route coding tasks to coding type", () => {
    const result = classifyTask("write a function to sort array");
    expect(result.taskType).toBe("coding");
  });

  it("MR-002: should route reasoning tasks to reasoning type", () => {
    const result = classifyTask("explain how binary search works");
    expect(result.taskType).toBe("reasoning");
  });

  it("MR-003: should route conversation tasks to conversation type", () => {
    const result = classifyTask("hello, how are you?");
    expect(result.taskType).toBe("conversation");
  });

  it("MR-004: should route planning tasks to planning type", () => {
    const result = classifyTask("create a project roadmap");
    expect(result.taskType).toBe("planning");
  });

  it("MR-005: should route analysis tasks to analysis type", () => {
    const result = classifyTask("analyze the performance metrics");
    expect(result.taskType).toBe("analysis");
  });

  it("MR-006: should handle ambiguous prompts with combined keywords", () => {
    const result = classifyTask("explain how to write a function in python");
    expect(result.taskType).toBe("coding");
  });

  it("should return confidence score between 0 and 1", () => {
    const result = classifyTask("code a function");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should handle non-English input gracefully", () => {
    const result = classifyTask("bonjour comment ça va");
    expect(result.taskType).toBe("conversation");
  });
});

describe("Model Router - selectModel", () => {
  it("MR-001: should select deepseek-coder for coding tasks", () => {
    const result = selectModel("write a function to sort array");
    expect(result.model).toBe("deepseek-coder");
  });

  it("MR-002: should select llama3 for reasoning tasks", () => {
    const result = selectModel("explain how binary search works");
    expect(result.model).toBe("llama3");
  });

  it("MR-003: should select mistral for conversation tasks", () => {
    const result = selectModel("hello, how are you?");
    expect(result.model).toBe("mistral");
  });

  it("MR-006: should use preferred model override when provided", () => {
    const result = selectModel("code function", "mistral");
    expect(result.model).toBe("mistral");
  });

  it("should include fallback model in result", () => {
    const result = selectModel("hello");
    expect(result.fallback).toBeDefined();
  });

  it("should return task type and confidence", () => {
    const result = selectModel("code function");
    expect(result.taskType).toBe("coding");
    expect(result.confidence).toBeGreaterThan(0);
  });
});

describe("Model Router - getModelProfiles", () => {
  it("should return all registered models", () => {
    const profiles = getModelProfiles();
    expect(profiles).toHaveLength(3);
    expect(profiles.map((p) => p.id)).toContain("deepseek-coder");
    expect(profiles.map((p) => p.id)).toContain("llama3");
    expect(profiles.map((p) => p.id)).toContain("mistral");
  });
});

describe("Model Router - isModelRegistered", () => {
  it("should return true for registered models", () => {
    expect(isModelRegistered("llama3")).toBe(true);
    expect(isModelRegistered("deepseek-coder")).toBe(true);
    expect(isModelRegistered("mistral")).toBe(true);
  });

  it("should return false for unregistered models", () => {
    expect(isModelRegistered("gpt-4")).toBe(false);
    expect(isModelRegistered("invalid-model")).toBe(false);
  });
});
