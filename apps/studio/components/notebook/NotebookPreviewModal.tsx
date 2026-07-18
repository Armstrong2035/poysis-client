"use client";

/* Previews a notebook the way a visitor sees it, without leaving Canvas.
 *
 * Renders the existing /preview route in embed mode inside an iframe — that
 * page hydrates from the notebook's SAVED config via the public API and
 * applies its own theme, so it works for unpublished notebooks too (it keys
 * off the notebook id, not a slug). Canvas persists before opening this, so
 * what you see reflects the edits you just made rather than the last autosave. */

interface NotebookPreviewModalProps {
  notebookId: string;
  appLabel: string;
  onClose: () => void;
}

export function NotebookPreviewModal({ notebookId, appLabel, onClose }: NotebookPreviewModalProps) {
  const src = `/preview?id=${encodeURIComponent(notebookId)}&embed=true`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        background: "rgba(38,41,34,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 92vw)",
          height: "min(700px, 84vh)",
          display: "flex",
          flexDirection: "column",
          background: "#FAF8F0",
          border: "1px solid #E4DECC",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderBottom: "1px solid #E4DECC",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#8A9488",
            }}
          >
            Preview
          </div>
          <div
            style={{
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#262922",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {appLabel}
          </div>
          <div style={{ flex: 1 }} />
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#4B6B49",
              textDecoration: "none",
              padding: "6px 10px",
              borderRadius: "8px",
              border: "1px solid #E4DECC",
              whiteSpace: "nowrap",
            }}
          >
            Open in new tab ↗
          </a>
          <div
            onClick={onClose}
            style={{ cursor: "pointer", color: "#8A9488", fontSize: "18px", padding: "0 4px" }}
          >
            ✕
          </div>
        </div>

        <iframe
          src={src}
          title={`Preview of ${appLabel}`}
          style={{ flex: 1, width: "100%", border: "none", background: "#FFFFFF" }}
        />
      </div>
    </div>
  );
}
