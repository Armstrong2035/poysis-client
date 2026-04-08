"use client";

import { useNotebookStore } from "../../../store/notebookStore";
import { LayoutRenderer } from "./LayoutRenderer";

interface SourceAccordionProps {
  blockId: string;
  outputKey: string;
  layout?: "list" | "grid";
  theme?: "card" | "box";
  hiddenWhenEmpty?: boolean;
}

export function SourceAccordion({ blockId, outputKey, layout = "list", theme = "card", hiddenWhenEmpty = false }: SourceAccordionProps) {
  const block = useNotebookStore((state) => state.blocks[blockId]);
  const activeBlock = useNotebookStore((state) => state.activeBlocks.find(b => b.id === blockId));
  const { setActivePreviewBlock, selectedBlockId } = useNotebookStore();

  const handleAction = (action: string, metadata: any) => {
    if (action === 'route' && activeBlock?.chainingTarget) {
      setActivePreviewBlock(activeBlock.chainingTarget.blockId);
    } else if (action === 'link' && typeof metadata === 'string') {
      window.open(metadata, '_blank');
    }
  };

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

  // If a formatter is defined, use the LayoutRenderer
  if (block?.uiConfig?.layout && block.uiConfig.layout.length > 0) {
    return (
      <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-2">
        <LayoutRenderer 
          layout={block.uiConfig.layout} 
          data={activeSources} 
          onAction={handleAction} 
          limit={selectedBlockId === blockId ? 1 : undefined}
        />
      </div>
    );
  }

  return (
    <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-3 ml-1 flex items-center gap-2">
        <span>Cited Sources</span>
        <span className="bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded text-[10px]">{activeSources.length}</span>
      </div>
      <div className={layout === "grid" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-3"}>
        {activeSources.map((source, index) => (
          <div 
            key={index} 
            className="flex flex-col p-4 bg-white transition-all duration-300"
            style={{ 
              borderRadius: 'var(--radius)', 
              border: 'var(--border-width) solid rgba(13, 14, 18, 0.08)',
              boxShadow: 'var(--shadow)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <span className="text-zinc-400 text-sm">📄</span>
                 <span 
                    className="text-sm font-bold cursor-pointer hover:underline transition-colors"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {source.file}
                 </span>
              </div>
              <span className="text-[10px] font-mono bg-zinc-50 border border-zinc-100 text-zinc-500 px-2 py-0.5 rounded">
                {(source.score * 100).toFixed(0)}% Match
              </span>
            </div>
            {source.snippet && (
              <p className="text-[11px] text-zinc-500 italic border-l-2 border-zinc-100 pl-3 mt-1 leading-relaxed">
                "{source.snippet}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
