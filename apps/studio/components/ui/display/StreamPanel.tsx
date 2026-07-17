"use client";

import { useNotebookStore } from "../../../store/notebookStore";

interface StreamPanelProps {
  blockId: string;
  outputKey: string;
}

export function StreamPanel({ blockId, outputKey }: StreamPanelProps) {
  // We elegantly subscribe ONLY to the node we care about in the store
  const block = useNotebookStore((state) => state.blocks[blockId]);

  const isStreaming = block?.status === "streaming";
  const content = block ? (block.outputs[outputKey as keyof typeof block.outputs] as string) : undefined;

  const activeContent = content;

  return (
    <div className="w-full p-6 md:p-8 rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-100">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
          ✨
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Synthesized Response</h3>
          <p className="text-xs text-zinc-500">Retrieval Logic Block</p>
        </div>
        
        {isStreaming && (
          <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Generating stream
          </span>
        )}
      </div>
      
      <div className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">
        {block?.status === 'error' ? (
          <span className="text-red-500 italic">Something went wrong. Check that the worker is running and the notebook has ingested documents.</span>
        ) : activeContent ? (
          activeContent
        ) : (
          <span className="text-zinc-400 italic">Waiting for a question...</span>
        )}

        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-1 bg-zinc-400 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
