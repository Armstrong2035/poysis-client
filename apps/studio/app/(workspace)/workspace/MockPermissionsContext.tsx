"use client";

/**
 * Cluster exposure ceilings — persisted server-side via the
 * cluster_ceilings table (see supabase/migrations/20260710000000_add_cluster_ceilings.sql)
 * and the /api/workspace/ceilings route. Retains the "Mock" name for now
 * since it's still the only concept it backs and every consumer imports it
 * by this name — the persistence itself is real.
 *
 * Also backs the per-cluster recluster lock — persisted via the
 * topic_overrides table (see supabase/migrations/20260627000001_add_topic_overrides.sql)
 * and the /api/workspace/topic-locks route. A locked cluster is skipped by
 * the worker on recluster (see the recluster route, which reads this same
 * table) so edits a user is satisfied with don't get overwritten.
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Ceiling } from "@/lib/ceiling";

type MockPermissionsValue = {
  getCeiling: (clusterId: string) => Ceiling;
  setCeiling: (clusterId: string, ceiling: Ceiling) => void;
  getLocked: (clusterId: string) => boolean;
  setLocked: (clusterId: string, locked: boolean) => void;
};

const MockPermissionsContext = createContext<MockPermissionsValue | null>(null);

export function MockPermissionsProvider({ children }: { children: React.ReactNode }) {
  const [ceilings, setCeilings] = useState<Record<string, Ceiling>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/workspace/ceilings");
        if (res.ok) {
          const data = await res.json();
          const next: Record<string, Ceiling> = {};
          for (const row of data.ceilings ?? []) {
            next[row.topic_id] = row.ceiling;
          }
          setCeilings(next);
        }
      } catch {
        // network unavailable — falls back to the "private" default per-cluster
      }
    })();

    (async () => {
      try {
        const res = await fetch("/api/workspace/topic-locks");
        if (res.ok) {
          const data = await res.json();
          const next: Record<string, boolean> = {};
          for (const row of data.locks ?? []) {
            next[row.topic_id] = row.locked;
          }
          setLocks(next);
        }
      } catch {
        // network unavailable — falls back to the "unlocked" default per-cluster
      }
    })();
  }, []);

  const getCeiling = useCallback(
    (clusterId: string): Ceiling => ceilings[clusterId] ?? "private",
    [ceilings]
  );

  const setCeiling = useCallback((clusterId: string, ceiling: Ceiling) => {
    const previous = ceilings[clusterId] ?? "private";
    setCeilings((prev) => ({ ...prev, [clusterId]: ceiling }));

    fetch("/api/workspace/ceilings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: clusterId, ceiling }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to save ceiling (${res.status})`);
      })
      .catch((err) => {
        console.error("Failed to persist ceiling change, reverting:", err);
        setCeilings((prev) => ({ ...prev, [clusterId]: previous }));
      });
  }, [ceilings]);

  const getLocked = useCallback(
    (clusterId: string): boolean => locks[clusterId] ?? false,
    [locks]
  );

  const setLocked = useCallback((clusterId: string, locked: boolean) => {
    const previous = locks[clusterId] ?? false;
    setLocks((prev) => ({ ...prev, [clusterId]: locked }));

    fetch("/api/workspace/topic-locks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId: clusterId, locked }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to save lock (${res.status})`);
      })
      .catch((err) => {
        console.error("Failed to persist lock change, reverting:", err);
        setLocks((prev) => ({ ...prev, [clusterId]: previous }));
      });
  }, [locks]);

  return (
    <MockPermissionsContext.Provider
      value={{ getCeiling, setCeiling, getLocked, setLocked }}
    >
      {children}
    </MockPermissionsContext.Provider>
  );
}

export function useMockPermissions() {
  const ctx = useContext(MockPermissionsContext);
  if (!ctx) throw new Error("useMockPermissions must be used within MockPermissionsProvider");
  return ctx;
}
