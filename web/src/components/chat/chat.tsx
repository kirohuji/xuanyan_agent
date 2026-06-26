"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Message } from "./message";
import { ChatInput } from "./chat-input";
import {
  Plus, Globe, Cpu, X,
  Building2, Map, Database, Users, Lightbulb,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// ===================================================
// 模型配置
// ===================================================

const MODELS = [
  { key: "deepseek", label: "DeepSeek Pro V4 Flash", icon: Globe },
  { key: "local", label: "本地 Qwen2.5-7B", icon: Cpu },
];

// ===================================================
// 尽调导航板块
// ===================================================

const DD_SECTIONS = [
  { id: "overview",     label: "公司概览",        icon: Building2,    color: "bg-blue-500/10 text-blue-600" },
  { id: "pipeline",     label: "管线地图",        icon: Map,          color: "bg-emerald-500/10 text-emerald-600" },
  { id: "clinical",     label: "临床验证",        icon: Database,     color: "bg-violet-500/10 text-violet-600" },
  { id: "fda",          label: "FDA/注册路径",    icon: Users,        color: "bg-rose-500/10 text-rose-600" },
  { id: "commercial",   label: "商业化模型",      icon: Building2,    color: "bg-amber-500/10 text-amber-600" },
  { id: "competitive",  label: "竞品对标",        icon: Map,          color: "bg-orange-500/10 text-orange-600" },
  { id: "financial",    label: "财务预测",        icon: Database,     color: "bg-cyan-500/10 text-cyan-600" },
  { id: "risk",         label: "风险与应对",      icon: Users,        color: "bg-red-500/10 text-red-600" },
  { id: "hospitals",    label: "合作医院",        icon: Building2,    color: "bg-indigo-500/10 text-indigo-600" },
  { id: "patents",      label: "专利与论文",      icon: Map,          color: "bg-teal-500/10 text-teal-600" },
];

const DD_QUESTIONS: Record<string, { label: string; question: string }[]> = {
  overview: [
    { label: "公司定位", question: "介绍一下玄言生物科技" },
    { label: "业务线", question: "玄言有哪些核心业务" },
    { label: "融资", question: "玄言的融资情况和团队背景" },
  ],
  pipeline: [
    { label: "管线进度", question: "玄言的管线进展到哪了" },
    { label: "甲转探", question: "甲转探®是什么" },
    { label: "CD14/CD3", question: "CD14/CD3 双抗项目进展" },
  ],
  clinical: [
    { label: "807例数据", question: "甲转探的临床验证数据" },
    { label: "vs 超声", question: "甲转探和超声比怎么样" },
    { label: "前瞻性", question: "前瞻性多中心验证结果" },
  ],
  fda: [
    { label: "注册路径", question: "FDA 注册进展和时间线" },
    { label: "最大风险", question: "FDA 审批的主要风险" },
    { label: "NMPA", question: "NMPA 注册进度" },
  ],
  commercial: [
    { label: "定价", question: "甲转探的定价和医保" },
    { label: "销售", question: "销售渠道和商业化" },
    { label: "收入预测", question: "未来的收入预测" },
  ],
  competitive: [
    { label: "vs Grail", question: "玄言和其他公司比怎么样" },
    { label: "数据壁垒", question: "玄言的数据壁垒" },
    { label: "差异化", question: "玄言的差异化优势" },
  ],
  financial: [
    { label: "财务预测", question: "玄言的财务预测数据" },
    { label: "现金流", question: "现金流和融资计划" },
    { label: "估值", question: "估值参考" },
  ],
  risk: [
    { label: "CD14/CD3 毒性", question: "CD14/CD3 的安全性问题" },
    { label: "主要风险", question: "主要风险和应对措施" },
    { label: "竞争壁垒", question: "玄言的竞争壁垒" },
  ],
  hospitals: [
    { label: "合作医院", question: "玄言合作了哪些医院" },
    { label: "入院", question: "甲转探入院签约情况" },
    { label: "国际", question: "国际合作有哪些" },
  ],
  patents: [
    { label: "专利", question: "已授权专利有哪些" },
    { label: "论文", question: "发表了哪些论文" },
    { label: "IP 布局", question: "知识产权布局" },
  ],
};

// ===================================================
// Chat 组件
// ===================================================

export function Chat() {
  const [selectedModel, setSelectedModel] = useState("local");
  const [showPanel, setShowPanel] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const chatId = `chat-${selectedModel}`;
  const apiUrl = `/api/chat?model=${selectedModel}`;

  const { messages, sendMessage, stop, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
    }),
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledAway = useRef(false);
  const isStreamingRef = useRef(false);
  const programmaticScroll = useRef(false); // 防止程序滚动触发 handleScroll
  const isLoading = status === "streaming" || status === "submitted";

  // 安全地程序化滚动，标记为程序滚动避免用户滚回判定冲突
  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    programmaticScroll.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior });
    // scroll 事件是异步的，微任务后重置标记
    queueMicrotask(() => { programmaticScroll.current = false; });
  }, []);

  // 检测用户是否手动滚离底部
  const handleScroll = useCallback(() => {
    if (programmaticScroll.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (userScrolledAway.current && isNearBottom) {
      // 用户手动滚回底部 → 重新吸附并跳转到最新内容
      userScrolledAway.current = false;
      scrollToBottom("instant");
    } else {
      userScrolledAway.current = !isNearBottom;
    }
  }, [scrollToBottom]);

  // 新消息到达时自动滚动（仅在用户处于底部时）
  useEffect(() => {
    if (userScrolledAway.current) return;
    scrollToBottom(isStreamingRef.current ? "instant" : "smooth");
  }, [messages, scrollToBottom]);

  // streaming 状态变化时同步 ref；结束时若用户在底部则平滑滚到底
  useEffect(() => {
    isStreamingRef.current = isLoading;
    if (!isLoading && !userScrolledAway.current) {
      scrollToBottom("smooth");
    }
  }, [isLoading, scrollToBottom]);

  const handleSend = useCallback((content: string) => {
    sendMessage({ text: content });
  }, [sendMessage]);

  const clearChat = useCallback(() => { setMessages([]); setActiveSection(null); }, [setMessages]);
  const currentModel = MODELS.find((m) => m.key === selectedModel) || MODELS[0];

  const switchModel = useCallback((key: string) => {
    setSelectedModel(key);
    clearChat();
  }, [clearChat]);

  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setShowPanel(false);
    const questions = DD_QUESTIONS[sectionId];
    if (questions && questions.length > 0) {
      handleSend(questions[0].question);
    }
  }, [handleSend]);

  const handleToolClick = useCallback((question: string) => {
    setShowPanel(false);
    handleSend(question);
  }, [handleSend]);

  // 上拉面板内容 — 卡片风格
  const panelContent = (
    <div className="pb-6">
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <h3 className="text-sm font-semibold">尽调导航</h3>
        <button onClick={() => setShowPanel(false)} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center">
          <X size={15} />
        </button>
      </div>

      {/* 卡片网格 */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {DD_SECTIONS.map((s) => {
          const Icon = s.icon;
          const qs = DD_QUESTIONS[s.id];
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSection(isActive ? null : s.id);
                if (!isActive && qs && qs.length > 0) handleToolClick(qs[0].question);
              }}
              className={`relative flex flex-col items-start gap-2 p-3.5 rounded-2xl border text-left transition-all ${
                isActive
                  ? "border-primary/30 bg-primary/[0.04] shadow-sm"
                  : "border-border/60 bg-white dark:bg-white/[0.03] hover:border-border hover:shadow-sm"
              }`}
            >
              <div className={`size-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <Icon size={16} />
              </div>
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/50 leading-tight">
                  {isActive ? "点击发送" : `${qs?.length || 0} 个问题`}
                </div>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* 激活板块的快捷问题 */}
      {activeSection && DD_QUESTIONS[activeSection] && (
        <div className="px-4 pt-4">
          <div className="text-[10px] font-medium text-muted-foreground/50 mb-2.5 px-0.5">快速提问</div>
          <div className="flex flex-wrap gap-1.5">
            {DD_QUESTIONS[activeSection].map((q) => (
              <button
                key={q.label}
                onClick={() => handleToolClick(q.question)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted/80 text-[11px] text-muted-foreground transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 模型 */}
      <div className="mt-4 mx-4 pt-3 border-t border-border/30 flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">模型</span>
        <div className="flex gap-1.5">
          {MODELS.map((m) => (
            <button
              key={m.key}
              onClick={() => switchModel(m.key)}
              className={`px-2 py-1 rounded-md text-[10px] transition-all border ${
                selectedModel === m.key
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-muted-foreground/60 border-transparent hover:bg-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* ============================================ */}
      {/* HEADER — 极简，只留品牌 */}
      {/* ============================================ */}
      <header className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-3">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-white dark:bg-white/5 ring-1 ring-border/30 overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="" className="size-5 object-contain" />
              </div>
              <h1 className="text-sm font-semibold tracking-tight">玄言</h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary/70 border border-primary/15 leading-none">
                DD
              </span>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="size-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                <Plus size={14} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================ */}
      {/* MAIN */}
      {/* ============================================ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
          <div className="max-w-3xl mx-auto space-y-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center px-5 pt-14 pb-8">
                {/* hero */}
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="size-14 rounded-2xl bg-white dark:bg-white/5 shadow-md ring-1 ring-border/20 overflow-hidden flex items-center justify-center mb-4">
                    <img src="/logo.png" alt="" className="size-9 object-contain" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight mb-1">玄言 Investor Room</h2>
                  <p className="text-[13px] text-muted-foreground/60">投资人尽调智能体</p>
                </div>

                {/* 板块卡片网格 */}
                <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-2.5 mb-6">
                  {DD_SECTIONS.slice(0, 8).map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSectionClick(s.id)}
                        className="group relative flex flex-col items-start gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-border/50 hover:border-border/80 hover:shadow-sm transition-all text-left"
                      >
                        <div className={`size-9 rounded-xl flex items-center justify-center ${s.color}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-tight">{s.label}</div>
                          <div className="text-[10px] text-muted-foreground/40 mt-0.5">
                            {s.id === "overview" && "定位 · 业务 · 融资"}
                            {s.id === "pipeline" && "诊断 · 治疗管线"}
                            {s.id === "clinical" && "807例 · vs超声 · 前瞻性"}
                            {s.id === "fda" && "510(k) · 风险 · NMPA"}
                            {s.id === "commercial" && "定价 · 渠道 · 出海"}
                            {s.id === "competitive" && "Grail · Exact · 差异"}
                            {s.id === "financial" && "收入 · 利润 · 估值"}
                            {s.id === "risk" && "技术 · 监管 · 商业"}
                            {s.id === "hospitals" && "中山 · 瑞金 · 胸科"}
                            {s.id === "patents" && "4项授权 · 3篇论文"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 快捷问题 */}
                {activeSection && DD_QUESTIONS[activeSection] && (
                  <div className="w-full max-w-md mx-auto mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={12} className="text-amber-500/60" />
                      <span className="text-[11px] font-medium text-muted-foreground/60">快速提问</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DD_QUESTIONS[activeSection].map((q) => (
                        <button
                          key={q.label}
                          onClick={() => handleSend(q.question)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/40 hover:bg-muted/70 text-[11px] text-muted-foreground transition-colors"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/30 text-center">
                  数据来源：国家企业信用信息公示系统 · 天眼查
                </p>
              </div>
            ) : (
              <div className="px-3 py-3 space-y-5">
                {messages.map((m, i) => {
                  // AI SDK v6 消息格式：从 parts 中提取所有文本内容
                  const text = m.parts?.map((p: any) => {
                    if (p.type === "text") return p.text;
                    if (p.type === "reasoning") return "";
                    if (p.type === "tool-result" || p.type.startsWith("tool-")) return "";
                    return "";
                  }).filter(Boolean).join("") || "";
                  const isLast = i === messages.length - 1;
                  return (
                    <div key={m.id}>
                      <Message
                        role={m.role === "user" ? "user" : "assistant"}
                        content={text}
                        isStreaming={m.role === "assistant" && isLoading && isLast}
                      />
                    </div>
                  );
                })}
                <div />
              </div>
            )}
          </div>
        </div>

        {/* thinking */}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="shrink-0 border-t border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-2.5 text-xs text-muted-foreground/70">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                <span className="relative inline-flex size-2 rounded-full bg-primary/60" />
              </span>
              正在查询...
            </div>
          </div>
        )}

        {/* input */}
        <ChatInput
          onSend={handleSend}
          onStop={stop}
          isLoading={isLoading}
          onOpenPanel={() => setShowPanel(true)}
        />
      </main>

      {/* ============================================ */}
      {/* 底部面板 */}
      {/* ============================================ */}
      {showPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/15 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background border border-border shadow-2xl animate-slide-up">
            {panelContent}
          </div>
        </>
      )}
    </div>
  );
}
