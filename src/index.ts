#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer, getServerInfo } from "./server.js";
import http from "http";

const TRANSPORT = process.env.MCP_TRANSPORT ?? "stdio";
const PORT = parseInt(process.env.PORT ?? "3000", 10);

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  const info = getServerInfo();
  console.error(`${info.name} v${info.version} running on stdio`);
}

async function startHttp(): Promise<void> {
  const info = getServerInfo();
  const transports: Record<string, SSEServerTransport> = {};
  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    if (req.method === "GET" && url.pathname === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      transports[transport.sessionId] = transport;
      res.on("close", () => { delete transports[transport.sessionId]; });
      const server = createServer();
      await server.connect(transport);
      return;
    }
    if (req.method === "POST" && url.pathname === "/messages") {
      const sessionId = url.searchParams.get("sessionId") ?? "";
      const transport = transports[sessionId];
      if (!transport) { res.writeHead(404); res.end(JSON.stringify({ error: "Session not found" })); return; }
      await transport.handlePostMessage(req, res);
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });
  httpServer.listen(PORT, () => { console.error(`${info.name} v${info.version} running on HTTP port ${PORT}`); });
}

async function main(): Promise<void> {
  if (TRANSPORT === "http") { await startHttp(); } else { await startStdio(); }
}

main().catch((error) => { console.error("Fatal error:", error); process.exit(1); });
