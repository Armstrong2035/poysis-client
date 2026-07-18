"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useClusteringStatus } from "../../hooks/useClusteringStatus";
import { normalizeMcpUrl } from "@/utils/normalizeMcpUrl";
import { SourcesModal } from "../../../components/sources/SourcesModal";

export type DriveConnection = {
  id: string;
  google_account_email: string;
  doc_count: number;
  last_synced_at: string | null;
};

export type Topic = {
  topic_id: string;
  label: string;
  keywords: string[];
  doc_count: number;
  parent_topic_id: string | null;
  semantic_summary?: string;
  key_themes?: string[];
  suggested_use_cases?: string[];
  updated_at?: string;
};

export type Story = {
  story_id: string;
  title: string;
  description: string;
  topic_sequence: string[];
  reasoning?: string;
  strength?: number;
  doc_count: number;
};

type WorkspaceContextValue = Omit<ReturnType<typeof useClusteringStatus>, "mcpUrl"> & {
  connections: DriveConnection[];
  refreshConnections: () => Promise<void>;
  openSources: () => void;
  indexedCount: number | null;
  orphanedCount: number | null;
  refreshIndexedCount: () => Promise<void>;
  topics: Topic[] | null;
  stories: Story[] | null;
  knowledgeLoading: boolean;
  knowledgeError: string | null;
  refreshKnowledge: () => Promise<void>;
  reclustering: boolean;
  reclusterError: string | null;
  recluster: () => Promise<void>;
  mcpUrl: string | null;
  refreshMcpUrl: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function ConsolidationProvider({ children }: { children: React.ReactNode }) {
  const clustering = useClusteringStatus();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [connections, setConnections] = useState<DriveConnection[]>([]);
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [orphanedCount, setOrphanedCount] = useState<number | null>(null);
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [stories, setStories] = useState<Story[] | null>(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [reclustering, setReclustering] = useState(false);
  const [reclusterError, setReclusterError] = useState<string | null>(null);
  const [mcpUrl, setMcpUrl] = useState<string | null>(null);
  const hasFetchedKnowledgeRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/status");
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections ?? []);
      }
    } catch {
      // keep current state
    }
  }, []);

  const refreshIndexedCount = useCallback(async () => {
    try {
      const res = await fetch("/api/worker/consolidation/indexed-count");
      if (res.ok) {
        const data = await res.json();
        setIndexedCount(data.indexed ?? 0);
        setOrphanedCount(data.orphaned ?? 0);
      }
    } catch {
      // keep current state
    }
  }, []);

  const refreshKnowledge = useCallback(async () => {
    hasFetchedKnowledgeRef.current = true;
    setKnowledgeLoading(true);
    setKnowledgeError(null);
    try {
      const [topicsRes, storiesRes] = await Promise.all([
        fetch("/api/worker/consolidation/topics"),
        fetch("/api/worker/consolidation/stories"),
      ]);

      if (topicsRes.ok) {
        const data = await topicsRes.json();
        setTopics(Array.isArray(data.topics) ? data.topics : []);
      } else {
        const text = await topicsRes.text();
        setKnowledgeError(text || "Failed to load topics");
      }

      if (storiesRes.ok) {
        const data = await storiesRes.json();
        setStories(Array.isArray(data.stories) ? data.stories : []);
      } else if (topicsRes.ok) {
        // Topics loaded but stories didn't — surface a softer error
        // without clobbering the loaded topics.
        const text = await storiesRes.text();
        setKnowledgeError(`Stories unavailable: ${text || storiesRes.statusText}`);
      }
    } catch (err: any) {
      setKnowledgeError(err?.message ?? "Failed to load knowledge");
    } finally {
      setKnowledgeLoading(false);
    }
  }, []);

  const refreshMcpUrl = useCallback(async () => {
    try {
      const res = await fetch("/api/worker/consolidation/mcp-url", {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setMcpUrl(normalizeMcpUrl(data.mcp_url));
      }
    } catch {
      // keep current state
    }
  }, []);

  const recluster = useCallback(async () => {
    setReclustering(true);
    setReclusterError(null);
    try {
      const res = await fetch("/api/worker/consolidation/recluster", { method: "POST" });
      if (!res.ok) {
        setReclusterError(await res.text());
        setReclustering(false);
        return;
      }
      // Give the worker a moment to produce the new tree, then refresh.
      // The status endpoint exists if we want true polling later; this is
      // the "or just call refreshKnowledge() after a bit" path.
      setTimeout(async () => {
        await refreshKnowledge();
        await refreshIndexedCount();
        setReclustering(false);
      }, 4000);
    } catch (err: any) {
      setReclusterError(err?.message ?? "Failed to start recluster");
      setReclustering(false);
    }
  }, [refreshKnowledge, refreshIndexedCount]);

  useEffect(() => {
    refreshConnections();
    refreshIndexedCount();
    refreshMcpUrl();
  }, [refreshConnections, refreshIndexedCount, refreshMcpUrl]);

  // Re-fetch the cumulative count whenever a run finishes — that's when
  // consolidation_indexed_files has new rows to surface. completedAt is
  // included so a fresh "done" snapshot from the stream (e.g. a run that
  // finished before this client connected) re-triggers the refresh even
  // if status was already "done" from a prior session.
  useEffect(() => {
    if (clustering.status === "done" || clustering.status === "failed") {
      refreshIndexedCount();
    }
  }, [clustering.status, clustering.completedAt, refreshIndexedCount]);

  // The worker can (re)issue the MCP URL when a run finishes, so re-fetch it
  // on done — the mount-only fetch would otherwise leave a stale value.
  useEffect(() => {
    if (clustering.status === "done") {
      refreshMcpUrl();
    }
  }, [clustering.status, clustering.completedAt, refreshMcpUrl]);

  // Refresh topics/stories on done — but only if a consumer has already
  // requested them at least once. Avoids fetching for users who never
  // open the knowledge views.
  useEffect(() => {
    if (clustering.status === "done" && hasFetchedKnowledgeRef.current) {
      refreshKnowledge();
    }
  }, [clustering.status, clustering.completedAt, refreshKnowledge]);

  const openSources = useCallback(() => setSourcesOpen(true), []);

  return (
    <WorkspaceContext.Provider
      value={{
        ...clustering,
        connections,
        refreshConnections,
        openSources,
        indexedCount,
        orphanedCount,
        refreshIndexedCount,
        topics,
        stories,
        knowledgeLoading,
        knowledgeError,
        refreshKnowledge,
        reclustering,
        reclusterError,
        recluster,
        mcpUrl,
        refreshMcpUrl,
      }}
    >
      {children}
      {sourcesOpen && (
        <SourcesModal
          connections={connections}
          onConnectionChange={refreshConnections}
          onClose={() => setSourcesOpen(false)}
          clustering={clustering}
        />
      )}
    </WorkspaceContext.Provider>
  );
}

export function useConsolidation() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useConsolidation must be used within ConsolidationProvider");
  return ctx;
}
