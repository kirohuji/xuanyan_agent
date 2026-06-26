# AI Chat Web App — 架构计划

## 技术栈

| 技术 | 用途 |
|------|------|
| **Next.js 15** (App Router) | 框架 |
| **pnpm** | 包管理 |
| **React 19** + **TypeScript** | UI |
| **shadcn/ui** | 组件库 |
| **Tailwind CSS v4** | 样式 |
| **Vercel AI SDK** (`ai`, `@ai-sdk/openai`) | LLM 流式调用 |
| **llama.cpp** 后端 | `http://8.136.36.195:2620/v1/chat/completions` |

## 项目结构

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 全局布局（主题、字体）
│   │   ├── page.tsx            # 聊天主页（移动端优先）
│   │   └── globals.css         # Tailwind + shadcn 样式
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件（自动生成）
│   │   ├── chat/
│   │   │   ├── chat.tsx        # 聊天容器（管理消息列表 + 输入）
│   │   │   ├── chat-input.tsx  # 输入框（支持 Enter/Shift+Enter）
│   │   │   └── message.tsx     # 单条消息（markdown、代码高亮）
│   │   └── mobile-nav.tsx      # 移动端导航/侧边栏
│   ├── lib/
│   │   └── ai.ts               # Vercel AI SDK 配置
│   └── hooks/
│       └── use-chat.ts         # 聊天逻辑 hook
├── public/
│   └── icons/                  # PWA 图标
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── components.json             # shadcn 配置
└── tsconfig.json
```

## 功能清单

### 核心聊天
- [x] 流式输出（SSE）
- [x] Markdown 渲染
- [x] 代码块 + 复制按钮
- [x] 用户消息 / AI 消息区分
- [x] Loading 骨架屏
- [x] 空状态引导

### 交互
- [x] Enter 发送，Shift+Enter 换行
- [x] 自动滚动到底部
- [x] 停止生成
- [x] 重试（重新生成最后一条 AI 回复）
- [x] 清除对话

### 移动端适配
- [x] 移动端优先设计
- [x] 底部输入框固定定位
- [x] 安全区域适配（safe-area-inset）
- [x] 触摸友好

### 额外
- [x] 深色模式（跟随系统）
- [x] PWA manifest
- [x] 会话持久化（localStorage）

## API 对接

使用 Vercel AI SDK 的 `@ai-sdk/openai` 包，配置自定义 base URL：

```typescript
const client = createOpenAI({
  baseURL: "http://8.136.36.195:2620/v1",
  apiKey: "llama_8f3b0c9a4e2d7f1c6a9b2e8d0f4c1a7b9e3d5f6a8c2b1d0e4f7a9c3b6d8e1f2a",
});
```

由于是纯前端 SPA（API Key 暴露），采用 **Next.js API Route** 作为代理：

```
浏览器 → /api/chat → Next.js Server → llama.cpp API
```

这样 API Key 保存在服务端，不暴露给前端。

## 数据流

```
用户输入 → chat-input.tsx
         → useChat() hook (Vercel AI SDK)
         → POST /api/chat (Next.js Route Handler)
         → llama.cpp /v1/chat/completions
         → SSE 流式返回
         → message.tsx 实时渲染
```

## 启动命令

```bash
cd web
pnpm install
pnpm dev        # 开发 → http://localhost:3000
pnpm build      # 构建
```
