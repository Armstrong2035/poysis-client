"use client";

import { useEffect, useState } from "react";
import { MARKETPLACE_COLORS, type MarketplaceMeta } from "@/lib/marketplace";

interface MarketplaceFieldsProps {
  /** Re-seeds the free-text list drafts when the edited notebook changes. */
  notebookId: string;
  meta: MarketplaceMeta;
  onChange: (meta: MarketplaceMeta) => void;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#55594D",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: "13px",
  color: "#262922",
  border: "1px solid #E4DECC",
  borderRadius: "8px",
  padding: "8px 10px",
  outline: "none",
  background: "#FFFDF9",
};

const hintStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#8A8C7E",
  marginTop: "4px",
};

export function MarketplaceFields({ notebookId, meta, onChange }: MarketplaceFieldsProps) {
  // Free-text list fields keep a local draft so typing commas/newlines isn't
  // fought by the array round-trip; re-seeded when the notebook switches.
  const [topicsDraft, setTopicsDraft] = useState((meta.topics ?? []).join(", "));
  const [questionsDraft, setQuestionsDraft] = useState((meta.questions ?? []).join("\n"));

  useEffect(() => {
    setTopicsDraft((meta.topics ?? []).join(", "));
    setQuestionsDraft((meta.questions ?? []).join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notebookId]);

  const set = (patch: Partial<MarketplaceMeta>) => onChange({ ...meta, ...patch });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={labelStyle}>Creator</label>
        <input
          style={inputStyle}
          value={meta.creator ?? ""}
          onChange={(e) => set({ creator: e.target.value })}
          placeholder="@handle or name"
        />
      </div>

      <div>
        <label style={labelStyle}>Domain</label>
        <input
          style={inputStyle}
          value={meta.domain ?? ""}
          onChange={(e) => set({ domain: e.target.value })}
          placeholder="e.g. AI, Faith, Business"
        />
        <div style={hintStyle}>One category — keep it consistent across notebooks (powers “Browse by domain”).</div>
      </div>

      <div>
        <label style={labelStyle}>Topics</label>
        <input
          style={inputStyle}
          value={topicsDraft}
          onChange={(e) => {
            setTopicsDraft(e.target.value);
            set({ topics: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) });
          }}
          placeholder="Prayer, Purpose, Faith"
        />
        <div style={hintStyle}>Comma-separated tags — power the home filter chips and search.</div>
      </div>

      <div>
        <label style={labelStyle}>Tagline</label>
        <input
          style={inputStyle}
          value={meta.tagline ?? ""}
          onChange={(e) => set({ tagline: e.target.value })}
          placeholder="One-line pitch shown on cards"
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          style={{ ...inputStyle, minHeight: "68px", resize: "vertical" }}
          value={meta.description ?? ""}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Longer blurb for the notebook page"
        />
      </div>

      <div>
        <label style={labelStyle}>Suggested questions</label>
        <textarea
          style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }}
          value={questionsDraft}
          onChange={(e) => {
            setQuestionsDraft(e.target.value);
            set({ questions: e.target.value.split("\n").map((q) => q.trim()).filter(Boolean) });
          }}
          placeholder={"One question per line\nHow do I…?\nWhat does she teach about…?"}
        />
      </div>

      <div>
        <label style={labelStyle}>Sources indexed</label>
        <input
          style={inputStyle}
          type="number"
          min={0}
          value={meta.sourceCount ?? ""}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            set({ sourceCount: Number.isFinite(n) ? n : undefined });
          }}
          placeholder="e.g. 142"
        />
      </div>

      <div>
        <label style={labelStyle}>Card color</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
          <ColorSwatch
            label="Auto"
            selected={!meta.color}
            onClick={() => set({ color: undefined })}
          />
          {MARKETPLACE_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              label={c.label}
              hex={c.hex}
              selected={meta.color === c.id}
              onClick={() => set({ color: c.id })}
            />
          ))}
        </div>
      </div>

      <ToggleRow
        label="Feature on home"
        hint="Shows as the big “Just Dropped” card."
        checked={!!meta.featured}
        onChange={(v) => set({ featured: v })}
      />
      <ToggleRow
        label="Show in Trending"
        hint="Adds it to the home “Trending” row."
        checked={!!meta.trending}
        onChange={(v) => set({ trending: v })}
      />
    </div>
  );
}

function ColorSwatch({
  label,
  hex,
  selected,
  onClick,
}: {
  label: string;
  hex?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "5px 9px",
        borderRadius: "999px",
        border: `1px solid ${selected ? "#3C4A3A" : "#E4DECC"}`,
        background: selected ? "#F1EEE2" : "#FFFDF9",
        cursor: "pointer",
        fontSize: "12px",
        color: "#262922",
      }}
    >
      <span
        style={{
          width: "13px",
          height: "13px",
          borderRadius: "50%",
          background: hex ?? "conic-gradient(#3C4A3A,#7E3A33,#84977A,#C98A5D,#55594D,#262922)",
          flexShrink: 0,
        }}
      />
      {label}
    </button>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#262922" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "#8A8C7E" }}>{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: "38px",
          height: "22px",
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          background: checked ? "#3C4A3A" : "#D9D2BE",
          flexShrink: 0,
          transition: "background 160ms",
        }}
        aria-pressed={checked}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "18px" : "2px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#FAF8F0",
            transition: "left 160ms",
          }}
        />
      </button>
    </div>
  );
}
