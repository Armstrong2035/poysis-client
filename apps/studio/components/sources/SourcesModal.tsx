"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { type ClusteringState } from "../../app/hooks/useClusteringStatus";
import { InfoTooltip } from "../ui/InfoTooltip";
import {
  DEFAULT_MAX_VIDEO_MINUTES,
  MAX_VIDEO_MINUTES_ERROR,
  MAX_VIDEO_MINUTES_HELP,
  MAX_VIDEO_MINUTES_LIMIT,
  MIN_VIDEO_MINUTES_LIMIT,
  parseMaxVideoMinutes,
} from "../../lib/youtube";

export type DriveConnection = {
  id: string;
  google_account_email: string;
  doc_count: number;
  last_synced_at: string | null;
};

export type YoutubeConnection = {
  id: string;
  channel_id: string;
  channel_name: string | null;
  enabled: boolean;
  created_at: string;
};

type ClusteringProps = ClusteringState & {
  start: () => void;
  reset: () => void;
};

type SourcesModalProps = {
  connections: DriveConnection[];
  onConnectionChange: () => void;
  onClose: () => void;
  clustering: ClusteringProps;
};

const COMING_SOON = [
  {
    id: "notion",
    name: "Notion",
    icon: "N",
    description: "Pages, databases, wikis",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "S",
    description: "Channels, threads, DMs",
  },
  {
    id: "confluence",
    name: "Confluence",
    icon: "C",
    description: "Spaces, pages, docs",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "G",
    description: "Issues, PRs, wikis",
  },
  {
    id: "linear",
    name: "Linear",
    icon: "L",
    description: "Issues, projects, docs",
  },
];

export function SourcesModal({
  connections,
  onConnectionChange,
  onClose,
  clustering,
}: SourcesModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [youtubeConnections, setYoutubeConnections] = useState<YoutubeConnection[]>([]);

  const fetchYoutube = () => {
    fetch("/api/youtube/status")
      .then((r) => (r.ok ? r.json() : { connections: [] }))
      .then((data) => setYoutubeConnections(data.connections ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchYoutube();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const hasConnections = connections.length > 0;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: "520px",
          maxHeight: "80vh",
          background: "#0A0B0F",
          border: "1px solid rgba(232, 165, 71, 0.25)",
          borderRadius: "12px",
          boxShadow:
            "0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,165,71,0.06)",
          animation: "fade-up 200ms ease-out both",
        }}
      >
        {/* Atmospheric glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(232,165,71,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid rgba(58,61,71,0.4)" }}
        >
          <div>
            <h2
              style={{
                fontFamily: "Syne, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#E8E9ED",
              }}
            >
              Knowledge Sources
            </h2>
            <p
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "12px",
                fontWeight: 300,
                color: "#9CA0AC",
                marginTop: "2px",
              }}
            >
              Connect the places your knowledge lives.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-[#9CA0AC] hover:text-[#E8E9ED] hover:bg-[rgba(232,165,71,0.08)] transition-all"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-7 py-5"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}
        >
          {/* Connected drives */}
          {hasConnections && (
            <section className="mb-7">
              <SectionLabel text="Connected" />
              <div className="space-y-2">
                {connections.map((conn) => (
                  <DriveCard
                    key={conn.id}
                    connection={conn}
                    onConnectionChange={onConnectionChange}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Get Started — only when nothing connected */}
          {!hasConnections && (
            <section className="mb-7">
              <SectionLabel text="Get Started" />
              <p
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#9CA0AC",
                  marginBottom: "16px",
                }}
              >
                Connect a source so Poysis can build your knowledge map.
              </p>
              <ConnectGoogleDriveButton />
            </section>
          )}

          {/* Add another drive when already connected */}
          {hasConnections && (
            <section className="mb-7">
              <SectionLabel text="Also Connect" />
              <ConnectGoogleDriveButton secondary />
            </section>
          )}

          {/* YouTube channels */}
          <section className="mb-7">
            <SectionLabel text="YouTube" />
            {youtubeConnections.length > 0 && (
              <div className="space-y-2 mb-3">
                {youtubeConnections.map((conn) => (
                  <YoutubeCard
                    key={conn.id}
                    connection={conn}
                    onConnectionChange={fetchYoutube}
                  />
                ))}
              </div>
            )}
            <ConnectYoutubeForm onConnected={fetchYoutube} />
          </section>

          {/* Build Knowledge Map */}
          {hasConnections && (
            <section className="mb-7">
              <div
                className="mb-4"
                style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}
              />
              <SectionLabel text="Knowledge Map" />
              <ClusteringSection clustering={clustering} />
            </section>
          )}

          {/* Coming Soon */}
          <section>
            <SectionLabel text="Coming Soon" />
            <div className="space-y-2">
              {COMING_SOON.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded"
                  style={{
                    background: "rgba(58,61,71,0.15)",
                    border: "1px solid rgba(58,61,71,0.3)",
                    opacity: 0.55,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(58,61,71,0.5)",
                      fontFamily: "Syne, sans-serif",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#9CA0AC",
                    }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "#9CA0AC",
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "11px",
                        fontWeight: 300,
                        color: "#3A3D47",
                      }}
                    >
                      {s.description}
                    </div>
                  </div>
                  <SoonPill />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="px-7 py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.18em",
              color: "#3A3D47",
              textTransform: "uppercase",
            }}
          >
            Sources sync every 15 min
          </span>
          <button
            onClick={onClose}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "10px",
              letterSpacing: "0.15em",
              color: "#9CA0AC",
              textTransform: "uppercase",
            }}
            className="hover:text-[#E8E9ED] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── DriveCard ─────────────────────────────────────────────────────── */

