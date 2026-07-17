/**
 * Exposure ceiling — the farthest a cluster's (or notebook's) contents may
 * ever reach. Mock/client-only concept for now: no Supabase column backs
 * this yet, so values live in MockPermissionsContext (localStorage).
 */
export type Ceiling = "private" | "team" | "public";

export const CEILING_RANK: Record<Ceiling, number> = { private: 0, team: 1, public: 2 };
export const CEILING_LABEL: Record<Ceiling, string> = { private: "Private", team: "Team", public: "Public-eligible" };
export const CEILING_BG: Record<Ceiling, string> = { private: "#F3E5E3", team: "#F7ECDC", public: "#EDF1E9" };
export const CEILING_COLOR: Record<Ceiling, string> = { private: "#7E3A33", team: "#9C6B2E", public: "#4B6B49" };
export const CEILING_DOT: Record<Ceiling, string> = { private: "#7E3A33", team: "#C99A5C", public: "#849777" };

export function rankToCeiling(rank: number): Ceiling {
  return rank === 0 ? "private" : rank === 1 ? "team" : "public";
}
