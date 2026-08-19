"use client";

import { useState } from "react";
import type { AppType, MemoryMode, ModelTier } from "../../app/(workspace)/workspace/NotebooksContext";
import type { MarketplaceMeta } from "@/lib/marketplace";
import { MARKETPLACE_URL } from "@/lib/marketplace";
import { useNotebookStore } from "@/store/notebookStore";
import { MarketplaceFields } from "../notebook/MarketplaceFields";
import { LockGlyph } from "./LockGlyph";

/* The right rail: everything about the notebook that isn't its sources or its
 * chat. Sectioned rather than stacked — the full config in one scroll was too
 * long to find anything in, the same reason Canvas's settings drawer splits it.
 *
 * Sections mirror Canvas's so a notebook means the same thing in both builders:
 *   Setup       — what it is and how it answers
 *   Look & feel — how the published app presents itself
 *   Tuning      — how answers are generated
 *   Listing     — its public link and marketplace card
 *
 * There is deliberately no visibility control: a notebook is private until its
 * author publishes it, and publishing means public. See the ceiling note in
 * NotebooksContext's seed config. */

type Section = "setup" | "look" | "tuning" | "listing";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "look", label: "Look" },
  { id: "tuning", label: "Tuning" },
  { id: "listing", label: "Listing" },
];

const MODEL_TIERS: { id: ModelTier; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "Fast" },
  { id: "thinking", label: "Thinking", hint: "Smarter" },
  { id: "expert", label: "Expert", hint: "Deepest" },
];

const MEMORY_OPTIONS: { id: MemoryMode; label: string; sub: string; locked: boolean }[] = [
  { id: "none", label: "No memory", sub: "Each question stands alone", locked: false },
  { id: "session", label: "Remembers this session", sub: "Priced feature — coming soon", locked: true },
  { id: "persistent", label: "Remembers across sessions", sub: "Priced feature — coming soon", locked: true },
];

interface StudioConfigPanelProps {
  name: string;
  onRename: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  persona: string;
  onPersona: (v: string) => void;
  modelTier: ModelTier;
  onModelTier: (t: ModelTier) => void;
  memory: MemoryMode;
  onMemory: (m: MemoryMode) => void;

  /** The notebook's single block — tuning writes to its stateSettings. */
  blockId: string | null;
  appType: AppType;

  notebookId: string;
  marketplace: MarketplaceMeta;
  onMarketplace: (meta: MarketplaceMeta) => void;
  slug: string | null;
  /** Resolves to an error message, or null on success. */
  onSaveSlug: (slug: string) => Promise<string | null>;

  published: boolean;
  publishAllowed: boolean;
  shareUrl: string;
  copyLabel: string;
  onOpenPublish: () => void;
  onCopy: () => void;
  onUnpublish: () => void;
}

