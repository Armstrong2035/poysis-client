"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  action: () => Promise<void>;
}

export function DeleteNotebookButton({ action }: Props) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        if (!confirm("Delete this notebook? This cannot be undone.")) return;
        setIsPending(true);
        try {
          await action();
          router.refresh();
        } catch (err: any) {
          console.error("[DeleteNotebook] Failed:", err);
          alert(`Delete failed: ${err?.message ?? "Unknown error"}`);
        } finally {
          setIsPending(false);
        }
      }}
      className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 text-xs disabled:opacity-50"
      title="Delete notebook"
    >
      {isPending ? <div className="w-3 h-3 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" /> : "🗑️"}
    </button>
  );
}
