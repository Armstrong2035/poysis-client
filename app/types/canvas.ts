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
  type: "chat" | "search" | "generate" | "classifier" | "recommendation";
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

// --- Chat Message (shared across conversational blocks) ---

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ file: string; score: number; snippet?: string }>;
  timestamp: number;
}

// --- Block-Specific Input/Output Types ---

// Chat: Conversational RAG over documents
export interface ChatInputs {
  query: string;
  documents?: DocumentValue[];
}

export interface ChatOutputs {
  stream: string; // Live streaming buffer for current response
  sources: Array<{ file: string; score: number; snippet?: string }>;
  history: ChatMessage[];
}

export type ChatBlock = ComputeBlock<ChatInputs, ChatOutputs> & { type: "chat" };

// Search: Semantic search over structured data
export interface SearchInputs {
  query: string;
}

export interface SearchOutputs {
  sources: Array<{ file: string; score: number; snippet?: string }>;
}

export type SearchBlock = ComputeBlock<SearchInputs, SearchOutputs> & { type: "search" };

// Generate: Pure LLM completion (no knowledge base)
export interface GenerateInputs {
  query: string;
}

export interface GenerateOutputs {
  stream: string;
  history: ChatMessage[];
}

export type GenerateBlock = ComputeBlock<GenerateInputs, GenerateOutputs> & { type: "generate" };

// --- 4. UI REGISTRY (The Presentation Nodes) ---

export interface UIComponentBinding {
  id: string;
  type: "chat_input" | "search_bar" | "stream_panel" | "source_accordion" | "button" | "file_uploader";
  boundToInput?: { blockId: string; inputKey: string };  // Where the UI writes to
  boundToOutput?: { blockId: string; outputKey: string }; // Where the UI reads from
}

// --- 5. APP THEME (The Branding Engine) ---

export interface AppTheme {
  primaryColor: string;
  backgroundColor: string;
  borderRadius: string;  // e.g. "0px", "12px", "24px"
  borderWidth: string;   // e.g. "0px", "1px", "2px"
  boxShadow: string;     // Tailwind shadow-xs, shadow-md, etc.
  fontFamily: string;    // "Inter" | "Playfair Display" | "JetBrains Mono"
  appLabel: string;
  showBanner: boolean;
}

// --- 6. BUILDER STATE TYPES ---

export interface ActiveBlock {
  id: string;
  blockTypeId: string;
  name: string;
  slug: string; // URL-friendly name for variable injection (e.g. "research_hub")
  expanded: boolean;
  sources: string[];
  uploadFormats?: string[];
  chainingTarget?: { blockId: string; inputKey: string }; // Pipes output to another block
}
