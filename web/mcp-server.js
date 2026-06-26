#!/usr/bin/env node
// MCP 服务器：提供 web_search + image_search
// 支持 HTTP 和 stdio 两种传输模式
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const DDG = require("duckduckgo-images-api");
const express = require("express");

const PORT = process.env.MCP_PORT || 3456;
const useHttp = process.argv.includes("--http");

const server = new Server(
  { name: "web-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "web_search",
      description: "搜索网络获取最新信息，返回标题和摘要",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" },
          count: { type: "number", description: "返回条数", default: 5 },
        },
        required: ["query"],
      },
    },
    {
      name: "image_search",
      description: "搜索网络图片，返回图片URL列表。适合搜人物照片、医院大楼、产品图",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" },
          count: { type: "number", description: "返回图片数", default: 3 },
        },
        required: ["query"],
      },
    },
  ],
}));

async function handleToolCall(name, args) {
  if (name === "web_search") {
    const q = encodeURIComponent(args?.query || "");
    try {
      const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const html = await res.text();
      const results = [];
      const re = /<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/g;
      let m;
      while ((m = re.exec(html)) !== null && results.length < (args?.count || 5)) {
        results.push({ title: m[1].replace(/<[^>]+>/g, "").trim() });
      }
      return results.length ? results : "未找到结果";
    } catch { return "搜索失败"; }
  }

  if (name === "image_search") {
    try {
      const images = await DDG.image_search({ query: args?.query || "", moderate: true, iterations: 1 });
      return (images || []).slice(0, args?.count || 3).map(i => ({
        title: i.title || "", url: i.image || i.thumbnail || "",
      }));
    } catch (e) { return `图片搜索失败`; }
  }
  throw new Error(`未知工具: ${name}`);
}

// —— stdio 模式 ——
if (!useHttp) {
  const transport = new StdioServerTransport();
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const result = await handleToolCall(req.params.name, req.params.arguments);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  });
  server.connect(transport);
  return;
}

// —— HTTP 模式 ——
const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const { method, params } = req.body || {};

  if (method === "tools/list") {
    const tools = (await server.requestHandlers[ListToolsRequestSchema]()).tools;
    return res.json({ tools, jsonrpc: "2.0", id: params?.id });
  }

  if (method === "tools/call") {
    const result = await handleToolCall(params?.name, params?.arguments);
    return res.json({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      jsonrpc: "2.0",
      id: params?.id,
    });
  }

  res.status(400).json({ error: "unknown method" });
});

app.listen(PORT, () => {
  console.error(`MCP server running on http://localhost:${PORT}/mcp`);
});
