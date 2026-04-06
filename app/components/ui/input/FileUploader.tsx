"use client";

import { useRef, useState } from "react";
import { useNotebookStore } from "../../../store/notebookStore";

interface FileUploaderProps {
  blockId: string;
  inputKey: string;
  acceptedFormats?: string[];
}

type UploadedDoc = {
  fileName: string;
  fileType: string;
  sizeBytes: number;
  vectorsIndexed: number;
};

type UploadState = "idle" | "uploading" | "error";

export function FileUploader({ blockId, inputKey, acceptedFormats = ["pdf", "spreadsheet"] }: FileUploaderProps) {
  const { setInputValue, blocks, notebookId } = useNotebookStore();
  const block = blocks[blockId];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const existingDocs: UploadedDoc[] = (block?.currentInputs[inputKey as keyof typeof block.currentInputs] as UploadedDoc[]) || [];

  const acceptAttr = (() => {
    const types: string[] = [];
    if (acceptedFormats.includes("pdf")) types.push(".pdf");
    if (acceptedFormats.includes("spreadsheet")) types.push(".xlsx,.xls,.csv");
    return types.join(",") || ".pdf,.xlsx,.xls,.csv,.txt,.docx";
  })();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File exceeds 50MB limit.");
      return;
    }

    if (!notebookId) {
      setErrorMsg("Notebook not saved yet — save the notebook first.");
      return;
    }

    setUploadState("uploading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("notebook_id", notebookId);
      formData.append("file", file);

      const res = await fetch("/api/worker/ingest-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Ingestion failed");
      }

      const data = await res.json();

      const newDoc: UploadedDoc = {
        fileName: file.name,
        fileType: file.type,
        sizeBytes: file.size,
        vectorsIndexed: data.vectors_indexed ?? 0,
      };

      setInputValue(blockId, inputKey, [...existingDocs, newDoc]);
      setUploadState("idle");
    } catch (err: any) {
      console.error("[FileUploader] Ingestion error:", err);
      setErrorMsg(err.message ?? "Upload failed.");
      setUploadState("error");
    }

    // Reset input so the same file can be re-uploaded if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatText = () => {
    const hasPdf = acceptedFormats.includes("pdf");
    const hasSpreadsheet = acceptedFormats.includes("spreadsheet");
    if (hasPdf && hasSpreadsheet) return "PDF, Excel, or CSV";
    if (hasPdf) return "PDF Documents";
    if (hasSpreadsheet) return "Excel or CSV Data";
    return "Supported files";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploadState === "uploading"}
      />

      <div
        onClick={() => uploadState !== "uploading" && fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center group shadow-sm transition-colors cursor-pointer
          ${uploadState === "uploading"
            ? "border-blue-300 bg-blue-50/50 cursor-wait"
            : uploadState === "error"
            ? "border-red-300 bg-red-50/50 hover:border-red-400"
            : "border-zinc-300 hover:border-blue-400 bg-white hover:bg-blue-50/50"
          }`}
      >
        <div className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md mb-4 border border-zinc-100 text-2xl transition-transform
          ${uploadState === "uploading" ? "animate-pulse" : "group-hover:scale-110"}`}>
          {uploadState === "uploading" ? "⏳" : acceptedFormats.includes("spreadsheet") && !acceptedFormats.includes("pdf") ? "📊" : "📄"}
        </div>

        {uploadState === "uploading" ? (
          <>
            <h4 className="text-sm font-semibold text-blue-700 mb-1">Ingesting file...</h4>
            <p className="text-xs font-medium text-blue-500">Chunking, embedding, and indexing to Pinecone</p>
          </>
        ) : uploadState === "error" ? (
          <>
            <h4 className="text-sm font-semibold text-red-700 mb-1">Upload failed</h4>
            <p className="text-xs font-medium text-red-500">{errorMsg}</p>
            <p className="text-xs text-zinc-400 mt-1">Click to try again</p>
          </>
        ) : (
          <>
            <h4 className="text-sm font-semibold text-zinc-900 mb-1">Click to upload</h4>
            <p className="text-xs font-medium text-zinc-500">{formatText()} up to 50MB</p>
          </>
        )}
      </div>

      {existingDocs.length > 0 && (
        <div className="mt-4 space-y-2">
          {existingDocs.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-sm group">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">{doc.fileName}</div>
                  <div className="text-[10px] text-zinc-400">{(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB · {doc.vectorsIndexed} vectors</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Indexed</div>
                <button
                  onClick={() => setInputValue(blockId, inputKey, existingDocs.filter((_, idx) => idx !== i))}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-500 p-1 rounded"
                  title="Remove from notebook"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
