# AI Agent 聊天应用实现文档

> **模型选型**：千问3-4B (Qwen3-4B) —— 目前同参数量级综合能力最强的开源模型

## 1. 千问3-4B 简介与获取方式

### 1.1 为什么选千问3-4B？

千问3（Qwen3）是阿里通义千问第三代模型，2025年4月发布。4B 参数版本的核心优势：

| 能力维度 | 表现 | 说明 |
|----------|------|------|
| **Agent / Tool Calling** | ⭐⭐⭐⭐⭐ | Qwen3 系列原生强化 Function Call，支持多工具并行调用 |
| **中英文能力** | ⭐⭐⭐⭐⭐ | 中文能力同参数级最强，天然适配国内场景 |
| **推理能力 (Thinking)** | ⭐⭐⭐⭐ | 支持 thinking 模式（深度思考），可开关 |
| **上下文窗口** | ⭐⭐⭐⭐ | 原生 32K token，满足大多数对话场景 |
| **推理速度** | ⭐⭐⭐⭐⭐ | 4B 参数极轻量，首字延迟 < 300ms |
| **多语言** | ⭐⭐⭐⭐ | 支持 119 种语言 |

> 💡 Qwen3-4B 在 4B 量级模型中 Agent 能力（Tool Calling）排名第一，非常适合构建 AI Agent 应用。

### 1.2 Qwen3-4B vs Qwen2.5-3B 对比

| 对比维度 | Qwen3-4B | Qwen2.5-3B（上一代） |
|----------|----------|---------------------|
| Function Call 准确率 | **大幅提升** | 一般 |
| 推理能力 | 支持 thinking 模式 | 不支持 |
| 多工具并行调用 | ✅ 原生支持 | ⚠️ 不稳定 |
| 指令遵循 | 显著增强 | 一般 |

### 1.3 获取 / 部署方式

#### 方式一：硅基流动 SiliconFlow 🏆 国内首选
- **优点**：国内直连低延迟、中文优化、兼容 OpenAI SDK、Serverless 免运维
- **模型 ID**：`Qwen/Qwen3-4B`
- **定价**：¥0.5 / 百万 token（输入），¥1.0 / 百万 token（输出）
- **获取**：https://siliconflow.cn → 注册 → API Key
- **速度**：国内 < 500ms

#### 方式二：阿里云百炼 Bailian 🏆 官方渠道
- **优点**：阿里官方、模型更新最快、企业级稳定性
- **模型 ID**：`qwen3-4b`
- **获取**：https://bailian.console.aliyun.com → 开通 → API Key
- **免费额度**：新用户 100 万 token 免费

#### 方式三：Together AI
- **优点**：国际主流平台、模型全、兼容 OpenAI SDK
- **模型 ID**：`Qwen/Qwen3-4B`
- **获取**：https://api.together.ai 注册 → API Key
- **注意**：国内需代理访问

#### 方式四：Ollama 本地部署
- **优点**：完全免费、数据不出域
- **缺点**：需要 GPU（建议 8GB+ 显存）或 Apple Silicon
- **部署**：
  ```bash
  # 安装 Ollama
  curl -fsSL https://ollama.com/install.sh | sh
  # 拉取 Qwen3-4B (4-bit 量化版，仅需 ~3GB 显存)
  ollama pull qwen3:4b
  # 启动服务 (默认端口 11434)
  ollama serve
  ```

#### 方式五：HuggingFace Inference API
- **模型地址**：https://huggingface.co/Qwen/Qwen3-4B
- **优点**：官方模型，免费 tier 可用
- **缺点**：免费 tier 速度较慢

---

## 2. 技术方案

### 2.1 推荐架构：ToolLoopAgent (AI SDK v6) + 硅基流动/百炼 + Qwen3-4B

