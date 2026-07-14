"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatMessage, ChatConfig } from "../types/canvas";

const SENTINEL = "\n\n__SOURCES__";

export type ChatStatus = "idle" | "streaming" | "error";

export interface ChatSession {
  messages: ChatMessage[];
  status: ChatStatus;
  stream: string;
  send: (query: string) => Promise<void>;
  retry: () => void;
}

export function useChatSession(config: ChatConfig): ChatSession {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [stream, setStream] = useState("");
  const lastQueryRef = useRef<string>("");

  const send = useCallback(
    async (query: string) => {
      if (!query.trim() || status === "streaming") return;
      lastQueryRef.current = query;

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: query,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setStatus("streaming");
      setStream("");

      try {
        const endpoint =
          config.mode === "dashboard"
            ? "/api/worker/ask"
            : `/api/notebook/${config.playgroundId}/chat`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebook_id: config.notebookId,
            query,
            stream: true,
            ...(config.branding?.systemPrompt
              ? { instructions: config.branding.systemPrompt }
              : {}),
            ...(config.allowedSources
              ? { allowed_sources: config.allowedSources }
              : {}),
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`${res.status}: ${text.slice(0, 200)}`);
        }
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const sentinelIdx = buffer.indexOf(SENTINEL);
          const displayText =
            sentinelIdx !== -1 ? buffer.slice(0, sentinelIdx) : buffer;
          setStream(displayText);
        }

        const sentinelIdx = buffer.indexOf(SENTINEL);
        const answer =
          sentinelIdx !== -1 ? buffer.slice(0, sentinelIdx) : buffer;
        let sources: ChatMessage["sources"] = [];
        if (sentinelIdx !== -1) {
          try {
            sources = JSON.parse(buffer.slice(sentinelIdx + SENTINEL.length));
          } catch {
            sources = [];
          }
        }

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: answer,
          sources,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStream("");
        setStatus("idle");
      } catch (err) {
        console.error("[useChatSession] Request failed:", err);
        setStream("");
        setStatus("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.mode, config.notebookId, config.playgroundId, status]
  );

  const retry = useCallback(() => {
    if (lastQueryRef.current) send(lastQueryRef.current);
  }, [send]);

  return { messages, status, stream, send, retry };
}
