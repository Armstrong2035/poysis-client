"use client";

import { WaitlistCapture } from "./WaitlistCapture";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(10,16,13,0.6)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="mkt-surface"
        style={{
          borderRadius: 8,
          maxWidth: 420,
          width: "100%",
          padding: 32,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 18,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: 22,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ×
        </button>
        <WaitlistCapture
          variant="modal"
          source="marketplace"
          eyebrow="Join the Beta"
          headline="Reserve your place."
          description="Get early access, follow new notebook drops, and tell us whose channel you want us to index next."
        />
      </div>
    </div>
  );
}