function DriveCard({
  connection,
  onConnectionChange,
}: {
  connection: DriveConnection;
  onConnectionChange: () => void;
}) {
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
    if (!confirm(`Disconnect ${connection.google_account_email} from Poysis?`))
      return;
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
      style={{
        background: "rgba(107, 176, 122, 0.06)",
        border: "1px solid rgba(107, 176, 122, 0.2)",
      }}
    >
      {/* Drive icon */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(107, 176, 122, 0.12)" }}
      >
        <DriveIcon />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 400,
              color: "#E8E9ED",
            }}
            className="truncate"
          >
            {connection.google_account_email}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]"
              style={{ boxShadow: "0 0 5px rgba(107,176,122,0.7)" }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "#6BB07A",
                textTransform: "uppercase",
              }}
            >
              Active
            </span>
          </div>
        </div>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            color: "#9CA0AC",
            letterSpacing: "0.1em",
            marginTop: "2px",
          }}
        >
          {connection.doc_count > 0
            ? `${connection.doc_count} docs`
            : "Indexing…"}{" "}
          · synced {lastSynced}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleResync}
          disabled={resyncing}
          className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(232,165,71,0.12)] disabled:opacity-40"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "#E8A547",
            textTransform: "uppercase",
            border: "1px solid rgba(232,165,71,0.25)",
          }}
        >
          {resyncing ? "…" : "Resync"}
        </button>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(201,80,75,0.12)] disabled:opacity-40"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "#9CA0AC",
            textTransform: "uppercase",
            border: "1px solid rgba(58,61,71,0.4)",
          }}
        >
          {removing ? "…" : "Remove"}
        </button>
      </div>
    </div>
  );
}

/* ── YoutubeCard ───────────────────────────────────────────────────── */

