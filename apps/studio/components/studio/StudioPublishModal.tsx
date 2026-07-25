"use client";

interface StudioPublishModalProps {
  published: boolean;
  publishing: boolean;
  shareUrl: string;
  copyLabel: string;
  visibilitySummary: string;
  onCopy: () => void;
  onConfirmPublish: () => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function StudioPublishModal({
  published,
  publishing,
  shareUrl,
  copyLabel,
  visibilitySummary,
  onCopy,
  onConfirmPublish,
  onClose,
  onToast,
}: StudioPublishModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(35,38,31,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "480px",
          maxWidth: "100%",
          background: "#FBF9F3",
          borderRadius: "18px",
          boxShadow: "0 40px 80px -30px rgba(35,38,31,.6)",
          overflow: "hidden",
          animation: "pz-pop .22s ease",
        }}
      >
        <div style={{ padding: "24px 26px 18px", borderBottom: "1px solid rgba(35,38,31,.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-source-serif), serif", fontSize: "22px", fontWeight: 600, margin: "0 0 3px", color: "#23261F" }}>
                {published ? "Share this notebook" : "Publish this notebook"}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#6B6D62" }}>
                {published ? "It's live. Share the link or export." : "Give it a home readers can open."}
              </p>
            </div>
            <button onClick={onClose} style={{ fontSize: "20px", color: "#9A9C90", lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: "20px 26px 8px" }}>
          {published && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", border: "1px solid rgba(35,38,31,.12)", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", color: "#23261F", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shareUrl}</span>
              <button onClick={onCopy} style={{ fontSize: "13px", fontWeight: 600, color: "#fff", background: "#3C4A3A", borderRadius: "8px", padding: "8px 14px" }}>{copyLabel}</button>
            </div>
          )}
          <div style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
            <button
              onClick={() => onToast(published ? "Embed snippet coming soon" : "Publish first to get an embed snippet")}
              style={{ flex: 1, textAlign: "left", background: "#fff", border: "1px solid rgba(35,38,31,.1)", borderRadius: "11px", padding: "13px 14px" }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#23261F", marginBottom: "2px" }}>◧ Embed</div>
              <div style={{ fontSize: "12px", color: "#8A8C80" }}>Drop into any site</div>
            </button>
            <button
              onClick={() => onToast("PDF export coming soon")}
              style={{ flex: 1, textAlign: "left", background: "#fff", border: "1px solid rgba(35,38,31,.1)", borderRadius: "11px", padding: "13px 14px" }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#23261F", marginBottom: "2px" }}>↓ Export PDF</div>
              <div style={{ fontSize: "12px", color: "#8A8C80" }}>Cited &amp; formatted</div>
            </button>
          </div>
        </div>

        <div style={{ padding: "14px 26px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#8A8C80" }}>{visibilitySummary}</span>
          {published ? (
            <button onClick={onClose} style={{ fontSize: "15px", fontWeight: 700, color: "#fff", background: "#3C4A3A", borderRadius: "11px", padding: "12px 24px" }}>Done</button>
          ) : (
            <button
              onClick={onConfirmPublish}
              disabled={publishing}
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#fff",
                background: "#3C4A3A",
                borderRadius: "11px",
                padding: "12px 24px",
                boxShadow: "0 10px 24px -12px rgba(60,74,58,.7)",
                opacity: publishing ? 0.7 : 1,
              }}
            >
              {publishing ? "Publishing…" : "Publish →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
