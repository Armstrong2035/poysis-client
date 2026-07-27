"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_MAX_VIDEO_MINUTES,
  MAX_VIDEO_MINUTES_ERROR,
  parseMaxVideoMinutes,
} from "@/lib/youtube";
import type { ClusterOption } from "@/components/notebook/SourcesDrawer";

/* A connected platform (whole account/channel), tagged `conn:<id>` on the
 * notebook. Clustersg  are tagged `topic:<id>`. Both are just prefixed strings in
 * the notebook's `sources` array; this panel resolves them to labelled cards. */
type Kind = "drive" | "youtube";
interface Connection {
  id: string;
  label: string;
  kind: Kind;
  docCount?: number;
  /** The YouTube channel id (UC…), used to scope playlists to this channel. */
  channelId?: string;
}

const KIND_BADGE: Record<
  Kind,
  { badge: string; tint: string; ink: string; label: string }
> = {
  drive: {
    badge: "GD",
    tint: "rgba(60,74,58,.12)",
    ink: "#3C4A3A",
    label: "Google Drive",
  },
  youtube: {
    badge: "YT",
    tint: "rgba(185,66,47,.13)",
    ink: "#B9422F",
    label: "YouTube",
  },
};
const CLUSTER_BADGE = {
  badge: "◈",
  tint: "rgba(185,118,47,.15)",
  ink: "#B9762F",
};

// Connections are workspace-level and change rarely, but /api/youtube/status
// round-trips to the worker (slow). Cache the resolved list per session so a
// reopened panel paints instantly, then revalidate in the background.
const CONNECTIONS_CACHE_KEY = "pz-studio-connections";
function readConnectionsCache(): Connection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CONNECTIONS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Connection[]) : [];
  } catch {
    return [];
  }
}

interface StudioSourcesPanelProps {
  /** Prefixed tags currently attached to the notebook (`conn:` / `topic:`). */
  sources: string[];
  /** Toggle a prefixed tag on/off the notebook. */
  onToggleSource: (tag: string) => void;
  /** Semantic clusters available to attach (from consolidation). */
  clusters: ClusterOption[];
  onToast: (msg: string) => void;
  /** Called after playlists are imported as categories, so the parent can
   *  refresh consolidation topics and surface them in the cluster list. */
  onCategoriesImported?: () => void;
}

