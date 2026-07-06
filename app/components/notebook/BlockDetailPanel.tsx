me"use client";

import { useState, useEffect, useRef } from "react";
import { FileUploader } from "../ui/input/FileUploader";
import { VariableList } from "../ui/input/VariableList";
import { BlueprintDesigner } from "./BlueprintDesigner";
import { LayoutRenderer } from "../ui/display/LayoutRenderer";
import { TopicScopePicker } from "./TopicScopePicker";
import { ConnectionScopePicker } from "./ConnectionScopePicker";
import type { ActiveBlock } from "../../types/canvas";
import { useNotebookStore } from "../../store/notebookStore";

interface BlockDetailPanelProps {
  block: ActiveBlock;
  blocks: Record<string, any>;
  allBlocks: ActiveBlock[];
  isOpen: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onToggleSource: (type: string) => void;
  onSetChainingTarget: (target: { blockId: string; inputKey: string } | undefined) => void;
  onSetTemplatedInput: (inputKey: string, template: string) => void;
  onSetStateSetting: (key: string, value: any) => void;
  onSetUIConfig: (uiConfig: any) => void;
  onSave: () => void;
}

const BLOCK_ICON: Record<string, React.ReactNode> = {
  chat: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M2 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5.5l-3.5 2.5V3z" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="8" cy="8" r="5" />
      <line x1="12" y1="12" x2="16" y2="16" />
    </svg>
  ),
  generate: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="9" cy="9" r="3" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="9" y1="14" x2="9" y2="17" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="14" y1="9" x2="17" y2="9" />
    </svg>
  ),
};

const BLOCK_SUBTITLE: Record<string, string> = {
  chat: "Let your users chat with your knowledge base. E.g. FAQs.",
  search: "Let your users search through your structured data. E.g. Product Catalog.",
  generate: "Generate a response directly from AI. No knowledge base required.",
};

