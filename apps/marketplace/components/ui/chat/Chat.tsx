"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import type { ChatConfig } from "../../../types/canvas";
import { MarkdownContent } from "./MarkdownContent";

const SOURCES_SENTINEL = "\n\n__SOURCES__";
const META_SENTINEL = "\n\n__META__";
// Retrieval replies self-identify with a leading __MODE__ marker — the very first
// bytes of the stream, with NO "\n\n" prefix — and carry ranked sources but no
// written answer. Synthesis replies (the original behavior) stream prose first,
// then the __SOURCES__/__META__ machine blocks.
const MODE_SENTINEL = "__MODE__";

const MODELS = [
  { id: "gemini-3-flash", label: "Flash", hint: "Fast · Default" },
  { id: "gemini-3-pro",   label: "Pro",   hint: "Smarter · Slower" },
] as const;

function displayContent(content: string): string {
  // The worker appends machine blocks (__SOURCES__ then __META__) after the answer.
  // Visible text ends at the first one that appears.
  const idx = content.indexOf(SOURCES_SENTINEL);
  return idx !== -1 ? content.slice(0, idx) : content;
}

type CitedSource = {
  file: string;
  score: number;
  snippet?: string;
  url?: string;
  title?: string;
};

type ChatMeta = {
  scale?: { sources: number; excerpts: number };
  themes?: string[];
  key_quote?: { text: string; title?: string; url?: string; start_time?: string } | null;
};

