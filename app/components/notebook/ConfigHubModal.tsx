"use client";

interface ConfigHubModalProps {
  activeBlocks: any[];
  blocks: Record<string, any>;
  uiComponents: Record<string, any>;
  onReset: () => void;
  onClose: () => void;
}

export function ConfigHubModal({ activeBlocks, blocks, uiComponents, onReset, onClose }: ConfigHubModalProps) {
  const handleDownload = () => {
    const data = JSON.stringify({ activeBlocks, blocks, uiComponents }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poysis-config-${Date.now()}.json`;
    a.click();
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will permanently delete your local config.")) {
      onReset();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-white sticky top-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Project Configuration</h2>
            <p className="text-sm text-zinc-500 mt-1">Technical specification of your headless logic flow.</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-black transition-colors text-2xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/50">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Raw Config JSON</span>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 shadow-sm transition-all">
                Download JSON
              </button>
              <button onClick={handleReset} className="px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-100 shadow-sm transition-all">
                Reset Notebook
              </button>
            </div>
          </div>
          <pre className="p-6 bg-zinc-900 text-emerald-400 rounded-2xl text-[11px] font-mono leading-relaxed overflow-x-auto shadow-inner">
            {JSON.stringify({ activeBlocks, blocks, uiComponents }, null, 2)}
          </pre>
        </div>

        <div className="p-8 bg-white border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-500 italic leading-relaxed">
            This file is all that Poysis needs to reconstruct your experience.
            <br />In V2, this will be automatically hosted on Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
