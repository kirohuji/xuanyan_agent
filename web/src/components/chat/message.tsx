"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, Check, ChevronDown } from "lucide-react";
import * as recharts from "recharts";

// ============================================
// Mermaid 图表渲染（带错误容错）
// ============================================
function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!ref.current || hasError) return;
    // 清空再渲染，避免残留
    ref.current.innerHTML = "";
    const el = document.createElement("div");
    el.textContent = code;
    ref.current.appendChild(el);

    import("mermaid").then((mod) => {
      const m = mod.default;
      m.initialize({ theme: "neutral", startOnLoad: false, securityLevel: "loose" });
      return m.run({ nodes: [el], suppressErrors: true });
    }).catch((e) => {
      console.warn("Mermaid error:", e);
      setHasError(true);
    });
  }, [code, hasError]);

  if (hasError) return null;
  return (
    <div className="my-3 overflow-x-auto">
      <div className="flex justify-center" ref={ref} />
    </div>
  );
}

// ============================================
// Recharts 图表（柱状/饼图/雷达/折线）
// ============================================
function ChartBlock({ data: raw, type }: { data: string; type: string }) {
  let parsed: any[];
  try { parsed = JSON.parse(raw); } catch { return <div className="text-xs text-red-400 my-2">数据格式错误</div>; }
  if (!Array.isArray(parsed) || parsed.length === 0) return <div className="text-xs text-muted-foreground my-2">暂无数据</div>;

  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];
  const keys = Object.keys(parsed[0]);
  const numKeys = keys.filter((k) => typeof parsed[0][k] === "number");
  const labelKey = keys.find((k) => !numKeys.includes(k)) || keys[0];
  if (numKeys.length === 0) return <div className="text-xs text-muted-foreground my-2">无数值字段</div>;

  const gridColor = "#d4d4d8";

  // ---- 饼图 ----
  if (type === "pie") {
    return (
      <div className="my-3 flex justify-center w-full max-w-[300px] mx-auto">
        <recharts.PieChart width={260} height={200}>
          <recharts.Pie data={parsed} dataKey={numKeys[0]} nameKey={labelKey}
            cx="50%" cy="50%" outerRadius={80}
            label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          >
            {parsed.map((_, i) => <recharts.Cell key={i} fill={colors[i % colors.length]} />)}
          </recharts.Pie>
          <recharts.Tooltip />
        </recharts.PieChart>
      </div>
    );
  }

  // ---- 雷达图 ----
  if (type === "radar") {
    return (
      <div className="my-3 flex justify-center w-full max-w-[320px] mx-auto">
        <recharts.RadarChart width={300} height={260} data={parsed}>
          <recharts.PolarGrid stroke={gridColor} />
          <recharts.PolarAngleAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <recharts.PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
          {numKeys.map((k, i) => (
            <recharts.Radar key={k} name={k} dataKey={k}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <recharts.Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <recharts.Tooltip />
        </recharts.RadarChart>
      </div>
    );
  }

  // ---- 折线图 ----
  if (type === "line") {
    return (
      <div className="my-3">
        <recharts.ResponsiveContainer width="100%" height={200}>
          <recharts.LineChart data={parsed} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <recharts.CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <recharts.XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#6b7280" }} />
            <recharts.YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
            <recharts.Tooltip />
            {numKeys.map((k, i) => (
              <recharts.Line key={k} type="monotone" dataKey={k}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={{ r: 3, fill: colors[i % colors.length] }}
                activeDot={{ r: 5 }}
              />
            ))}
          </recharts.LineChart>
        </recharts.ResponsiveContainer>
      </div>
    );
  }

  // ---- 柱状图（默认） ----
  return (
    <div className="my-3">
      <recharts.ResponsiveContainer width="100%" height={200}>
        <recharts.BarChart data={parsed} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
          <recharts.CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <recharts.XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: "#6b7280" }} />
          <recharts.YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
          <recharts.Tooltip />
          {numKeys.map((k, i) => (
            <recharts.Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
          ))}
        </recharts.BarChart>
      </recharts.ResponsiveContainer>
    </div>
  );
}

