/**
 * Poysis Canvas Architecture Types
 * Defines the Headless Dataflow Graph
 */

// --- 1. DATA BINDINGS (The "Where" and "What") ---

export type InputResolver =
  | { type: "user_generated"; componentId: string }      // Wired to a UI Component (e.g., ChatInput)
  | { type: "static_default"; value: any }               // Hardcoded by the Creator (e.g., limit=5)
  | { type: "dynamic"; sourceBlockId: string; outputKey: string } // Direct block-to-block wiring
  | { type: "templated"; template: string };            // String with {{ variables }}

export type OutputDefinition =
  | { type: "raw_generated" } 
  | { type: "rules_constrained"; schema: string }; // e.g., "Must be a JSON Array"

// --- 2. TRIGGERS (The "When") ---

export type TriggerCondition = 
  | { type: "manual"; componentId: string } // Triggers on UI interaction
  | { type: "lifecycle"; event: "onLoad" }  // Triggers when notebook loads
  | { type: "chained"; sourceBlockId: string }; // Web-hook style execution

// --- 3. BLOCK DEFINITIONS (The Logic Nodes) ---

// A generic compute block
export interface ComputeBlock<TInputs = Record<string, any>, TOutputs = Record<string, any>> {
  id: string;
  type: "retrieval" | "classifier" | "recommendation"; // Block type
  status: "idle" | "loading" | "streaming" | "complete" | "error";
  
  // Configuration Triad
  stateSettings: Record<string, any>; // Fixed configs (e.g., namespace)
  inputBindings: Partial<Record<keyof TInputs, InputResolver>>;
  triggers: TriggerCondition[];
  
  // Live Data
  currentInputs: Partial<TInputs>; // Evaluated inputs right before execution
  outputs: Partial<TOutputs>;      // The emitted results
}

export interface DocumentValue {
  fileName: string;
  fileType: "pdf" | "excel" | "csv";
  sizeBytes: number;
  uri?: string; // e.g. blob URL or base64 representation
}

// Specific definition for the Retrieval Block
export interface RetrievalInputs {
  query: string;
  documents?: DocumentValue[]; // For when the creator allows on-the-fly user uploads
}

export interface RetrievalOutputs {
  stream: string;
  sources: Array<{ file: string; score: number; snippet?: string }>;
}

// Helper specific type for TS
export type RetrievalBlock = ComputeBlock<RetrievalInputs, RetrievalOutputs> & { type: "retrieval" };

// --- 4. UI REGISTRY (The Presentation Nodes) ---

export interface UIComponentBinding {
  id: string;
  type: "chat_input" | "search_bar" | "stream_panel" | "source_accordion" | "button" | "file_uploader";
  boundToInput?: { blockId: string; inputKey: string };  // Where the UI writes to
  boundToOutput?: { blockId: string; outputKey: string }; // Where the UI reads from
}

// --- 5. BUILDER STATE TYPES ---

export interface ActiveBlock {
  id: string;
  blockTypeId: string;
  name: string;
  slug: string; // URL-friendly name for variable injection (e.g. "research_hub")
  expanded: boolean;
  sources: string[];
  uploadFormats?: string[];
  uiOrder?: ("source" | "input" | "output")[];
  inputInterface: "chat" | "search" | "none" | null;
  outputStyle: "looped" | "result" | "agent" | null;
  resultLayout?: "list" | "grid";
  resultStyle?: "card" | "box";
}

