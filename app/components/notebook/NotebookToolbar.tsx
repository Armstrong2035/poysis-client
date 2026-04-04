"use client";

import Link from "next/link";

interface NotebookToolbarProps {
  notebookTitle: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onTitleChange: (value: string) => void;
  onSave: () => void;
}

export function NotebookToolbar({ notebookTitle, isSaving, lastSaved, onTitleChange, onSave }: NotebookToolbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-md border-b border-zinc-200/50 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Save Status Badge */}
        <div className="flex items-center gap-2 px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200">
          <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></div>
          {isSaving
            ? "Syncing..."
            : lastSaved
            ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Cloud Draft"}
        </div>

        <div className="h-4 w-px bg-zinc-200 mx-2"></div>

        {/* Editable Title */}
        <input
          value={notebookTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          placeholder="Notebook Title"
          className="bg-transparent border-none outline-none text-sm font-bold text-zinc-900 placeholder:text-zinc-300 w-64 focus:ring-4 focus:ring-black/5 rounded-lg transition-all"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1.5 text-xs font-bold text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-lg transition-all flex items-center gap-2 border border-zinc-200 bg-white shadow-sm disabled:opacity-50"
        >
          {isSaving ? <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full"></div> : "☁️"} Save to Cloud
        </button>
        <div className="h-4 w-px bg-zinc-300 mx-1"></div>
        <button className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-all">
          History
        </button>
        <Link
          href="/preview"
          target="_blank"
          className="flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-px active:translate-y-0 transition-all group"
        >
          <span className="group-hover:rotate-12 transition-transform">🚀</span> Launch Preview
        </Link>
      </div>
    </header>
  );
}
