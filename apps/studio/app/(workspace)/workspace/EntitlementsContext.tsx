"use client";

/**
 * What the signed-in account is allowed to reach, resolved once on the server
 * and handed to the client tree. The gates themselves live server-side (the
 * /workspace layout redirect, the setUiMode action) — this only exists so the
 * UI can render honestly: an admin shouldn't be shown a padlock on a door that
 * will actually open for them, and a regular user shouldn't be shown a switch
 * that dead-ends in a rejected server action.
 *
 * Read-only by design. Nothing here is a permission check — it's a copy of one.
 */

import { createContext, useContext } from "react";

type Entitlements = {
  /** May this account enter Enterprise (the /workspace app)? */
  enterprise: boolean;
};

const EntitlementsContext = createContext<Entitlements | null>(null);

export function EntitlementsProvider({
  value,
  children,
}: {
  value: Entitlements;
  children: React.ReactNode;
}) {
  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error("useEntitlements must be used within EntitlementsProvider");
  return ctx;
}
