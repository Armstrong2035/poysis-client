"use client";

import { useEffect, useState } from "react";

interface Connection {
  id: string;
  label: string;
  docCount?: number;
  enabled?: boolean;
  kind: "drive" | "youtube";
}

interface ConnectionScopePickerProps {
  selectedIds: string[];
  onToggle: (connId: string) => void;
}

const prefixed = (id: string) => `conn:${id}`;

export function ConnectionScopePicker({ selectedIds, onToggle }: ConnectionScopePickerProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/drive/status").then((r) => (r.ok ? r.json() : { connections: [] })),
      fetch("/api/youtube/status").then((r) => (r.ok ? r.json() : { connections: [] })),
    ])
      .then(([drive, youtube]) => {
        const driveConns: Connection[] = (drive.connections ?? []).map((c: any) => ({
          id: c.id,
          label: c.google_account_email,
          docCount: c.doc_count,
          kind: "drive" as const,
        }));
        const youtubeConns: Connection[] = (youtube.connections ?? []).map((c: any) => ({
          id: c.id,
          label: c.channel_name ?? c.channel_id,
          enabled: c.enabled,
          kind: "youtube" as const,
        }));
        setConnections([...driveConns, ...youtubeConns]);
      })
      .catch(() => setError("Couldn't load connections."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <span className="w-3 h-3 rounded-full animate-pulse" style={{ background: "rgba(232,165,71,0.4)" }} />
        <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#9CA0AC" }}>
          Loading connections…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#C9534B" }}>{error}</p>
    );
  }

  if (connections.length === 0) {
    return (
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#3A3D47" }}>
        No connections yet — connect a source in the Knowledge tab.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-1">
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" }}>
          {connections.filter(c => selectedIds.includes(prefixed(c.id))).length === 0
            ? "No connections in scope"
            : `${connections.filter(c => selectedIds.includes(prefixed(c.id))).length} connection${connections.filter(c => selectedIds.includes(prefixed(c.id))).length !== 1 ? "s" : ""} in scope`}
        </span>
      </div>

      {connections.map((conn) => {
        const selected = selectedIds.includes(prefixed(conn.id));
        return (
          <button
            key={conn.id}
            onClick={() => onToggle(prefixed(conn.id))}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
            style={{
              background: selected ? "rgba(232,165,71,0.08)" : "rgba(58,61,71,0.15)",
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

            {/* Source icon */}
            {conn.kind === "drive" ? (
              <svg width="14" height="14" viewBox="0 0 87.3 78" fill="none" className="flex-shrink-0" style={{ opacity: selected ? 1 : 0.5 }}>
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0" style={{ opacity: selected ? 1 : 0.5 }}>
                <rect x="1" y="4" width="22" height="16" rx="4" fill="#E8504B" />
                <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#0A0B0F" />
              </svg>
            )}

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
              {conn.label}
            </span>

            {/* Doc count (Drive) or enabled state (YouTube) */}
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47", flexShrink: 0 }}>
              {typeof conn.docCount === "number"
                ? `${conn.docCount.toLocaleString()} docs`
                : conn.enabled
                  ? "Active"
                  : "Disabled"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
