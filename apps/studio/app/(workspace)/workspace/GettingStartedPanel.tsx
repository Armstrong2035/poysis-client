"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConsolidation } from "./ConsolidationContext";
import { useOnboarding, type OnboardingKey } from "./OnboardingContext";

type Item = {
  key: OnboardingKey | "connectedSource";
  title: string;
  desc: string;
  href?: string;
  action?: "quickAsk";
};

const ITEMS: Item[] = [
  { key: "connectedSource", title: "Connect a source", desc: "Link Google Drive so Poysis has something to learn from.", href: "/workspace/sources" },
  { key: "viewedCluster", title: "Review your first cluster", desc: "Poysis auto-organizes your documents into clusters. Open one on the Knowledge Map to see what it found.", href: "/workspace" },
  { key: "changedCeiling", title: "Set a cluster's ceiling", desc: "Every cluster carries an exposure ceiling — the farthest its contents may ever reach. Try changing one from Canvas.", href: "/workspace/canvas" },
  { key: "builtNotebook", title: "Configure a notebook via chat", desc: "Notebooks are configured by asking, not filling out forms. Open a notebook in Canvas and tell Poysis what you want.", href: "/workspace/canvas" },
  { key: "triedQuickAsk", title: "Try Quick Ask", desc: "Ask anything, across every cluster you already have access to, without picking one first.", action: "quickAsk" },
  { key: "deployedNotebook", title: "Deploy a notebook", desc: "Publish a notebook so it can be reached outside of Canvas.", href: "/workspace/canvas" },
  { key: "invitedTeammate", title: "Invite a teammate", desc: "Bring in a collaborator and give them a role on the Teams page.", href: "/workspace/teams" },
];

export function GettingStartedPanel({ onClose, onOpenQuickAsk }: { onClose: () => void; onOpenQuickAsk: () => void }) {
  const router = useRouter();
  const { connections } = useConsolidation();
  const { done } = useOnboarding();
  const [expanded, setExpanded] = useState<string | null>(null);

  const isDone = (key: Item["key"]) => (key === "connectedSource" ? connections.length > 0 : done[key]);
  const doneCount = ITEMS.filter((item) => isDone(item.key)).length;
  const pct = Math.round((doneCount / ITEMS.length) * 100);

  const go = (item: Item) => {
    onClose();
    if (item.action === "quickAsk") {
      onOpenQuickAsk();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(38,41,34,0.28)", zIndex: 24 }} />
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "420px",
          background: "#FAF8F0", borderLeft: "1px solid #E4DECC", zIndex: 25,
          padding: "26px", display: "flex", flexDirection: "column", gap: "6px",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.08)", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#849777", marginBottom: "6px" }}>
              Getting Started
            </div>
            <div style={{ fontFamily: "var(--font-source-serif), serif", fontWeight: 600, fontSize: "20px", color: "#262922" }}>
              {doneCount}/{ITEMS.length} complete
            </div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}>✕</div>
        </div>

        <div style={{ height: "6px", borderRadius: "3px", background: "#E4DECC", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "100%", background: "#849777", width: `${pct}%`, transition: "width 200ms ease-out" }} />
        </div>

        {ITEMS.map((item) => {
          const itemDone = isDone(item.key);
          const isExpanded = expanded === item.key;
          return (
            <div key={item.key} style={{ border: "1px solid #E4DECC", borderRadius: "11px", marginBottom: "10px", overflow: "hidden" }}>
              <div
                onClick={() => setExpanded((e) => (e === item.key ? null : item.key))}
                style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", padding: "13px 15px" }}
              >
                <div
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    background: itemDone ? "#E9F0E6" : "transparent",
                    color: itemDone ? "#4B6B49" : "#C9C2AC",
                    border: `1.5px solid ${itemDone ? "#4B6B49" : "#C9C2AC"}`,
                  }}
                >
                  {itemDone ? "✓" : ""}
                </div>
                <div style={{ flex: 1, fontSize: "13.5px", fontWeight: 600, color: itemDone ? "#8A9488" : "#262922" }}>
                  {item.title}
                </div>
                <div style={{ color: "#8A9488", fontSize: "12px" }}>{isExpanded ? "▲" : "▼"}</div>
              </div>
              {isExpanded && (
                <div style={{ padding: "0 15px 15px 49px" }}>
                  <div style={{ fontSize: "12.5px", color: "#55594D", lineHeight: 1.55, marginBottom: "10px" }}>{item.desc}</div>
                  <button
                    onClick={() => go(item)}
                    style={{ cursor: "pointer", padding: "8px 14px", borderRadius: "8px", border: "none", background: "#3C4A3A", color: "#FAF8F0", fontWeight: 600, fontSize: "12.5px" }}
                  >
                    Go do it →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
