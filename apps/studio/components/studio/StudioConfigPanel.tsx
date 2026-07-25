"use client";

import type { MemoryMode, ModelTier } from "../../app/(workspace)/workspace/NotebooksContext";

/* The right rail: the notebook's existing config (title, description, persona,
 * model, memory, visibility) plus the sticky publish/share card. Replaces the
 * prototype's Sections/Appearance concepts with the config the product already
 * models. */

export type Visibility = "private" | "link" | "public";

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

const VIS_OPTIONS: { id: Visibility; label: string; sub: string }[] = [
  { id: "private", label: "Private", sub: "Only you can open it" },
  { id: "link", label: "Anyone with the link", sub: "No sign-in needed to view" },
  { id: "public", label: "Public on the web", sub: "Listed in the marketplace directory" },
];

const VIS_SUMMARY: Record<Visibility, string> = {
  private: "Only you can open it.",
  link: "Anyone with the link can view — no sign-in.",
  public: "Listed publicly in the marketplace directory.",
};

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
  visibility: Visibility;
  onVisibility: (v: Visibility) => void;

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
    modelTier, onModelTier, memory, onMemory, visibility, onVisibility,
    published, publishAllowed, shareUrl, copyLabel, onOpenPublish, onCopy, onUnpublish,
  } = props;

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
      <div style={{ padding: "16px 18px 4px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#6B6D62" }}>
          Notebook
        </span>
      </div>

      <div
        className="pz-scroll"
        style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: "20px" }}
      >
        {/* Title + description */}
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

        {/* Persona */}
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

        {/* Model */}
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

        {/* Memory */}
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

        {/* Who can see it */}
        <div>
          <SectionLabel text="Who can see it" />
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {VIS_OPTIONS.map((v) => {
              const active = v.id === visibility;
              return (
                <button
                  key={v.id}
                  onClick={() => onVisibility(v.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    textAlign: "left",
                    background: active ? "#EBF0E5" : "#fff",
                    border: `1.5px solid ${active ? "#3C4A3A" : "rgba(35,38,31,.1)"}`,
                    borderRadius: "10px",
                    padding: "11px 12px",
                  }}
                >
                  <Radio active={active} />
                  <span>
                    <span style={{ display: "block", fontSize: "13.5px", fontWeight: 600, color: "#23261F" }}>{v.label}</span>
                    <span style={{ display: "block", fontSize: "12px", color: "#8A8C80", marginTop: "1px" }}>{v.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky publish / share card */}
      <div style={{ flex: "0 0 auto", margin: "0 16px 16px", background: "#3C4A3A", borderRadius: "14px", padding: "15px", color: "#EDEFE7" }}>
        {published ? (
          <div style={{ animation: "pz-fade .25s ease" }}>
            <div style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>● Live</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#33402F", borderRadius: "9px", padding: "9px 11px", marginBottom: "9px" }}>
              <span style={{ fontSize: "12.5px", color: "#C7CFBE", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shareUrl}</span>
              <button onClick={onCopy} style={{ fontSize: "12px", fontWeight: 600, color: "#EAEFE2" }}>{copyLabel}</button>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={onOpenPublish} style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "#3C4A3A", background: "#EAEFE2", borderRadius: "9px", padding: "9px" }}>Share options</button>
              <button onClick={onUnpublish} style={{ fontSize: "13px", fontWeight: 600, color: "#EAEFE2", border: "1px solid #6E7D62", borderRadius: "9px", padding: "9px 12px" }}>Unpublish</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "16px", fontWeight: 600, color: "#fff", marginBottom: "3px" }}>Ready to publish</div>
            <div style={{ fontSize: "12.5px", color: "#C3CBBB", lineHeight: 1.5, marginBottom: "12px" }}>
              {publishAllowed ? VIS_SUMMARY[visibility] : "Add a source first — answers need something to ground in."}
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
        )}
      </div>
    </div>
  );
}

/* ── primitives ─────────────────────────────────────────────────────── */

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
