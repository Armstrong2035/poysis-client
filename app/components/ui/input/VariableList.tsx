"use client";

import { useNotebookStore } from "../../../store/notebookStore";
import { ActiveBlock } from "../../../types/canvas";

interface VariableListProps {
  currentBlockId: string;
  onSelect: (variable: string) => void;
}

export function VariableList({ currentBlockId, onSelect }: VariableListProps) {
  const { activeBlocks } = useNotebookStore();
  
  const currentIndex = activeBlocks.findIndex((b: ActiveBlock) => b.id === currentBlockId);
  const upstreamBlocks = activeBlocks.slice(0, currentIndex);

  if (upstreamBlocks.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-zinc-400 font-medium italic">No upstream blocks found yet.</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      <div className="px-2 pb-2 mb-1 border-b border-zinc-100 italic text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
        Available Variables
      </div>
      {upstreamBlocks.map((block: ActiveBlock) => (
        <div key={block.id} className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 bg-zinc-50 rounded uppercase tracking-tighter">
            {block.name} ({`{{${block.slug}}}`})
          </div>
          <div className="pl-2 space-y-0.5">
            <button
              onClick={() => onSelect(`{{ ${block.slug}.stream }}`)}
              className="w-full text-left px-2 py-1.5 text-xs text-zinc-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex justify-between group"
            >
              <span>Stream Output</span>
              <span className="opacity-0 group-hover:opacity-60 text-[9px] font-mono">.stream</span>
            </button>
            <button
              onClick={() => onSelect(`{{ ${block.slug}.sources }}`)}
              className="w-full text-left px-2 py-1.5 text-xs text-zinc-600 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors flex justify-between group"
            >
              <span>Source List</span>
              <span className="opacity-0 group-hover:opacity-60 text-[9px] font-mono">.sources</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
