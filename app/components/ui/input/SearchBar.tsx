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
    executeBlock(blockId);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full shrink-0">
      <div className="flex-1 relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {isStreaming ? (
            <div
              className="w-4 h-4 border-2 border-t-transparent animate-spin rounded-full"
              style={{ borderColor: 'var(--primary-color) transparent transparent transparent' }}
            />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          )}
        </div>
        <input
          type="text"
          className="w-full pl-10 pr-4 py-3 text-sm outline-none transition-all placeholder:text-zinc-400 bg-white"
          style={{
            borderRadius: 'var(--radius)',
            border: 'var(--border-width) solid rgba(0,0,0,0.1)',
            boxShadow: 'var(--shadow)',
          }}
          placeholder="Search documents..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          disabled={isStreaming}
        />
      </div>
      <button
        type="submit"
        disabled={!localValue.trim() || isStreaming}
        className="shrink-0 px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'var(--primary-color)',
          borderRadius: 'var(--radius)',
        }}
      >
        Search
      </button>
    </form>
  );
}
