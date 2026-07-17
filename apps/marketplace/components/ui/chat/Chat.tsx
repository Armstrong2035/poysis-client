"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { ChatConfig } from "../../../types/canvas";
import { MarkdownContent } from "./MarkdownContent";

const SENTINEL = "\n\n__SOURCES__";

const MODELS = [
  { id: "gemini-3-flash", label: "Flash", hint: "Fast · Default" },
  { id: "gemini-3-pro",   label: "Pro",   hint: "Smarter · Slower" },
] as const;

function displayContent(content: string): string {
  const idx = content.indexOf(SENTINEL);
  return idx !== -1 ? content.slice(0, idx) : content;
}

type CitedSource = {
  file: string;
  score: number;
  snippet?: string;
  url?: string;
  title?: string;
};

function extractSources(content: string): CitedSource[] {
  const idx = content.indexOf(SENTINEL);
  if (idx === -1) return [];
  try {
    return JSON.parse(content.slice(idx + SENTINEL.length));
  } catch {
    return [];
  }
}

function getMessageText(parts: any[]): string {
  return (parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

const DARK = {
  bg: "transparent",
  inputBg: "rgba(58,61,71,0.25)",
  inputBorder: "rgba(58,61,71,0.5)",
  inputText: "#E8E9ED",
  inputPlaceholder: "#9CA0AC",
  userBubbleBg: "",
  assistantBubbleBg: "rgba(58,61,71,0.2)",
  assistantBubbleBorder: "rgba(58,61,71,0.4)",
  assistantText: "#E8E9ED",
  mutedText: "#9CA0AC",
  dotColor: "#E8A547",
  errorBg: "rgba(201,80,75,0.08)",
  errorBorder: "rgba(201,80,75,0.25)",
  errorText: "#C9534B",
  sourceItemBg: "rgba(58,61,71,0.3)",
  sourceItemBorder: "rgba(58,61,71,0.5)",
  emptyText: "#9CA0AC",
};

const LIGHT = {
  bg: "transparent",
  inputBg: "#ffffff",
  inputBorder: "rgba(0,0,0,0.1)",
  inputText: "#18181b",
  inputPlaceholder: "#a1a1aa",
  userBubbleBg: "",
  assistantBubbleBg: "rgba(0,0,0,0.03)",
  assistantBubbleBorder: "rgba(0,0,0,0.06)",
  assistantText: "#27272a",
  mutedText: "#71717a",
  dotColor: "#71717a",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
  errorText: "#dc2626",
  sourceItemBg: "#ffffff",
  sourceItemBorder: "#e4e4e7",
  emptyText: "#a1a1aa",
};

interface ChatProps {
  config: ChatConfig;
  className?: string;
  /**
   * Optional local command interceptor, checked before any message is sent
   * to the backend. Return a reply string to handle the message entirely
   * client-side (appended to the thread as a synthetic assistant turn, no
   * network call) — used by Canvas to let the same input drive mock
   * ceiling/rename actions instead of the real RAG chat. Return null/undefined
   * to fall through to the real chat.
   */
  onCommand?: (text: string) => string | null | undefined;
  /** Quick-fill chips rendered above the input; clicking fills and sends. */
  quickPrompts?: { label: string; text: string }[];
  /** Optional extra content rendered under each assistant reply (e.g. a "Promote to notebook" action). */
  renderMessageFooter?: (info: { id: string; userText: string; assistantText: string }) => React.ReactNode;
  /** Fires whenever the user submits a message, before onCommand runs — a lightweight "chat was used" signal. */
  onSend?: (text: string) => void;
  /** If set, sent automatically once on mount — used to jump straight into a conversation from a suggested question. */
  initialQuery?: string;
}

export function Chat({ config, className, onCommand, quickPrompts, renderMessageFooter, onSend, initialQuery }: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelDropRef = useRef<HTMLDivElement>(null);

  // Keep a ref to config so the stable transport can read the latest values.
  const configRef = useRef(config);
  configRef.current = config;

  const isDark = config.mode === "dashboard";
  const theme = isDark ? DARK : LIGHT;
  const primaryColor = config.branding?.primaryColor ?? (isDark ? "#E8A547" : "#000000");
  const placeholder = config.placeholder ?? "Ask a question…";
  const endpoint =
    config.mode === "dashboard"
      ? "/api/worker/chat"
      : `/api/notebook/${config.playgroundId}/chat`;

  const defaultModel = config.model ?? "gemini-3-flash";
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef = useRef(defaultModel);
  useEffect(() => { modelRef.current = selectedModel; }, [selectedModel]);

  const [input, setInput] = useState("");

  // Transport is created once per endpoint. prepareSendMessagesRequest reads from
  // configRef/modelRef at call time so it always uses the latest values without
  // rebuilding the transport on every render.
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: endpoint,
        prepareSendMessagesRequest: ({ messages }) => {
          const c = configRef.current;
          const lastMsg = messages.at(-1);
          const query = getMessageText(lastMsg?.parts as any[]);

          const topicIds = (c.allowedSources ?? [])
            .filter((s) => s.startsWith("topic:"))
            .map((s) => s.slice(6));
          const connIds = (c.allowedSources ?? [])
            .filter((s) => s.startsWith("conn:"))
            .map((s) => s.slice(5));

          const body =
            c.mode === "dashboard"
              ? {
                  workspace_id: c.notebookId,
                  query,
                  top_k: 5,
                  min_score: 0.4,
                  model: modelRef.current,
                  ...(c.useOuroboros ? { useOuroboros: true } : {}),
                  ...(topicIds.length > 0 ? { allowed_topic_ids: topicIds } : {}),
                  ...(connIds.length > 0 ? { allowed_connection_ids: connIds } : {}),
                }
              : {
                  notebook_id: c.notebookId,
                  query,
                  stream: true,
                  ...(c.branding?.systemPrompt
                    ? { instructions: c.branding.systemPrompt }
                    : {}),
                  ...(topicIds.length > 0 ? { allowed_topic_ids: topicIds } : {}),
                  ...(connIds.length > 0 ? { allowed_connection_ids: connIds } : {}),
                };

          return { body };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint]
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({ transport });

  const isStreaming = status === "streaming" || status === "submitted";

  const submitText = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    onSend?.(text);

    const reply = onCommand?.(text);
    if (reply != null) {
      setMessages((prev) => [
        ...prev,
        { id: `local-user-${Date.now()}`, role: "user", parts: [{ type: "text", text }] },
        { id: `local-assistant-${Date.now()}`, role: "assistant", parts: [{ type: "text", text: reply }] },
      ]);
      return;
    }

    await sendMessage({ text });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input;
    setInput("");
    await submitText(text);
  };

  const handleQuickPrompt = (text: string) => {
    void submitText(text);
  };

  // Auto-send the initial query exactly once, regardless of prop identity
  // changing across re-renders (a fresh string literal from a caller would
  // otherwise re-trigger this on every render).
  const sentInitialRef = useRef(false);
  useEffect(() => {
    if (sentInitialRef.current || !initialQuery?.trim()) return;
    sentInitialRef.current = true;
    void submitText(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close model dropdown on outside click.
  useEffect(() => {
    if (!modelOpen) return;
    const handler = (e: MouseEvent) => {
      if (modelDropRef.current && !modelDropRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modelOpen]);

  // Auto-scroll on new content.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, messages[messages.length - 1]]);

  return (
    <div
      className={`flex flex-col min-h-0 h-full${className ? ` ${className}` : ""}`}
      style={{ background: theme.bg }}
    >
      {/* Thread */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-1 py-4 space-y-4 min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(100,100,100,0.3) transparent" }}
      >
        {messages.length === 0 && !isStreaming && (
          <div
            className="flex flex-col items-center justify-center text-center py-16 select-none"
            style={{ color: theme.emptyText }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              className="mb-3 opacity-40"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontWeight: 300,
              }}
            >
              Ask a question to get started
            </span>
          </div>
        )}

        {messages.map((msg, i) => {
          const text = getMessageText(msg.parts as any[]);
          if (msg.role === "user") {
            return <UserBubble key={msg.id} content={text} primaryColor={primaryColor} />;
          }
          const prevUser = messages.slice(0, i).reverse().find((m) => m.role === "user");
          const assistantText = displayContent(text);
          return (
            <div key={msg.id}>
              <AssistantBubble content={assistantText} sources={extractSources(text)} streaming={false} theme={theme} />
              {renderMessageFooter?.({
                id: msg.id,
                userText: prevUser ? getMessageText(prevUser.parts as any[]) : "",
                assistantText,
              })}
            </div>
          );
        })}

        {status === "submitted" && <ThinkingDots color={theme.dotColor} />}

        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
            style={{
              background: theme.errorBg,
              border: `1px solid ${theme.errorBorder}`,
              color: theme.errorText,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
            }}
          >
            <span>Something went wrong. Please try again.</span>
          </div>
        )}
      </div>

      {quickPrompts && quickPrompts.length > 0 && (
        <div className="flex gap-2 flex-wrap pb-2 shrink-0">
          {quickPrompts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleQuickPrompt(p.text)}
              disabled={isStreaming}
              className="px-3 py-1.5 rounded-full text-xs transition-opacity disabled:opacity-40"
              style={{
                border: `1px solid ${theme.inputBorder}`,
                background: theme.inputBg,
                color: theme.mutedText,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 pt-3 shrink-0"
        style={{
          borderTop: `1px solid ${isDark ? "rgba(58,61,71,0.4)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        {/* Model switcher — dashboard only, unless the host page has its own */}
        {config.mode === "dashboard" && !config.hideModelSwitcher && (
          <div className="relative self-center" ref={modelDropRef}>
            <button
              type="button"
              onClick={() => setModelOpen((o) => !o)}
              className="flex items-center gap-1 px-2 py-1.5 transition-opacity hover:opacity-70"
              style={{
                background: "rgba(58,61,71,0.25)",
                border: "1px solid rgba(58,61,71,0.5)",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.08em",
                color: "#9CA0AC",
                whiteSpace: "nowrap",
              }}
            >
              {MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1.5 2.5L4 5L6.5 2.5" />
              </svg>
            </button>

            {modelOpen && (
              <div
                className="absolute bottom-full mb-1.5 left-0 z-50 py-1"
                style={{
                  background: "#1A1C23",
                  border: "1px solid rgba(58,61,71,0.6)",
                  borderRadius: "10px",
                  minWidth: "150px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              >
                {MODELS.map((m) => {
                  const active = m.id === selectedModel;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m.id);
                        setModelOpen(false);
                      }}
                      className="w-full flex flex-col px-3 py-2 text-left transition-colors hover:bg-white/5"
                      style={{ background: active ? "rgba(232,165,71,0.08)" : undefined }}
                    >
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "12px",
                          color: active ? "#E8A547" : "#E8E9ED",
                        }}
                      >
                        {m.label}
                      </span>
                      <span
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "10px",
                          color: "#9CA0AC",
                        }}
                      >
                        {m.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-sm outline-none transition-all"
          style={{
            background: theme.inputBg,
            border: `1px solid ${theme.inputBorder}`,
            borderRadius: "10px",
            color: theme.inputText,
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: primaryColor,
            borderRadius: "10px",
            minWidth: "44px",
          }}
        >
          {isStreaming ? (
            <span className="flex gap-1 items-center">
              <span className="w-1 h-1 rounded-full bg-white animate-bounce" />
              <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function UserBubble({
  content,
  primaryColor,
}: {
  content: string;
  primaryColor: string;
}) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] text-white text-sm px-4 py-2.5 leading-relaxed"
        style={{
          background: primaryColor,
          borderRadius: "12px",
          borderBottomRightRadius: "3px",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "13px",
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
  theme,
}: {
  content: string;
  sources: CitedSource[];
  streaming: boolean;
  theme: typeof DARK;
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = sources.length > 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div
          className="text-sm px-4 py-3 leading-relaxed"
          style={{
            background: theme.assistantBubbleBg,
            border: `1px solid ${theme.assistantBubbleBorder}`,
            borderRadius: "12px",
            borderBottomLeftRadius: "3px",
            color: theme.assistantText,
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 300,
          }}
        >
          <MarkdownContent content={content} linkColor="#3b82f6" />
          {streaming && (
            <span
              className="inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle rounded-sm"
              style={{ background: theme.dotColor }}
            />
          )}
        </div>

        {hasSources && (
          <div className="mt-1.5 ml-1">
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="flex items-center gap-1 transition-colors"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10px",
                letterSpacing: "0.06em",
                color: theme.mutedText,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transition: "transform 180ms",
                  transform: sourcesOpen ? "rotate(90deg)" : "rotate(0deg)",
                  color: theme.mutedText,
                }}
              >
                ▶
              </span>
              {sources.length} source{sources.length !== 1 ? "s" : ""} cited
            </button>

            {sourcesOpen && (
              <div className="mt-1.5 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources.map((src, i) => {
                  const label = src.title || src.file;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{
                        background: theme.sourceItemBg,
                        border: `1px solid ${theme.sourceItemBorder}`,
                        borderRadius: "8px",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "11px",
                        color: theme.mutedText,
                      }}
                    >
                      <span style={{ opacity: 0.5 }}>{src.url ? "🔗" : "📄"}</span>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium truncate hover:underline"
                          style={{ color: "#3b82f6" }}
                          title={src.url}
                        >
                          {label}
                        </a>
                      ) : (
                        <span
                          className="font-medium truncate"
                          style={{ color: "#3b82f6" }}
                        >
                          {label}
                        </span>
                      )}
                      <span
                        className="ml-auto flex-shrink-0"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "9px",
                          color: theme.mutedText,
                        }}
                      >
                        {Math.round(src.score * 100)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingDots({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-2 pl-1 py-2">
      <span className="flex gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: color }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.15s]"
          style={{ background: color }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.3s]"
          style={{ background: color }}
        />
      </span>
      <span
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "11px",
          color,
          opacity: 0.7,
        }}
      >
        Thinking…
      </span>
    </div>
  );
}
