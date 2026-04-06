"use client";

import { useNotebookStore } from "../../../store/notebookStore";

interface SourceAccordionProps {
  blockId: string;
  outputKey: string;
  layout?: "list" | "grid";
  theme?: "card" | "box";
  hiddenWhenEmpty?: boolean;
}

export function SourceAccordion({ blockId, outputKey, layout = "list", theme = "card", hiddenWhenEmpty = false }: SourceAccordionProps) {
  const block = useNotebookStore((state) => state.blocks[blockId]);

  const sources = block ? (block.outputs[outputKey as keyof typeof block.outputs] as Array<{ file: string; score: number; snippet?: string }>) : undefined;
  const hasSources = sources && sources.length > 0;

  if (hiddenWhenEmpty && !hasSources) return null;

  const activeSources = hasSources
    ? sources
    : [
        { file: "employee_handbook_2025.pdf", score: 0.94, snippet: "The company policy dictates all deployments must pass through..." },
        { file: "q1_revenue_metrics.csv", score: 0.86, snippet: "Row 42: Q1 Revenue hit a record high of 2.1M driven by growth." },
        { file: "architecture_v2.md", score: 0.72, snippet: "The updated microservices architecture utilizes isolated containers." },
      ];

  return (
    <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-3 ml-1 flex items-center gap-2">
        <span>Cited Sources</span>
        <span className="bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded text-[10px]">{activeSources.length}</span>
      </div>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
        {activeSources.map((source, index) => (
          <div key={index} className={`flex flex-col p-4 bg-white ${theme === "card" ? "border border-zinc-200 rounded-xl shadow-sm hover:shadow transition-shadow" : "border-2 border-zinc-800 rounded-sm shadow-[2px_2px_0_#27272a] transition-all hover:translate-x-[-1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0_#27272a]"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <span className="text-zinc-400 text-sm">📄</span>
                 <span className="text-sm font-semibold text-blue-600 cursor-pointer hover:underline">
                   {source.file}
                 </span>
              </div>
              <span className="text-xs font-mono bg-zinc-100 border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded shadow-inner">
                {Math.round(source.score * 100)}% Match
              </span>
            </div>
            {source.snippet && (
              <p className="text-sm text-zinc-600 italic border-l-2 border-zinc-200 pl-3 mt-1 leading-relaxed">
                "{source.snippet}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
