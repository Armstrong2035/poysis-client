"use client";

import { useNotebookStore } from "../../../store/notebookStore";

interface FileUploaderProps {
  blockId: string;
  inputKey: string;
  acceptedFormats?: string[];
}

export function FileUploader({ blockId, inputKey, acceptedFormats = ["pdf", "spreadsheet"] }: FileUploaderProps) {
  const { setInputValue, blocks } = useNotebookStore();
  const block = blocks[blockId];
  
  // Dummy ingestion handler mapping to our DocumentValue type
  const handleSimulatedUpload = () => {
    const dummyFile = {
      fileName: "financial_report_Q3.pdf",
      fileType: "pdf",
      sizeBytes: 1024 * 1024 * 2.4, // 2.4MB
      uri: "dummy://blob-url"
    };

    // Grab existing documents array, append new
    const currentDocs = (block?.currentInputs[inputKey as keyof typeof block.currentInputs] as any[]) || [];
    setInputValue(blockId, inputKey, [...currentDocs, dummyFile]);
    
    // NOTE: An actual system might trigger an "ingestion" block execution here 
    // to map the file to Pinecone before allowing retrieval. 
    // e.g., executeBlock(ingestionBlockId);
  };

  const formatText = () => {
    const hasPdf = acceptedFormats.includes("pdf");
    const hasSpreadsheet = acceptedFormats.includes("spreadsheet");
    
    if (hasPdf && hasSpreadsheet) return "PDF, Excel, or CSV";
    if (hasPdf) return "PDF Documents";
    if (hasSpreadsheet) return "Excel or CSV Data";
    return "No formats selected";
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        onClick={handleSimulatedUpload}
        className="w-full border-2 border-dashed border-zinc-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition-colors cursor-pointer rounded-xl p-8 flex flex-col items-center justify-center text-center group shadow-sm"
      >
        <div className="w-12 h-12 bg-white flex items-center justify-center rounded-full shadow-md mb-4 border border-zinc-100 group-hover:scale-110 transition-transform text-2xl">
           {acceptedFormats.includes("spreadsheet") && !acceptedFormats.includes("pdf") ? "📊" : "📄"}
        </div>
        <h4 className="text-sm font-semibold text-zinc-900 mb-1">Click to simulate upload</h4>
        <p className="text-xs font-medium text-zinc-500">{formatText()} up to 50MB</p>
      </div>
      
      {/* Show uploaded state dynamically reading right out of the logic block */}
      {((block?.currentInputs[inputKey as keyof typeof block.currentInputs] as any[])?.length > 0) && (
         <div className="mt-4 space-y-2">
           {(block.currentInputs[inputKey as keyof typeof block.currentInputs] as any[]).map((doc: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <div className="text-xs font-semibold text-zinc-800">{doc.fileName}</div>
                    <div className="text-[10px] text-zinc-400">{(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Ready</div>
              </div>
           ))}
         </div>
      )}
    </div>
  );
}
