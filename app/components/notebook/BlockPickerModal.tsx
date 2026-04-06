"use client";

const BLOCK_TYPES = [
  { 
    id: "chat", 
    label: "Chat", 
    emoji: "💬", 
    description: "Let users have a conversation with your documents. Streams answers with cited sources.", 
    example: "E.g. Chat with my product manual",
    color: "emerald", 
    locked: false 
  },
  { 
    id: "search", 
    label: "Search", 
    emoji: "🔍", 
    description: "Let users search structured data and get matching results back as cards.", 
    example: "E.g. Find products under $50",
    color: "blue", 
    locked: false 
  },
  { 
    id: "generate", 
    label: "Generate", 
    emoji: "🧠", 
    description: "A direct AI completion block. No knowledge base — just system instructions and conversation.", 
    example: "E.g. Write a social post",
    color: "violet", 
    locked: false 
  },
  { 
    id: "classifier", 
    label: "Classifier", 
    emoji: "🏷️", 
    description: "Automatically sort and route your users' submissions into the right categories without manual review.", 
    example: "E.g. Tag support tickets",
    color: "amber", 
    locked: true 
  },
  { 
    id: "recommendation", 
    label: "Recommendation", 
    emoji: "✨", 
    description: "Proactively surface the most relevant content to your users before they even know to ask.", 
    example: "E.g. Upsell matching items",
    color: "purple", 
    locked: true 
  },
  { 
    id: "extractor", 
    label: "Data Extractor", 
    emoji: "📊", 
    description: "Let your users drop in raw documents and instantly receive structured, usable data back.", 
    example: "E.g. Pull info from invoices",
    color: "amber", 
    locked: true 
  },
  { 
    id: "diagnosis", 
    label: "Diagnosis", 
    emoji: "🩺", 
    description: "Guided conversation engine that arrive at the core of a user's intent through clinical discovery.", 
    example: "E.g. Medical intake or Onboarding",
    color: "rose", 
    locked: true 
  },
];

interface BlockPickerModalProps {
  onAdd: (blockTypeId: string) => void;
  onClose: () => void;
}

export function BlockPickerModal({ onAdd, onClose }: BlockPickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Add an Engine</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Drop a headless logic block onto the canvas.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-sm transition-colors hover:bg-zinc-200">✕</button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 grid grid-cols-1 gap-3 overflow-y-auto custom-scrollbar">
          {BLOCK_TYPES.map((block) => (
            <div
              key={block.id}
              onClick={() => !block.locked && onAdd(block.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${block.locked ? "border-zinc-100 bg-zinc-50/50 opacity-60 cursor-not-allowed" : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer group"}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border bg-white shadow-sm transition-transform group-hover:scale-105">{block.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-zinc-900 underline-offset-2 group-hover:underline">{block.label}</span>
                  {block.locked && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">🔒 Coming Soon</span>}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-2">{block.description}</p>
                {block.example && (
                  <div className="text-[10px] font-medium text-blue-600/70 bg-blue-50/50 px-2 py-1 rounded inline-flex items-center gap-1 border border-blue-100/30">
                    <span className="opacity-50 italic">{block.example}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info (optional, helps clarify scrollability) */}
        <div className="px-6 py-3 border-t border-zinc-50 bg-zinc-50/50 block sm:hidden">
          <p className="text-[10px] text-zinc-400 text-center font-medium uppercase tracking-widest">Swipe or Scroll for more blocks</p>
        </div>
      </div>
    </div>
  );
}

export { BLOCK_TYPES };
