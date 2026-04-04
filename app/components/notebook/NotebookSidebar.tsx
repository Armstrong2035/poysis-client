"use client";

import { useRef } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { logout } from "../../lib/auth";

interface NotebookSidebarProps {
  user: User;
  workspaceDocuments: any[];
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfigOpen: () => void;
}

export function NotebookSidebar({ user, workspaceDocuments, isUploading, onUpload, onConfigOpen }: NotebookSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-72 border-r border-zinc-200/80 bg-white/70 backdrop-blur-xl flex-col pt-6 hidden sm:flex shadow-[4px_0_24px_rgba(0,0,0,0.04)] z-20 h-screen overflow-y-auto relative">
      {/* Logo */}
      <div className="px-6 mb-8 flex items-center gap-2 font-bold text-lg text-zinc-900">
        <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-sm"></div>
        </div>
        Poysis
      </div>

      {/* Nav */}
      <div className="px-4 flex flex-col gap-1 mb-10">
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

      {/* Workspace Memory */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-zinc-300">🗄️</span> Workspace Memory
        </div>

        <div className="px-4 space-y-1">
          {workspaceDocuments.length === 0 ? (
            <div className="px-6 py-4 text-[10px] font-medium text-zinc-400 italic bg-zinc-50/50 rounded-xl mx-4 border border-zinc-100/50">
              No data indexed yet. <br />Upload below to begin.
            </div>
          ) : (
            workspaceDocuments.map((doc) => (
              <div key={doc.id} className="px-3 py-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer group flex items-start gap-3">
                <span className="text-blue-500 text-lg leading-none mt-0.5">
                  {doc.file_type === "pdf" ? "📄" : doc.file_type === "spreadsheet" ? "📊" : "🌐"}
                </span>
                <div className="overflow-hidden">
                  <div className="text-sm font-semibold text-zinc-700 truncate group-hover:text-black transition-colors">{doc.name}</div>
                  <div className="text-[10px] font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${doc.status === "indexed" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}></div>
                    {doc.status === "indexed" ? "Indexed globally" : doc.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upload */}
        <div className="px-6 mt-8">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onUpload}
            className="hidden"
            accept="application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2.5 border border-dashed border-zinc-300 hover:border-black text-zinc-500 hover:text-black bg-zinc-50 hover:bg-white rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span className="text-lg leading-none mt-[-2px]">+</span>
                <span>Upload to Library</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Vector Capacity */}
      <div className="p-6 mt-auto border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vector Storage Limit</span>
          <span className="text-[10px] font-bold text-zinc-900">45%</span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full" style={{ width: "45%" }}></div>
        </div>
        <div className="mt-2 text-[9px] text-zinc-400 font-medium">Poysis Pro Tier • 4.5M / 10M Vectors</div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50 shadow-inner">
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