function extractSources(content: string): CitedSource[] {
  const start = content.indexOf(SOURCES_SENTINEL);
  if (start === -1) return [];
  const from = start + SOURCES_SENTINEL.length;
  // Sources JSON runs up to the __META__ block (if present) — parsing past it fails.
  const metaAt = content.indexOf(META_SENTINEL, from);
  const raw = metaAt === -1 ? content.slice(from) : content.slice(from, metaAt);
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function extractMeta(content: string): ChatMeta | null {
  const idx = content.indexOf(META_SENTINEL);
  if (idx === -1) return null;
  try {
    return JSON.parse(content.slice(idx + META_SENTINEL.length));
  } catch {
    return null;
  }
}

type ChatMode = "retrieval" | "synthesis";

type ParsedChat = {
  mode: ChatMode;
  answer: string; // "" in retrieval mode
  sources: CitedSource[];
  meta: ChatMeta | null;
};

// One place that decides how to render a reply. A retrieval reply leads with
// __MODE__ and has no prose — we must never print that marker as answer text and
// must tolerate it arriving split across chunks. Everything after the leading
// marker (the __SOURCES__/__META__ blocks) is shared with synthesis, so the
// existing extractors handle both shapes unchanged.
function parseChat(content: string): ParsedChat {
  const trimmed = content.trimStart();
  const retrieval = trimmed.startsWith(MODE_SENTINEL);
  // While the leading __MODE__ is still streaming in (e.g. "__MO"), suppress it
  // too so a partial marker never flashes as answer text before we know the mode.
  const partialMode = !retrieval && trimmed.length > 0 && MODE_SENTINEL.startsWith(trimmed);
  return {
    mode: retrieval ? "retrieval" : "synthesis",
    answer: retrieval || partialMode ? "" : displayContent(content),
    sources: extractSources(content),
    // Retrieval is LLM-free, so key_quote is absent — the renderer already
    // treats it as optional.
    meta: extractMeta(content),
  };
}

function getMessageText(parts: any[]): string {
  return (parts ?? [])
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

// Notebook chat renders in the marketplace design system (globals.css tokens),
// so it follows the site's own light/dark "reading room" automatically instead
// of a per-notebook custom palette.
const THEME = {
  bg: "transparent",
  inputBg: "var(--card)",
  inputBorder: "var(--rule)",
  inputText: "var(--ink)",
  inputPlaceholder: "var(--faint)",
  userBubbleBg: "",
  assistantBubbleBg: "var(--card)",
  assistantBubbleBorder: "var(--rule)",
  assistantText: "var(--ink)",
  mutedText: "var(--muted)",
  dotColor: "var(--accent)",
  // Error stays a legible light-red card on either ground — there is no error
  // token in the design system.
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
  errorText: "#dc2626",
  sourceItemBg: "var(--card)",
  sourceItemBorder: "var(--rule)",
  emptyText: "var(--faint)",
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
  /** Fires once each time an assistant reply finishes streaming — a "an answer just landed" signal (used to prompt the waitlist). */
  onAnswer?: () => void;
  /** If set, sent automatically once on mount — used to jump straight into a conversation from a suggested question. */
  initialQuery?: string;
}

export function Chat({ config, className, onCommand, quickPrompts, renderMessageFooter, onSend, onAnswer, initialQuery }: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const modelDropRef = useRef<HTMLDivElement>(null);

  // Keep a ref to config so the stable transport can read the latest values.
  const configRef = useRef(config);
  configRef.current = config;

  const theme = THEME;
  // The chat accent is the site accent — notebooks no longer carry a custom color.
  const primaryColor = "var(--accent)";
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

  // Fire onAnswer on the streaming→settled transition when the last message is
  // an assistant reply — i.e. an answer just finished landing.
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (wasStreamingRef.current && !isStreaming && last?.role === "assistant") {
      onAnswer?.();
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, messages, onAnswer]);

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
          const parsed = parseChat(text);
          return (
            <div key={msg.id}>
              <AssistantBubble content={parsed.answer} sources={parsed.sources} meta={parsed.meta} mode={parsed.mode} streaming={false} theme={theme} />
              {renderMessageFooter?.({
                id: msg.id,
                userText: prevUser ? getMessageText(prevUser.parts as any[]) : "",
                assistantText: parsed.answer,
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
          borderTop: `1px solid var(--rule)`,
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
          className="flex items-center justify-center px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: primaryColor,
            color: "var(--ground)",
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
        className="max-w-[85%] text-sm px-4 py-2.5 leading-relaxed"
        style={{
          background: primaryColor,
          color: "var(--ground)",
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
  meta,
  mode,
  streaming,
  theme,
}: {
  content: string;
  sources: CitedSource[];
  meta: ChatMeta | null;
  mode: ChatMode;
  streaming: boolean;
  theme: typeof THEME;
}) {
  // Citations are the whole point of a grounded answer — show them by default
  // rather than hiding them behind a collapsed toggle.
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const hasSources = sources.length > 0;
  // Retrieval replies have no prose — go straight to the source list. Empty
  // retrieval results get an explicit "no results" state instead of a blank card.
  const isRetrieval = mode === "retrieval";

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        {content.trim() && (
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
        )}

        {isRetrieval && !hasSources && (
          <div
            className="text-sm px-4 py-3 leading-relaxed"
            style={{
              background: theme.assistantBubbleBg,
              border: `1px solid ${theme.assistantBubbleBorder}`,
              borderRadius: "12px",
              borderBottomLeftRadius: "3px",
              color: theme.mutedText,
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 300,
            }}
          >
            No results found.
          </div>
        )}

        {/* Key quote — one memorable, grounded line, visually emphasized. */}
        {meta?.key_quote?.text && (
          <div
            className="mt-2 px-3.5 py-2.5"
            style={{
              borderLeft: `3px solid ${theme.dotColor}`,
              background: theme.sourceItemBg,
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: theme.mutedText,
                marginBottom: "4px",
              }}
            >
              Key quote
            </div>
            <div
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "13px",
                fontStyle: "italic",
                color: theme.assistantText,
                lineHeight: 1.5,
              }}
            >
              “{meta.key_quote.text}”
            </div>
            {(meta.key_quote.title || meta.key_quote.start_time) && (
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "10px",
                  color: theme.mutedText,
                  marginTop: "5px",
                }}
              >
                {meta.key_quote.url ? (
                  <a
                    href={meta.key_quote.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                    style={{ color: theme.mutedText }}
                  >
                    {meta.key_quote.title}
                    {meta.key_quote.start_time ? ` · ${meta.key_quote.start_time}` : ""}
                  </a>
                ) : (
                  <>
                    {meta.key_quote.title}
                    {meta.key_quote.start_time ? ` · ${meta.key_quote.start_time}` : ""}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recurring themes — the clusters this answer touches, so search becomes exploration. */}
        {meta?.themes && meta.themes.length > 0 && (
          <div className="mt-2 ml-1">
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: theme.mutedText,
                marginBottom: "5px",
              }}
            >
              Recurring themes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {meta.themes.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "11px",
                    padding: "3px 9px",
                    borderRadius: "999px",
                    background: theme.sourceItemBg,
                    border: `1px solid ${theme.sourceItemBorder}`,
                    color: theme.mutedText,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Scale — communicates this is a synthesis of real material, not a one-off answer. */}
        {meta?.scale && (meta.scale.sources > 0 || meta.scale.excerpts > 0) && (
          <div
            className="mt-2 ml-1"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              color: theme.mutedText,
            }}
          >
            Synthesized from {meta.scale.sources} source{meta.scale.sources !== 1 ? "s" : ""}
            {" · "}
            {meta.scale.excerpts} excerpt{meta.scale.excerpts !== 1 ? "s" : ""}
          </div>
        )}

        {hasSources && (
          <div className="mt-2.5 ml-1">
            <button
              onClick={() => setSourcesOpen((o) => !o)}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  transition: "transform 180ms",
                  transform: sourcesOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ▶
              </span>
              Sources
              <span
                className="flex items-center justify-center"
                style={{
                  minWidth: 16,
                  height: 16,
                  padding: "0 5px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  fontSize: 9,
                }}
              >
                {sources.length}
              </span>
            </button>

            {sourcesOpen && (
              <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                {sources.map((src, i) => {
                  const label = src.title || src.file;
                  const pct = Math.round(src.score * 100);
                  // Whole row is the target (not just the label) so citations are
                  // easy to tap; the ↗ arrow signals it opens the source.
                  const inner = (
                    <>
                      <span
                        className="flex items-center justify-center shrink-0"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        className="flex-1 min-w-0 truncate font-medium"
                        style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12.5, color: "var(--ink)" }}
                      >
                        {label}
                      </span>
                      <span
                        className="shrink-0"
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9.5, color: "var(--faint)" }}
                      >
                        {pct}%
                      </span>
                      {src.url && (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          className="shrink-0"
                          style={{ color: "var(--accent)" }}
                        >
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="8 7 17 7 17 16" />
                        </svg>
                      )}
                    </>
                  );
                  return src.url ? (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      title={src.url}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg no-underline transition-colors bg-[var(--card)] border border-[var(--rule)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={i}
                      title={label}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--card)] border border-[var(--rule)]"
                    >
                      {inner}
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