// ============================================
// 消息组件
// ============================================
interface MessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end pl-8" : "")}>
      {isUser ? (
        <div className="rounded-2xl bg-primary/90 text-primary-foreground px-4 py-2.5 text-[15px] leading-relaxed max-w-[88%]">
          {content}
        </div>
      ) : (
        <div className="w-full max-w-2xl prose prose-sm dark:prose-invert">
          {content ? (
            <MarkdownContent content={content} renderSpecial={!isStreaming} />
          ) : isStreaming ? (
            <div className="flex items-center gap-2.5 py-2">
              <span className="text-sm text-muted-foreground/50">思考中</span>
              <span className="inline-flex gap-1">
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ============================================
// 手风琴组件（点击展开/收起）
// ============================================
function Accordion({ summary, children }: { summary: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-3 rounded-lg border border-border/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-medium text-left hover:bg-muted/30 transition-colors"
      >
        <span>{summary}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3.5 pb-3 text-sm text-muted-foreground/80 leading-relaxed">{children}</div>}
    </div>
  );
}

// ============================================
// 图片组件（懒加载 + 骨架屏 + 灯箱预览）
// ============================================
function DDImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <button onClick={() => setShowLightbox(true)} className="my-2 group text-left">
        <div className="relative size-20 rounded-xl border border-border/40 overflow-hidden bg-muted/20 hover:border-primary/30 transition-all">
          {/* 骨架屏 */}
          {!loaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-muted/40 to-muted/20 animate-pulse rounded-xl" />
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`size-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
        <div className="text-[10px] text-muted-foreground/50 mt-1 group-hover:text-primary/60 transition-colors truncate max-w-20">
          {alt}
        </div>
      </button>

      {/* 灯箱 */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="max-w-lg max-h-[80vh] rounded-xl overflow-hidden shadow-2xl bg-background animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={src} alt={alt} className="w-full h-auto" />
          </div>
        </div>
      )}
    </>
  );
}

// ============================================
// Markdown 渲染
// ============================================
function MarkdownContent({ content, renderSpecial = true }: { content: string; renderSpecial?: boolean }) {
  // 修复：确保 # ## ### 标题前有换行，否则 markdown 不识别
  const fixed = content.replace(/([^\n])(#{1,6}\s)/g, "$1\n\n$2");
  const renderCode = (lang: string | undefined, code: string) => {
    // 流式输出时，图表/mermaid 以普通代码块展示，避免不完整JSON反复挂载导致闪烁
    if (!renderSpecial) {
      return <CodeBlock language={lang || ""} code={code} />;
    }
    if (lang === "mermaid") return <Mermaid code={code} />;
    if (["chart-bar", "chart-pie", "chart-radar", "chart-line"].includes(lang || "")) {
      return <ChartBlock data={code} type={(lang || "").replace("chart-", "")} />;
    }
    return <CodeBlock language={lang || ""} code={code} />;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => <h1 className="not-prose text-xl font-bold mt-7 mb-3 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="not-prose text-lg font-semibold mt-5 mb-2 text-foreground/90">{children}</h2>,
        h3: ({ children }) => <h3 className="not-prose text-[15px] font-semibold mt-3 mb-1 text-foreground/85">{children}</h3>,

        strong: ({ children }) => <strong className="not-prose font-semibold text-foreground">{children}</strong>,

        p: ({ children }) => <p className="not-prose text-[15px] leading-[1.65] my-2 text-foreground/85">{children}</p>,

        ul: ({ children }) => <ul className="not-prose space-y-0.5 my-2 pl-4 list-disc text-[15px] text-foreground/85 marker:text-muted-foreground/40">{children}</ul>,
        ol: ({ children }) => <ol className="not-prose space-y-1 my-2.5 pl-5 list-decimal text-[15px] text-foreground/85 marker:text-muted-foreground/40">{children}</ol>,
        li: ({ children }) => <li className="not-prose leading-[1.7]">{children}</li>,

        // 图片
        img: ({ src, alt }: any) => <DDImage src={String(src || "")} alt={alt || ""} />,



        blockquote: ({ children }) => (
          <blockquote className="not-prose border-l-2 border-border pl-4 py-1 my-3 text-[14px] text-muted-foreground/70">
            {children}
          </blockquote>
        ),

        hr: () => <div className="not-prose my-6 h-px bg-border/50" />,

        code({ className, children, ...props }) {
          const isInline = !className;
          const codeStr = String(children).replace(/\n$/, "");
          if (isInline) {
            return <code className="not-prose bg-muted/60 px-1.5 py-0.5 rounded text-sm font-mono text-foreground/80 text-[13px]" {...props}>{children}</code>;
          }
          const lang = className?.replace("language-", "") || "";
          return renderCode(lang, codeStr);
        },

        pre({ children }) {
          return <>{children}</>;
        },

        table: ({ children }) => (
          <div className="not-prose my-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-border/40">{children}</tr>,
        th: ({ children }) => <th className="px-2.5 py-2 text-left font-semibold text-foreground/80 text-[12px] border-b border-border/60 whitespace-nowrap">{children}</th>,
        td: ({ children }) => <td className="px-2.5 py-2 text-foreground/80 text-[12px]">{children}</td>,
      }}
    >
      {fixed}
    </ReactMarkdown>
  );
}

// ============================================
// 代码块（含复制）
// ============================================
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-lg border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground/60">
        <span>{language || ""}</span>
        <button onClick={handleCopy} className="hover:text-foreground transition-colors">
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <pre className="p-3.5 text-sm overflow-x-auto bg-[#0d0d0d] dark:bg-[#0a0a0a] text-[#e5e5e5] leading-relaxed"><code>{code}</code></pre>
    </div>
  );
}
