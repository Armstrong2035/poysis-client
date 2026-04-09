"use client";

import { useRef, useState, useEffect } from "react";
import { useNotebookStore } from "../../../store/notebookStore";

interface FileUploaderProps {
  blockId: string;
  inputKey: string;
  acceptedFormats?: string[];
  onUploadComplete?: () => void;
}

type UploadedDoc = {
  fileName: string;
  fileType: string;
  sizeBytes: number;
  vectorsIndexed: number;
};

type UploadState = "idle" | "uploading" | "complete" | "sampling" | "ready" | "error";

const STEPS = [
  { key: "uploading", label: "Uploading your file"   },
  { key: "complete",  label: "File processed"        },
  { key: "ready",     label: "Data fields ready"     },
];

function getStepStatus(step: string, current: UploadState): "done" | "active" | "pending" {
  const order: UploadState[] = ["uploading", "complete", "sampling", "ready"];
  const stepIdx   = order.indexOf(step as UploadState);
  const currentIdx = order.indexOf(current);
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx || (step === "complete" && current === "sampling")) return "active";
  return "pending";
}

export function FileUploader({ blockId, inputKey, acceptedFormats = ["pdf", "spreadsheet"], onUploadComplete }: FileUploaderProps) {
  const { setInputValue, blocks, notebookId, executeInitialSample, bootstrapNotebook } = useNotebookStore();
  const block = blocks[blockId];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<{ name: string; vectors: number } | null>(null);
  const [progress, setProgress] = useState(0);

  const existingDocs: UploadedDoc[] = (block?.currentInputs[inputKey as keyof typeof block.currentInputs] as UploadedDoc[]) || [];

  const acceptAttr = (() => {
    const types: string[] = [];
    if (acceptedFormats.includes("pdf")) types.push(".pdf");
    if (acceptedFormats.includes("spreadsheet")) types.push(".xlsx,.xls,.csv");
    return types.join(",") || ".pdf,.xlsx,.xls,.csv,.txt,.docx";
  })();

  // Animate progress bar during upload
  useEffect(() => {
    if (uploadState !== "uploading") return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 82) { clearInterval(interval); return 82; }
        return p + Math.random() * 8;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [uploadState]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File exceeds 50MB limit.");
      setUploadState("error");
      return;
    }

    setActiveFile({ name: file.name, vectors: 0 });
    setUploadState("uploading");
    setErrorMsg(null);

    try {
      let targetNotebookId = notebookId;
      if (!targetNotebookId) {
        try {
          targetNotebookId = await bootstrapNotebook();
        } catch {
          throw new Error("Failed to initialize project before upload. Please try a manual save.");
        }
      }
      if (!targetNotebookId) throw new Error("Could not obtain a valid Project ID.");

      const formData = new FormData();
      formData.append("notebook_id", targetNotebookId);
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
      const vectors = data.vectors_indexed ?? 0;

      const newDoc: UploadedDoc = {
        fileName: file.name,
        fileType: file.type,
        sizeBytes: file.size,
        vectorsIndexed: vectors,
      };

      setProgress(100);
      setActiveFile({ name: file.name, vectors });
      setInputValue(blockId, inputKey, [...existingDocs, newDoc]);
      onUploadComplete?.();

      // Step 2: indexed
      setUploadState("complete");

      // Step 3: schema sampling
      if (existingDocs.length === 0) {
        setTimeout(() => setUploadState("sampling"), 600);
        try {
          await executeInitialSample(blockId);
        } catch (sampleErr) {
          console.error("[FileUploader] Auto-sample failed, but upload succeeded:", sampleErr);
        }
        setUploadState("ready");
      }
    } catch (err: any) {
      console.error("[FileUploader] Ingestion error:", err);
      setErrorMsg(err.message ?? "Upload failed.");
      setUploadState("error");
    }

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

  const isActive = uploadState !== "idle" && uploadState !== "error";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleFileChange}
        disabled={isActive}
      />

      {/* ── Idle / Error: drop zone ── */}
      {!isActive && (
        <div
          onClick={() => uploadState !== "uploading" && fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center group transition-colors cursor-pointer
            ${uploadState === "error"
              ? "border-red-300 bg-red-50/50 hover:border-red-400"
              : "border-zinc-300 hover:border-blue-400 bg-white hover:bg-blue-50/50"
            }`}
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-full shadow-sm mb-4 border border-zinc-100 text-2xl group-hover:scale-110 transition-transform">
            {uploadState === "error" ? "⚠️" : acceptedFormats.includes("spreadsheet") && !acceptedFormats.includes("pdf") ? "📊" : "📄"}
          </div>
          {uploadState === "error" ? (
            <>
              <h4 className="text-sm font-semibold text-red-700 mb-1">Upload failed</h4>
              <p className="text-xs font-medium text-red-500 mb-1">{errorMsg}</p>
              <p className="text-xs text-zinc-400">Click to try again</p>
            </>
          ) : (
            <>
              <h4 className="text-sm font-semibold text-zinc-900 mb-1">Click to upload</h4>
              <p className="text-xs font-medium text-zinc-500">{formatText()} up to 50MB</p>
            </>
          )}
        </div>
      )}

      {/* ── Active: step-by-step progress ── */}
      {isActive && activeFile && (
        <div className="w-full bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-300">

          {/* File identity */}
          <div className="px-5 pt-5 pb-4 flex items-center gap-3 border-b border-zinc-100">
            <div className="w-9 h-9 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-lg flex-shrink-0">
              {acceptedFormats.includes("spreadsheet") && !acceptedFormats.includes("pdf") ? "📊" : "📄"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-zinc-900 truncate">{activeFile.name}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                {uploadState === "uploading" ? "Reading your file..." :
                 uploadState === "complete"  ? "File processed successfully" :
                 uploadState === "sampling"  ? "Preparing your data fields..." :
                                              "Your data is ready to use"}
              </div>
            </div>
            {uploadState === "ready" && (
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex-shrink-0">
                Ready
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="px-5 py-4 space-y-3">
            {STEPS.map((step, i) => {
              const status = getStepStatus(step.key, uploadState);
              return (
                <div key={step.key} className="flex items-center gap-3">
                  {/* Step indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                    ${status === "done"    ? "bg-emerald-500"  :
                      status === "active"  ? "bg-blue-500"     :
                                            "bg-zinc-100 border border-zinc-200"}`}
                  >
                    {status === "done" && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                    {status === "active" && (
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    )}
                    {status === "pending" && (
                      <span className="text-[8px] font-black text-zinc-400">{i + 1}</span>
                    )}
                  </div>

                  {/* Label + bar */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-[11px] font-bold mb-1 transition-colors
                      ${status === "done"   ? "text-emerald-600" :
                        status === "active" ? "text-blue-600"    :
                                             "text-zinc-400"}`}
                    >
                      {step.label}
                      {status === "active" && step.key === "sampling" && (
                        <span className="ml-1 text-[9px] font-medium opacity-60">just a moment...</span>
                      )}
                    </div>
                    {/* Progress bar — only for uploading step */}
                    {step.key === "uploading" && (
                      <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500
                            ${status === "done" ? "bg-emerald-500 w-full" :
                              status === "active" ? "bg-blue-500" : "w-0"}`}
                          style={status === "active" ? { width: `${progress}%` } : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formatter CTA — only when ready */}
          {uploadState === "ready" && (
            <div className="mx-5 mb-5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <span className="text-base shrink-0">🪄</span>
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed flex-1">
                Open the <span className="font-bold">Formatter</span> tab to view your data fields and configure how results are displayed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Indexed docs list ── */}
      {existingDocs.length > 0 && (
        <div className="mt-4 space-y-2">
          {existingDocs.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-sm group">
              <div className="flex items-center gap-3">
                <span className="text-xl">📄</span>
                <div>
                  <div className="text-xs font-semibold text-zinc-800">{doc.fileName}</div>
                  <div className="text-[10px] text-zinc-400">{(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB</div>
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