export function BlockDetailPanel({
  block,
  blocks,
  allBlocks,
  isOpen,
  onClose,
  onRename,
  onToggleSource,
  onSetChainingTarget,
  onSetTemplatedInput,
  onSetStateSetting,
  onSetUIConfig,
  onSave,
}: BlockDetailPanelProps) {
  const [tab, setTab] = useState<"logic" | "review" | "interface">("logic");
  const { setSelectedBlockId } = useNotebookStore();
  const [showVariablePicker, setShowVariablePicker] = useState(false);

  const icon = BLOCK_ICON[block.blockTypeId] ?? (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="2" y="2" width="14" height="14" rx="2" />
    </svg>
  );
  const subtitle = BLOCK_SUBTITLE[block.blockTypeId] || "";
  const chainableBlocks = allBlocks.filter(b => b.id !== block.id);

  const hasSources = block.sources.length > 0;
  const hasSystemPrompt = !!(blocks[block.id]?.inputBindings?.instructions as any)?.template;
  const hasFormatter = !!(blocks[block.id]?.uiConfig?.layout?.length > 0);
  const needsSources = block.blockTypeId === "chat" || block.blockTypeId === "search";
  const needsInstructions = block.blockTypeId === "generate";
  const needsFormatter = block.blockTypeId === "search";
  const formatterTabDot = needsFormatter && !hasFormatter;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setSelectedBlockId(block.id);
    } else {
      setSelectedBlockId(null);
    }
    return () => setSelectedBlockId(null);
  }, [isOpen, block.id, setSelectedBlockId]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 left-0 right-0 xl:left-[240px] z-50 flex items-stretch" style={{ animation: "fade-up 200ms ease-out both" }}>
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "#0A0B0F", borderLeft: "1px solid rgba(58,61,71,0.4)" }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center gap-4 px-8 py-5 shrink-0 sticky top-0 z-10"
            style={{ background: "rgba(10,11,15,0.95)", borderBottom: "1px solid rgba(58,61,71,0.4)", backdropFilter: "blur(12px)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(232,165,71,0.1)", color: "#E8A547", border: "1px solid rgba(232,165,71,0.2)" }}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                className="outline-none bg-transparent w-full transition-all rounded-lg px-2 py-0.5 -ml-2 border border-transparent"
                style={{ fontFamily: "Syne, sans-serif", fontSize: "20px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.02em" }}
                value={block.name}
                onChange={(e) => onRename(e.target.value)}
                placeholder="Block name…"
                onFocus={(e) => {
                  e.currentTarget.style.background = "rgba(58,61,71,0.2)";
                  e.currentTarget.style.borderColor = "rgba(232,165,71,0.3)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              />
              <div
                className="px-2 mt-0.5"
                style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC" }}
              >
                {subtitle}
              </div>
            </div>

            {/* Tab switcher */}
            <div
              className="flex items-center p-1 gap-1 flex-shrink-0 rounded-xl"
              style={{ background: "rgba(58,61,71,0.4)" }}
            >
              {(["logic", "review", "interface"] as const).map((t) => {
                const labels: Record<string, string> = { logic: "Logic", review: "Playground", interface: "Formatter" };
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="relative px-4 py-1.5 rounded-lg transition-all"
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: "9px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: isActive ? "rgba(232,165,71,0.15)" : "transparent",
                      color: isActive ? "#E8A547" : "#9CA0AC",
                      border: isActive ? "1px solid rgba(232,165,71,0.3)" : "1px solid transparent",
                    }}
                  >
                    {labels[t]}
                    {t === "interface" && formatterTabDot && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: "#E8A547" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ background: "rgba(58,61,71,0.3)", border: "1px solid rgba(58,61,71,0.5)", color: "#9CA0AC" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,83,75,0.15)";
                (e.currentTarget as HTMLButtonElement).style.color = "#C9534B";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.3)";
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC";
              }}
              title="Close (Esc)"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" } as React.CSSProperties}>

            {/* ── LOGIC TAB ── */}
            {tab === "logic" && (
              <div className="max-w-2xl mx-auto px-8 py-10 space-y-12">

                {/* Library & Context */}
                <section>
                  <SectionHeader
                    label="Library & Context"
                    barColor={needsSources && !hasSources ? "#E8A547" : "#6BB07A"}
                    warning={needsSources && !hasSources ? "Not configured" : undefined}
                  />

                  {(block.blockTypeId === "chat" || block.blockTypeId === "search") && (
                    <div className="space-y-4">
                      <DarkCard>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8E9ED" }}>
                              Knowledge Ingestion
                            </h3>
                            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
                              Inject documents into Pinecone for this block.
                            </p>
                          </div>
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(58,61,71,0.5)", color: "#9CA0AC", border: "1px solid rgba(58,61,71,0.6)" }}
                          >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
                              <rect x="2" y="1" width="11" height="13" rx="1.5" />
                              <line x1="5" y1="5" x2="10" y2="5" />
                              <line x1="5" y1="7.5" x2="10" y2="7.5" />
                              <line x1="5" y1="10" x2="8" y2="10" />
                            </svg>
                          </div>
                        </div>
                        <FileUploader
                          blockId={block.id}
                          inputKey="documents"
                          acceptedFormats={block.uploadFormats || (block.blockTypeId === "search" ? ["spreadsheet"] : ["pdf", "spreadsheet"])}
                          onUploadComplete={onSave}
                        />
                      </DarkCard>

                      <div
                        className="px-5 py-4 rounded-2xl"
                        style={{ background: "rgba(58,61,71,0.08)", border: "1px solid rgba(58,61,71,0.3)" }}
                      >
                        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase", marginBottom: "4px" }}>
                          Mapping Guide
                        </div>
                        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.6 }}>
                          This block is connected to <strong style={{ color: "#E8E9ED" }}>{block.name}</strong> memory. Queries from the UI will search these documents instantly.
                        </div>
                      </div>

                      {/* Knowledge Scope */}
                      <DarkCard>
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <h3 style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8E9ED" }}>
                              Knowledge Scope
                            </h3>
                            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
                              What end users can query. No selection = no access.
                            </p>
                          </div>
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(58,61,71,0.5)", color: "#9CA0AC", border: "1px solid rgba(58,61,71,0.6)" }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2">
                              <circle cx="7" cy="7" r="2" />
                              <circle cx="7" cy="2" r="1" /><circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="9" r="1" /><circle cx="7" cy="12" r="1" />
                              <circle cx="2" cy="9" r="1" /><circle cx="2" cy="5" r="1" />
                              <line x1="7" y1="5" x2="7" y2="3" /><line x1="7" y1="9" x2="7" y2="11" />
                              <line x1="8.7" y1="6" x2="11" y2="5.3" /><line x1="8.7" y1="8" x2="11" y2="8.7" />
                              <line x1="5.3" y1="6" x2="3" y2="5.3" /><line x1="5.3" y1="8" x2="3" y2="8.7" />
                            </svg>
                          </div>
                        </div>

                        {/* Connections */}
                        <div className="mb-5">
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase", marginBottom: "8px" }}>
                            By Connection
                          </div>
                          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", fontWeight: 300, color: "#3A3D47", marginBottom: "10px", lineHeight: 1.5 }}>
                            Grant access to everything from a source — e.g. all 150 sermons from your YouTube channel.
                          </p>
                          <ConnectionScopePicker
                            selectedIds={block.sources}
                            onToggle={(id) => onToggleSource(id)}
                          />
                        </div>

                        <div style={{ borderTop: "1px solid rgba(58,61,71,0.3)", margin: "0 0 16px" }} />

                        {/* Topics */}
                        <div>
                          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.18em", color: "#9CA0AC", textTransform: "uppercase", marginBottom: "8px" }}>
                            By Topic
                          </div>
                          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", fontWeight: 300, color: "#3A3D47", marginBottom: "10px", lineHeight: 1.5 }}>
                            Restrict to specific knowledge clusters — e.g. only sermons about Grace & Forgiveness.
                          </p>
                          <TopicScopePicker
                            selectedIds={block.sources}
                            onToggle={(id) => onToggleSource(id)}
                          />
                        </div>
                      </DarkCard>
                    </div>
                  )}
                </section>

                {/* System Persona */}
                <section>
                  <SectionHeader
                    label="System Persona"
                    barColor={needsInstructions && !hasSystemPrompt ? "#E8A547" : "#9CA0AC"}
                    warning={needsInstructions && !hasSystemPrompt ? "Not configured" : undefined}
                  />

                  <DarkCard>
                    <div className="flex items-center justify-between mb-4">
                      <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" }}>
                        Instructions
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setShowVariablePicker(v => !v)}
                          className="flex items-center gap-1 transition-all"
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: "9px",
                            letterSpacing: "0.12em",
                            color: "#E8A547",
                            textTransform: "uppercase",
                            background: "rgba(232,165,71,0.1)",
                            border: "1px solid rgba(232,165,71,0.25)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          <span>{`{ }`}</span> Insert Variable
                        </button>
                        {showVariablePicker && (
                          <div
                            className="absolute right-0 mt-2 w-64 z-50 overflow-hidden"
                            style={{ background: "#0A0B0F", border: "1px solid rgba(58,61,71,0.5)", borderRadius: "12px", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}
                          >
                            <VariableList
                              currentBlockId={block.id}
                              onSelect={(variable) => {
                                const current = (blocks[block.id]?.inputBindings?.instructions as any)?.template || "";
                                onSetTemplatedInput("instructions", current + variable);
                                setShowVariablePicker(false);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <textarea
                      className="w-full outline-none h-56 resize-none leading-relaxed rounded-xl px-5 py-4 transition-all"
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "11px",
                        background: "rgba(58,61,71,0.2)",
                        border: "1px solid rgba(58,61,71,0.4)",
                        color: "#E8E9ED",
                      }}
                      value={(blocks[block.id]?.inputBindings?.instructions as any)?.template || ""}
                      onChange={(e) => onSetTemplatedInput("instructions", e.target.value)}
                      placeholder="Define the block's personality and goals here…"
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,165,71,0.35)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,71,0.4)"; }}
                    />
                    <div className="flex items-center gap-2 mt-4">
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#3A3D47", textTransform: "uppercase" }}>
                        Context Slug:
                      </span>
                      <code
                        className="rounded px-2 py-0.5"
                        style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", background: "rgba(58,61,71,0.4)", border: "1px solid rgba(58,61,71,0.5)" }}
                      >
                        {block.slug}
                      </code>
                    </div>
                  </DarkCard>
                </section>

                {/* Engine Dashboard */}
                <section>
                  <SectionHeader label="Engine Dashboard" barColor="#5B8DD9" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <DarkCard>
                        <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                          Foundation Model
                        </label>
                        <select
                          className="w-full outline-none rounded-xl px-4 py-3 transition-all"
                          style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            background: "rgba(58,61,71,0.3)",
                            border: "1px solid rgba(58,61,71,0.5)",
                            color: "#E8E9ED",
                          }}
                          value={blocks[block.id]?.stateSettings?.model || "gemini-3-flash"}
                          onChange={(e) => onSetStateSetting("model", e.target.value)}
                        >
                          <option value="gemini-3-flash">Gemini 3 Flash</option>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                        </select>
                      </DarkCard>
                    </div>

                    {(block.blockTypeId === "chat" || block.blockTypeId === "generate") && (
                      <DarkCard>
                        <div className="flex items-center justify-between mb-4">
                          <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
                            Creativity
                          </label>
                          <span
                            className="rounded px-2 py-0.5"
                            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#E8A547", background: "rgba(232,165,71,0.1)", border: "1px solid rgba(232,165,71,0.2)" }}
                          >
                            {(blocks[block.id]?.stateSettings?.creativity ?? 0.5).toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.1"
                          className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: "#E8A547" }}
                          value={blocks[block.id]?.stateSettings?.creativity ?? 0.5}
                          onChange={(e) => onSetStateSetting("creativity", parseFloat(e.target.value))}
                        />
                        <div className="flex justify-between mt-3">
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Facts</span>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Flair</span>
                        </div>
                      </DarkCard>
                    )}

                    {(block.blockTypeId === "chat" || block.blockTypeId === "generate") && (
                      <DarkCard>
                        <div className="flex items-center justify-between mb-4">
                          <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
                            Max Tokens
                          </label>
                          <span
                            className="rounded px-2 py-0.5"
                            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#E8A547", background: "rgba(232,165,71,0.1)", border: "1px solid rgba(232,165,71,0.2)" }}
                          >
                            {blocks[block.id]?.stateSettings?.maxTokens || 1000}
                          </span>
                        </div>
                        <input
                          type="range" min="50" max="2048" step="50"
                          className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                          style={{ accentColor: "#E8A547" }}
                          value={blocks[block.id]?.stateSettings?.maxTokens || 1000}
                          onChange={(e) => onSetStateSetting("maxTokens", parseInt(e.target.value))}
                        />
                        <div className="flex justify-between mt-3">
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Short</span>
                          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Long</span>
                        </div>
                      </DarkCard>
                    )}

                    {block.blockTypeId === "search" && (
                      <div className="col-span-2">
                        <DarkCard>
                          <div className="flex items-center justify-between mb-4">
                            <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9CA0AC", textTransform: "uppercase" }}>
                              Search Precision (Top K)
                            </label>
                            <span
                              className="rounded px-2 py-0.5"
                              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#E8A547", background: "rgba(232,165,71,0.1)", border: "1px solid rgba(232,165,71,0.2)" }}
                            >
                              {blocks[block.id]?.stateSettings?.limit || 5}
                            </span>
                          </div>
                          <input
                            type="range" min="1" max="20" step="1"
                            className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: "#E8A547" }}
                            value={blocks[block.id]?.stateSettings?.limit || 5}
                            onChange={(e) => onSetStateSetting("limit", parseInt(e.target.value))}
                          />
                          <div className="flex justify-between mt-3">
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Precise</span>
                            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", color: "#3A3D47", textTransform: "uppercase", letterSpacing: "0.1em" }}>Comprehensive</span>
                          </div>
                        </DarkCard>
                      </div>
                    )}
                  </div>
                </section>

                {/* Handoff Action */}
                {chainableBlocks.length > 0 && (
                  <section>
                    <SectionHeader label="Handoff Action" barColor="#E8A547" />

                    <DarkCard>
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8E9ED" }}>
                            Routing Target
                          </div>
                          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", marginTop: "3px" }}>
                            Jump to another screen after this block runs.
                          </div>
                        </div>
                        <button
                          onClick={() => onSetChainingTarget(block.chainingTarget ? undefined : { blockId: chainableBlocks[0].id, inputKey: "query" })}
                          className="relative flex-shrink-0 transition-all"
                          style={{
                            width: "44px",
                            height: "24px",
                            borderRadius: "12px",
                            background: block.chainingTarget ? "rgba(232,165,71,0.5)" : "rgba(58,61,71,0.5)",
                            border: block.chainingTarget ? "1px solid rgba(232,165,71,0.6)" : "1px solid rgba(58,61,71,0.6)",
                          }}
                        >
                          <div
                            className="absolute top-[3px] w-[18px] h-[18px] rounded-full transition-all"
                            style={{
                              background: block.chainingTarget ? "#E8A547" : "#9CA0AC",
                              left: block.chainingTarget ? "22px" : "3px",
                            }}
                          />
                        </button>
                      </div>

                      {block.chainingTarget && (
                        <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
                          <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
                            Link to Screen
                          </label>
                          <select
                            className="w-full outline-none rounded-xl px-4 py-3"
                            style={{
                              fontFamily: "DM Sans, sans-serif",
                              fontSize: "13px",
                              background: "rgba(58,61,71,0.3)",
                              border: "1px solid rgba(58,61,71,0.5)",
                              color: "#E8E9ED",
                            }}
                            value={block.chainingTarget.blockId}
                            onChange={(e) => onSetChainingTarget({ blockId: e.target.value, inputKey: "query" })}
                          >
                            {chainableBlocks.map(b => (
                              <option key={b.id} value={b.id}>{b.name} ({b.blockTypeId})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </DarkCard>
                  </section>
                )}
              </div>
            )}

            {/* ── PLAYGROUND TAB ── */}
            {tab === "review" && (
              <BlockPlayground block={block} blocks={blocks} />
            )}

            {/* ── FORMATTER TAB ── */}
            {tab === "interface" && (
              <div className="max-w-4xl mx-auto px-8 py-10">
                <div className="mb-10">
                  <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "20px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.02em", marginBottom: "6px" }}>
                    Card Formatter
                  </h2>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>
                    Map your block's data output to visual UI components.
                  </p>
                </div>
                <BlueprintDesigner blockId={block.id} mode="panel" />
                <RawOutputInspector blockId={block.id} blocks={blocks} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────── */

function SectionHeader({ label, barColor, warning }: { label: string; barColor: string; warning?: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="w-1.5 h-4 rounded-full block flex-shrink-0" style={{ background: barColor }} />
      <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", fontWeight: 500, letterSpacing: "0.2em", color: "#E8E9ED", textTransform: "uppercase" }}>
        {label}
      </h2>
      {warning && (
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: "#E8A547", textTransform: "uppercase" }}>
          — {warning}
        </span>
      )}
    </div>
  );
}

function DarkCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "rgba(58,61,71,0.1)", border: "1px solid rgba(58,61,71,0.35)" }}
    >
      {children}
    </div>
  );
}

