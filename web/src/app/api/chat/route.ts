import { queryDB } from "@/lib/db";
import { searchKnowledge } from "@/lib/rag";

export const runtime = "nodejs";

// ===================================================
// 后端配置
// ===================================================

interface ModelConfig {
  label: string;
  provider: "local" | "deepseek";
  modelId: string;
  baseURL: string;
  apiKey: string;
}

const MODELS: Record<string, ModelConfig> = {
  local: {
    label: "本地 Qwen2.5-7B",
    provider: "local",
    modelId: "qwen2.5-7b",
    baseURL: "http://127.0.0.1:2620/v1",
    apiKey: "llama_8f3b0c9a4e2d7f1c6a9b2e8d0f4c1a7b9e3d5f6a8c2b1d0e4f7a9c3b6d8e1f2a",
  },
  deepseek: {
    label: "DeepSeek Pro V4 Flash",
    provider: "deepseek",
    modelId: "deepseek-chat",
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
  },
};

const tools = [
  {
    type: "function" as const,
    function: {
      name: "getCurrentTime",
      description: "获取当前的日期和时间",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "queryDatabase",
      description: "查询玄言生物科技结构化数据库：company(公司概览), pipeline(管线), clinical(临床数据), finance(财务), team(团队), patents(专利), hospitals(合作医院), competitors(竞品)",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchKnowledge",
      description: "在玄言生物科技尽调知识库搜索详细信息（公司概况、管线地图、临床验证、FDA注册、商业化模型、竞品分析、财务预测、风险应对等）",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
    },
  },
];

const toolExecutors: Record<string, (args: any) => Promise<string>> = {
  getCurrentTime: async () => new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
  queryDatabase: async ({ query }: { query: string }) => queryDB(query),
  searchKnowledge: async ({ query }: { query: string }) => await searchKnowledge(query),
};

// ===================================================
// OpenAI 兼容的通用 API 调用
// ===================================================

interface ChatCallOptions {
  messages: any[];
  stream: boolean;
  max_tokens: number;
}

/** 非流式请求 — 用于工具调用检测 */
async function callNonStream(cfg: ModelConfig, opts: ChatCallOptions): Promise<{ text: string; toolCalls?: any[] }> {
  const body: any = {
    model: cfg.modelId,
    messages: opts.messages,
    stream: false,
    max_tokens: opts.max_tokens,
  };

  // 先尝试带 tools 调用
  body.tools = tools;

  let res = await fetch(cfg.baseURL + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  });

  // 如果 tools 导致错误（不支持 / 解析失败 / 服务端错误），降级为无 tools 重试
  if (!res.ok && body.tools) {
    const errText = await res.text();
    console.warn(`[callNonStream] tools 请求失败 (${res.status}), 降级重试:`, errText.slice(0, 200));
    delete body.tools;
    res = await fetch(cfg.baseURL + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    return { text: `API Error: ${await res.text()}` };
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg) return { text: "" };

  // 工具调用的 JSON 参数可能解析失败，兜底处理
  if (msg.tool_calls?.length > 0) {
    try {
      const calls = msg.tool_calls.map((tc: any) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      }));
      // 尝试验证 arguments 是合法 JSON
      calls.forEach((c: any) => {
        if (c.function.arguments) JSON.parse(c.function.arguments);
      });
      return { text: msg.content || "", toolCalls: calls };
    } catch (e) {
      // 工具参数 JSON 不合法 → 丢弃工具调用，返回纯文本
      console.warn("[callNonStream] 工具参数 JSON 解析失败，降级为纯文本:", e);
      return { text: msg.content || "" };
    }
  }
  return { text: msg.content || "" };
}

/** 流式请求 — 用于最终文字输出 */
async function* streamChat(cfg: ModelConfig, opts: ChatCallOptions): AsyncGenerator<string> {
  const body: any = {
    model: cfg.modelId,
    messages: opts.messages,
    stream: true,
    max_tokens: opts.max_tokens,
  };

  const res = await fetch(cfg.baseURL + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    yield `[API Error: ${await res.text()}]`;
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith("data: ")) continue;
      const d = t.slice(6);
      if (d === "[DONE]") return;
      try {
        const chunk = JSON.parse(d);

        // ---- DeepSeek V4 Pro Flash 可能包含 reasoning_content ----
        // 标准字段
        const delta = chunk.choices?.[0]?.delta;
        let content = delta?.content || "";

        // 有的 provider 把内容放在 reasoning_content 中（思考过程）
        if (!content && delta?.reasoning_content) {
          content = delta.reasoning_content;
        }

        // 部分 DeepSeek 返回格式: choices[0].content (非流式格式混入流式)
        if (!content && chunk.choices?.[0]?.content) {
          content = chunk.choices[0].content;
        }

        if (content) yield content;
      } catch {}
    }
  }
}

// ===================================================
// 消息格式转换
// ===================================================

