"use client";

import { useState } from "react";
import { useNotebookStore } from "../../../store/notebookStore";

interface ChatInputProps {
  blockId: string;
  inputKey: string;
}

export function ChatInput({ blockId, inputKey }: ChatInputProps) {
  const [localValue, setLocalValue] = useState("");
  const { setInputValue, executeBlock, blocks } = useNotebookStore();
  
  // Connect cleanly to our Headless DAG
  const block = blocks[blockId];
  const isStreaming = block?.status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localValue.trim() || isStreaming) return;
    
    // 1. Sync React's local state to the central Zustand graph
    setInputValue(blockId, inputKey, localValue);
    
    // 2. Clear local UI state (the graph now owns the data)
    setLocalValue("");
    
    // 3. Fire the trigger event for the DAG Orchestrator
    executeBlock(blockId);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400 shadow-sm"
        placeholder="Ask the Knowledge Base a question..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        disabled={isStreaming}
      />
      <button
        type="submit"
        disabled={!localValue.trim() || isStreaming}
        className="rounded-xl flex items-center justify-center min-w-[100px] bg-black px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isStreaming ? (
          <span className="flex gap-1.5 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
          </span>
        ) : (
          "Ask AI"
        )}
      </button>
    </form>
  );
}