export function StudioConfigPanel(props: StudioConfigPanelProps) {
  const {
    name, onRename, description, onDescription, persona, onPersona,
    modelTier, onModelTier, memory, onMemory,
    blockId, appType, notebookId, marketplace, onMarketplace, slug, onSaveSlug,
    published, publishAllowed, shareUrl, copyLabel, onOpenPublish, onCopy, onUnpublish,
  } = props;

  const [section, setSection] = useState<Section>("setup");

  return (
    <div
      style={{
        width: "330px",
        flex: "0 0 auto",
        borderLeft: "1px solid rgba(35,38,31,.09)",
        display: "flex",
        flexDirection: "column",
        background: "#F7F4EC",
      }}
    >
      <div style={{ padding: "16px 16px 0" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#6B6D62" }}>
          Notebook
        </span>
        <div style={{ display: "flex", gap: "3px", marginTop: "11px" }}>
          {SECTIONS.map((s) => {
            const active = s.id === section;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                style={{
                  flex: 1,
                  padding: "6px 2px",
                  borderRadius: "999px",
                  border: `1px solid ${active ? "#3C4A3A" : "rgba(35,38,31,.12)"}`,
                  background: active ? "#3C4A3A" : "#fff",
                  color: active ? "#FAF8F0" : "#6B6D62",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="pz-scroll"
        style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {section === "setup" && (
          <SetupSection
            name={name}
            onRename={onRename}
            description={description}
            onDescription={onDescription}
            persona={persona}
            onPersona={onPersona}
            modelTier={modelTier}
            onModelTier={onModelTier}
            memory={memory}
            onMemory={onMemory}
          />
        )}
        {section === "look" && <LookSection />}
        {section === "tuning" && <TuningSection blockId={blockId} appType={appType} />}
        {section === "listing" && (
          <ListingSection
            // Remount on notebook switch or when the stored slug changes, so
            // the link field always re-seeds from what's actually saved.
            key={`${notebookId}:${slug ?? ""}`}
            notebookId={notebookId}
            marketplace={marketplace}
            onMarketplace={onMarketplace}
            slug={slug}
            published={published}
            onSaveSlug={onSaveSlug}
          />
        )}
      </div>

      <PublishCard
        published={published}
        publishAllowed={publishAllowed}
        shareUrl={shareUrl}
        copyLabel={copyLabel}
        onOpenPublish={onOpenPublish}
        onCopy={onCopy}
        onUnpublish={onUnpublish}
      />
    </div>
  );
}

/* ── Publish / share ────────────────────────────────────────────────── */

/* Pinned below the sections, since it's the one action that's relevant
 * whichever section you're in — but collapsible, because at full height it
 * eats most of a short viewport and pushes the config out of reach. Collapsed
 * it keeps the status line and the primary action, which is all it needs to be
 * once you're deep in a config section. */
function PublishCard({
  published, publishAllowed, shareUrl, copyLabel, onOpenPublish, onCopy, onUnpublish,
}: Pick<
  StudioConfigPanelProps,
  "published" | "publishAllowed" | "shareUrl" | "copyLabel" | "onOpenPublish" | "onCopy" | "onUnpublish"
>) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ flex: "0 0 auto", margin: "0 16px 16px", background: "#3C4A3A", borderRadius: "14px", padding: open ? "15px" : "9px 12px", color: "#EDEFE7" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: open ? (published ? "8px" : "3px") : 0 }}>
        <span style={{ fontFamily: "var(--font-source-serif), serif", fontSize: open ? "16px" : "14px", fontWeight: 600, color: "#fff", flex: 1 }}>
          {published ? "● Live" : "Ready to publish"}
        </span>

        {/* Collapsed, the card still carries its primary action so hiding it
            never costs a click. */}
        {!open && published && (
          <button onClick={onCopy} style={{ fontSize: "12px", fontWeight: 600, color: "#EAEFE2" }}>{copyLabel}</button>
        )}
        {!open && !published && publishAllowed && (
          <button
            onClick={onOpenPublish}
            style={{ fontSize: "12px", fontWeight: 700, color: "#3C4A3A", background: "#EAEFE2", borderRadius: "7px", padding: "5px 10px" }}
          >
            Publish ↗
          </button>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Collapse publish panel" : "Expand publish panel"}
          title={open ? "Collapse" : "Expand"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", flex: "0 0 auto", color: "#C3CBBB" }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden style={{ transform: open ? "none" : "rotate(180deg)", transition: "transform .18s ease" }}>
            <polyline points="3,9 7,5 11,9" />
          </svg>
        </button>
      </div>

      {open && (published ? (
        <div style={{ animation: "pz-fade .25s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#33402F", borderRadius: "9px", padding: "9px 11px", marginBottom: "9px" }}>
            <span style={{ fontSize: "12.5px", color: "#C7CFBE", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shareUrl}</span>
            <button onClick={onCopy} style={{ fontSize: "12px", fontWeight: 600, color: "#EAEFE2" }}>{copyLabel}</button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Locked alongside the top bar's Share button — both are the same
                gate, so leaving this one live would make the padlock cosmetic. */}
            <button
              disabled
              title="Sharing isn't available yet"
              aria-label="Share options — not available yet"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#8A9483", background: "#E3E7DC", borderRadius: "9px", padding: "9px", cursor: "not-allowed" }}
            >
              Share options
              <LockGlyph size={12} />
            </button>
            <button onClick={onUnpublish} style={{ fontSize: "13px", fontWeight: 600, color: "#EAEFE2", border: "1px solid #6E7D62", borderRadius: "9px", padding: "9px 12px" }}>Unpublish</button>
          </div>
        </div>
      ) : (
        <div style={{ animation: "pz-fade .25s ease" }}>
          <div style={{ fontSize: "12.5px", color: "#C3CBBB", lineHeight: 1.5, marginBottom: "12px" }}>
            {publishAllowed
              ? "Anyone with the link will be able to open it. Appearing in the marketplace directory is a separate review."
              : "Add a source first — answers need something to ground in."}
          </div>
          <button
            onClick={onOpenPublish}
            disabled={!publishAllowed}
            style={{
              width: "100%",
              fontSize: "14px",
              fontWeight: 700,
              color: "#3C4A3A",
              background: "#EAEFE2",
              borderRadius: "10px",
              padding: "11px",
              opacity: publishAllowed ? 1 : 0.5,
              cursor: publishAllowed ? "pointer" : "not-allowed",
            }}
          >
            Publish notebook ↗
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Setup ──────────────────────────────────────────────────────────── */

function SetupSection({
  name, onRename, description, onDescription, persona, onPersona,
  modelTier, onModelTier, memory, onMemory,
}: Pick<
  StudioConfigPanelProps,
  "name" | "onRename" | "description" | "onDescription" | "persona" | "onPersona" | "modelTier" | "onModelTier" | "memory" | "onMemory"
>) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        <Field label="Title">
          <input
            value={name}
            onChange={(e) => onRename(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "var(--font-source-serif), serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "#23261F",
              background: "#fff",
              border: "1px solid rgba(35,38,31,.12)",
              borderRadius: "9px",
              padding: "10px 12px",
            }}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            rows={2}
            placeholder="One line readers see first…"
            style={{
              width: "100%",
              resize: "none",
              fontSize: "13.5px",
              color: "#3A3C33",
              background: "#fff",
              border: "1px solid rgba(35,38,31,.12)",
              borderRadius: "9px",
              padding: "10px 12px",
              lineHeight: 1.4,
            }}
          />
        </Field>
      </div>

      <div>
        <SectionLabel text="Persona" />
        <textarea
          value={persona}
          onChange={(e) => onPersona(e.target.value)}
          rows={3}
          placeholder="How should it sound? e.g. Friendly and concise, avoids jargon…"
          style={{
            width: "100%",
            resize: "none",
            fontSize: "13px",
            color: "#3A3C33",
            background: "#fff",
            border: "1px solid rgba(35,38,31,.12)",
            borderRadius: "9px",
            padding: "10px 12px",
            lineHeight: 1.45,
          }}
        />
      </div>

      <div>
        <SectionLabel text="Model" />
        <div style={{ display: "flex", gap: "7px" }}>
          {MODEL_TIERS.map((t) => {
            const active = t.id === modelTier;
            return (
              <button
                key={t.id}
                onClick={() => onModelTier(t.id)}
                style={{
                  flex: 1,
                  borderRadius: "9px",
                  border: `1.5px solid ${active ? "#3C4A3A" : "rgba(35,38,31,.12)"}`,
                  background: active ? "#EBF0E5" : "#fff",
                  padding: "9px 4px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1px",
                }}
              >
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: active ? "#23261F" : "#3A3C33" }}>{t.label}</span>
                <span style={{ fontSize: "10.5px", color: "#8A8C80" }}>{t.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel text="Memory" />
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {MEMORY_OPTIONS.map((m) => {
            const active = m.id === memory;
            return (
              <button
                key={m.id}
                onClick={() => !m.locked && onMemory(m.id)}
                disabled={m.locked}
                title={m.locked ? "Not available yet" : undefined}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  textAlign: "left",
                  background: active ? "#EBF0E5" : "#fff",
                  border: `1.5px solid ${active ? "#3C4A3A" : "rgba(35,38,31,.1)"}`,
                  borderRadius: "10px",
                  padding: "10px 12px",
                  opacity: m.locked ? 0.55 : 1,
                  cursor: m.locked ? "not-allowed" : "pointer",
                }}
              >
                <Radio active={active} />
                <span>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#23261F" }}>
                    {m.label} {m.locked && <LockPill />}
                  </span>
                  <span style={{ display: "block", fontSize: "11.5px", color: "#8A8C80", marginTop: "1px" }}>{m.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Look & feel ────────────────────────────────────────────────────── */

/* Reads the shared store directly rather than threading four more props —
 * same pattern as Canvas's settings drawer and BlueprintDesigner. The store is
 * what useStudioNotebook autosaves, so edits here persist on the normal
 * debounce with no extra wiring. */
function LookSection() {
  const { theme, setTheme } = useNotebookStore();

  return (
    <>
      <Field label="App name (shown to visitors)">
        <input
          value={theme.appLabel}
          onChange={(e) => setTheme({ appLabel: e.target.value })}
          style={{
            width: "100%",
            fontSize: "13.5px",
            color: "#23261F",
            background: "#fff",
            border: "1px solid rgba(35,38,31,.12)",
            borderRadius: "9px",
            padding: "10px 12px",
          }}
        />
      </Field>

      <div>
        <SectionLabel text="Colors" />
        <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#3A3C33", cursor: "pointer" }}>
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              style={{ width: "28px", height: "28px", border: "1px solid rgba(35,38,31,.12)", borderRadius: "6px", padding: 0, cursor: "pointer" }}
            />
            Accent
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#3A3C33", cursor: "pointer" }}>
            <input
              type="color"
              value={theme.backgroundColor}
              onChange={(e) => setTheme({ backgroundColor: e.target.value })}
              style={{ width: "28px", height: "28px", border: "1px solid rgba(35,38,31,.12)", borderRadius: "6px", padding: 0, cursor: "pointer" }}
            />
            Background
          </label>
        </div>
      </div>

      <div>
        <SectionLabel text="Poysis banner" />
        <label style={{ display: "flex", alignItems: "flex-start", gap: "9px", fontSize: "13px", color: "#3A3C33", cursor: "pointer", lineHeight: 1.45 }}>
          <input
            type="checkbox"
            checked={theme.showBanner}
            onChange={(e) => setTheme({ showBanner: e.target.checked })}
            style={{ marginTop: "2px" }}
          />
          Show the &quot;Powered by Poysis&quot; banner on the published app
        </label>
      </div>
    </>
  );
}

/* ── Tuning ─────────────────────────────────────────────────────────── */

function TuningSection({ blockId, appType }: { blockId: string | null; appType: AppType }) {
  const { blocks, setStateSetting } = useNotebookStore();
  const compute = blockId ? blocks[blockId] : null;

  const creativity = (compute?.stateSettings?.creativity as number) ?? 0.5;
  const maxTokens = (compute?.stateSettings?.maxTokens as number) ?? 1000;
  const resultLimit = (compute?.stateSettings?.limit as number) ?? 5;

  if (!blockId) {
    return (
      <div style={{ fontSize: "12.5px", color: "#8A8C80", lineHeight: 1.5 }}>
        Add a source to start building — tuning applies once the notebook has
        something to answer from.
      </div>
    );
  }

  return (
    <>
      {appType === "search" ? (
        <div>
          <SectionLabel text="Results per search" />
          <Slider
            value={resultLimit}
            min={1}
            max={20}
            step={1}
            display={`${resultLimit}`}
            leftLabel="Just the best match"
            rightLabel="Cast a wide net"
            onChange={(v) => setStateSetting(blockId, "limit", v)}
          />
        </div>
      ) : (
        <>
          <div>
            <SectionLabel text="Creativity" />
            <Slider
              value={creativity}
              min={0}
              max={1}
              step={0.1}
              display={creativity.toFixed(1)}
              leftLabel="Sticks to facts"
              rightLabel="More creative"
              onChange={(v) => setStateSetting(blockId, "creativity", v)}
            />
          </div>
          <div>
            <SectionLabel text="Response length" />
            <Slider
              value={maxTokens}
              min={50}
              max={2048}
              step={50}
              display={`${maxTokens}`}
              leftLabel="Short"
              rightLabel="Long"
              onChange={(v) => setStateSetting(blockId, "maxTokens", v)}
            />
          </div>
        </>
      )}
    </>
  );
}

/* ── Listing ────────────────────────────────────────────────────────── */

function ListingSection({
  notebookId, marketplace, onMarketplace, slug, published, onSaveSlug,
}: {
  notebookId: string;
  marketplace: MarketplaceMeta;
  onMarketplace: (m: MarketplaceMeta) => void;
  slug: string | null;
  published: boolean;
  onSaveSlug: (slug: string) => Promise<string | null>;
}) {
  // Seeded from props on mount only — the parent keys this section on
  // notebookId + slug, so switching notebooks or storing a new link remounts
  // it with fresh drafts. That matters because saving sanitizes ("My Notebook"
  // → "my-notebook") and publishing mints a slug outright: the field has to
  // end up showing what was stored, not what was typed.
  const [draft, setDraft] = useState(slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const next = draft.trim();
    if (saving || !next || next === slug) return;
    setSaving(true);
    const err = await onSaveSlug(next);
    setSaving(false);
    setError(err);
  };

  return (
    <>
      <div>
        <SectionLabel text="Link" />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px", color: "#8A8C80", flexShrink: 0 }}>/</span>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            onBlur={() => void commit()}
            placeholder="your-notebook-name"
            disabled={!published}
            title={published ? undefined : "Publish the notebook to claim its link"}
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "13px",
              color: "#23261F",
              background: published ? "#fff" : "rgba(35,38,31,.04)",
              border: "1px solid rgba(35,38,31,.12)",
              borderRadius: "9px",
              padding: "9px 11px",
              cursor: published ? "text" : "not-allowed",
            }}
          />
        </div>
        {error && <div style={{ fontSize: "12px", color: "#7E3A33", marginTop: "6px" }}>{error}</div>}
        {published && slug && !error && (
          <div style={{ fontSize: "12.5px", color: "#8A8C80", marginTop: "8px" }}>
            Live at{" "}
            <a href={`${MARKETPLACE_URL}/${slug}`} target="_blank" rel="noreferrer" style={{ color: "#4B6B49", fontWeight: 600 }}>
              /{slug}
            </a>
          </div>
        )}
        {!published && (
          <div style={{ fontSize: "12px", color: "#8A8C80", marginTop: "6px", lineHeight: 1.45 }}>
            Publish first — that&apos;s what claims the link.
          </div>
        )}
      </div>

      <div>
        <SectionLabel text="Marketplace card" />
        <MarketplaceFields notebookId={notebookId} meta={marketplace} onChange={onMarketplace} />
      </div>
    </>
  );
}

/* ── primitives ─────────────────────────────────────────────────────── */

function Slider({
  value, min, max, step, display, leftLabel, rightLabel, onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  leftLabel: string;
  rightLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: "#3C4A3A", cursor: "pointer" }}
        />
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#23261F", minWidth: "34px", textAlign: "right" }}>{display}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8A8C80", marginTop: "3px" }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11.5px", fontWeight: 600, color: "#8A8C80", marginBottom: "5px" }}>{label}</div>
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "11.5px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#8A8C80", marginBottom: "9px" }}>
      {text}
    </div>
  );
}

function Radio({ active }: { active: boolean }) {
  return (
    <span
      style={{
        width: "16px",
        height: "16px",
        flex: "0 0 auto",
        marginTop: "1px",
        borderRadius: "999px",
        border: `2px solid ${active ? "#3C4A3A" : "rgba(35,38,31,.25)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: active ? "#3C4A3A" : "transparent" }} />
    </span>
  );
}

function LockPill() {
  return (
    <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "#8A8C80", border: "1px solid rgba(35,38,31,.15)", borderRadius: "999px", padding: "0 6px", marginLeft: "4px" }}>
      Soon
    </span>
  );
}
