"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { logout } from "../../lib/auth";

interface NotebookSidebarProps {
  user: User;
  onConfigOpen: () => void;
  notebookTitle: string;
  isSaving: boolean;
  lastSaved: Date | null;
  onTitleChange: (value: string) => void;
  onSave: () => void;
}

export function NotebookSidebar({ user, onConfigOpen, notebookTitle, isSaving, lastSaved, onTitleChange, onSave }: NotebookSidebarProps) {
  return (
    <div className="w-72 border-r border-zinc-200/80 bg-white/70 backdrop-blur-xl flex-col pt-6 hidden sm:flex shadow-[4px_0_24px_rgba(0,0,0,0.04)] z-20 h-screen overflow-y-auto sticky top-0 shrink-0">
        {/* Logo */}
        <div className="px-6 mb-6 flex items-center gap-2 font-bold text-lg text-zinc-900">
          <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          Poysis
        </div>

        {/* Title + Save */}
        <div className="px-4 mb-4 flex flex-col gap-2">
          <input
            value={notebookTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onSave}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            placeholder="Notebook Title"
            className="bg-transparent border-none outline-none text-sm font-bold text-zinc-900 placeholder:text-zinc-300 w-full focus:ring-4 focus:ring-black/5 rounded-lg px-3 py-2 transition-all hover:bg-zinc-50 focus:bg-zinc-50"
          />
          <div className="flex items-center gap-2 px-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSaving ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></div>
              {isSaving ? "Syncing..." : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Cloud Draft"}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-2 py-1 text-[10px] font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-md transition-all flex items-center gap-1 disabled:opacity-50"
              >
                {isSaving ? <div className="w-2.5 h-2.5 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full"></div> : "☁️"} Save
              </button>
            </div>
          </div>
        </div>

        <div className="mx-4 border-t border-zinc-100 mb-3"></div>

        {/* Nav */}
        <div className="px-4 flex flex-col gap-1">
          <Link href="/workspace" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors font-medium group">
            <span className="text-base leading-none group-hover:-translate-x-1 transition-transform">←</span> Back to Workspace
          </Link>
          <button
            onClick={onConfigOpen}
            className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-500 hover:text-black hover:bg-zinc-50 rounded-lg transition-colors font-medium group"
          >
            <span className="text-base leading-none group-hover:rotate-12 transition-transform">⚙️</span> Project Config
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 shadow-inner mt-auto">
          <div className="flex items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-[11px] font-bold text-zinc-900 truncate">{user.email}</div>
                <div className="text-[9px] font-medium text-zinc-400 capitalize">{user.role || "User"}</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200 group shadow-sm hover:shadow active:scale-95"
              title="Logout"
            >
              <span className="text-xs group-hover:scale-110 transition-transform inline-block">🚪</span>
            </button>
          </div>
        </div>
    </div>
  );
}
