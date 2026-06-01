"use client";

const BLOCK_TYPES = [
  { id: "chat", label: "Chat", description: "Let users have a conversation with your documents. Streams answers with cited sources.", example: "Chat with my product manual", locked: false },
  { id: "search", label: "Search", description: "Let users search structured data and get matching results back as cards.", example: "Find products under $50", locked: false },
  { id: "generate", label: "Generate", description: "A direct AI completion block. No knowledge base — just system instructions.", example: "Write a social post", locked: false },
  { id: "classifier", label: "Classifier", description: "Automatically sort and route submissions into categories without manual review.", example: "Tag support tickets", locked: true },
  { id: "recommendation", label: "Recommendation", description: "Proactively surface the most relevant content before users even ask.", example: "Upsell matching items", locked: true },
  { id: "extractor", label: "Data Extractor", description: "Drop in raw documents and instantly receive structured, usable data.", example: "Pull info from invoices", locked: true },
  { id: "diagnosis", label: "Diagnosis", description: "Guided conversation engine that arrives at the core of a user's intent.", example: "Medical intake or Onboarding", locked: true },
];

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  chat: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1.5 2.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4.5l-3 2V2.5z"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="6.5" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/></svg>,
  generate: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7.5" cy="7.5" r="2.5"/><line x1="7.5" y1="1" x2="7.5" y2="3"/><line x1="7.5" y1="12" x2="7.5" y2="14"/><line x1="1" y1="7.5" x2="3" y2="7.5"/><line x1="12" y1="7.5" x2="14" y2="7.5"/></svg>,
  classifier: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="9" y="1" width="5" height="5" rx="1"/><rect x="1" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>,
  recommendation: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><polygon points="7.5,1 9.5,5.5 14.5,6 11,9.5 12,14.5 7.5,12 3,14.5 4,9.5 0.5,6 5.5,5.5"/></svg>,
  extractor: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="1" width="11" height="13" rx="1.5"/><line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10" x2="8" y2="10"/></svg>,
  diagnosis: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7.5" cy="7.5" r="6"/><line x1="7.5" y1="4" x2="7.5" y2="7.5"/><circle cx="7.5" cy="10" r="0.7" fill="currentColor"/></svg>,
};

interface BlockPickerModalProps {
  onAdd: (blockTypeId: string) => void;
  onClose: () => void;
}

export function BlockPickerModal({ onAdd, onClose }: BlockPickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md flex flex-col"
        style={{
          background: "#0A0B0F",
          border: "1px solid rgba(232,165,71,0.2)",
          borderRadius: "12px 12px 0 0",
          maxHeight: "80vh",
          boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
          animation: "fade-up 200ms ease-out both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(58,61,71,0.4)" }}
        >
          <div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: "15px", fontWeight: 700, color: "#E8E9ED", letterSpacing: "-0.01em" }}>
              Add an Engine
            </h2>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", fontWeight: 300, color: "#9CA0AC", marginTop: "2px" }}>
              Drop a logic block onto the canvas.
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

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {BLOCK_TYPES.map((block) => (
            <div
              key={block.id}
              onClick={() => !block.locked && onAdd(block.id)}
              className="flex items-start gap-3 p-4 rounded-xl transition-all"
              style={{
                background: block.locked ? "rgba(58,61,71,0.08)" : "rgba(58,61,71,0.12)",
                border: block.locked ? "1px solid rgba(58,61,71,0.25)" : "1px solid rgba(58,61,71,0.35)",
                opacity: block.locked ? 0.5 : 1,
                cursor: block.locked ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!block.locked) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,165,71,0.35)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(232,165,71,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!block.locked) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(58,61,71,0.35)";
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(58,61,71,0.12)";
                }
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: block.locked ? "rgba(58,61,71,0.3)" : "rgba(232,165,71,0.1)", color: block.locked ? "#3A3D47" : "#E8A547" }}
              >
                {BLOCK_ICONS[block.id]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontFamily: "Syne, sans-serif", fontSize: "13px", fontWeight: 700, color: block.locked ? "#3A3D47" : "#E8E9ED" }}>
                    {block.label}
                  </span>
                  {block.locked && (
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "8px", letterSpacing: "0.15em", color: "#3A3D47", textTransform: "uppercase", background: "rgba(58,61,71,0.4)", padding: "1px 5px", borderRadius: "3px" }}>
                      Soon
                    </span>
                  )}
                </div>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", fontWeight: 300, color: "#9CA0AC", lineHeight: 1.5, marginBottom: "4px" }}>
                  {block.description}
                </p>
                {block.example && (
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "#3A3D47", letterSpacing: "0.06em" }}>
                    e.g. {block.example}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { BLOCK_TYPES };
