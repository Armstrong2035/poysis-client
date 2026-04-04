import { create } from 'zustand';
import { ActiveBlock, ComputeBlock, UIComponentBinding, RetrievalBlock } from '../types/canvas';

interface NotebookState {
  // --- 1. REGISTRIES ---
  // A dictionary of all the logic nodes operating on this canvas
  blocks: Record<string, ComputeBlock>;
  
  // A dictionary of the visual components (used by the builder UI)
  uiComponents: Record<string, UIComponentBinding>;

  // --- 2. BUILDER TOPOLOGY ---
  name: string;
  activeBlocks: ActiveBlock[];

  // --- 3. ACTIONS ---
  setName: (name: string) => void;
  setInputValue: (blockId: string, inputKey: string, value: any) => void;
  executeBlock: (blockId: string) => Promise<void>;

  // Builder Methods
  addBlock: (blockTypeId: string) => void;
  renameBlock: (id: string, newName: string) => void;
  toggleBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  toggleSource: (id: string, type: string) => void;
  toggleUploadFormat: (id: string, format: string) => void;
  setInputInterface: (id: string, intf: "chat" | "search" | "none") => void;
  setOutputStyle: (id: string, style: "looped" | "result" | "agent") => void;
  setResultConfig: (id: string, key: "layout" | "style", value: "list" | "grid" | "card" | "box") => void;
  shiftElementRank: (blockId: string, index: number, direction: 'up' | 'down') => void;
  setTemplatedInput: (blockId: string, inputKey: string, template: string) => void;
  resolveInputs: (blockId: string) => Record<string, any>;
  resetStore: () => void;
  hydrateStore: (data: any, notebookName?: string) => void;
}


