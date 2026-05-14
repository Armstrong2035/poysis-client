"use client";

import { useMemo } from "react";

type DebrisProps = {
  tokens?: string[];
  /** Number of items rendered. Defaults to 16. */
  density?: number;
  /** Stable seed so positions don't change between renders. */
  seed?: number;
};

const DEFAULT_TOKENS = [
  "drive/q4-research.pdf",
  "slack/#product-design",
  "notion/onboarding-v3",
  "linear/POY-241",
  "gmail/legal-review",
  "calendar/strategy-sync",
  "figma/landing-v2",
  "docs/pricing-memo",
  "claude/conversation-2026",
  "github/poysis/main",
  "memory/customer-research",
  "memory/hiring-2025",
  "fragment/decision-q3",
  "fragment/auth-rewrite",
  "snippet/copilot-config",
  "thread/competitor-analysis",
];

// Deterministic PRNG so SSR + CSR agree.
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function DebrisField({
  tokens = DEFAULT_TOKENS,
  density = 16,
  seed = 42,
}: DebrisProps) {
  const items = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: density }).map((_, i) => {
      const big = rng() > 0.7;
      return {
        key: i,
        text: tokens[Math.floor(rng() * tokens.length)],
        top: `${(rng() * 92).toFixed(2)}%`,
        left: `${(rng() * 92).toFixed(2)}%`,
        dx: `${(rng() * 80 - 40).toFixed(0)}px`,
        dy: `${(rng() * 80 - 40).toFixed(0)}px`,
        rot: `${(rng() * 12 - 6).toFixed(1)}deg`,
        dur: `${(40 + rng() * 50).toFixed(0)}s`,
        big,
      };
    });
  }, [tokens, density, seed]);

  return (
    <div className="lv2-debris" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.key}
          className={`lv2-debris-item${it.big ? " lv2-debris-item--lg" : ""}`}
          style={
            {
              top: it.top,
              left: it.left,
              "--dx": it.dx,
              "--dy": it.dy,
              "--rot": it.rot,
              "--dur": it.dur,
            } as React.CSSProperties
          }
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}
