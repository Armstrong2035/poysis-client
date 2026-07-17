"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Chat } from "@/components/ui/chat/Chat";
import { useNotebooks } from "./NotebooksContext";
import { useOnboarding } from "./OnboardingContext";

export function QuickAskModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createNotebook } = useNotebooks();
  const { markDone } = useOnboarding();
  const promotingRef = useRef(false);

  const promote = async (userText: string) => {
    if (promotingRef.current) return;
    promotingRef.current = true;
    try {
      const nb = await createNotebook({
        name: userText.length > 40 ? `${userText.slice(0, 40)}…` : userText,
        persona:
          "Promoted from a Quick Ask thread — describe the tone you want in Canvas.",
      });
      onClose();
      router.push(`/workspace/canvas?notebook=${nb.id}`);
    } catch (err) {
      console.error("Failed to promote to notebook:", err);
    } finally {
      promotingRef.current = false;
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(38,41,34,0.35)", zIndex: 30 }} />
      <div
        style={{
          position: "fixed", top: "5vh", left: "50%", transform: "translateX(-50%)",
          width: "820px", maxWidth: "92vw", height: "88vh", background: "#F1EEE2",
          borderRadius: "18px", zIndex: 31, boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          display: "flex", overflow: "hidden",
        }}
      >
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", borderRight: "1px solid #E4DECC", background: "#FAF8F0" }}>
          <div style={{ padding: "20px 26px", borderBottom: "1px solid #E4DECC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#C99A5C" }}>
                Quick Ask
              </div>
              <div style={{ fontFamily: "var(--font-source-serif), serif", fontWeight: 600, fontSize: "19px", color: "#262922" }}>
                Across everything you can access
              </div>
            </div>
            <div onClick={onClose} style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px" }}>✕</div>
          </div>

          <div style={{ flex: 1, minHeight: 0, padding: "16px 26px 22px 26px" }}>
            <Chat
              config={{
                mode: "dashboard",
                notebookId: "quick-ask",
                placeholder: "Ask anything…",
              }}
              onSend={() => markDone("triedQuickAsk")}
              renderMessageFooter={({ id, userText }) => (
                <div
                  onClick={() => promote(userText)}
                  style={{ cursor: "pointer", marginTop: "6px", marginLeft: "4px", fontSize: "11.5px", color: "#7E3A33", fontWeight: 600 }}
                  key={id}
                >
                  Promote to notebook →
                </div>
              )}
            />
          </div>
        </div>

        <div style={{ width: "260px", padding: "22px 20px", background: "#F1EEE2" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8A9488", marginBottom: "12px" }}>
            Research log
          </div>
          <div style={{ fontSize: "12.5px", color: "#55594D", lineHeight: 1.6 }}>
            Every question you ask here is answered live across your whole knowledge base — no cluster picked first.
            Promote a thread to give it its own notebook, scoped and configurable in Canvas.
          </div>
        </div>
      </div>
    </>
  );
}
