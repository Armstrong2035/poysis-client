"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useClusteringStatus } from "../../hooks/useClusteringStatus";
import { SourcesModal } from "../../dashboard/SourcesModal";

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

type WorkspaceContextValue = ReturnType<typeof useClusteringStatus> & {
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
      const res = await fetch("/api/worker/consolidation/knowledge");
      if (res.ok) {
        const data = await res.json();
        setTopics(Array.isArray(data.topics) ? data.topics : []);
        setStories(Array.isArray(data.stories) ? data.stories : []);
      } else {
        setKnowledgeError(await res.text());
      }
    } catch (err: any) {
      setKnowledgeError(err?.message ?? "Failed to load knowledge");
    } finally {
      setKnowledgeLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConnections();
    refreshIndexedCount();
  }, [refreshConnections, refreshIndexedCount]);

  // Re-fetch the cumulative count whenever a run finishes — that's when
  // consolidation_indexed_files has new rows to surface.
  useEffect(() => {
    if (clustering.status === "done" || clustering.status === "failed") {
      refreshIndexedCount();
    }
  }, [clustering.status, refreshIndexedCount]);

  // Refresh topics/stories on done — but only if a consumer has already
  // requested them at least once. Avoids fetching for users who never
  // open the knowledge views.
  useEffect(() => {
    if (clustering.status === "done" && hasFetchedKnowledgeRef.current) {
      refreshKnowledge();
    }
  }, [clustering.status, refreshKnowledge]);

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
