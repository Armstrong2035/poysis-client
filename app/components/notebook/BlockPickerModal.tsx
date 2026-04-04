"use client";

const BLOCK_TYPES = [
  { id: "prompt_wrapper", label: "AI Wrapper", emoji: "🧠", description: "A pure AI completion block. No knowledge base required, just set the instructions.", color: "violet", locked: false },
  { id: "retrieval", label: "Retrieval", emoji: "📄", description: "Give your users a way to ask questions and get instant answers from your knowledge base.", color: "blue", locked: false },
  { id: "classifier", label: "Classifier", emoji: "🏷️", description: "Automatically sort and route your users' submissions into the right categories without manual review.", color: "emerald", locked: true },
  { id: "recommendation", label: "Recommendation", emoji: "✨", description: "Proactively surface the most relevant content to your users before they even know to ask.", color: "purple", locked: true },
  { id: "extractor", label: "Data Extractor", emoji: "📊", description: "Let your users drop in raw documents and instantly receive structured, usable data back.", color: "amber", locked: true },
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
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border border-zinc-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Add an Engine</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Drop a headless logic block onto the canvas.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center text-sm">✕</button>
        </div>
        <div className="p-4 grid grid-cols-1 gap-3">
          {BLOCK_TYPES.map((block) => (
            <div
              key={block.id}
              onClick={() => !block.locked && onAdd(block.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${block.locked ? "border-zinc-100 bg-zinc-50/50 opacity-60 cursor-not-allowed" : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer"}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border bg-white shadow-sm">{block.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-zinc-900">{block.label}</span>
                  {block.locked && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">🔒 Coming Soon</span>}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{block.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { BLOCK_TYPES };
