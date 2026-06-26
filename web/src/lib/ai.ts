import { createOpenAI } from "@ai-sdk/openai";

/** 本地 llama.cpp 实例 */
export const lm = createOpenAI({
  baseURL: "http://127.0.0.1:2620/v1",
  apiKey: "llama_8f3b0c9a4e2d7f1c6a9b2e8d0f4c1a7b9e3d5f6a8c2b1d0e4f7a9c3b6d8e1f2a",
});

export const localModel = lm.chat("qwen2.5-7b");

/** 模型配置列表（与 API route 保持一致） */
export const AVAILABLE_MODELS = [
  { key: "local", label: "本地 Qwen2.5-7B", provider: "local" },
  { key: "deepseek", label: "DeepSeek Pro V4 Flash", provider: "deepseek" },
];
