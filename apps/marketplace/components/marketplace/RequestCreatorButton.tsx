"use client";

import { useState } from "react";
import { WaitlistModal } from "./WaitlistModal";

export function RequestCreatorButton({ label = "Request a creator" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#3C4A3A",
          color: "#FAF8F0",
          border: "none",
          borderRadius: 12,
          padding: "12px 22px",
          fontFamily: "'Albert Sans', sans-serif",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
      <WaitlistModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
