"use client";

interface ConfigHubModalProps {
  activeBlocks: any[];
  blocks: Record<string, any>;
  uiComponents: Record<string, any>;
  onReset: () => void;
  onClose: () => void;
}

export function ConfigHubModal({ activeBlocks, blocks, uiComponents, onReset, onClose }: ConfigHubModalProps) {
  const handleDownload = () => {
    const data = JSON.stringify({ activeBlocks, blocks, uiComponents }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poysis-config-${Date.now()}.json`;
    a.click();
  };

  const handleReset = () => {
    if (confirm("This will permanently delete your local config. Continue?")) {
      onReset();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-2xl flex flex-col"
        style={{
          background: "#0A0B0F",
          border: "1px solid rgba(232,165,71,0.2)",
          borderRadius: "12px",
          maxHeight: "80vh",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          animation: "fade-up 200ms ease-out both",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(58,61,71,0.4)" }}
        >
          <div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "16px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.02em" }}>
              Project Configuration
            </h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "3px" }}>
              Technical specification of your headless logic flow.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded transition-colors hover:bg-[rgba(232,165,71,0.08)]"
            style={{ color: "#9CA0AC" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="10" y2="10"/><line x1="10" y1="1" x2="1" y2="10"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-5" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.2em", color: "#9CA0AC", textTransform: "uppercase" }}>
              Raw Config JSON
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="transition-colors hover:text-[#E8E9ED]"
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#E8A547", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
              >
                Download
              </button>
              <button
                onClick={handleReset}
                className="transition-colors hover:text-[#C9534B]"
                style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", letterSpacing: "0.15em", color: "#9CA0AC", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer" }}
              >
                Reset
              </button>
            </div>
          </div>
          <pre
            className="text-[11px] font-mono leading-relaxed p-5 overflow-x-auto rounded-xl"
            style={{ background: "rgba(58,61,71,0.15)", color: "#6BB07A", border: "1px solid rgba(58,61,71,0.4)" }}
          >
            {JSON.stringify({ activeBlocks, blocks, uiComponents }, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-7 py-4" style={{ borderTop: "1px solid rgba(58,61,71,0.4)" }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#3A3D47", textAlign: "center" }}>
            This config file is all Poysis needs to reconstruct your app.
          </p>
        </div>
      </div>
    </div>
  );
}