function toModelMessage(msg: any): any {
  if (msg.parts) {
    const text = msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
    const toolInvocations = msg.parts.filter((p: any) => p.type === "tool-invocation");
    // 如果有工具调用结果，拼成 tool message
    if (toolInvocations.length > 0) {
      // 只返回文本部分，工具调用由工具执行循环处理
      return { role: msg.role, content: text || "" };
    }
    return { role: msg.role, content: text || "" };
  }
  return msg;
}

// ===================================================
// AI SDK v6 流式协议格式化
// ===================================================

function createAIStream(finalStream: AsyncGenerator<string>): ReadableStream {
  const encoder = new TextEncoder();
  const textId = crypto.randomUUID();

  return new ReadableStream({
    async start(controller) {
      // 发送 text-start
      const start = JSON.stringify({ type: "text-start", id: textId });
      controller.enqueue(encoder.encode(`data: ${start}\n\n`));

      // 发送 text-delta 块
      for await (const chunk of finalStream) {
        const delta = JSON.stringify({ type: "text-delta", id: textId, delta: chunk });
        controller.enqueue(encoder.encode(`data: ${delta}\n\n`));
      }

      // 发送 text-end
      const end = JSON.stringify({ type: "text-end", id: textId });
      controller.enqueue(encoder.encode(`data: ${end}\n\n`));

      controller.close();
    },
  });
}

function createAIResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// ===================================================
// POST 处理主入口
// ===================================================

export async function POST(req: Request) {
  // 从 URL 查询参数读取模型选择（由前端 useChat 拼接）
  const url = new URL(req.url);
  const modelKey = url.searchParams.get("model") || "local";
  const { messages } = await req.json();
  const cfg = MODELS[modelKey] || MODELS.local;

  // 本地模型可用性检查
  if (cfg.provider === "deepseek" && !cfg.apiKey) {
    return new Response(JSON.stringify({ error: "DeepSeek API Key 未配置，请在 .env 中设置 DEEPSEEK_API_KEY" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let currentMessages = [
    { role: "system", content: `你是玄言生物科技的 Investor DD Agent（投资人尽调智能体）。回答风格要像CEO路演：简洁、坚定、带数据、承认风险但给出解决路径。

可以调用 queryDatabase 查询结构化业务数据（管线、临床、财务、团队、专利、医院、竞品），调用 searchKnowledge 搜索尽调知识库获取详细信息（公司概况、管线地图、临床验证、FDA注册、商业化模型、竞品分析、财务预测、风险应对等）。

每次回答尽量标注数据来源。对于不确定的信息，明确说明。请用中文回答。

=== 可视化组件使用指南 ===

用特殊代码块渲染图表，让回答更直观：

• 柱状图 \`\`\`chart-bar [{ "name":"A", "value":100 }] \`\`\` → 收入/管线对比
• 饼图   \`\`\`chart-pie [{ "name":"A", "value":35 }] \`\`\` → 股权/市场份额
• 折线图 \`\`\`chart-line [{ "name":"Q1", "收入":500 }] \`\`\` → 趋势/时间序列
• 雷达图 \`\`\`chart-radar [{ "name":"技术", "评分":9 }] \`\`\` → 多维对比(0-10)
• 流程图 \`\`\`mermaid graph TD; A-->B; \`\`\` → 管线/流程/架构
• 时序图 \`\`\`mermaid sequenceDiagram A->>B:请求; \`\`\` → 流程/时间线
• 表格  标准 Markdown 表格
• 图片  ![描述](URL)

规则：图表数据须是合法 JSON 数组，name 为分类字段，其余数字为数值。每张图前后用文字说明背景和结论。
` },
    ...messages.map(toModelMessage),
  ];

  // 工具调用循环（最多 3 轮）
  for (let round = 0; round < 3; round++) {
    const { text, toolCalls } = await callNonStream(cfg, { messages: currentMessages, stream: false, max_tokens: 512 });

    if (!toolCalls || toolCalls.length === 0) {
      // 没有工具调用 → 流式输出最终回复（AI SDK v6 协议）
      const finalStream = streamChat(cfg, { messages: currentMessages, stream: true, max_tokens: 1024 });
      return createAIResponse(createAIStream(finalStream));
    }

    // 执行工具调用
    const toolResults = [];
    for (const tc of toolCalls) {
      const executor = toolExecutors[tc.function.name];
      if (executor) {
        try {
          const args = JSON.parse(tc.function.arguments);
          const result = await executor(args);
          toolResults.push({ role: "tool", content: result, tool_call_id: tc.id });
        } catch (e: any) {
          toolResults.push({ role: "tool", content: `Error: ${e.message}`, tool_call_id: tc.id });
        }
      }
    }

    currentMessages.push({ role: "assistant", content: null, tool_calls: toolCalls } as any);
    currentMessages.push(...toolResults);
  }

  // 超过 3 轮后的 fallback 流式输出（AI SDK v6 协议）
  const finalStream = streamChat(cfg, { messages: currentMessages, stream: true, max_tokens: 1024 });
  return createAIResponse(createAIStream(finalStream));
}