```
┌──────────────────────────────────────────────┐
│                用户浏览器                      │
│      Next.js App (shadcn/ui)                  │
│  ┌────────────────────────────────────┐      │
│  │  useChat() hook                    │      │
│  │  ▪ 自动管理 messages 状态          │      │
│  │  ▪ 流式消费 UI Message Stream      │      │
│  │  ▪ tool-call / tool-result 展示    │      │
│  └────────────────┬───────────────────┘      │
└───────────────────┼──────────────────────────┘
                    │ HTTP POST /api/chat
                    ▼
┌──────────────────────────────────────────────┐
│        Next.js API Route (Edge/Node)          │
│   createAgentUIStreamResponse()               │
│  ┌────────────────────────────────────┐      │
│  │       ToolLoopAgent                │      │
│  │  ▪ 自动管理 Agent 循环             │      │
│  │  ▪ 上下文管理 (自动保留历史)       │      │
│  │  ▪ stopWhen / prepareStep 控制     │      │
│  │  ▪ onStepFinish 日志追踪           │      │
│  └────────────────┬───────────────────┘      │
└───────────────────┼──────────────────────────┘
                    │ OpenAI 兼容协议
                    ▼
┌──────────────────────────────────────────────┐
│     硅基流动 / 阿里云百炼 / Ollama            │
│          Qwen3-4B (千问3-4B)                  │
│  ▪ 原生 Function Call 支持                    │
│  ▪ 32K 上下文窗口                             │
│  ▪ Thinking 模式（可选）                      │
└──────────────────────────────────────────────┘
```

### 2.2 Provider 选择建议

| 场景 | 推荐 Provider | 原因 |
|------|---------------|------|
| 国内生产环境 | 🏆 阿里云百炼 | 官方、稳定、企业级 SLA |
| 国内开发 / 低成本 | 🏆 硅基流动 | Serverless、按量付费、接入快 |
| 海外 / Vercel 部署 | Together AI | 国际带宽好 |
| 数据不出域 / 离线 | Ollama 本地 | 完全私有化 |

---

## 3. 项目架构设计

### 3.1 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14+ (App Router) | React 全栈框架 |
| UI 库 | shadcn/ui + Tailwind CSS | 组件库 |
| AI SDK | `ai` v6 (ToolLoopAgent) | 🆕 官方 Agent API，自动管理工具调用循环 |
| Provider | `@ai-sdk/openai` 兼容模式 | 连接硅基流动 / 百炼等 OpenAI 兼容服务 |
| 大模型 | **Qwen3-4B** (千问3-4B) | 通过硅基流动 / 百炼 / Ollama |
| 客户端 | `useChat` from `@ai-sdk/react` | 自动处理流式消息 + tool call 状态 |
| 工具定义 | `tool()` + Zod Schema | AI SDK 原生 |
| 部署 | Vercel | 一键部署 |

### 3.2 项目目录结构

```
agent/
├── app/
│   ├── layout.tsx              # 全局布局
│   ├── page.tsx                # 聊天主页
│   ├── globals.css             # 全局样式
│   └── api/
│       └── chat/
│           └── route.ts        # AI 聊天 API 路由
├── components/
│   ├── chat/
│   │   ├── chat-interface.tsx   # 聊天界面主组件
│   │   ├── chat-message.tsx     # 消息气泡组件
│   │   ├── chat-input.tsx       # 输入框组件
│   │   ├── chat-sidebar.tsx     # 侧边栏（会话列表）
│   │   └── tool-call-card.tsx   # Tool Call 结果展示
│   └── ui/                      # shadcn/ui 组件
│       ├── button.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── card.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       └── avatar.tsx
├── lib/
│   ├── ai/
│   │   ├── model.ts            # AI 模型配置
│   │   └── tools.ts            # Agent 工具定义
│   └── utils.ts                # 工具函数
├── hooks/
│   └── use-chat.ts             # 自定义聊天 Hook（可选）
├── types/
│   └── index.ts                # TypeScript 类型定义
├── .env.local                  # 环境变量
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. 核心实现步骤

### 4.1 初始化项目

```bash
npx create-next-app@latest agent --typescript --tailwind --eslint --app --src-dir=false
cd agent

# 安装 shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input textarea card scroll-area separator avatar

# 安装 AI SDK v6（核心 + Provider + UI 客户端）
pnpm add ai @ai-sdk/openai @ai-sdk/react zod

# (可选) 如果使用 Ollama 本地
pnpm add ollama-ai-provider
```

### 4.2 环境变量配置 (.env.local)

```env
# ========== 方式一：硅基流动（国内开发首选）==========
AI_PROVIDER=siliconflow
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=Qwen/Qwen3-4B

# ========== 方式二：阿里云百炼（国内生产首选）==========
# AI_PROVIDER=bailian
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# AI_MODEL=qwen3-4b

