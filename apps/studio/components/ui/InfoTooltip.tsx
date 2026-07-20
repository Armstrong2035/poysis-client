"use client";

import { useState, useId } from "react";

/**
 * Small "i" affordance that reveals an explanation on hover or keyboard focus.
 *
 * Deliberately dependency-free and local: the two places that need it (the
 * dark Sources modal and the cream Sources page) render the same control on
 * different palettes, so `tone` swaps the colours rather than each copy
 * hand-rolling its own popover.
 */
export function InfoTooltip({
  text,
  tone = "dark",
  label = "More information",
}: {
  text: string;
  tone?: "dark" | "light";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  const palette =
    tone === "dark"
      ? { trigger: "#9CA0AC", border: "rgba(58,61,71,0.5)", bg: "#22252C", text: "#E8E9ED" }
      : { trigger: "#8A9488", border: "#E4DECC", bg: "#FAF8F0", text: "#262922" };

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // Tap-only devices get no hover — let a tap toggle it, and keep the
          // click from submitting the form this sits inside.
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          width: "15px",
          height: "15px",
          borderRadius: "50%",
          border: `1px solid ${palette.border}`,
          background: "transparent",
          color: palette.trigger,
          fontFamily: "DM Sans, sans-serif",
          fontSize: "10px",
          lineHeight: 1,
          cursor: "help",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        i
      </button>

      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            width: "230px",
            padding: "8px 10px",
            borderRadius: "6px",
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontFamily: "DM Sans, sans-serif",
            fontSize: "11px",
            fontWeight: 300,
            lineHeight: 1.45,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
