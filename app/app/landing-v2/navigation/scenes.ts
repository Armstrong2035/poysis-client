export type SceneId =
  | "hook"
  | "wound"
  | "reveal"
  | "consolidate"
  | "query"
  | "build"
  | "airlock";

export type SceneDef = {
  id: SceneId;
  label: string;
};

export const SCENES: SceneDef[] = [
  { id: "hook", label: "Hook" },
  { id: "wound", label: "Wound" },
  { id: "reveal", label: "Reveal" },
  { id: "consolidate", label: "Consolidate" },
  { id: "query", label: "Query" },
  { id: "build", label: "Build" },
  { id: "airlock", label: "Airlock" },
];