export function StudioSourcesPanel({
  sources,
  onToggleSource,
  clusters,
  onToast,
  onCategoriesImported,
}: StudioSourcesPanelProps) {
  // Hydrate from the session cache on first render so a reopened panel paints
  // instantly; only a first-ever load with no cache starts in the loading state.
  const [connections, setConnections] = useState<Connection[]>(readConnectionsCache);
  const [loading, setLoading] = useState(() => connections.length === 0);
  const [addOpen, setAddOpen] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const [drive, youtube] = await Promise.all([
        fetch("/api/drive/status").then((r) =>
          r.ok ? r.json() : { connections: [] },
        ),
        fetch("/api/youtube/status").then((r) =>
          r.ok ? r.json() : { connections: [] },
        ),
      ]);
      const driveConns: Connection[] = (drive.connections ?? []).map(
        (c: {
          id: string;
          google_account_email?: string;
          doc_count?: number;
        }) => ({
          id: c.id,
          label: c.google_account_email ?? "Google Drive",
          docCount: c.doc_count,
          kind: "drive" as const,
        }),
      );
      const ytConns: Connection[] = (youtube.connections ?? []).map(
        (c: {
          id: string;
          channel_name?: string | null;
          channel_id: string;
        }) => ({
          id: c.id,
          label: c.channel_name ?? c.channel_id,
          kind: "youtube" as const,
          channelId: c.channel_id,
        }),
      );
      const combined = [...driveConns, ...ytConns];
      setConnections(combined);
      try {
        sessionStorage.setItem(CONNECTIONS_CACHE_KEY, JSON.stringify(combined));
      } catch {
        /* storage full/blocked — cache is best-effort */
      }
    } catch {
      /* keep prior state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Revalidate on mount; the initial paint already came from the session
    // cache (or the skeleton, on the first-ever load). setState lives inside the
    // async fetch, not the effect body, so it doesn't cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConnections();
  }, [fetchConnections]);

  const rootClusters = clusters.filter((c) => !c.parent_topic_id);
  const connById = new Map(connections.map((c) => [c.id, c]));
  const clusterById = new Map(clusters.map((c) => [c.topic_id, c]));

  // Attached tags → display cards, in the order they were attached.
  const attached = sources
    .map((tag) => {
      if (tag.startsWith("conn:")) {
        const c = connById.get(tag.slice(5));
        if (!c) return null;
        const b = KIND_BADGE[c.kind];
        return {
          tag,
          title: c.label,
          meta: [b.label, c.docCount != null ? `${c.docCount} docs` : ""]
            .filter(Boolean)
            .join(" · "),
          // Worker source type — drives the per-source "Sync" (reindex). Only
          // connections can be reindexed; clusters are derived, so they omit it.
          sourceType: c.kind === "youtube" ? "youtube" : "google_drive",
          // Channel id (YouTube only) — scopes the playlist list to this card.
          channelId: c.kind === "youtube" ? c.channelId : undefined,
          ...b,
        };
      }
      if (tag.startsWith("topic:")) {
        const c = clusterById.get(tag.slice(6));
        if (!c) return null;
        return {
          tag,
          title: c.label,
          meta: `Cluster · ${c.doc_count} doc${c.doc_count === 1 ? "" : "s"}`,
          sourceType: undefined,
          channelId: undefined,
          ...CLUSTER_BADGE,
        };
      }
      return null;
    })
    .filter(Boolean) as {
    tag: string;
    title: string;
    meta: string;
    sourceType?: string;
    channelId?: string;
    badge: string;
    tint: string;
    ink: string;
  }[];

  // Connections / clusters that exist but aren't attached yet — the "add an
  // existing source" list inside the tray.
  const attachedConnIds = new Set(
    sources.filter((s) => s.startsWith("conn:")).map((s) => s.slice(5)),
  );
  const attachedTopicIds = new Set(
    sources.filter((s) => s.startsWith("topic:")).map((s) => s.slice(6)),
  );
  const availableConns = connections.filter((c) => !attachedConnIds.has(c.id));
  const availableClusters = rootClusters.filter(
    (c) => !attachedTopicIds.has(c.topic_id),
  );

  const noSources = attached.length === 0;

  const handleYoutubeConnected = () => {
    fetchConnections();
    onToast("YouTube channel added");
  };

  // Reindex a source: re-run a consolidation snapshot scoped to that source's
  // type so its latest content is pulled in. Keyed by tag for a per-card
  // spinner. (Scopes to the type, not a single connection — a workspace with
  // two YouTube channels reindexes both; that's the worker's granularity.)
  const [syncing, setSyncing] = useState<Set<string>>(new Set());
  const handleSync = async (tag: string, sourceType: string) => {
    if (syncing.has(tag)) return;
    setSyncing((prev) => new Set(prev).add(tag));
    try {
      const res = await fetch("/api/worker/consolidation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: [sourceType] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't start sync");
      onToast("Sync started — reindexing this source");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Couldn't start sync");
    } finally {
      setSyncing((prev) => {
        const next = new Set(prev);
        next.delete(tag);
        return next;
      });
    }
  };

  return (
    <div
      style={{
        width: "300px",
        flex: "0 0 auto",
        borderRight: "1px solid rgba(35,38,31,.09)",
        display: "flex",
        flexDirection: "column",
        background: "#F7F4EC",
      }}
    >
      <style>{`
        @keyframes pz-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .pz-skel { background: linear-gradient(90deg, #ECE8DE 0%, #F5F2EA 50%, #ECE8DE 100%); background-size: 200% 100%; animation: pz-shimmer 1.2s ease-in-out infinite; border-radius: 6px; }
      `}</style>
      <div
        style={{
          padding: "16px 18px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: ".09em",
            textTransform: "uppercase",
            color: "#6B6D62",
          }}
        >
          Sources
        </span>
        <button
          onClick={() => setAddOpen((o) => !o)}
          style={{
            fontSize: "13px",
            color: "#3C4A3A",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          + Add
        </button>
      </div>

      {addOpen && (
        <div
          style={{
            margin: "0 14px 12px",
            background: "#fff",
            border: "1px solid rgba(35,38,31,.12)",
            borderRadius: "12px",
            padding: "12px",
            boxShadow: "0 12px 24px -16px rgba(35,38,31,.4)",
            animation: "pz-fade .18s ease",
          }}
        >
          <YoutubeConnectForm
            onConnected={handleYoutubeConnected}
            onToast={onToast}
          />

          <button
            onClick={() => {
              window.location.href = "/api/auth/google-drive";
            }}
            style={{
              width: "100%",
              marginTop: "9px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#3C4A3A",
              background: "#EBF0E5",
              border: "1px solid #DCE4D2",
              borderRadius: "8px",
              padding: "9px 4px",
            }}
          >
            + Connect Google Drive
          </button>

          {(availableConns.length > 0 || availableClusters.length > 0) && (
            <>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                  color: "#9A9C90",
                  margin: "12px 0 7px",
                }}
              >
                Add an existing source
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                {availableConns.map((c) => {
                  const b = KIND_BADGE[c.kind];
                  return (
                    <AddRow
                      key={`conn:${c.id}`}
                      badge={b.badge}
                      tint={b.tint}
                      ink={b.ink}
                      title={c.label}
                      onClick={() => {
                        onToggleSource(`conn:${c.id}`);
                        onToast("Source added");
                      }}
                    />
                  );
                })}
                {availableClusters.map((c) => (
                  <AddRow
                    key={`topic:${c.topic_id}`}
                    badge={CLUSTER_BADGE.badge}
                    tint={CLUSTER_BADGE.tint}
                    ink={CLUSTER_BADGE.ink}
                    title={c.label}
                    onClick={() => {
                      onToggleSource(`topic:${c.topic_id}`);
                      onToast("Cluster added");
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Source list */}
      <div
        className="pz-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 14px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {loading && (
          <>
            <SourceSkeleton />
            <SourceSkeleton />
          </>
        )}

        {!loading && noSources && !addOpen && (
          <div
            style={{
              border: "1.5px dashed rgba(35,38,31,.18)",
              borderRadius: "12px",
              padding: "26px 16px",
              textAlign: "center",
              color: "#8A8C80",
            }}
          >
            <div style={{ fontSize: "26px", marginBottom: "8px" }}>◧</div>
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#5B5D52",
                marginBottom: "3px",
              }}
            >
              No sources yet
            </div>
            <div style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
              Add a YouTube channel, Drive, or a cluster. Everything Poysis
              answers is grounded in them.
            </div>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                marginTop: "12px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#fff",
                background: "#3C4A3A",
                borderRadius: "9px",
                padding: "9px 16px",
              }}
            >
              Add your first source
            </button>
          </div>
        )}

        {attached.map((s) => (
          <div
            key={s.tag}
            style={{
              background: "#fff",
              border: "1px solid rgba(35,38,31,.08)",
              borderRadius: "10px",
              padding: "11px 12px",
              animation: "pz-fade .2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "11px",
                alignItems: "flex-start",
              }}
            >
            <div
              style={{
                width: "26px",
                height: "26px",
                flex: "0 0 auto",
                borderRadius: "6px",
                background: s.tint,
                color: s.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {s.badge}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "13.5px",
                  fontWeight: 500,
                  color: "#23261F",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: "11.5px", color: "#9A9C90" }}>
                {s.meta}
              </div>
            </div>
            {s.sourceType && (
              <button
                onClick={() => handleSync(s.tag, s.sourceType!)}
                disabled={syncing.has(s.tag)}
                title="Sync — reindex the latest content from this source"
                style={{
                  fontSize: "14px",
                  color: "#3C4A3A",
                  padding: "0 3px",
                  lineHeight: 1,
                  opacity: syncing.has(s.tag) ? 0.5 : 1,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    animation: syncing.has(s.tag)
                      ? "pz-spin .8s linear infinite"
                      : "none",
                  }}
                >
                  ⟳
                </span>
              </button>
            )}
            <button
              onClick={() => onToggleSource(s.tag)}
              title="Remove from notebook"
              style={{
                fontSize: "15px",
                color: "#B7B9AD",
                padding: "0 2px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            </div>
            {s.sourceType === "youtube" && s.channelId && (
              <ChannelPlaylists
                channelId={s.channelId}
                onToast={onToast}
                onImported={onCategoriesImported}
              />
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          padding: "13px 18px",
          borderTop: "1px solid rgba(35,38,31,.08)",
          fontSize: "12px",
          color: "#9A9C90",
        }}
      >
        {loading && attached.length === 0
          ? "Loading sources…"
          : noSources
            ? "Add sources to start"
            : `${attached.length} source${attached.length === 1 ? "" : "s"} · grounding every answer`}
      </div>
    </div>
  );
}

function AddRow({
  badge,
  tint,
  ink,
  title,
  onClick,
}: {
  badge: string;
  tint: string;
  ink: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        gap: "9px",
        alignItems: "center",
        textAlign: "left",
        background: "#F7F4EC",
        border: "1px solid rgba(35,38,31,.08)",
        borderRadius: "8px",
        padding: "8px 10px",
        width: "100%",
      }}
    >
      <span
        style={{
          width: "20px",
          height: "20px",
          flex: "0 0 auto",
          borderRadius: "5px",
          background: tint,
          color: ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        {badge}
      </span>
      <span
        style={{
          fontSize: "12.5px",
          color: "#3A3C33",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
        }}
      >
        {title}
      </span>
      <span style={{ fontSize: "14px", color: "#3C4A3A" }}>+</span>
    </button>
  );
}

/* Shimmer placeholders shown while the first connection/playlist fetch is in
 * flight (the worker round-trip is the slow part). */
function SourceSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        gap: "11px",
        alignItems: "center",
        background: "#fff",
        border: "1px solid rgba(35,38,31,.08)",
        borderRadius: "10px",
        padding: "11px 12px",
      }}
    >
      <div
        className="pz-skel"
        style={{ width: "26px", height: "26px", borderRadius: "6px", flex: "0 0 auto" }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div className="pz-skel" style={{ width: "68%", height: "11px" }} />
        <div className="pz-skel" style={{ width: "42%", height: "9px" }} />
      </div>
    </div>
  );
}

function PlaylistRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        gap: "9px",
        alignItems: "center",
        background: "#F7F4EC",
        border: "1px solid rgba(35,38,31,.08)",
        borderRadius: "8px",
        padding: "7px 9px",
      }}
    >
      <div
        className="pz-skel"
        style={{ width: "16px", height: "16px", borderRadius: "4px", flex: "0 0 auto" }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
        <div className="pz-skel" style={{ width: "72%", height: "10px" }} />
        <div className="pz-skel" style={{ width: "35%", height: "8px" }} />
      </div>
    </div>
  );
}

/* Organize-by-playlist — turns a connected channel's YouTube playlists into
 * locked topic categories. Lists them lazily on first open (Data-API backed, so
 * it works even before transcripts exist), lets the owner pick several, and
 * imports them in one call. Imported categories surface in the cluster list via
 * the parent's knowledge refresh, where they can be attached as chat scope. */
interface Playlist {
  playlist_id: string;
  title: string;
  description?: string;
  item_count: number;
  thumbnail?: string;
  channel_id: string;
  channel_name: string;
}

function ChannelPlaylists({
  channelId,
  onToast,
  onImported,
}: {
  channelId: string;
  onToast: (msg: string) => void;
  onImported?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // The playlists endpoint returns the whole workspace's playlists; show only
  // the ones belonging to this card's channel.
  const channelPlaylists = (playlists ?? []).filter(
    (p) => p.channel_id === channelId,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/playlists");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't load playlists");
      setPlaylists(data.playlists ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load playlists");
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    // Fetch on first expand only; re-opening reuses what we already have.
    if (next && playlists === null && !loading) void load();
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0 || importing) return;
    setImporting(true);
    try {
      const res = await fetch("/api/youtube/playlists/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_ids: [...selected] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't import playlists");
      const n = data.categories?.length ?? selected.size;
      onToast(`Imported ${n} categor${n === 1 ? "y" : "ies"}`);
      setSelected(new Set());
      onImported?.();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Couldn't import playlists");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ marginTop: "9px" }}>
      <button
        onClick={toggleOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          fontWeight: 600,
          color: "#3C4A3A",
          background: "#EBF0E5",
          border: "1px solid #DCE4D2",
          borderRadius: "8px",
          padding: "9px 12px",
        }}
      >
        <span>◈ Organize by playlist</span>
        <span
          style={{
            fontSize: "10px",
            color: "#8A8C80",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ marginTop: "8px" }}>
          {loading && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <PlaylistRowSkeleton />
              <PlaylistRowSkeleton />
              <PlaylistRowSkeleton />
            </div>
          )}
          {error && (
            <div
              style={{ fontSize: "11px", color: "#B9422F", padding: "4px 2px" }}
            >
              {error}
            </div>
          )}
          {!loading &&
            !error &&
            playlists !== null &&
            channelPlaylists.length === 0 && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#9A9C90",
                  padding: "6px 2px",
                  lineHeight: 1.5,
                }}
              >
                No playlists on this channel.
              </div>
            )}

          {channelPlaylists.length > 0 && (
            <>
              <div
                className="pz-scroll"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {channelPlaylists.map((p) => {
                  const checked = selected.has(p.playlist_id);
                  return (
                    <button
                      key={p.playlist_id}
                      onClick={() => toggle(p.playlist_id)}
                      style={{
                        display: "flex",
                        gap: "9px",
                        alignItems: "center",
                        textAlign: "left",
                        background: checked ? "#EBF0E5" : "#F7F4EC",
                        border: `1px solid ${checked ? "#C6D3B8" : "rgba(35,38,31,.08)"}`,
                        borderRadius: "8px",
                        padding: "7px 9px",
                        width: "100%",
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          flex: "0 0 auto",
                          borderRadius: "4px",
                          border: `1.5px solid ${checked ? "#3C4A3A" : "rgba(35,38,31,.25)"}`,
                          background: checked ? "#3C4A3A" : "transparent",
                          color: "#fff",
                          fontSize: "11px",
                          lineHeight: "14px",
                          textAlign: "center",
                        }}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12.5px",
                            color: "#23261F",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {p.title}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "10.5px",
                            color: "#9A9C90",
                          }}
                        >
                          {p.item_count} video{p.item_count === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleImport}
                disabled={selected.size === 0 || importing}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#fff",
                  background: "#3C4A3A",
                  borderRadius: "8px",
                  padding: "9px 4px",
                  opacity: selected.size === 0 || importing ? 0.5 : 1,
                }}
              >
                {importing
                  ? "Importing…"
                  : selected.size === 0
                    ? "Select playlists to import"
                    : `Import ${selected.size} as categor${selected.size === 1 ? "y" : "ies"}`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* Inline YouTube connect — posts to the same /api/youtube/connect route the
 * Sources page uses; on success the parent refetches connections and the new
 * channel appears in "add an existing source" to attach. */
function YoutubeConnectForm({
  onConnected,
  onToast,
}: {
  onConnected: () => void;
  onToast: (msg: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || submitting) return;
    const minutes = parseMaxVideoMinutes(DEFAULT_MAX_VIDEO_MINUTES);
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
        body: JSON.stringify({
          channelUrl: url.trim(),
          maxVideoMinutes: minutes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't add that channel");
      }
      setUrl("");
      onConnected();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn't add that channel";
      setError(msg);
      onToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "#9A9C90",
          marginBottom: "7px",
        }}
      >
        Add a YouTube channel
      </div>
      <div style={{ display: "flex", gap: "7px" }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="youtube.com/@channel"
          style={{
            flex: 1,
            minWidth: 0,
            background: "#F7F4EC",
            border: "1px solid rgba(35,38,31,.12)",
            borderRadius: "8px",
            padding: "9px 10px",
            fontSize: "12.5px",
            color: "#23261F",
          }}
        />
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          style={{
            flex: "0 0 auto",
            fontSize: "12px",
            fontWeight: 600,
            color: "#fff",
            background: "#3C4A3A",
            borderRadius: "8px",
            padding: "9px 12px",
            opacity: submitting || !url.trim() ? 0.5 : 1,
          }}
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </div>
      {error && (
        <div style={{ fontSize: "11px", color: "#B9422F", marginTop: "6px" }}>
          {error}
        </div>
      )}
      <div style={{ fontSize: "10.5px", color: "#9A9C90", marginTop: "6px" }}>
        Public channels only — no sign-in.
      </div>
    </form>
  );
}