export const useNotebookStore = create<NotebookState>()(
    (set, get) => ({
      blocks: {
        // We are seeding the store with an initial Retrieval Block to test out the architecture
        'retrieval_1': {
          id: 'retrieval_1',
          type: 'retrieval',
          status: 'idle',
          stateSettings: { namespace: 'default_workspace' }, // Hardcoded static config
          inputBindings: {
            query: { type: 'user_generated', componentId: 'chat_input_1' } // Resolving the 'Where'
          },
          triggers: [
            { type: 'manual', componentId: 'chat_input_1' } // Runs when Chat is submitted
          ],
          currentInputs: {
            query: "" // Updates live dynamically as user types
          },
          outputs: {
            stream: "",
            sources: []
          }
        } as RetrievalBlock
      },
      
      uiComponents: {
        'chat_input_1': {
          id: 'chat_input_1',
          type: 'chat_input',
          boundToInput: { blockId: 'retrieval_1', inputKey: 'query' }
        }
      },

      name: 'Untitled Notebook',
      activeBlocks: [],

      addBlock: (blockTypeId: string) => set((state: NotebookState) => {
        const newId = `${blockTypeId}_${Date.now()}`;
        const baseSlug = blockTypeId === "prompt_wrapper" ? "ai_engine" : "retrieval_node";
        const existingCount = state.activeBlocks.filter(b => b.slug.startsWith(baseSlug)).length;
        const slug = existingCount > 0 ? `${baseSlug}_${existingCount + 1}` : baseSlug;
        
        // 1. Add to the visual builder stack
        const newActiveBlock: ActiveBlock = { 
          id: newId, 
          blockTypeId, 
          name: blockTypeId === "prompt_wrapper" ? "AI Engine" : "Knowledge Base", 
          slug,
          expanded: true, 
          sources: [], 
          uploadFormats: ["pdf", "spreadsheet"], 
          uiOrder: ["source", "input", "output"], 
          inputInterface: null, 
          outputStyle: null 
        };

        // 2. Add to the logical compute dictionary
        const newComputeBlock: ComputeBlock = {
          id: newId,
          type: blockTypeId as any,
          status: 'idle',
          stateSettings: {},
          inputBindings: {},
          triggers: [],
          currentInputs: {},
          outputs: {
            stream: "",
            sources: []
          }
        };

        return {
          activeBlocks: [...state.activeBlocks, newActiveBlock],
          blocks: {
            ...state.blocks,
            [newId]: newComputeBlock
          }
        };
      }),

      setName: (name: string) => set({ name }),

      renameBlock: (id: string, newName: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, name: newName } : b)
      })),

      toggleBlock: (id: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, expanded: !b.expanded } : b)
      })),

      removeBlock: (id: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.filter((b: ActiveBlock) => b.id !== id)
      })),

      toggleSource: (id: string, type: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => {
          if (b.id !== id) return b;
          const sources = b.sources.includes(type)
            ? b.sources.filter((s: string) => s !== type)
            : [...b.sources, type];
          return { ...b, sources };
        })
      })),

      toggleUploadFormat: (id: string, format: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => {
          if (b.id !== id) return b;
          const formats = b.uploadFormats || ["pdf", "spreadsheet"];
          const has = formats.includes(format);
          return { ...b, uploadFormats: has ? formats.filter((f: string) => f !== format) : [...formats, format] };
        })
      })),

      setInputInterface: (id: string, intf: "chat" | "search" | "none") => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, inputInterface: intf } : b)
      })),

      setOutputStyle: (id: string, style: "looped" | "result" | "agent") => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, outputStyle: style } : b)
      })),

      setResultConfig: (id: string, key: "layout" | "style", value: "list" | "grid" | "card" | "box") => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => {
          if (b.id !== id) return b;
          return { ...b, [key === "layout" ? "resultLayout" : "resultStyle"]: value };
        })
      })),

      shiftElementRank: (blockId: string, index: number, direction: 'up' | 'down') => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => {
          if (b.id !== blockId) return b;
          const newOrder = [...(b.uiOrder || ["source", "input", "output"])];
          if (direction === 'up' && index > 0) {
            [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
          } else if (direction === 'down' && index < newOrder.length - 1) {
            [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
          }
          return { ...b, uiOrder: newOrder };
        })
      })),

      setInputValue: (blockId: string, inputKey: string, value: any) => set((state: NotebookState) => {
        const block = state.blocks[blockId];
        if (!block) return state;

        return {
          blocks: {
            ...state.blocks,
            [blockId]: {
              ...block,
              currentInputs: {
                ...block.currentInputs,
                [inputKey]: value
              }
            }
          }
        };
      }),

      setTemplatedInput: (blockId: string, inputKey: string, template: string) => set((state: NotebookState) => {
        const block = state.blocks[blockId];
        if (!block) return state;

        return {
          blocks: {
            ...state.blocks,
            [blockId]: {
              ...block,
              inputBindings: {
                ...block.inputBindings,
                [inputKey]: { type: 'templated', template }
              }
            }
          }
        };
      }),

      // --- RESOLVE DYNAMIC DATA ---
      resolveInputs: (blockId: string) => {
         const state = get();
         const block = state.blocks[blockId];
         
         if (!block) return {};

         const resolved: Record<string, any> = { ...block.currentInputs };

         // Resolve any templated strings or dynamic bindings
         Object.entries(block.inputBindings).forEach(([key, resolver]) => {
            if (!resolver) return;
            
            switch (resolver.type) {
               case 'dynamic':
                  const sourceBlock = state.blocks[resolver.sourceBlockId];
                  if (sourceBlock) {
                     resolved[key] = sourceBlock.outputs[resolver.outputKey];
                  }
                  break;
               case 'templated':
                  // Simple regex parser for {{ slug.property }}
                  resolved[key] = (resolver as any).template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_: string, match: string) => {
                     const [slug, outputKey] = match.split('.');
                     const targetBlockConfig = state.activeBlocks.find(b => b.slug === slug);
                     if (targetBlockConfig) {
                        const targetBlock = state.blocks[targetBlockConfig.id];
                        return targetBlock?.outputs[outputKey] || `[${match}]`;
                     }
                     return `[${match}]`;
                  });
                  break;
            }
         });

         return resolved;
      },

      executeBlock: async (blockId: string) => {
        const state = get();
        const block = state.blocks[blockId];
        
        if (!block || block.status === 'streaming') return;

        // 1. Resolve Dynamic Inputs (The "{{ variable }}" binding happens here)
        const resolvedInputs = state.resolveInputs(blockId);

        // 2. React by setting status to streaming
        set((s: NotebookState) => ({
          blocks: {
            ...s.blocks,
            [blockId]: { 
              ...block, 
              status: 'streaming',
              currentInputs: resolvedInputs 
            }
          }
        }));

        // 3. Mocking execution
        if (block.type === 'retrieval') {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          set((s: NotebookState) => ({
            blocks: {
              ...s.blocks,
              [blockId]: {
                ...s.blocks[blockId],
                status: 'complete',
                outputs: {
                  ...s.blocks[blockId].outputs,
                  stream: `You asked: "${resolvedInputs.query || ""}". \nSynthesized response.`,
                  sources: [
                    { file: "manual.pdf", score: 0.95, snippet: "The dataflow model is core to the notebook architecture." },
                    { file: "config.json", score: 0.88, snippet: "All blocks are persisted to a JSON configuration file." }
                  ]
                }
              }
            }
          }));
        }
      },

      resetStore: () => {
         set({ activeBlocks: [], blocks: {}, uiComponents: {}, name: 'Untitled Notebook' });
      },

      hydrateStore: (data: any, notebookName?: string) => {
        if (!data) return;
        set({
          name: notebookName || 'Untitled Notebook',
          activeBlocks: data.activeBlocks || [],
          blocks: data.blocks || {},
          uiComponents: data.uiComponents || {}
        });
      }
    })
);


