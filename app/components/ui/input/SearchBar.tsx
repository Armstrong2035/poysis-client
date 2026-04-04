"use client";

import { useState } from "react";
import { useNotebookStore } from "../../../store/notebookStore";

interface SearchBarProps {
  blockId: string;
  inputKey: string;
}

export function SearchBar({ blockId, inputKey }: SearchBarProps) {
  const [localValue, setLocalValue] = useState("");
  const { setInputValue, executeBlock, blocks } = useNotebookStore();
  
  const block = blocks[blockId];
  const isStreaming = block?.status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localValue.trim() || isStreaming) return;
    
    setInputValue(blockId, inputKey, localValue);
    // Unlike chat, we usually leave the search term in the box so the user knows what they searched!
    executeBlock(blockId);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-2xl relative shadow-sm rounded-xl">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
         🔍
      </div>
      <input
        type="text"
        className="w-full rounded-xl border border-zinc-200 pl-11 pr-4 py-3.5 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400"
        placeholder="Search for concepts, facts, or data..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        disabled={isStreaming}
      />
    </form>
  );
}