# ========== 方式三：Together AI（海外部署兼容）==========
# AI_PROVIDER=together
# OPENAI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
# OPENAI_BASE_URL=https://api.together.xyz/v1
# AI_MODEL=Qwen/Qwen3-4B

# ========== 方式四：Ollama 本地（数据不出域）==========
# AI_PROVIDER=ollama
# OPENAI_API_KEY=ollama
# OPENAI_BASE_URL=http://localhost:11434/v1
# AI_MODEL=qwen3:4b
```

### 4.3 Agent 定义 (`lib/ai/agent.ts`)

```typescript
import { ToolLoopAgent, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { tools } from './tools';

// 创建 OpenAI 兼容客户端（硅基流动 / 百炼 等均兼容）
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL!,
});

const model = openai(process.env.AI_MODEL!);

// 🏆 使用 ToolLoopAgent 定义 Agent（AI SDK v6 推荐方式）
export const agent = new ToolLoopAgent({
  model,
  tools,
  instructions: `
    你是千问3-4B (Qwen3-4B)，阿里通义千问第三代 AI 助手。
    - 你具备工具调用能力，可以主动使用工具获取实时信息
    - 请用中文回答用户问题
    - 回答简洁准确，需要时可以多轮调用工具完成任务
    - 如果用户问题超出你的知识范围，请使用工具查找
  `,
  // 循环控制：最多 15 步，避免无限循环
  stopWhen: stepCountIs(15),
  // 每一步完成后的回调（日志/监控）
  onStepFinish: ({ stepNumber, usage, toolCalls, finishReason }) => {
    console.log(`[Agent] Step ${stepNumber} done, reason: ${finishReason}`);
    if (toolCalls?.length) {
      toolCalls.forEach((tc) =>
        console.log(`  → ${tc.toolName}: ${tc.status}`)
      );
    }
  },
});
```

### 4.4 Agent 工具定义 (`lib/ai/tools.ts`)

```typescript
import { tool } from 'ai';
import { z } from 'zod';

// Qwen3-4B 对 Function Call 原生支持极好，工具定义即用即生效

// 示例工具 1：获取天气
export const weatherTool = tool({
  description: '获取指定城市的天气信息',
  inputSchema: z.object({
    city: z.string().describe('城市名称，如 Beijing, Shanghai'),
  }),
  execute: async ({ city }) => {
    // 实际项目中调用天气 API（如 OpenWeatherMap）
    return { city, temperature: 25, condition: '晴', humidity: '45%' };
  },
});

// 示例工具 2：联网搜索（需要接入搜索 API）
export const searchTool = tool({
  description: '搜索网络信息，获取实时资讯',
  inputSchema: z.object({
    query: z.string().describe('搜索关键词'),
  }),
  execute: async ({ query }) => {
    // 实际项目中调用 Tavily / SerpAPI 等搜索 API
    return {
      query,
      results: [
        { title: '结果示例 1', snippet: '这是搜索结果摘要...' },
        { title: '结果示例 2', snippet: '这是另一条搜索结果...' },
      ],
    };
  },
});

// 导出工具集（ToolLoopAgent 直接使用）
export const tools = {
  weather: weatherTool,
  search: searchTool,
};
```

### 4.5 API 路由 (`app/api/chat/route.ts`)

```typescript
import { createAgentUIStreamResponse } from 'ai';
import { agent } from '@/lib/ai/agent';

// Vercel Hobby 限制 10s，Pro 可到 60s+
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 🏆 ToolLoopAgent 专用 API：一行搞定流式响应
  // 自动处理 Agent 循环、工具调用、上下文管理
  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
```

> 💡 **对比旧方式**：以前需要手动 `streamText({ model, tools, maxSteps, ... })`，现在只需 `createAgentUIStreamResponse({ agent, uiMessages })` ，Agent 循环、工具编排、上下文管理全部自动处理。
```

### 4.6 聊天界面主组件 (`components/chat/chat-interface.tsx`)

```typescript
'use client';

import { useChat } from '@ai-sdk/react';
import type { InferAgentUIMessage } from 'ai';
import { agent } from '@/lib/ai/agent';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';

// 🏆 从 Agent 自动推导完整类型（含 tool-call / tool-result）
type AgentMessage = InferAgentUIMessage<typeof agent>;

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat<AgentMessage>({
      api: '/api/chat',
      onError: (error) => console.error('Chat error:', error),
    });

  return (
    <div className="flex flex-col h-screen">
      {/* 消息区域 */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              <h2 className="text-2xl font-bold mb-2">🤖 AI Agent</h2>
              <p>由千问3-4B (Qwen3-4B) 驱动 · ToolLoopAgent 架构</p>
              <p className="text-sm text-muted-foreground mt-2">
                可以回答问题、调用工具、多轮推理、帮你完成复杂任务
              </p>
            </div>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* 输入区域 */}
      <div className="border-t p-4">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
```

