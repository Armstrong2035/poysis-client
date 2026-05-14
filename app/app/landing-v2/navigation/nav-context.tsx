"use client";

import { createContext, useContext } from "react";
import type { SceneId } from "./scenes";

const SceneNavContext = createContext<{ active: SceneId }>({ active: "hook" });

export const SceneNavProvider = SceneNavContext.Provider;

export function useActiveScene(): SceneId {
  return useContext(SceneNavContext).active;
}