/* ── Raw Output Inspector ─────────────────────────────────────────── */

function RawOutputInspector({ blockId, blocks }: { blockId: string; blocks: Record<string, any> }) {
  const [open, setOpen] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const runtime = blocks[blockId];
  const sources = runtime?.outputs?.sources;
  const hasData = Array.isArray(sources) && sources.length > 0;
  const raw = hasData ? JSON.stringify(sources, null, 2) : null;

  const copy = () => { if (raw) navigator.clipboard.writeText(raw); };

  return (
    <div className="mt-12 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(58,61,71,0.4)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors"
        style={{ background: "rgba(58,61,71,0.15)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.25)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(58,61,71,0.15)"; }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: "#E8E9ED" }}>
            Raw API Response
          </span>
          {hasData ? (
            <span
              className="rounded-full px-2 py-0.5"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: "#6BB07A", background: "rgba(107,176,122,0.08)", border: "1px solid rgba(107,176,122,0.25)", textTransform: "uppercase" }}
            >
              {sources.length} result{sources.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-0.5"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.1em", color: "#3A3D47", background: "rgba(58,61,71,0.3)", border: "1px solid rgba(58,61,71,0.4)", textTransform: "uppercase" }}
            >
              No data yet
            </span>
          )}
        </div>
        <span style={{ color: "#3A3D47", fontSize: "11px", transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 200ms" }}>▼</span>
      </button>

      {open && (
        <div className="relative" style={{ background: "rgba(0,0,0,0.4)" }}>
          <button
            onClick={copy}
            className="absolute top-3 right-4 transition-all"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#9CA0AC", background: "rgba(58,61,71,0.5)", border: "1px solid rgba(58,61,71,0.6)", padding: "3px 8px", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E8E9ED"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; }}
          >
            Copy
          </button>
          <pre
            ref={preRef}
            className="leading-relaxed p-6 overflow-x-auto max-h-[480px] overflow-y-auto"
            style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#6BB07A" }}
          >
            {raw ?? <span style={{ color: "#3A3D47" }}>// No output yet. Run a search in the Playground tab first.</span>}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ── Block Playground ─────────────────────────────────────────────── */

function BlockPlayground({ block, blocks }: { block: ActiveBlock; blocks: Record<string, any> }) {
  const { setInputValue, executeBlock } = useNotebookStore();
  const runtime = useNotebookStore(s => s.blocks[block.id]);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"output" | "raw">("output");
  const [timing, setTiming] = useState<number | null>(null);
  const startRef = useRef<number | null>(null);

  const isChat = block.blockTypeId === "chat" || block.blockTypeId === "generate";
  const isSearch = block.blockTypeId === "search";

  const status = runtime?.status ?? "idle";
  const isRunning = status === "streaming" || status === "loading";

  useEffect(() => {
    if ((status === "complete" || status === "error") && startRef.current) {
      setTiming(Date.now() - startRef.current);
      startRef.current = null;
    }
  }, [status]);

  const handleRun = async () => {
    if (!query.trim() || isRunning) return;
    setInputValue(block.id, "query", query);
    startRef.current = Date.now();
    setTiming(null);
    executeBlock(block.id);
  };

  const sources: any[] = runtime?.outputs?.sources ?? [];
  const history: any[] = runtime?.outputs?.history ?? [];
  const stream: string = runtime?.outputs?.stream ?? "";

  const lastAssistant = [...history].reverse().find((m: any) => m.role === "assistant");
  const hasOutput = isSearch ? sources.length > 0 : !!lastAssistant || !!stream;

  const rawData = isSearch
    ? sources
    : lastAssistant ? [{ role: "assistant", content: lastAssistant.content, sources: lastAssistant.sources }] : null;

  const hasFormatter = !!(runtime?.uiConfig?.layout && runtime.uiConfig.layout.length > 0);

  return (
    <div className="flex flex-col h-full">

      {/* Input bar */}
      <div
        className="px-8 py-6 shrink-0 sticky top-0 z-10"
        style={{ background: "rgba(10,11,15,0.95)", borderBottom: "1px solid rgba(58,61,71,0.4)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <textarea
              rows={isChat ? 3 : 1}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !isChat) { e.preventDefault(); handleRun(); } }}
              placeholder={isSearch ? "Enter a search query…" : "Enter a prompt…"}
              className="w-full outline-none resize-none rounded-xl px-4 py-3 transition-all"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "11px",
                background: "rgba(58,61,71,0.2)",
                border: "1px solid rgba(58,61,71,0.4)",
                color: "#E8E9ED",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(232,165,71,0.35)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(58,61,71,0.4)"; }}
            />
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", fontWeight: 300, color: "#3A3D47", marginTop: "6px", marginLeft: "4px" }}>
              {isSearch ? "Press Enter to run" : "Shift+Enter for new line · Click Run to send"}
            </p>
          </div>
          <button
            onClick={handleRun}
            disabled={!query.trim() || isRunning}
            className="flex items-center gap-2 transition-all flex-shrink-0"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "10px 18px",
              borderRadius: "10px",
              background: (!query.trim() || isRunning) ? "rgba(58,61,71,0.3)" : "rgba(232,165,71,0.9)",
              color: (!query.trim() || isRunning) ? "#3A3D47" : "#0A0B0F",
              border: "none",
              cursor: (!query.trim() || isRunning) ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {isRunning ? (
              <>
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{ borderColor: "rgba(58,61,71,0.5)", borderTopColor: "#9CA0AC", animation: "spin 0.8s linear infinite" }}
                />
                Running
              </>
            ) : "▶ Run"}
          </button>
        </div>
      </div>

      {/* Status bar */}
      {(hasOutput || status === "error") && (
        <div
          className="px-8 py-2.5 flex items-center gap-4"
          style={{ background: "rgba(58,61,71,0.08)", borderBottom: "1px solid rgba(58,61,71,0.3)" }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: status === "error" ? "#C9534B" : status === "streaming" ? "#E8A547" : "#6BB07A",
              boxShadow: status === "streaming" ? "0 0 6px rgba(232,165,71,0.6)" : "none",
              animation: status === "streaming" ? "pulse 1s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase" }}>
            {status === "error" ? "Error" : status === "streaming" ? "Streaming…" : "Complete"}
          </span>
          {isSearch && sources.length > 0 && (
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#9CA0AC" }}>
              {sources.length} result{sources.length !== 1 ? "s" : ""}
            </span>
          )}
          {timing && (
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47", marginLeft: "auto" }}>
              {(timing / 1000).toFixed(2)}s
            </span>
          )}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-lg ml-auto"
            style={{ background: "rgba(58,61,71,0.4)" }}
          >
            {(["output", "raw"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1 rounded-md transition-all capitalize"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: view === v ? "rgba(232,165,71,0.15)" : "transparent",
                  color: view === v ? "#E8A547" : "#9CA0AC",
                  border: view === v ? "1px solid rgba(232,165,71,0.25)" : "1px solid transparent",
                }}
              >
                {v === "raw" ? "Raw JSON" : "Output"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Output area */}
      <div className="flex-1 overflow-y-auto">
        {!hasOutput && !isRunning && (
          <div className="flex flex-col items-center justify-center py-24 text-center select-none">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="rgba(58,61,71,0.6)" strokeWidth="1.3" className="mb-3">
              <polygon points="8,5 22,14 8,23" />
            </svg>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#3A3D47" }}>
              Run a query to see results
            </p>
          </div>
        )}

        {isRunning && !hasOutput && (
          <div className="flex items-center justify-center py-24 gap-3" style={{ color: "#9CA0AC" }}>
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{ borderColor: "rgba(58,61,71,0.5)", borderTopColor: "#E8A547", animation: "spin 0.8s linear infinite" }}
            />
            <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC" }}>Running…</span>
          </div>
        )}

        {hasOutput && view === "output" && (
          <div className="px-8 py-6">
            {isSearch && sources.length > 0 && (
              hasFormatter
                ? <LayoutRenderer layout={runtime.uiConfig?.layout ?? []} data={sources} />
                : <div className="space-y-3">
                    {sources.map((src: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-2xl p-5"
                        style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.35)" }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-2" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 500, color: "#E8E9ED" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9CA0AC" strokeWidth="1.3">
                              <rect x="1" y="1" width="10" height="10" rx="1" /><line x1="3" y1="4" x2="9" y2="4" /><line x1="3" y1="6.5" x2="9" y2="6.5" /><line x1="3" y1="9" x2="7" y2="9" />
                            </svg>
                            {src.file || "Unknown source"}
                          </span>
                          {src.score != null && (
                            <span
                              className="rounded-lg px-2 py-0.5"
                              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#9CA0AC", background: "rgba(58,61,71,0.4)", border: "1px solid rgba(58,61,71,0.5)" }}
                            >
                              {(src.score * 100).toFixed(0)}% match
                            </span>
                          )}
                        </div>
                        {src.snippet && (
                          <p
                            className="pl-3 leading-relaxed mb-3"
                            style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", borderLeft: "2px solid rgba(58,61,71,0.5)", fontStyle: "italic" }}
                          >
                            {src.snippet}
                          </p>
                        )}
                        {(() => {
                          const skip = new Set(["file", "score", "snippet"]);
                          const fields = Object.entries(src).filter(([k]) => !skip.has(k));
                          return fields.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(58,61,71,0.3)" }}>
                              {fields.map(([k, v]) => (
                                <div key={k} className="flex flex-col gap-0.5">
                                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase" }}>{k}</span>
                                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#E8E9ED" }} className="truncate">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ))}
                  </div>
            )}

            {isChat && (lastAssistant || stream) && (
              <div
                className="rounded-2xl p-5"
                style={{ background: "rgba(58,61,71,0.12)", border: "1px solid rgba(58,61,71,0.35)" }}
              >
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase", marginBottom: "12px" }}>
                  Response
                </div>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 300, color: "#E8E9ED", lineHeight: 1.7 }} className="whitespace-pre-wrap">
                  {stream || lastAssistant?.content}
                  {isRunning && <span className="inline-block w-1.5 h-4 ml-1 rounded-sm align-middle" style={{ background: "#9CA0AC", animation: "pulse 1s ease-in-out infinite" }} />}
                </p>
                {lastAssistant?.sources?.length > 0 && (
                  <div className="mt-4 pt-4 space-y-1.5" style={{ borderTop: "1px solid rgba(58,61,71,0.3)" }}>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase", marginBottom: "8px" }}>Sources</div>
                    {lastAssistant.sources.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-2" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "#9CA0AC" }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#3A3D47" strokeWidth="1.2">
                          <rect x="1" y="1" width="8" height="8" rx="1" /><line x1="3" y1="3.5" x2="7" y2="3.5" /><line x1="3" y1="5" x2="7" y2="5" /><line x1="3" y1="6.5" x2="5.5" y2="6.5" />
                        </svg>
                        <span className="flex-1 font-medium">{s.file}</span>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47" }}>{Math.round(s.score * 100)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {hasOutput && view === "raw" && (
          <div className="relative min-h-full" style={{ background: "rgba(0,0,0,0.4)" }}>
            <button
              onClick={() => rawData && navigator.clipboard.writeText(JSON.stringify(rawData, null, 2))}
              className="absolute top-4 right-5 transition-all z-10"
              style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.1em", color: "#9CA0AC", background: "rgba(58,61,71,0.5)", border: "1px solid rgba(58,61,71,0.6)", padding: "3px 8px", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#E8E9ED"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA0AC"; }}
            >
              Copy
            </button>
            <pre className="leading-relaxed p-6 overflow-x-auto" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#6BB07A" }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </div>
        )}

        {status === "error" && (
          <div className="px-8 py-6">
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: "rgba(201,83,75,0.08)", border: "1px solid rgba(201,83,75,0.25)" }}
            >
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 400, color: "#C9534B" }}>
                Something went wrong. Check your connection and try again.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