### 4.7 Tool Call 展示 (`components/chat/tool-call-card.tsx`)

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ToolCallCardProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  loading?: boolean;
}

export function ToolCallCard({ toolName, args, result, loading }: ToolCallCardProps) {
  return (
    <Card className="my-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
      <CardHeader className="py-2 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          调用工具: {toolName}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4 text-xs">
        <p className="text-muted-foreground">参数: {JSON.stringify(args)}</p>
        {result && <p className="mt-1">结果: {JSON.stringify(result)}</p>}
      </CardContent>
    </Card>
  );
}
```

---

## 5. 关键设计决策

### 5.1 Provider 选型对比：硅基流动 vs 百炼 vs Ollama

| 对比维度 | 硅基流动 | 阿里云百炼 | Ollama 本地 |
|----------|----------|-----------|-------------|
| 延迟 | ⭐⭐⭐⭐⭐ (< 500ms) | ⭐⭐⭐⭐ (< 1s) | ⭐⭐⭐ (取决于 GPU) |
| Qwen3-4B 支持 | ✅ 官方适配 | ✅ 官方首发 | ✅ 社区量化版 |
| 免费额度 | ✅ 注册赠送 | ✅ 100万 token | ✅ 完全免费 |
| 中文支持 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 国内访问 | ✅ 直连 | ✅ 直连 | ✅ 本地 |
| 运维成本 | 无 (Serverless) | 无 (Serverless) | 需要 GPU 硬件 |
| 稳定性 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 企业级 SLA | ❌ | ✅ | N/A |

### 5.2 Qwen3-4B 的能力边界

- ✅ **擅长**：
  - 🏆 **Agent / Tool Calling**（核心优势，同量级最强）
  - 中文对话、翻译、摘要、分类
  - 指令遵循（Instruct 对齐质量高）
  - 简单代码生成和解释
  - 多轮对话上下文理解（32K 窗口）
- ⚠️ **一般**：
  - 复杂多步推理（建议开启 thinking 模式增强）
  - 专业领域深度知识（可配合 RAG 弥补）
  - 长文本生成（4K 输出上限）
- ❌ **不擅长**：
  - 复杂数学证明
  - 超长文档理解（> 32K token 需外部分块）
  - 多模态识别（纯文本模型，不含视觉）

> 💡 **核心策略**：利用 Qwen3-4B 原生 Function Call 能力构建 Agent，让模型自主调用外部工具（搜索、计算器、数据库查询等）来弥补参数规模的知识局限。

### 5.3 Qwen3-4B 特有功能：Thinking 模式

Qwen3 系列支持可开关的 thinking（深度思考）模式。可在 Agent 的 `instructions` 中控制：

```typescript
// lib/ai/agent.ts

export const agent = new ToolLoopAgent({
  model,
  tools,
  instructions: `
    你是千问3-4B AI 助手。
    /no_think    ← 日常对话关闭深度思考，响应更快
    - 请用中文回答
  `,
  // ...
});

// 🔥 高级用法：根据场景动态切换 thinking
// 可以创建两个 Agent 实例，按需选用：
export const fastAgent = new ToolLoopAgent({
  model,
  tools,
  instructions: '/no_think\n你是快速响应助手。',
});

