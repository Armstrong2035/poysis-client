"use client";

import { useEffect, useState } from "react";

interface Topic {
  topic_id: string;
  label: string;
  doc_count: number;
  parent_topic_id: string | null;
  locked?: boolean;
}

interface TopicScopePickerProps {
  selectedIds: string[];
  onToggle: (topicId: string) => void;
}

export function TopicScopePicker({ selectedIds, onToggle }: TopicScopePickerProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/worker/consolidation/topics")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) => {
        // Only show root topics (no parent) — children are implicit
        const roots = (data.topics ?? data ?? []).filter(
          (t: Topic) => !t.parent_topic_id
        );
        setTopics(roots);
      })
      .catch(() => setError("Couldn't load topics."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <span
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ background: "rgba(232,165,71,0.4)" }}
        />
        <span
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "11px",
            color: "#9CA0AC",
          }}
        >
          Loading topics…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#C9534B" }}>
        {error}
      </p>
    );
  }

  if (topics.length === 0) {
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#3A3D47" }}>
        No topics found — run consolidation first.
      </p>
    );
  }

  const prefixed = (id: string) => `topic:${id}`;
  const allSelected = topics.length > 0 && topics.every((t) => selectedIds.includes(prefixed(t.topic_id)));

  return (
    <div className="space-y-2">
      {/* Select all / none */}
      <div className="flex items-center justify-between mb-1">
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "8px",
            letterSpacing: "0.15em",
            color: "#3A3D47",
            textTransform: "uppercase",
          }}
        >
          {selectedIds.length === 0
            ? "No scope set — end users see nothing"
            : `${selectedIds.length} topic${selectedIds.length !== 1 ? "s" : ""} in scope`}
        </span>
        <button
          onClick={() => topics.forEach((t) => {
            const isSelected = selectedIds.includes(prefixed(t.topic_id));
            if (allSelected ? isSelected : !isSelected) onToggle(prefixed(t.topic_id));
          })}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "8px",
            letterSpacing: "0.12em",
            color: "#E8A547",
            textTransform: "uppercase",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          className="hover:opacity-70 transition-opacity"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {topics.map((topic) => {
        const selected = selectedIds.includes(prefixed(topic.topic_id));
        return (
          <button
            key={topic.topic_id}
            onClick={() => onToggle(prefixed(topic.topic_id))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
              background: selected
                ? "rgba(232,165,71,0.08)"
                : "rgba(58,61,71,0.15)",
              border: `1px solid ${selected ? "rgba(232,165,71,0.3)" : "rgba(58,61,71,0.3)"}`,
            }}
          >
            {/* Checkbox */}
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: selected ? "#E8A547" : "rgba(58,61,71,0.4)",
                border: `1px solid ${selected ? "#E8A547" : "rgba(58,61,71,0.6)"}`,
              }}
            >
              {selected && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="white" strokeWidth="1.5">
                  <polyline points="1,3 3,5 7,1" />
                </svg>
              )}
            </div>

            {/* Label */}
            <span
              className="flex-1 truncate"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: selected ? 400 : 300,
                color: selected ? "#E8E9ED" : "#9CA0AC",
              }}
            >
              {topic.label}
            </span>

            {/* Doc count */}
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                color: "#3A3D47",
                flexShrink: 0,
              }}
            >
              {topic.doc_count} doc{topic.doc_count !== 1 ? "s" : ""}
            </span>

            {/* Lock badge — shown when topic has been user-modified */}
            {topic.locked && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="#E8A547"
                strokeWidth="1.2"
                className="flex-shrink-0"
              >
                <title>User-modified — protected from recluster</title>
                <rect x="2" y="4.5" width="6" height="4.5" rx="1" />
                <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
