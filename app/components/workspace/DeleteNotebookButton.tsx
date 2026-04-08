"use client";

import { useTransition } from "react";

interface Props {
  action: () => Promise<void>;
}

export function DeleteNotebookButton({ action }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("Delete this notebook? This cannot be undone.")) {
          startTransition(() => action());
        }
      }}
      className="w-7 h-7 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 text-xs disabled:opacity-50"
      title="Delete notebook"
    >
      🗑️
    </button>
  );
}
