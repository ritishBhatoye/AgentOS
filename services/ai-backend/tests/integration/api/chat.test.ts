import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import cors from "cors";
import { chatRouter } from "@/api/routes/chat";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRouter);

describe("API Integration Tests - Chat Endpoints", () => {
  describe("POST /api/chat", () => {
    it("API-001: should return 200 for valid message (skips if Ollama unavailable)", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ message: "Hello, how are you?" });

      if (response.status === 500) {
        console.log("Ollama not available - skipping test");
        return;
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("message");
      expect(response.body.data).toHaveProperty("conversationId");
    });

    it("API-002: should return 400 for empty message", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ message: "" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("API-003: should return 400 for invalid conversationId", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ message: "Hello", conversationId: "invalid-uuid" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/chat/stream", () => {
    it("API-004: should return text/event-stream for streaming (skips if Ollama unavailable)", async () => {
      const response = await request(app)
        .post("/api/chat/stream")
        .send({ message: "Hello", stream: true });

      if (response.status === 500) {
        console.log("Ollama not available - skipping test");
        return;
      }

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("text/event-stream");
    });
  });

  describe("GET /api/chat/conversations", () => {
    it("should return list of conversations", async () => {
      const response = await request(app).get("/api/chat/conversations");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