function YoutubeCard({
  connection,
  onConnectionChange,
}: {
  connection: YoutubeConnection;
  onConnectionChange: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Disconnect ${connection.channel_name ?? connection.channel_id} from Poysis?`))
      return;
    setRemoving(true);
    try {
      await fetch("/api/youtube/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: connection.channel_id }),
      });
      onConnectionChange();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded"
      style={{
        background: "rgba(232, 80, 75, 0.06)",
        border: "1px solid rgba(232, 80, 75, 0.2)",
      }}
    >
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(232, 80, 75, 0.12)" }}
      >
        <YoutubeIcon />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className="truncate block"
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            color: "#E8E9ED",
          }}
        >
          {connection.channel_name ?? connection.channel_id}
        </span>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            color: "#9CA0AC",
            letterSpacing: "0.1em",
            marginTop: "2px",
          }}
        >
          {connection.enabled ? "Active" : "Disabled"}
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={removing}
        className="px-2.5 py-1 rounded transition-all hover:bg-[rgba(201,80,75,0.12)] disabled:opacity-40"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "9px",
          letterSpacing: "0.15em",
          color: "#9CA0AC",
          textTransform: "uppercase",
          border: "1px solid rgba(58,61,71,0.4)",
          flexShrink: 0,
        }}
      >
        {removing ? "…" : "Remove"}
      </button>
    </div>
  );
}

/* ── ConnectYoutubeForm ────────────────────────────────────────────── */

function ConnectYoutubeForm({ onConnected }: { onConnected: () => void }) {
  const [url, setUrl] = useState("");
  const [maxMinutes, setMaxMinutes] = useState(String(DEFAULT_MAX_VIDEO_MINUTES));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    const minutes = parseMaxVideoMinutes(maxMinutes);
    if (minutes === null) {
      setError(MAX_VIDEO_MINUTES_ERROR);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: url.trim(), maxVideoMinutes: minutes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't add that channel");
      }
      setUrl("");
      onConnected();
    } catch (err: any) {
      setError(err?.message ?? "Couldn't add that channel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/@yourchannel"
          className="flex-1 px-3 py-2.5 rounded outline-none"
          style={{
            background: "rgba(58,61,71,0.15)",
            border: "1px solid rgba(58,61,71,0.4)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            color: "#E8E9ED",
          }}
        />
        <label
          className="flex items-center gap-1.5 shrink-0"
          style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#9CA0AC" }}
        >
          <span className="whitespace-nowrap">Max length</span>
          <input
            type="number"
            inputMode="numeric"
            min={MIN_VIDEO_MINUTES_LIMIT}
            max={MAX_VIDEO_MINUTES_LIMIT}
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.value)}
            aria-label="Maximum video length in minutes"
            className="px-2 py-2.5 rounded outline-none"
            style={{
              width: "64px",
              background: "rgba(58,61,71,0.15)",
              border: "1px solid rgba(58,61,71,0.4)",
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              color: "#E8E9ED",
            }}
          />
          <span>min</span>
          <InfoTooltip text={MAX_VIDEO_MINUTES_HELP} tone="dark" />
        </label>
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          className="px-4 py-2.5 rounded transition-all disabled:opacity-40"
          style={{
            background: "rgba(232,165,71,0.1)",
            border: "1px solid rgba(232,165,71,0.35)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "#E8E9ED",
            whiteSpace: "nowrap",
          }}
        >
          {submitting ? "Adding…" : "Add channel"}
        </button>
      </div>
      {error && (
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#C9534B" }}>
          {error}
        </p>
      )}
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47" }}>
        Public channels only — no sign-in required.
      </p>
    </form>
  );
}

/* ── ConnectGoogleDriveButton ──────────────────────────────────────── */

function ConnectGoogleDriveButton({
  secondary = false,
}: {
  secondary?: boolean;
}) {
  const handleConnect = () => {
    // Full page redirect — the OAuth flow requires following redirects
    window.location.href = "/api/auth/google-drive";
  };

  return (
    <button
      onClick={handleConnect}
      className="w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-300"
      style={
        secondary
          ? {
              background: "rgba(58,61,71,0.15)",
              border: "1px dashed rgba(232,165,71,0.3)",
            }
          : {
              background:
                "linear-gradient(135deg, rgba(232,165,71,0.12) 0%, rgba(201,149,71,0.06) 100%)",
              border: "1px solid rgba(232,165,71,0.35)",
              boxShadow: "0 0 24px rgba(232,165,71,0.04)",
            }
      }
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = secondary
          ? "rgba(232,165,71,0.5)"
          : "rgba(232,165,71,0.6)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = secondary
          ? "rgba(232,165,71,0.3)"
          : "rgba(232,165,71,0.35)";
      }}
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{
          background: secondary ? "rgba(58,61,71,0.4)" : "rgba(232,165,71,0.1)",
        }}
      >
        <DriveIcon size={14} />
      </div>
      <div className="flex-1 text-left">
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: secondary ? 300 : 500,
            color: secondary ? "#9CA0AC" : "#E8E9ED",
          }}
        >
          {secondary ? "Connect another Google Drive" : "Connect Google Drive"}
        </div>
        {!secondary && (
          <div
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "11px",
              fontWeight: 300,
              color: "#9CA0AC",
              marginTop: "1px",
            }}
          >
            Docs, Sheets, Slides, Folders
          </div>
        )}
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="#E8A547"
        strokeWidth="1.4"
      >
        <line x1="2" y1="7" x2="12" y2="7" />
        <polyline points="8,3 12,7 8,11" />
      </svg>
    </button>
  );
}

/* ── ClusteringSection ─────────────────────────────────────────────── */

function ClusteringSection({ clustering }: { clustering: ClusteringProps }) {
  if (clustering.status === "done") {
    return (
      <div
        className="px-4 py-3 rounded flex items-center justify-between"
        style={{
          background: "rgba(107,176,122,0.06)",
          border: "1px solid rgba(107,176,122,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-1.5 rounded-full bg-[#6BB07A]"
            style={{ boxShadow: "0 0 5px rgba(107,176,122,0.7)" }}
          />
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 400,
              color: "#E8E9ED",
            }}
          >
            Map built
          </span>
          {clustering.totalTopics && (
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                color: "#9CA0AC",
                letterSpacing: "0.1em",
              }}
            >
              · {clustering.totalTopics} topics
            </span>
          )}
        </div>
        <Link
          href="/query"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "#E8A547",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
          className="hover:text-[#F5B25F] transition-colors"
        >
          View in Query →
        </Link>
      </div>
    );
  }

  if (clustering.status === "running") {
    return (
      <div
        className="px-4 py-3 rounded flex items-center gap-3"
        style={{
          background: "rgba(232,165,71,0.04)",
          border: "1px solid rgba(232,165,71,0.15)",
        }}
      >
        <SpinnerIcon />
        <div className="flex-1">
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 300,
              color: "#E8E9ED",
            }}
          >
            Building knowledge map
          </span>
          {(clustering.totalTopics ?? 0) > 0 && (
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "9px",
                color: "#9CA0AC",
                letterSpacing: "0.1em",
                marginLeft: "8px",
              }}
            >
              {clustering.totalTopics} topics found
            </span>
          )}
        </div>
      </div>
    );
  }

  if (clustering.status === "failed") {
    return (
      <div className="space-y-2">
        <div
          className="px-4 py-2.5 rounded flex items-center gap-2"
          style={{
            background: "rgba(201,80,75,0.06)",
            border: "1px solid rgba(201,80,75,0.2)",
          }}
        >
          <span style={{ color: "#C9534B", fontSize: "12px" }}>✕</span>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              fontWeight: 300,
              color: "#C9534B",
              flex: 1,
            }}
          >
            {clustering.error ?? "Clustering failed"}
          </span>
          <button
            onClick={clustering.reset}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#9CA0AC",
              textTransform: "uppercase",
            }}
            className="hover:text-[#E8E9ED] transition-colors"
          >
            Dismiss
          </button>
        </div>
        <BuildMapButton onStart={clustering.start} />
      </div>
    );
  }

  return <BuildMapButton onStart={clustering.start} />;
}

function BuildMapButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      onClick={onStart}
      className="w-full py-3 px-4 rounded transition-all duration-300 flex items-center justify-between group"
      style={{
        background:
          "linear-gradient(135deg, rgba(232,165,71,0.1) 0%, rgba(201,149,71,0.05) 100%)",
        border: "1px solid rgba(232,165,71,0.3)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(232,165,71,0.55)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "rgba(232,165,71,0.3)";
      }}
    >
      <div className="text-left">
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "#E8E9ED",
          }}
        >
          Build Knowledge Map
        </div>
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: "11px",
            fontWeight: 300,
            color: "#9CA0AC",
            marginTop: "1px",
          }}
        >
          Cluster your docs into topics for AI querying
        </div>
      </div>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="#E8A547"
        strokeWidth="1.4"
        className="flex-shrink-0 ml-3"
      >
        <line x1="2" y1="7" x2="12" y2="7" />
        <polyline points="8,3 12,7 8,11" />
      </svg>
    </button>
  );
}

/* ── Shared primitives ─────────────────────────────────────────────── */

function SectionLabel({ text }: { text: string }) {
  return (
    <div
      className="mb-3"
      style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "9px",
        letterSpacing: "0.18em",
        color: "#9CA0AC",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="#E8A547"
      strokeWidth="1.5"
      className="flex-shrink-0"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <circle
        cx="7"
        cy="7"
        r="5.5"
        strokeDasharray="20 14"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SoonPill() {
  return (
    <div
      className="px-1.5 py-0.5 rounded"
      style={{
        background: "rgba(58,61,71,0.5)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: "8px",
        letterSpacing: "0.15em",
        color: "#3A3D47",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      Soon
    </div>
  );
}

function DriveIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" fill="none">
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
        opacity="0.8"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
        fill="#00ac47"
        opacity="0.8"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
        fill="#ea4335"
        opacity="0.8"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
        opacity="0.8"
      />
      <path
        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
        opacity="0.8"
      />
      <path
        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z"
        fill="#ffba00"
        opacity="0.8"
      />
    </svg>
  );
}

function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="4" width="22" height="16" rx="4" fill="#E8504B" opacity="0.85" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#0A0B0F" />
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
