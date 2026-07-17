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
        background: "rgba(38,41,34,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FAF8F0",
          borderRadius: 22,
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
            color: "#55594D",
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
