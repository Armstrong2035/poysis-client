"use client";

import { useState, useEffect, useCallback } from "react";

type DriveConnection = {
  id: string;
  google_account_email: string;
  doc_count: number;
  last_synced_at: string | null;
};

const COMING_SOON = [
  { id: "notion", name: "Notion", icon: "N", description: "Pages, databases, wikis" },
  { id: "slack", name: "Slack", icon: "S", description: "Channels, threads, DMs" },
  { id: "confluence", name: "Confluence", icon: "C", description: "Spaces, pages, docs" },
  { id: "github", name: "GitHub", icon: "G", description: "Issues, PRs, wikis" },
  { id: "linear", name: "Linear", icon: "L", description: "Issues, projects, docs" },
];

export default function SourcesPage() {
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/status");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections ?? []);
      }
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const hasConnections = connections.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1
          style={{ fontFamily: "Syne, sans-serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", color: "#E8E9ED", marginBottom: "6px" }}
        >
          Knowledge Sources
        </h1>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 300, color: "#9CA0AC" }}>
          Connect the places your knowledge lives.
        </p>
      </div>

      {/* Connected */}
      {!loading && hasConnections && (
        <section className="mb-8">
          <SectionLabel text="Connected" />
          <div className="space-y-2">
            {connections.map((conn) => (
              <DriveCard key={conn.id} connection={conn} onConnectionChange={fetchConnections} />
            ))}
          </div>
        </section>
      )}

      {/* Get started — nothing connected yet */}
      {!loading && !hasConnections && (
        <section className="mb-8">
          <SectionLabel text="Get Started" />
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#9CA0AC", marginBottom: "16px" }}>
            Connect a source so Poysis can build your knowledge map.
          </p>
          <ConnectGoogleDriveButton />
        </section>
      )}

      {/* Add another drive */}
      {!loading && hasConnections && (
        <section className="mb-8">
          <SectionLabel text="Also Connect" />
          <ConnectGoogleDriveButton secondary />
        </section>
      )}

      {/* Coming soon */}
      <section>
        <SectionLabel text="Coming Soon" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMING_SOON.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded"
              style={{ background: "rgba(58,61,71,0.15)", border: "1px solid rgba(58,61,71,0.3)", opacity: 0.55 }}
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(58,61,71,0.5)", fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700, color: "#9CA0AC" }}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#9CA0AC" }}>{s.name}</div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47" }}>{s.description}</div>
              </div>
              <SoonPill />
            </div>
          ))}
        </div>
      </section>

      {/* Sync footnote */}
      <p
        className="mt-10"
        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#3A3D47", textTransform: "uppercase" as const }}
      >
        Sources sync every 15 min
      </p>
    </div>
  );
}

/* ── DriveCard ──────────────────────────────────────────────────────── */

function DriveCard({ connection, onConnectionChange }: { connection: DriveConnection; onConnectionChange: () => void }) {
  const [resyncing, setResyncing] = useState(false);
  const [removing, setRemoving] = useState(false);

  const lastSynced = connection.last_synced_at
    ? formatTimeAgo(new Date(connection.last_synced_at))
    : "never";

  const handleResync = async () => {
    setResyncing(true);
    try {
      await fetch("/api/drive/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      onConnectionChange();
    } finally {
      setResyncing(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Disconnect ${connection.google_account_email} from Poysis?`)) return;
    setRemoving(true);
    try {
      await fetch("/api/drive/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connection.id }),
      });
      onConnectionChange();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded"
      style={{ background: "rgba(107,176,122,0.06)", border: "1px solid rgba(107,176,122,0.2)" }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(107,176,122,0.12)" }}
      >
        <DriveIcon />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="truncate"
            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#E8E9ED" }}
          >
            {connection.google_account_email}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]" style={{ boxShadow: "0 0 5px rgba(107,176,122,0.7)" }} />
            <span
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#6BB07A", textTransform: "uppercase" as const }}
            >
              Active
            </span>
          </div>
        </div>
        <div
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", letterSpacing: "0.1em", marginTop: "2px" }}
        >
          {connection.doc_count > 0 ? `${connection.doc_count} docs` : "Indexing…"} · synced {lastSynced}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleResync}
          disabled={resyncing}
          className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(232,165,71,0.12)] disabled:opacity-40"
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase" as const, border: "1px solid rgba(232,165,71,0.25)" }}
        >
          {resyncing ? "…" : "Resync"}
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(201,80,75,0.12)] disabled:opacity-40"
          style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" as const, border: "1px solid rgba(58,61,71,0.4)" }}
        >
          {removing ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

/* ── ConnectGoogleDriveButton ─────────────────────────────────────── */

function ConnectGoogleDriveButton({ secondary = false }: { secondary?: boolean }) {
  return (
    <button
      onClick={() => { window.location.href = "/api/auth/google-drive"; }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-300"
      style={
        secondary
          ? { background: "rgba(58,61,71,0.15)", border: "1px dashed rgba(232,165,71,0.3)" }
          : { background: "linear-gradient(135deg, rgba(232,165,71,0.12) 0%, rgba(201,149,71,0.06) 100%)", border: "1px solid rgba(232,165,71,0.35)", boxShadow: "0 0 24px rgba(232,165,71,0.04)" }
      }
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = secondary ? "rgba(232,165,71,0.5)" : "rgba(232,165,71,0.6)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = secondary ? "rgba(232,165,71,0.3)" : "rgba(232,165,71,0.35)"; }}
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: secondary ? "rgba(58,61,71,0.4)" : "rgba(232,165,71,0.1)" }}
      >
        <DriveIcon size={14} />
      </div>
      <div className="flex-1 text-left">
        <div
          style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: secondary ? 300 : 500, color: secondary ? "#9CA0AC" : "#E8E9ED" }}
        >
          {secondary ? "Connect another Google Drive" : "Connect Google Drive"}
        </div>
        {!secondary && (
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", marginTop: "1px" }}>
            Docs, Sheets, Slides, Folders
          </div>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#E8A547" strokeWidth="1.4">
        <line x1="2" y1="7" x2="12" y2="7" />
        <polyline points="8,3 12,7 8,11" />
      </svg>
    </button>
  );
}

/* ── Primitives ──────────────────────────────────────────────────────── */

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-3"
      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase" as const }}
    >
      {text}
    </div>
  );
}

function SoonPill() {
  return (
    <div
      className="px-1.5 py-0.5 rounded"
      style={{ background: "rgba(58,61,71,0.5)", fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" as const, flexShrink: 0 }}
    >
      Soon
    </div>
  );
}

function DriveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" fill="none">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" opacity="0.8" />
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" opacity="0.8" />
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" opacity="0.8" />
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" opacity="0.8" />
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" opacity="0.8" />
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" opacity="0.8" />
    </svg>
  );
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
