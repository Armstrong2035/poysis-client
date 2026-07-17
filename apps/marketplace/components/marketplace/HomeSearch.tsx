"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HomeSearch() {
  const router = useRouter();
  const [draft, setDraft] = useState("");

  const submit = () => {
    const q = draft.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        background: "#FFFDF9",
        border: "1px solid #EFE9D8",
        borderRadius: 999,
        padding: "14px 19px",
        marginBottom: 13,
        boxShadow: "0 1px 2px rgba(38,41,34,0.04), 0 10px 26px -18px rgba(38,41,34,0.3)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7E3A33" strokeWidth="2" style={{ flexShrink: 0 }}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Search people, topics or ideas…"
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          flex: 1,
          fontFamily: "'Albert Sans', sans-serif",
          fontSize: 15,
          color: "#262922",
          minWidth: 0,
        }}
      />
    </div>
  );
}
