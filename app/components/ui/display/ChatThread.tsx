"use client";

import { useState, useRef, useEffect } from "react";
import { useNotebookStore } from "../../../store/notebookStore";
import type { ChatMessage } from "../../../types/canvas";

interface ChatThreadProps {
  blockId: string;
}

/**
 * ChatThread — unified conversational interface for looped blocks.
 * Combines input, streaming output, message history, and cited sources
 * in a single self-contained component that replaces the old
 * disconnected ChatInput + StreamPanel + SourceAccordion trio.
 */
export function ChatThread({ blockId }: ChatThreadProps) {
  const [localValue, setLocalValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const block = useNotebookStore((state) => state.blocks[blockId]);
  const { setInputValue, executeBlock } = useNotebookStore();

  const isStreaming = block?.status === "streaming";
  const history: ChatMessage[] = (block?.outputs as any)?.history || [];
  const liveStream: string = (block?.outputs as any)?.stream || "";

  // Auto-scroll to bottom when history or live stream changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length, liveStream]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localValue.trim() || isStreaming) return;

    setInputValue(blockId, "query", localValue);
    setLocalValue("");
    executeBlock(blockId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ─── Thread ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 py-4 space-y-4 custom-scrollbar min-h-0"
      >
        {history.length === 0 && !liveStream && (
          <div className="flex flex-col items-center justify-center text-center py-10 text-zinc-400 select-none">
            <span className="text-2xl mb-2 opacity-50">💬</span>
            <span className="text-xs font-medium">Ask a question to get started</span>
          </div>
        )}

        {history.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <UserBubble content={msg.content} />
            ) : (
              <AssistantBubble content={msg.content} sources={msg.sources} />
            )}
          </div>
        ))}

        {/* Live streaming bubble (current response in progress) */}
        {isStreaming && liveStream && (
          <AssistantBubble content={liveStream} streaming />
        )}

        {/* Streaming indicator before any text arrives */}
        {isStreaming && !liveStream && (
          <div className="flex items-center gap-2 pl-1 py-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.3s]" />
            </div>
            <span className="text-[10px] text-zinc-400 font-medium">Thinking…</span>
          </div>
        )}
      </div>

      {/* ─── Input ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-3 border-t border-zinc-100 shrink-0">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-zinc-400 bg-white"
          style={{ 
            borderRadius: 'var(--radius)', 
            border: 'var(--border-width) solid rgba(0,0,0,0.1)',
            boxShadow: 'var(--shadow)'
          }}
          placeholder="Ask a follow-up…"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!localValue.trim() || isStreaming}
          className="flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={{ 
            backgroundColor: 'var(--primary-color)',
            borderRadius: 'var(--radius)'
          }}
        >
          {isStreaming ? (
            <span className="flex gap-1 items-center">
              <div className="w-1 h-1 rounded-full bg-white animate-bounce" />
              <div className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
            </span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>
          )}
        </button>
      </form>
    </div>
  );
}


/* ━━━ Sub-components ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div 
        className="max-w-[85%] text-white text-sm px-4 py-2.5 shadow-sm leading-relaxed transition-all"
        style={{ 
          backgroundColor: 'var(--primary-color)',
          borderRadius: 'var(--radius)',
          borderBottomRightRadius: '2px'
        }}
      >
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({
  content,
  sources,
  streaming,
}: {
  content: string;
  sources?: Array<{ file: string; score: number; snippet?: string }>;
  streaming?: boolean;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = sources && sources.length > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {/* Response text */}
        <div 
          className="text-zinc-800 text-sm px-4 py-3 shadow-sm leading-relaxed whitespace-pre-wrap transition-all"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
            borderRadius: 'var(--radius)',
            border: 'var(--border-width) solid rgba(0,0,0,0.05)',
            borderBottomLeftRadius: '2px'
          }}
        >
          {content}
          {streaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle rounded-sm" style={{ backgroundColor: 'var(--primary-color)' }} />
          )}
        </div>

        {/* Inline cited sources (collapsed by default) */}
        {hasSources && (
          <div className="mt-1.5 ml-1">
            <button
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1 group"
            >
              <span className="text-zinc-400 group-hover:text-zinc-600 transition-transform duration-200"
                style={{ display: 'inline-block', transform: sourcesOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                ▶
              </span>
              {sources!.length} source{sources!.length !== 1 ? "s" : ""} cited
            </button>

            {sourcesOpen && (
              <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources!.map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-zinc-600 bg-white border border-zinc-100 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-zinc-400">📄</span>
                    <span className="font-medium text-blue-600 truncate">{src.file}</span>
                    <span className="ml-auto font-mono text-zinc-400 text-[10px] flex-shrink-0">
                      {Math.round(src.score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
