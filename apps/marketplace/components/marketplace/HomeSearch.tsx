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
    <div className="mkt-search" style={{ marginBottom: 16 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      />
      <span className="mkt-mono" style={{ color: "var(--faint)", fontSize: 12 }}>⏎</span>
    </div>
  );
}
