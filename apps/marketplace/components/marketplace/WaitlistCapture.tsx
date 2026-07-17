"use client";

import { useState } from "react";
import { joinWaitlist } from "@/lib/actions";

interface WaitlistCaptureProps {
  variant: "modal" | "inline";
  source?: string;
  eyebrow?: string;
  headline: string;
  description: string;
  onDone?: () => void;
}

const THEME = {
  modal: {
    label: "#7E3A33",
    headline: "#262922",
    body: "#55594D",
    inputBg: "#F1EEE2",
    inputBorder: "#E4DECC",
    inputText: "#262922",
    button: "#3C4A3A",
    buttonHover: "#2c3730",
    buttonText: "#FAF8F0",
    successRing: "#84977A",
    successHeadline: "#262922",
    successBody: "#55594D",
  },
  inline: {
    label: "#CBD3C2",
    headline: "#FAF8F0",
    body: "#CBD3C2",
    inputBg: "#33402f",
    inputBorder: "#55655047",
    inputText: "#FAF8F0",
    button: "#C98A5D",
    buttonHover: "#d99a6c",
    buttonText: "#262922",
    successRing: "#84977A",
    successHeadline: "#FAF8F0",
    successBody: "#CBD3C2",
  },
} as const;

export function WaitlistCapture({ variant, source, eyebrow, headline, description, onDone }: WaitlistCaptureProps) {
  const t = THEME[variant];
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [nextCreator, setNextCreator] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const successNote = nextCreator.trim()
    ? `We'll index ${nextCreator.trim()} soon and let you know the moment they're live.`
    : "We'll email you the moment the beta opens up.";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    const result = await joinWaitlist({ email, username, nextCreator, source });
    if ("error" in result) {
      setStatus("error");
      setError(result.error);
    } else {
      setStatus("done");
      onDone?.();
    }
  };

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "6px 0" }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: t.successRing,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FAF8F0" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 21, color: t.successHeadline, marginBottom: 7 }}>
          You&rsquo;re on the list.
        </div>
        <div style={{ fontSize: 13.5, color: t.successBody, lineHeight: 1.5 }}>{successNote}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {eyebrow && (
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "1.2px", color: t.label, textTransform: "uppercase", marginBottom: 10 }}>
          {eyebrow}
        </div>
      )}
      <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: 24, color: t.headline, marginBottom: 8, letterSpacing: "-0.4px" }}>
        {headline}
      </div>
      <p style={{ fontSize: 14, color: t.body, lineHeight: 1.5, margin: "0 0 18px" }}>{description}</p>

      <input
        type="text"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Choose a username"
        style={{
          width: "100%",
          border: `1px solid ${t.inputBorder}`,
          background: t.inputBg,
          borderRadius: 12,
          padding: "13px 15px",
          fontFamily: "'Albert Sans', sans-serif",
          fontSize: 14.5,
          color: t.inputText,
          outline: "none",
          marginBottom: 10,
        }}
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{
          width: "100%",
          border: `1px solid ${t.inputBorder}`,
          background: t.inputBg,
          borderRadius: 12,
          padding: "13px 15px",
          fontFamily: "'Albert Sans', sans-serif",
          fontSize: 14.5,
          color: t.inputText,
          outline: "none",
          marginBottom: 10,
        }}
      />
      <input
        type="text"
        value={nextCreator}
        onChange={(e) => setNextCreator(e.target.value)}
        placeholder="Who should we add next?"
        style={{
          width: "100%",
          border: `1px solid ${t.inputBorder}`,
          background: t.inputBg,
          borderRadius: 12,
          padding: "13px 15px",
          fontFamily: "'Albert Sans', sans-serif",
          fontSize: 14.5,
          color: t.inputText,
          outline: "none",
          marginBottom: 14,
        }}
      />
      {status === "error" && (
        <div style={{ fontSize: 12.5, color: variant === "inline" ? "#f3b4ac" : "#C0392B", marginBottom: 10 }}>{error}</div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          background: t.button,
          color: t.buttonText,
          border: "none",
          borderRadius: 12,
          padding: 14,
          fontFamily: "'Albert Sans', sans-serif",
          fontWeight: 700,
          fontSize: 15,
          cursor: status === "loading" ? "default" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "Joining…" : "Join Beta"}
      </button>
    </form>
  );
}
