"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { ArrowUp, Square, LayoutList } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isLoading: boolean;
  onOpenPanel?: () => void;
}

export function ChatInput({ onSend, onStop, isLoading, onOpenPanel }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) textareaRef.current.focus();
  }, [isLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput("");
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px"; }
  }, [input]);

  return (
    <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-3xl mx-auto px-3 py-2">
        <div className="flex items-end gap-1.5 bg-muted/30 rounded-xl border border-border/50 focus-within:border-primary/25 focus-within:bg-muted/50 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder="向玄言 DD Agent 提问..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none px-4 py-3 text-[15px] placeholder:text-muted-foreground/40 focus:outline-none min-h-[44px] max-h-[140px]"
          />
          <div className="flex items-center gap-0.5 pr-1.5 pb-1.5">
            <button
              onClick={onOpenPanel}
              disabled={isLoading}
              className="size-8 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-all disabled:opacity-20"
              title="尽调导航"
            >
              <LayoutList size={15} className="text-muted-foreground/60" />
            </button>
            {isLoading ? (
              <button onClick={onStop} className="size-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors">
                <Square size={13} className="text-destructive" fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim()} className="size-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 flex items-center justify-center transition-all active:scale-95">
                <ArrowUp size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