export const thinkingAgent = new ToolLoopAgent({
  model,
  tools,
  instructions: '/think\n你是深度推理助手，复杂问题请先思考再回答。',
});
```

> ⚠️ 开启 thinking 会增加首字延迟 1-3s，但能显著提升复杂推理准确率。日常对话建议 `/no_think`。

### 5.4 性能优化建议

1. **流式输出**：Qwen3-4B 推理快，流式输出首字延迟 < 300ms（硅基流动）
2. **上下文管理**：32K 窗口足够大多数场景；超出时保留最近 8K + 摘要历史
3. **工具超时**：为每个 Tool Call 设置 8s 超时，避免阻塞对话流
4. **Thinking 模式按需开启**：简单对话关闭 thinking 以加快响应，复杂推理才开启
5. **缓存策略**：使用 Vercel Edge Cache 或 Redis 缓存高频问题的响应

---

## 6. 部署到 Vercel

### 6.1 部署步骤

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 部署（首次会引导登录 + 项目配置）
vercel

# 设置环境变量（三选一）
# 硅基流动：
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL  # https://api.siliconflow.cn/v1
vercel env add AI_MODEL          # Qwen/Qwen3-4B

# 或百炼：
vercel env add OPENAI_API_KEY
vercel env add OPENAI_BASE_URL  # https://dashscope.aliyuncs.com/compatible-mode/v1
vercel env add AI_MODEL          # qwen3-4b

# 重新部署使环境变量生效
vercel --prod
```

### 6.2 Vercel 限制与应对

| 限制 | Hobby 计划 | Pro 计划 | 应对策略 |
|------|-----------|---------|----------|
| 函数执行时间 | 10s | 60s | 减少 maxSteps，单步工具调用限时 5s |
| 响应体大小 | 4.5MB | 6MB | 流式输出天然不受影响 |
| 请求频率 | 100 req/min | 1000 req/min | 开发足够 |

> 💡 Qwen3-4B 推理极快（< 1s 单轮），即使 Hobby 计划的 10s 也足够完成 5-8 轮工具调用的 Agent 任务。

---

## 7. 扩展方向

### 7.1 Agent 能力扩展

- **联网搜索**：集成 Tavily Search API 或 SerpAPI
- **知识库**：接入 RAG (Retrieval-Augmented Generation)
- **计算能力**：让模型调用代码执行沙箱进行精确计算
- **记忆系统**：使用 Vercel KV / Upstash Redis 实现会话持久化
- **联网浏览**：集成网页抓取工具

### 7.2 进阶功能

- 多会话管理（侧边栏历史记录）
- Markdown 渲染 + 代码高亮（`react-markdown` + `prismjs`）
- 语音输入/输出
- 对话分享功能
- 主题切换（深色/浅色模式）
- 用量统计和 Token 计数

---

## 8. 参考资源

- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com)
- [硅基流动文档](https://docs.siliconflow.cn)
- [阿里云百炼文档](https://help.aliyun.com/product/279429.html)
- [Qwen3 官方博客](https://qwenlm.github.io/blog/qwen3/)
- [Qwen3-4B HuggingFace](https://huggingface.co/Qwen/Qwen3-4B)
- [Ollama Qwen3](https://ollama.com/library/qwen3)

---

## 附录：快速启动脚本

```bash
#!/bin/bash
# 一键初始化 AI Agent 项目（千问3-4B）

echo "🚀 初始化 AI Agent 项目 (Qwen3-4B)..."

# 1. 创建 Next.js 项目
npx create-next-app@latest agent --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd agent

# 2. 安装 shadcn/ui
npx shadcn@latest init -d
npx shadcn@latest add button input textarea card scroll-area separator avatar

# 3. 安装 AI SDK
npm install ai @ai-sdk/openai zod lucide-react

# 4. 创建 .env.local（默认用硅基流动）
cat > .env.local << 'EOF'
# ========== 硅基流动（国内开发首选）==========
AI_PROVIDER=siliconflow
OPENAI_API_KEY=your_siliconflow_api_key_here
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=Qwen/Qwen3-4B

# ========== 阿里云百炼（国内生产首选）==========
# AI_PROVIDER=bailian
# OPENAI_API_KEY=your_bailian_api_key_here
# OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
# AI_MODEL=qwen3-4b

# ========== Ollama 本地 ==========
# AI_PROVIDER=ollama
# OPENAI_API_KEY=ollama
# OPENAI_BASE_URL=http://localhost:11434/v1
# AI_MODEL=qwen3:4b
EOF

echo ""
echo "✅ 初始化完成！"
echo ""
echo "👉 下一步："
echo "   1. 编辑 .env.local 填入你的 API Key"
echo "   2. 获取 API Key: https://siliconflow.cn (硅基流动) 或 https://bailian.console.aliyun.com (百炼)"
echo "   3. npm run dev"
```

---

> **文档版本**: v2.0  
> **最后更新**: 2026-06-22  
> **模型**: 千问3-4B (Qwen3-4B)
