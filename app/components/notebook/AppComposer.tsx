"use client";

import { SearchBar } from "../ui/input/SearchBar";
import { SourceAccordion } from "../ui/display/SourceAccordion";
import { ChatThread } from "../ui/display/ChatThread";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { BlueprintDesigner } from "./BlueprintDesigner";
import type { ActiveBlock } from "../../types/canvas";
import { useNotebookStore } from "../../store/notebookStore";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface AppComposerProps {
  activeBlocks: ActiveBlock[];
  notebookId?: string;
  isVisible: boolean;
  onToggle: () => void;
}

const BLOCK_ICON: Record<string, React.ReactNode> = {
  chat: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M1.5 2a.8.8 0 0 1 .8-.8h8.4a.8.8 0 0 1 .8.8v5.5a.8.8 0 0 1-.8.8H4L1.5 10V2z" />
    </svg>
  ),
  search: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="5.5" cy="5.5" r="3.5" />
      <line x1="8.5" y1="8.5" x2="11.5" y2="11.5" />
    </svg>
  ),
  generate: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="6.5" cy="6.5" r="2.5" />
      <line x1="6.5" y1="1" x2="6.5" y2="3" />
      <line x1="6.5" y1="10" x2="6.5" y2="12" />
      <line x1="1" y1="6.5" x2="3" y2="6.5" />
      <line x1="10" y1="6.5" x2="12" y2="6.5" />
    </svg>
  ),
};

const BLOCK_FALLBACK_ICON = (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1.5" y="1.5" width="10" height="10" rx="1.5" />
  </svg>
);

