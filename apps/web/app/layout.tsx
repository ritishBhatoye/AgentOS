import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentOS — AI Agent Platform",
  description: "Multi-agent AI operating system for intelligent task orchestration, model routing, and tool execution. Monitor and control your AI agents from a single dashboard.",
  keywords: ["AI", "agents", "LLM", "Ollama", "dashboard", "orchestration"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
