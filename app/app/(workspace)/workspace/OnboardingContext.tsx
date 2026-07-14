"use client";

/**
 * Client-only onboarding checklist progress. "Connected a source" is derived
 * live from ConsolidationContext's real Drive connections — everything else
 * here (viewing a cluster, changing a ceiling, engaging a notebook in Canvas,
 * trying Quick Ask, deploying, inviting a teammate) has no server-side event
 * to key off yet, so it's tracked client-side and persisted to localStorage.
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "poysis-onboarding";

export type OnboardingKey =
  | "viewedCluster"
  | "changedCeiling"
  | "builtNotebook"
  | "triedQuickAsk"
  | "deployedNotebook"
  | "invitedTeammate";

const EMPTY: Record<OnboardingKey, boolean> = {
  viewedCluster: false,
  changedCeiling: false,
  builtNotebook: false,
  triedQuickAsk: false,
  deployedNotebook: false,
  invitedTeammate: false,
};

type OnboardingValue = {
  done: Record<OnboardingKey, boolean>;
  markDone: (key: OnboardingKey) => void;
};

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState<Record<OnboardingKey, boolean>>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      // ignore malformed storage
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // storage unavailable — progress just won't persist
    }
  }, [done, loaded]);

  const markDone = useCallback((key: OnboardingKey) => {
    setDone((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  return <OnboardingContext.Provider value={{ done, markDone }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
