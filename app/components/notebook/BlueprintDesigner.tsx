"use client";

import React from "react";
import { useNotebookStore } from "../../store/notebookStore";
import { LayoutRenderer } from "../ui/display/LayoutRenderer";
import { LayoutComponent, UIConfig } from "../../types/canvas";

interface BlueprintDesignerProps {
  blockId: string;
  mode?: "sidebar" | "panel";
}

export function BlueprintDesigner({ blockId, mode = "sidebar" }: BlueprintDesignerProps) {
  const { blocks, activeBlocks, setBlockUIConfig } = useNotebookStore();
  
  const blockDef = activeBlocks.find(b => b.id === blockId);
  const blockRuntime = blocks[blockId];
  
  if (!blockDef) return null;

  const currentLayout = blockDef.uiConfig?.layout || [];

  // ── Helpers ──────────────────────────────────────────────────────

  const updateConfig = (newLayout: LayoutComponent[]) => {
    setBlockUIConfig(blockId, { ...blockDef.uiConfig, layout: newLayout } as UIConfig);
  };

  const addComponent = (type: LayoutComponent["type"]) => {
    const newComp: LayoutComponent = {
      id: `${type}_${Date.now()}`,
      type,
      content: 
        type === "image" ? "{{item.image_url}}" :
        type === "title" ? "{{item.name}}" :
        type === "price" ? "{{item.price}}" :
        type === "button" ? "Add to Cart" :
        "Details here...",
      action: type === 'button' ? 'route' : undefined
    };
    updateConfig([...currentLayout, newComp]);
  };

  const removeComponent = (id: string) => {
    updateConfig(currentLayout.filter(c => c.id !== id));
  };

  const moveComponent = (index: number, direction: -1 | 1) => {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= currentLayout.length) return;
    const nextLayout = [...currentLayout];
    [nextLayout[index], nextLayout[nextIdx]] = [nextLayout[nextIdx], nextLayout[index]];
    updateConfig(nextLayout);
  };

  const updateComponentContent = (id: string, content: string, action?: any) => {
    const next = currentLayout.map(c => c.id === id ? { ...c, content, action: action || c.action } : c);
    updateConfig(next);
  };

  // ── Data Sniffer (Peeking at first result) ─────────────────────────
  
  const getSampleItem = () => {
    if (!blockRuntime || !blockRuntime.outputs) return null;
    
    // For Search blocks, pick the first source
    if (blockDef.blockTypeId === 'search' && Array.isArray(blockRuntime.outputs.sources) && blockRuntime.outputs.sources.length > 0) {
      return blockRuntime.outputs.sources[0];
    }
    
    // For Chat/Generate blocks, try to parse the last assistant message
    if ((blockDef.blockTypeId === 'chat' || blockDef.blockTypeId === 'generate') && Array.isArray(blockRuntime.outputs.history) && blockRuntime.outputs.history.length > 0) {
       const assistantMsgs = blockRuntime.outputs.history.filter((m: any) => m.role === 'assistant');
       if (assistantMsgs.length > 0) {
          const last = assistantMsgs[assistantMsgs.length - 1];
          try {
            return JSON.parse(last.content);
          } catch (e) {
            return { content: last.content };
          }
       }
    }
    return null;
  };

  const sampleItem = getSampleItem();
  const detectedKeys = sampleItem ? Object.keys(sampleItem) : [];

  // ── 1. SIDEBAR MODE (VISUAL STUDIO) ─────────────────────────────
  if (mode === "sidebar") {
    return (
      <div className="flex flex-col h-full bg-[#FAFAFA] animate-in fade-in duration-500">
        
        {/* The Golden Sample (Preview) */}
        <section className="shrink-0 p-6 bg-white border-b border-zinc-200 shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Blueprint Preview</h3>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${sampleItem ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-[9px] font-bold text-zinc-500 uppercase">
                  {sampleItem ? 'Real Data' : 'Skeleton Mode'}
                </span>
             </div>
          </div>

          <div className="max-w-[280px] mx-auto">
            {currentLayout.length > 0 ? (
              <div className="scale-[0.85] origin-top transition-transform">
                 <LayoutRenderer 
                   layout={currentLayout} 
                   data={sampleItem || { 
                     name: "Sample Product", 
                     price: "$99.00", 
                     image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
                     description: "A beautiful placeholder description for your preview."
                   }} 
                 />
              </div>
            ) : (
              <div className="aspect-[3/4] rounded-3xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50">
                 <span className="text-3xl mb-4 opacity-20">🎨</span>
                 <p className="text-[11px] text-zinc-400 leading-relaxed">Your card is empty. Add a design layer below to begin.</p>
              </div>
            )}
          </div>
        </section>

        {/* Reordering Stack */}
        <section className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Visual Hierarchy</h2>
            <span className="text-[10px] font-bold text-zinc-300">Reorder Layers</span>
          </div>

          <div className="space-y-2">
            {currentLayout.map((comp, idx) => (
              <div key={comp.id} className="group bg-white border border-zinc-200 hover:border-blue-400 rounded-xl px-4 py-3 transition-all shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-zinc-300">#{(idx + 1).toString().padStart(2, '0')}</span>
                  <span className="px-2 py-0.5 bg-zinc-50 rounded text-[9px] font-black text-zinc-500 border border-zinc-100 uppercase">{comp.type}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => moveComponent(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-400 disabled:opacity-20"
                  >▲</button>
                  <button 
                    onClick={() => moveComponent(idx, 1)}
                    disabled={idx === currentLayout.length - 1}
                    className="p-1 hover:bg-zinc-100 rounded text-zinc-400 disabled:opacity-20"
                  >▼</button>
                  <button onClick={() => removeComponent(comp.id)} className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 ml-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Global Toolbox (Bottom Fixed) */}
        <section className="p-4 bg-white border-t border-zinc-200">
           <div className="grid grid-cols-4 gap-2">
           {[
             { type: 'image', label: 'Image', icon: '🖼️' },
             { type: 'title', label: 'Title', icon: 'H2' },
             { type: 'paragraph', label: 'Text', icon: '¶' },
             { type: 'price', label: 'Price', icon: '＄' },
           ].map((btn) => (
             <button
               key={btn.type}
               onClick={() => addComponent(btn.type as any)}
               className="flex flex-col items-center justify-center gap-1 p-2 border border-zinc-100 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
             >
               <span className="text-base">{btn.icon}</span>
               <span className="text-[7px] font-black font-zinc-400 uppercase">{btn.label}</span>
             </button>
           ))}
           </div>
        </section>
      </div>
    );
  }

  // ── 2. PANEL MODE (MAPPER STUDIO) ─────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Design Philosophy Tooltip/Alert */}
      <section className="bg-amber-50 border border-amber-100 rounded-[32px] p-8 flex gap-5 items-start">
         <div className="w-12 h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-center text-2xl shadow-sm shrink-0">
            💡
         </div>
         <div className="space-y-1">
            <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Design Philosophy</h4>
            <p className="text-xs text-amber-800/70 leading-relaxed font-medium">
               Raw data from your knowledge base can be overwhelming. We recommend picking only the most 
               useful parts that your user <span className="font-bold text-amber-900">absolutely needs to see</span>. 
               Less is almost always more in a high-fidelity card.
            </p>
         </div>
      </section>

      {/* Toolbox Integration */}
      <section>
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
           <span>🪄</span> Format the AI output
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
           {[
             { type: 'image', label: 'Image', icon: '🖼️' },
             { type: 'title', label: 'Title', icon: 'H2' },
             { type: 'paragraph', label: 'Text', icon: '¶' },
             { type: 'price', label: 'Price', icon: '＄' },
             { type: 'chip', label: 'Chip', icon: '🏷️' },
             { type: 'button', label: 'Button', icon: '🔘' },
             { type: 'divider', label: 'Separator', icon: '—' },
             { type: 'link', label: 'Link', icon: '🔗' },
           ].map((btn) => (
             <button
               key={btn.type}
               onClick={() => addComponent(btn.type as any)}
               className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-zinc-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm active:scale-95 group"
             >
               <span className="text-xl group-hover:scale-110 transition-transform">{btn.icon}</span>
               <span className="text-[8px] font-black text-zinc-400 group-hover:text-blue-600 uppercase tracking-tighter">{btn.label}</span>
             </button>
           ))}
        </div>
      </section>

      {/* Mapping Stack */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">Content Mapping</h3>
        {currentLayout.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/30">
             <div className="text-4xl mb-4 opacity-10">🪄</div>
             <p className="text-sm font-bold text-zinc-400">Select an element above to start your card</p>
          </div>
        ) : (
        <div className="space-y-0 border border-zinc-100 rounded-[32px] overflow-hidden bg-white shadow-sm">
            {currentLayout.map((comp, idx) => (
              <div key={comp.id} className={`p-6 transition-all border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 group`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-zinc-300 font-mono tracking-tighter">
                      LAYER {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-900 rounded text-[8px] font-black text-white uppercase tracking-wider">
                      {comp.type}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeComponent(comp.id)} 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >✕</button>
                </div>

                <div className="grid md:grid-cols-12 gap-4 items-end">
                   <div className="md:col-span-8">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1.5 block ml-1">Field Mapping</label>
                      <div className="relative group/input">
                        <input
                          type="text"
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm text-zinc-700 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-mono shadow-sm"
                          value={comp.content}
                          onChange={(e) => updateComponentContent(comp.id, e.target.value)}
                          placeholder="e.g. {{item.field}}"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-300 pointer-events-none font-mono">{"{{"}</div>
                      </div>
                   </div>

                   {comp.type === 'button' ? (
                     <div className="md:col-span-4">
                       <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1.5 block ml-1">Action</label>
                       <select
                         className="w-full bg-white border border-zinc-100 rounded-xl px-2 py-2.5 text-[10px] font-bold text-zinc-600 outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                         value={comp.action || 'route'}
                         onChange={(e) => updateComponentContent(comp.id, comp.content, e.target.value as any)}
                       >
                         <option value="route">Next Screen</option>
                         <option value="link">Open URL</option>
                       </select>
                     </div>
                   ) : (
                     <div className="md:col-span-4 flex items-center justify-end pb-3 text-[9px] font-bold text-zinc-300 italic">
                        Visual only
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Mapping Assistant (The Golden Sample Inspector) */}
      {sampleItem && (
        <section className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8">
           <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">🔍</span> 
                 Mapping Assistant
              </h4>
              <div className="px-3 py-1 bg-blue-100 rounded-full text-[9px] font-bold text-blue-700 uppercase tracking-tighter">
                 Results Source: {blockDef.name}
              </div>
           </div>

           <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
                 <p className="text-[11px] text-blue-700 font-medium leading-relaxed italic">
                    🪄 Each search result returns these fields. Pick only the most relevant keys for your card design 
                    to avoid overwhelming the end user.
                 </p>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-blue-50">
                          <th className="px-6 py-3 text-[9px] font-black text-blue-400 uppercase tracking-widest">Key (Click to Copy)</th>
                          <th className="px-6 py-3 text-[9px] font-black text-blue-400 uppercase tracking-widest">Sample Value</th>
                       </tr>
                    </thead>
                    <tbody>
                       {Object.entries(sampleItem).map(([key, val]) => (
                          <tr key={key} className="border-b border-blue-50 last:border-0 group hover:bg-blue-50/30">
                             <td className="px-6 py-4">
                                <button
                                   onClick={() => navigator.clipboard.writeText(`{{item.${key}}}`)}
                                   className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 group-hover:border-blue-400 transition-all active:scale-95"
                                   title="Click to copy tag"
                                >
                                   {`{{item.${key}}}`}
                                </button>
                             </td>
                             <td className="px-6 py-4">
                                <div className="text-[11px] text-zinc-500 font-medium line-clamp-2 max-w-[280px]" title={typeof val === 'string' ? val : JSON.stringify(val)}>
                                   {typeof val === 'object' ? 'Complex Object (JSON)' : String(val)}
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
           
           <p className="text-[10px] text-blue-400 mt-6 leading-relaxed flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-300" />
              Click any key above to copy its <b>{"{{tag}}"}</b> instantly. Found from the latest execution!
           </p>
        </section>
      )}
    </div>
  );
}