export function AppComposer({ activeBlocks, notebookId, isVisible, onToggle }: AppComposerProps) {
  const {
    activePreviewBlockId,
    setActivePreviewBlock,
    theme,
    appScreens,
    addToApp,
    removeFromApp,
    reorderAppScreens,
    selectedBlockId,
    setSelectedBlockId,
  } = useNotebookStore();

  const [activeTab, setActiveTab] = useState<"screens" | "design">("screens");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeploy, setShowDeploy] = useState(false);
  const [deployTab, setDeployTab] = useState<"notebook" | "widget">("notebook");
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://poysis.app";
  const previewUrl = `${origin}/preview?id=${notebookId}`;
  const embedSnippet = `<script\n  src="${origin}/embed.js"\n  data-notebook-id="${notebookId}"\n  data-label="Ask us anything"\n  data-color="${theme.primaryColor}"\n  async>\n</script>`;
  const handleCopy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const screenBlocks = appScreens
    .map(id => activeBlocks.find(b => b.id === id))
    .filter(Boolean) as ActiveBlock[];

  const notInApp = activeBlocks.filter(b => !appScreens.includes(b.id));

  const currentBlockId = activePreviewBlockId && appScreens.includes(activePreviewBlockId)
    ? activePreviewBlockId
    : appScreens[0] || null;
  const currentBlock = activeBlocks.find(b => b.id === currentBlockId) || null;

  const moveScreen = (index: number, dir: -1 | 1) => {
    const next = [...appScreens];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderAppScreens(next);
  };

  const [showAddMenu, setShowAddMenu] = useState(false);

  const themeVars = {
    "--primary-color": theme.primaryColor,
    "--app-bg": theme.backgroundColor,
    "--radius": theme.borderRadius,
    "--border-width": theme.borderWidth,
    "--shadow": theme.boxShadow,
  } as React.CSSProperties;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all xl:hidden"
        style={{
          background: isVisible ? "rgba(232,165,71,0.9)" : "rgba(58,61,71,0.8)",
          color: isVisible ? "#0A0B0F" : "#E8E9ED",
          border: "1px solid rgba(232,165,71,0.3)",
        }}
        title={isVisible ? "Hide Composer" : "Show Composer"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          {isVisible
            ? <><line x1="2" y1="2" x2="14" y2="14" /><line x1="14" y1="2" x2="2" y2="14" /></>
            : <rect x="3" y="1" width="10" height="14" rx="2" />
          }
        </svg>
      </button>

      {/* Desktop panel wrapper */}
      <div
        className={`hidden xl:flex shrink-0 transition-all duration-300 ease-in-out ${isVisible ? "w-[780px] 2xl:w-[960px]" : "w-12"}`}
      >
        {/* Collapse handle */}
        <button
          onClick={onToggle}
          className="h-screen sticky top-0 flex items-center justify-center w-12 shrink-0 transition-colors group"
          style={{
            background: "rgba(10,11,15,0.96)",
            borderLeft: "1px solid rgba(58,61,71,0.4)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.25)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(58,61,71,0.4)"; }}
          title={isVisible ? "Collapse Composer" : "Expand Composer"}
        >
          <span
            className="select-none transition-colors"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#3A3D47",
              textTransform: "uppercase",
              writingMode: isVisible ? "horizontal-tb" : "vertical-rl",
            }}
          >
            {isVisible ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#9CA0AC" strokeWidth="1.5">
                <polyline points="6,2 2,5 6,8" />
              </svg>
            ) : "Composer"}
          </span>
        </button>

        {/* Panel body */}
        {isVisible && (
          <div
            className="flex-1 flex flex-row h-screen overflow-hidden sticky top-0"
            style={{ borderLeft: "1px solid rgba(58,61,71,0.4)", background: "#0A0B0F" }}
          >

            {/* ─── Column 1: Editor (Screens & Design) ─── */}
            <div
              className="w-[300px] 2xl:w-[380px] flex flex-col shrink-0 overflow-hidden"
              style={{ borderRight: "1px solid rgba(58,61,71,0.4)", background: "rgba(10,11,15,0.98)" }}
            >
              {/* Header */}
              <div
                className="px-5 pt-5 pb-4 shrink-0 space-y-3"
                style={{ borderBottom: "1px solid rgba(58,61,71,0.4)", background: "rgba(10,11,15,0.96)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#E8A547" strokeWidth="1.3">
                      <rect x="2" y="1" width="9" height="11" rx="1.5" />
                      <line x1="4" y1="4" x2="9" y2="4" />
                      <line x1="4" y1="6.5" x2="9" y2="6.5" />
                      <line x1="4" y1="9" x2="7" y2="9" />
                    </svg>
                    <span style={{ fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700, color: "#E8E9ED" }}>
                      App Composer
                    </span>
                  </div>
                  {notebookId && (
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setShowDropdown(v => !v)}
                        className="flex items-center gap-1.5 transition-all"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "8px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          background: "rgba(232,165,71,0.9)",
                          color: "#0A0B0F",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Launch App
                        <span style={{ opacity: 0.6, fontSize: "7px" }}>▾</span>
                      </button>
                      {showDropdown && (
                        <div
                          className="absolute right-0 top-full mt-1.5 w-48 z-50 overflow-hidden"
                          style={{ background: "#0A0B0F", border: "1px solid rgba(58,61,71,0.5)", borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
                        >
                          <Link
                            href={previewUrl}
                            target="_blank"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#9CA0AC", textDecoration: "none" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#E8E9ED"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(58,61,71,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#9CA0AC"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
                              <circle cx="5.5" cy="5.5" r="4" />
                              <circle cx="5.5" cy="5.5" r="1.5" />
                            </svg>
                            Preview
                          </Link>
                          <div style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }} />
                          <button
                            onClick={() => { setDeployTab("notebook"); setShowDeploy(true); setShowDropdown(false); setCopied(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#9CA0AC", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E8E9ED"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
                              <path d="M5.5 1v6M2.5 4.5l3 3 3-3M1.5 8.5v1a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-1" />
                            </svg>
                            Deploy as Notebook
                          </button>
                          <button
                            onClick={() => { setDeployTab("widget"); setShowDeploy(true); setShowDropdown(false); setCopied(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
                            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 400, color: "#9CA0AC", background: "none", border: "none", cursor: "pointer" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E8E9ED"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
                              <polyline points="3,3 1,5.5 3,8" /><polyline points="8,3 10,5.5 8,8" /><line x1="6.5" y1="1.5" x2="4.5" y2="9.5" />
                            </svg>
                            Deploy as Widget
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!selectedBlockId && (
                  <div
                    className="flex p-1 rounded-xl"
                    style={{ background: "rgba(58,61,71,0.4)" }}
                  >
                    {(["screens", "design"] as const).map((t) => {
                      const labels = { screens: "App Screens", design: "Design" };
                      const isActive = activeTab === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setActiveTab(t)}
                          className="flex-1 py-1.5 rounded-lg transition-all"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "8px",
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            background: isActive ? "rgba(232,165,71,0.15)" : "transparent",
                            color: isActive ? "#E8A547" : "#9CA0AC",
                            border: isActive ? "1px solid rgba(232,165,71,0.25)" : "1px solid transparent",
                          }}
                        >
                          {labels[t]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Scrollable Editor Content */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {selectedBlockId ? (
                  <div className="h-full flex flex-col">
                    <div
                      className="px-5 py-3 flex items-center justify-between shrink-0 relative z-20"
                      style={{ background: "rgba(232,165,71,0.08)", borderBottom: "1px solid rgba(232,165,71,0.2)" }}
                    >
                      <div className="flex items-center gap-2">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#E8A547" strokeWidth="1.3">
                          <rect x="1" y="1" width="9" height="9" rx="1" /><line x1="3.5" y1="1" x2="3.5" y2="10" /><line x1="1" y1="4" x2="10" y2="4" />
                        </svg>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", fontWeight: 500, color: "#E8A547", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                          Blueprint Designer
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedBlockId(null)}
                        className="flex items-center gap-1 transition-all"
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E8E9ED"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; }}
                      >
                        ✕ Back
                      </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <BlueprintDesigner blockId={selectedBlockId} />
                    </div>
                  </div>
                ) : activeTab === "design" ? (
                  <div className="p-5">
                    <ThemeCustomizer />
                  </div>
                ) : (
                  <div className="p-5">
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", color: "#3A3D47", textTransform: "uppercase", marginBottom: "12px" }}>
                      App Navigation
                    </div>

                    {screenBlocks.length === 0 ? (
                      <div
                        className="text-center py-10 px-6"
                        style={{ border: "2px dashed rgba(58,61,71,0.4)", borderRadius: "12px" }}
                      >
                        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47", lineHeight: 1.6 }}>
                          No screens yet. Click <strong style={{ color: "#9CA0AC" }}>+ App</strong> on any block to include it here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {screenBlocks.map((block, i) => {
                          const isActive = currentBlockId === block.id;
                          return (
                            <div
                              key={block.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all group"
                              style={{
                                background: isActive ? "rgba(232,165,71,0.1)" : "rgba(58,61,71,0.12)",
                                border: isActive ? "1px solid rgba(232,165,71,0.3)" : "1px solid rgba(58,61,71,0.35)",
                              }}
                              onClick={() => setActivePreviewBlock(block.id)}
                              onMouseEnter={(e) => {
                                if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,165,71,0.2)";
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(58,61,71,0.35)";
                              }}
                            >
                              <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveScreen(i, -1); }}
                                  disabled={i === 0}
                                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                                >▲</button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); moveScreen(i, 1); }}
                                  disabled={i === screenBlocks.length - 1}
                                  style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}
                                >▼</button>
                              </div>

                              <div
                                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ background: isActive ? "rgba(232,165,71,0.15)" : "rgba(58,61,71,0.4)", color: isActive ? "#E8A547" : "#9CA0AC" }}
                              >
                                {BLOCK_ICON[block.blockTypeId] || BLOCK_FALLBACK_ICON}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="truncate"
                                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 500, color: isActive ? "#E8E9ED" : "#9CA0AC" }}
                                >
                                  {block.name}
                                </div>
                                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.12em", color: isActive ? "#E8A547" : "#3A3D47", textTransform: "uppercase" }}>
                                  {block.blockTypeId}
                                </div>
                              </div>
                              <span
                                className="rounded flex-shrink-0 px-1.5 py-0.5"
                                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", background: isActive ? "rgba(232,165,71,0.2)" : "rgba(58,61,71,0.4)", color: isActive ? "#E8A547" : "#3A3D47" }}
                              >
                                {i + 1}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFromApp(block.id); }}
                                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all"
                                style={{ color: "#3A3D47", background: "none", border: "none", cursor: "pointer" }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,83,75,0.15)";
                                  (e.currentTarget as HTMLButtonElement).style.color = "#C9534B";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  (e.currentTarget as HTMLButtonElement).style.color = "#3A3D47";
                                }}
                              >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <line x1="1" y1="1" x2="7" y2="7" /><line x1="7" y1="1" x2="1" y2="7" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add screen menu */}
                    <div className="relative mt-3">
                      <button
                        onClick={() => setShowAddMenu(v => !v)}
                        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl transition-all"
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "8px",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          border: "2px dashed rgba(58,61,71,0.4)",
                          background: "transparent",
                          color: "#9CA0AC",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,165,71,0.3)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#E8A547";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(58,61,71,0.4)";
                          (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC";
                        }}
                      >
                        + Add Screen to App
                      </button>
                      {showAddMenu && (
                        <div
                          className="absolute top-full left-0 right-0 mt-1 z-20 overflow-hidden"
                          style={{ background: "#0A0B0F", border: "1px solid rgba(58,61,71,0.5)", borderRadius: "10px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
                        >
                          {appScreens.length === 0
                            ? notInApp.map(block => (
                                <button
                                  key={block.id}
                                  onClick={() => { addToApp(block.id); setShowAddMenu(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                  style={{ background: "none", border: "none", cursor: "pointer" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.2)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(232,165,71,0.1)", color: "#E8A547" }}>
                                    {BLOCK_ICON[block.blockTypeId] || BLOCK_FALLBACK_ICON}
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 500, color: "#E8E9ED" }}>{block.name}</div>
                                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: "#3A3D47", textTransform: "uppercase" }}>{block.blockTypeId}</div>
                                  </div>
                                </button>
                              ))
                            : notInApp.filter(b => !!b.chainingTarget).length === 0
                              ? (
                                <div className="p-6 text-center">
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(58,61,71,0.6)" strokeWidth="1.3" className="mx-auto mb-3">
                                    <path d="M5 10h10M10 5l5 5-5 5" /><circle cx="5" cy="10" r="2" /><circle cx="15" cy="10" r="2" />
                                  </svg>
                                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: "12px", fontWeight: 700, color: "#E8E9ED", marginBottom: "4px" }}>No more App-Ready blocks</div>
                                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.5 }}>
                                    Remaining blocks need a Next Screen defined before they can be added.
                                  </p>
                                </div>
                              )
                              : notInApp.filter(b => !!b.chainingTarget).map(block => (
                                <button
                                  key={block.id}
                                  onClick={() => { addToApp(block.id); setShowAddMenu(false); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                                  style={{ background: "none", border: "none", cursor: "pointer" }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.2)"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                >
                                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "rgba(232,165,71,0.1)", color: "#E8A547" }}>
                                    {BLOCK_ICON[block.blockTypeId] || BLOCK_FALLBACK_ICON}
                                  </div>
                                  <div>
                                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 500, color: "#E8E9ED" }}>{block.name}</div>
                                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: "#3A3D47", textTransform: "uppercase" }}>{block.blockTypeId}</div>
                                  </div>
                                </button>
                              ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Column 2: Live Preview ─── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "rgba(5,6,9,0.8)" }}>
              <div
                className="px-5 pt-5 pb-4 shrink-0 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(58,61,71,0.4)", background: "rgba(10,11,15,0.96)" }}
              >
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.2em", color: "#3A3D47", textTransform: "uppercase" }}>
                  Live Preview
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6BB07A", boxShadow: "0 0 5px rgba(107,176,122,0.6)" }} />
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
                    Interactive
                  </span>
                </div>
              </div>

              {/* iPhone Frame */}
              <div
                className="flex-1 p-8 overflow-y-auto"
                style={{ background: "radial-gradient(ellipse at center, rgba(58,61,71,0.08) 0%, transparent 70%)" }}
              >
                <div className="min-h-full w-full flex items-center justify-center">
                  <div className="relative shrink-0 shadow-2xl" style={{ width: 248, height: 530, margin: "20px 0" }}>
                    {/* Volume buttons */}
                    <div className="absolute -left-[3.5px] top-[90px] w-[3.5px] h-5 bg-zinc-700 rounded-l-sm shadow-sm" />
                    <div className="absolute -left-[3.5px] top-[120px] w-[3.5px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />
                    <div className="absolute -left-[3.5px] top-[158px] w-[3.5px] h-8 bg-zinc-700 rounded-l-sm shadow-sm" />
                    {/* Power button */}
                    <div className="absolute -right-[3.5px] top-[120px] w-[3.5px] h-12 bg-zinc-700 rounded-r-sm shadow-sm" />

                    {/* Phone bezel */}
                    <div
                      className="absolute inset-0 bg-zinc-900"
                      style={{ borderRadius: 42, boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.07)" }}
                    />

                    {/* Screen glass — interior driven by user's app theme */}
                    <div
                      className={`absolute flex flex-col overflow-hidden ${theme.fontFamily}`}
                      style={{
                        inset: 6,
                        borderRadius: 38,
                        backgroundColor: theme.backgroundColor,
                        transition: "background-color 0.3s",
                        ...themeVars,
                      }}
                    >
                      {/* Status bar */}
                      <div
                        className="shrink-0 px-5 pt-3 pb-1 flex items-center justify-between relative"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <span className="text-[9px] font-bold text-zinc-800" style={{ letterSpacing: "-0.02em" }}>9:41</span>
                        {/* Dynamic Island */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-2.5 bg-zinc-950 z-10 flex items-center justify-center gap-1.5" style={{ width: 72, height: 22, borderRadius: 12 }}>
                          <div className="w-2 h-2 rounded-full bg-zinc-800" />
                          <div className="w-[5px] h-[5px] rounded-full bg-zinc-700/60" />
                        </div>
                        {/* Signal + battery */}
                        <div className="flex items-center gap-1">
                          <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                            <rect x="0" y="5.5" width="1.8" height="2.5" rx="0.4" fill="#18181b"/>
                            <rect x="2.3" y="3.5" width="1.8" height="4.5" rx="0.4" fill="#18181b"/>
                            <rect x="4.6" y="1.5" width="1.8" height="6.5" rx="0.4" fill="#18181b"/>
                            <rect x="6.9" y="0" width="1.8" height="8" rx="0.4" fill="#18181b"/>
                          </svg>
                          <svg width="17" height="9" viewBox="0 0 17 9" fill="none">
                            <rect x="0.5" y="0.5" width="13" height="8" rx="2" stroke="#52525b" strokeWidth="0.8"/>
                            <rect x="1.8" y="1.8" width="9" height="5.4" rx="1" fill="#18181b"/>
                            <path d="M14.5 3v3a1.5 1.5 0 0 0 0-3z" fill="#52525b"/>
                          </svg>
                        </div>
                      </div>

                      {/* App header bar */}
                      <div
                        className="shrink-0 px-4 py-2 flex items-center justify-between border-b"
                        style={{ borderColor: "rgba(0,0,0,0.07)", backgroundColor: theme.backgroundColor }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: theme.primaryColor }}
                          >
                            <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                          </div>
                          <span className="text-[9px] font-bold text-zinc-900 uppercase tracking-tight truncate">
                            {theme.appLabel}
                          </span>
                        </div>
                        {theme.showBanner && (
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[7px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
                          </div>
                        )}
                      </div>

                      {/* App content */}
                      <div
                        className="flex-1 flex flex-col min-h-0 transition-colors duration-300"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        {!currentBlock ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.3">
                              <rect x="3" y="1" width="14" height="18" rx="2" />
                              <line x1="7" y1="7" x2="13" y2="7" /><line x1="7" y1="10" x2="13" y2="10" /><line x1="7" y1="13" x2="11" y2="13" />
                            </svg>
                            <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">
                              Add a screen on the left to begin
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col min-h-0">
                            {currentBlock.blockTypeId === "chat" && (
                              <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
                                <ChatThread blockId={currentBlock.id} />
                              </div>
                            )}
                            {currentBlock.blockTypeId === "search" && (
                              <div className="flex-1 flex flex-col min-h-0">
                                <div className="px-3 pt-3 shrink-0">
                                  <SearchBar blockId={currentBlock.id} inputKey="query" />
                                </div>
                                <div className="flex-1 overflow-y-auto px-3 pb-3 mt-3 min-h-0">
                                  <SourceAccordion blockId={currentBlock.id} outputKey="sources" layout="list" theme="card" hiddenWhenEmpty />
                                </div>
                              </div>
                            )}
                            {currentBlock.blockTypeId === "generate" && (
                              <div className="flex-1 flex flex-col min-h-0 px-3 pb-3">
                                <ChatThread blockId={currentBlock.id} />
                              </div>
                            )}

                            {currentBlock.chainingTarget && (
                              <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100/50 rounded-lg text-[9px] font-semibold text-emerald-700 mx-1">
                                <span>→</span>
                                <span className="truncate">
                                  <b>{activeBlocks.find(b => b.id === currentBlock.chainingTarget?.blockId)?.name || "Next Screen"}</b>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Home indicator */}
                      <div
                        className="shrink-0 flex items-center justify-center py-2"
                        style={{ backgroundColor: theme.backgroundColor }}
                      >
                        <div className="h-[4px] w-[72px] rounded-full bg-zinc-800/70" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deploy Modal */}
      {showDeploy && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-md overflow-hidden"
            style={{
              background: "#0A0B0F",
              border: "1px solid rgba(232,165,71,0.2)",
              borderRadius: "16px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              animation: "fade-up 200ms ease-out both",
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.02em" }}>
                  Deploy Copilot
                </h2>
                <button
                  onClick={() => setShowDeploy(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "rgba(58,61,71,0.3)", border: "1px solid rgba(58,61,71,0.5)", color: "#9CA0AC" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#C9534B"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; }}
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="8" y2="8" /><line x1="8" y1="1" x2="1" y2="8" />
                  </svg>
                </button>
              </div>

              {/* Deploy tab switcher */}
              <div
                className="flex p-1 rounded-xl mb-5"
                style={{ background: "rgba(58,61,71,0.4)" }}
              >
                {(["notebook", "widget"] as const).map(t => {
                  const labels = { notebook: "Notebook Link", widget: "Embed Widget" };
                  const isActive = deployTab === t;
                  return (
                    <button
                      key={t}
                      onClick={() => { setDeployTab(t); setCopied(false); }}
                      className="flex-1 py-2 rounded-lg transition-all"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "8px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: isActive ? "rgba(232,165,71,0.15)" : "transparent",
                        color: isActive ? "#E8A547" : "#9CA0AC",
                        border: isActive ? "1px solid rgba(232,165,71,0.25)" : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {deployTab === "notebook" && (
                <div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginBottom: "16px", lineHeight: 1.6 }}>
                    Anyone with this link can use your co-pilot as a standalone app.
                  </p>
                  <div
                    className="flex items-center gap-3 p-4 rounded-xl mb-5"
                    style={{ background: "rgba(58,61,71,0.15)", border: "1px solid rgba(58,61,71,0.4)" }}
                  >
                    <code
                      className="flex-1 truncate"
                      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#9CA0AC" }}
                    >
                      {previewUrl}
                    </code>
                    <button
                      onClick={() => handleCopy(previewUrl)}
                      className="transition-all whitespace-nowrap"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "8px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        background: copied ? "rgba(107,176,122,0.2)" : "rgba(232,165,71,0.15)",
                        color: copied ? "#6BB07A" : "#E8A547",
                        border: copied ? "1px solid rgba(107,176,122,0.3)" : "1px solid rgba(232,165,71,0.3)",
                        cursor: "pointer",
                      }}
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <Link
                    href={previewUrl}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                    style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 500, color: "#0A0B0F", background: "rgba(232,165,71,0.9)", textDecoration: "none" }}
                  >
                    Open Preview →
                  </Link>
                </div>
              )}

              {deployTab === "widget" && (
                <div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginBottom: "16px", lineHeight: 1.6 }}>
                    Paste anywhere on your site — <code style={{ fontFamily: "JetBrains Mono, monospace", background: "rgba(58,61,71,0.4)", padding: "1px 5px", borderRadius: "3px", fontSize: "10px" }}>{"<head>"}</code> or via Google Tag Manager.
                  </p>
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(58,61,71,0.4)" }}
                  >
                    <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#6BB07A", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {embedSnippet}
                    </pre>
                  </div>
                  <button
                    onClick={() => handleCopy(embedSnippet)}
                    className="w-full py-3 rounded-xl transition-all"
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      background: copied ? "rgba(107,176,122,0.15)" : "rgba(232,165,71,0.9)",
                      color: copied ? "#6BB07A" : "#0A0B0F",
                      border: copied ? "1px solid rgba(107,176,122,0.3)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ Copied to clipboard" : "Copy Embed Code"}
                  </button>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["Webflow", "WordPress", "Shopify"].map(p => (
                      <div
                        key={p}
                        className="text-center py-2.5 rounded-xl"
                        style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.3)" }}
                      >
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#3A3D47", textTransform: "uppercase" }}>{p}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", fontWeight: 300, color: "#3A3D47", textAlign: "center", marginTop: "8px" }}>
                    Works on any platform that supports custom scripts
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
