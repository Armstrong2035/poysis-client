import { create } from 'zustand';
import { ActiveBlock, ComputeBlock, UIComponentBinding, ChatMessage, AppTheme } from '../types/canvas';
import { initializeNotebook } from '../lib/actions';

// --- Block defaults by type ---
const BLOCK_DEFAULTS: Record<string, { name: string; slug: string; uploadFormats?: string[]; outputs: Record<string, any> }> = {
  chat: {
    name: 'Chat',
    slug: 'chat_block',
    uploadFormats: ['pdf', 'spreadsheet'],
    outputs: { stream: '', sources: [], history: [] },
  },
  search: {
    name: 'Search',
    slug: 'search_block',
    uploadFormats: ['spreadsheet'],
    outputs: { sources: [] },
  },
  generate: {
    name: 'Generate',
    slug: 'generate_block',
    outputs: { stream: '', history: [] },
  },
};

interface NotebookState {
  // --- 1. REGISTRIES ---
  blocks: Record<string, ComputeBlock>;
  uiComponents: Record<string, UIComponentBinding>;

  // --- 2. BUILDER TOPOLOGY ---
  name: string;
  notebookId: string | null;
  activeBlocks: ActiveBlock[];
  activePreviewBlockId: string | null;
  selectedBlockId: string | null;
  appScreens: string[]; // Ordered list of block IDs explicitly added to the App Composer
  theme: AppTheme;

  // --- 3. ACTIONS ---
  setName: (name: string) => void;
  setNotebookId: (id: string) => void;
  setInputValue: (blockId: string, inputKey: string, value: any) => void;
  setActivePreviewBlock: (blockId: string | null) => void;
  setSelectedBlockId: (blockId: string | null) => void;
  setTheme: (theme: Partial<AppTheme>) => void;
  setBlockUIConfig: (blockId: string, uiConfig: any) => void;
  executeBlock: (blockId: string) => Promise<void>;
  executeInitialSample: (blockId: string) => Promise<void>;

  // Builder Methods
  addBlock: (blockTypeId: string) => void;
  renameBlock: (id: string, newName: string) => void;
  toggleBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  toggleSource: (id: string, type: string) => void;
  toggleUploadFormat: (id: string, format: string) => void;
  setChainingTarget: (blockId: string, target: { blockId: string; inputKey: string } | undefined) => void;
  setTemplatedInput: (blockId: string, inputKey: string, template: string) => void;
  setStateSetting: (blockId: string, key: string, value: any) => void;
  resolveInputs: (blockId: string) => Record<string, any>;
  resetStore: () => void;
  hydrateStore: (data: any, notebookName?: string) => void;

  // App Screen Management
  addToApp: (blockId: string) => void;
  removeFromApp: (blockId: string) => void;
  reorderAppScreens: (screens: string[]) => void;
  bootstrapNotebook: () => Promise<string>;
}


export const useNotebookStore = create<NotebookState>()(
    (set, get) => ({
      // Start clean — no seed blocks
      blocks: {},
      uiComponents: {},

      name: 'Untitled Notebook',
      notebookId: null,
      activeBlocks: [],
      activePreviewBlockId: null,
      selectedBlockId: null,
      appScreens: [],
      theme: {
        primaryColor: '#000000',
        backgroundColor: '#F8FAFC',
        borderRadius: '12px',
        borderWidth: '1px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        fontFamily: 'font-sans',
        appLabel: 'Poysis Copilot',
        showBanner: true,
      },

      addBlock: (blockTypeId: string) => set((state: NotebookState) => {
        const defaults = BLOCK_DEFAULTS[blockTypeId];
        if (!defaults) {
          console.warn(`[addBlock] Unknown block type: ${blockTypeId}`);
          return state;
        }

        const newId = `${blockTypeId}_${Date.now()}`;
        const existingCount = state.activeBlocks.filter(b => b.blockTypeId === blockTypeId).length;
        const slug = existingCount > 0 ? `${defaults.slug}_${existingCount + 1}` : defaults.slug;
        
        // 1. Add to the visual builder stack
        const newActiveBlock: ActiveBlock = { 
          id: newId, 
          blockTypeId, 
          name: defaults.name, 
          slug,
          expanded: true, 
          sources: [], 
          uploadFormats: defaults.uploadFormats,
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
          outputs: { ...defaults.outputs },
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

      setNotebookId: (id: string) => set({ notebookId: id }),

      setActivePreviewBlock: (blockId: string | null) => set({ activePreviewBlockId: blockId }),

      setSelectedBlockId: (blockId: string | null) => set({ selectedBlockId: blockId }),

      setTheme: (theme: Partial<AppTheme>) => set((s: NotebookState) => ({
        theme: { ...s.theme, ...theme }
      })),

      setBlockUIConfig: (blockId: string, uiConfig: any) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === blockId ? { ...b, uiConfig } : b)
      })),

      renameBlock: (id: string, newName: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, name: newName } : b)
      })),

      toggleBlock: (id: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === id ? { ...b, expanded: !b.expanded } : b)
      })),

      removeBlock: (id: string) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.filter((b: ActiveBlock) => b.id !== id),
        appScreens: state.appScreens.filter(sid => sid !== id),
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
          const formats = b.uploadFormats || [];
          const has = formats.includes(format);
          return { ...b, uploadFormats: has ? formats.filter((f: string) => f !== format) : [...formats, format] };
        })
      })),

      setChainingTarget: (blockId: string, target: { blockId: string; inputKey: string } | undefined) => set((state: NotebookState) => ({
        activeBlocks: state.activeBlocks.map((b: ActiveBlock) => b.id === blockId ? { ...b, chainingTarget: target } : b)
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

      setStateSetting: (blockId: string, key: string, value: any) => set((state: NotebookState) => {
        const block = state.blocks[blockId];
        if (!block) return state;

        return {
          blocks: {
            ...state.blocks,
            [blockId]: {
              ...block,
              stateSettings: {
                ...block.stateSettings,
                [key]: value
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
        const blockDef = state.activeBlocks.find(b => b.id === blockId);
        const block = state.blocks[blockId];
        const notebookId = state.notebookId;

        if (!block || block.status === 'streaming') return;
        if (!notebookId) {
          console.error(`[executeBlock] notebookId not set — cannot execute block ${blockId}`);
          set((s: NotebookState) => ({
            blocks: {
              ...s.blocks,
              [blockId]: { ...s.blocks[blockId], status: 'error' },
            },
          }));
          return;
        }

        // Sync uiConfig to runtime state
        if (blockDef?.uiConfig) {
           set((s: NotebookState) => ({
             blocks: {
               ...s.blocks,
               [blockId]: { ...s.blocks[blockId], uiConfig: blockDef.uiConfig },
             },
           }));
        }

        const resolvedInputs = state.resolveInputs(blockId);
        const query = resolvedInputs.query as string;
        if (!query?.trim()) return;

        const blockType = block.type; // "chat" | "search" | "generate"

        // ── SEARCH — single-shot semantic lookup ─────────────────────────
        if (blockType === 'search') {
          set((s: NotebookState) => ({
            blocks: {
              ...s.blocks,
              [blockId]: {
                ...s.blocks[blockId],
                status: 'streaming',
                currentInputs: resolvedInputs,
                outputs: { ...s.blocks[blockId].outputs, sources: [] },
              },
            },
          }));

          try {
            const limit = block.stateSettings?.limit || 5;
            const res = await fetch('/api/worker/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notebook_id: notebookId, query, limit, min_score: 0.5 }),
            });

            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Worker error ${res.status}: ${text.slice(0, 200)}`);
            }

            const data = await res.json();
            console.log(`[executeBlock] Search results for ${blockId}:`, data.results);
            const sources = (data.results ?? []).map((r: any) => ({
              file: r.id,
              score: r.score,
              snippet: r.text,
            }));
            set((s: NotebookState) => ({
              blocks: {
                ...s.blocks,
                [blockId]: {
                  ...s.blocks[blockId],
                  status: 'complete',
                  outputs: { ...s.blocks[blockId].outputs, sources },
                },
              },
            }));
          } catch (err) {
            console.error(`[executeBlock] Search failed for block ${blockId}:`, err);
            set((s: NotebookState) => ({
              blocks: {
                ...s.blocks,
                [blockId]: { ...s.blocks[blockId], status: 'error' },
              },
            }));
          }
          return;
        }

        // ── CHAT / GENERATE — conversational streaming ────────────────────
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content: query,
          timestamp: Date.now(),
        };

        const prevHistory = (block.outputs as any).history || [];

        set((s: NotebookState) => ({
          blocks: {
            ...s.blocks,
            [blockId]: {
              ...s.blocks[blockId],
              status: 'streaming',
              currentInputs: resolvedInputs,
              outputs: {
                ...s.blocks[blockId].outputs,
                stream: '',
                ...(blockType === 'chat' ? { sources: [] } : {}),
                history: [...prevHistory, userMessage],
              },
            },
          },
        }));

        try {
          const SENTINEL = '\n\n__SOURCES__';

          // Chat hits the RAG endpoint; Generate hits the same endpoint but could be extended later
          const instructions = resolvedInputs.instructions;
          const model = block.stateSettings?.model || 'gemini-3-flash';
          const max_tokens = block.stateSettings?.maxTokens || 1000;
          const creativity = block.stateSettings?.creativity ?? 0.5; // Default to balanced

          const res = await fetch('/api/worker/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              notebook_id: notebookId, 
              query, 
              stream: true,
              instructions,
              model,
              max_tokens,
              temperature: creativity, // Map creativity slider to temperature
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Worker error ${res.status}: ${text.slice(0, 200)}`);
          }

          if (!res.body) throw new Error('No response body from worker');

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const sentinelIdx = buffer.indexOf(SENTINEL);
            const displayText = sentinelIdx !== -1 ? buffer.slice(0, sentinelIdx) : buffer;

            set((s: NotebookState) => ({
              blocks: {
                ...s.blocks,
                [blockId]: {
                  ...s.blocks[blockId],
                  outputs: { ...s.blocks[blockId].outputs, stream: displayText },
                },
              },
            }));
          }

          // Parse final answer + sources
          const sentinelIdx = buffer.indexOf(SENTINEL);
          const answer = sentinelIdx !== -1 ? buffer.slice(0, sentinelIdx) : buffer;
          let sources: any[] = [];
          if (sentinelIdx !== -1) {
            try {
              sources = JSON.parse(buffer.slice(sentinelIdx + SENTINEL.length));
            } catch {
              sources = [];
            }
          }

          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: answer,
            ...(blockType === 'chat' ? { sources } : {}),
            timestamp: Date.now(),
          };

          set((s: NotebookState) => {
            const currentHistory = (s.blocks[blockId].outputs as any).history || [];
            const activeBlock = s.activeBlocks.find(b => b.id === blockId);
            const chainingTarget = activeBlock?.chainingTarget;
            return {
              blocks: {
                ...s.blocks,
                [blockId]: {
                  ...s.blocks[blockId],
                  status: 'complete',
                  outputs: {
                    ...s.blocks[blockId].outputs,
                    stream: '',
                    ...(blockType === 'chat' ? { sources } : {}),
                    history: [...currentHistory, assistantMessage],
                  },
                },
              },
              // Automatic screen handoff: advance Composer to chained block
              ...(chainingTarget ? { activePreviewBlockId: chainingTarget.blockId } : {}),
            };
          });
        } catch (err) {
          console.error(`[executeBlock] Failed for block ${blockId}:`, err);
          set((s: NotebookState) => ({
            blocks: {
              ...s.blocks,
              [blockId]: { ...s.blocks[blockId], status: 'error' },
            },
          }));
        }
      },

      executeInitialSample: async (blockId: string) => {
        const state = get();
        const block = state.blocks[blockId];
        if (!block) return;

        const notebookId = state.notebookId;
        const sampleQuery = "Provide a representative overview/sample of this data.";

        // For simplicity, we trigger a search if it's a search block, or a chat for others
        if (block.type === 'search') {
           try {
             const res = await fetch('/api/worker/search', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ notebook_id: notebookId, query: sampleQuery, limit: 1, min_score: 0 }),
             });
             if (res.ok) {
               const data = await res.json();
               console.log(`[executeInitialSample] Sample results for ${blockId}:`, data.results);
               const sources = (data.results ?? []).map((r: any) => ({
                 file: r.metadata?.source_file || "Unknown Source",
                 score: r.score,
                 snippet: r.text || "",
                 ...r.metadata
               }));
               set((s: NotebookState) => ({
                 blocks: { ...s.blocks, [blockId]: { ...s.blocks[blockId], outputs: { ...s.blocks[blockId].outputs, sources } } }
               }));
             }
           } catch (e) {
             console.error("[executeInitialSample] Search failed:", e);
           }
        } else {
           // Chat/Generate fallback
           try {
              const res = await fetch('/api/worker/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  notebook_id: notebookId, 
                  query: sampleQuery, 
                  stream: false,
                }),
              });
              if (res.ok) {
                 const data = await res.json();
                 set((s: NotebookState) => ({
                   blocks: { ...s.blocks, [blockId]: { ...s.blocks[blockId], outputs: { ...s.blocks[blockId].outputs, stream: data.answer || "" } } }
                 }));
              }
           } catch (e) {
              console.error("[executeInitialSample] Ingestion-auto-run failed:", e);
           }
        }
      },

      // --- APP SCREEN MANAGEMENT ---
      addToApp: (blockId: string) => set((s: NotebookState) => {
        if (s.appScreens.includes(blockId)) return s;
        return { appScreens: [...s.appScreens, blockId] };
      }),

      removeFromApp: (blockId: string) => set((s: NotebookState) => ({
        appScreens: s.appScreens.filter(id => id !== blockId)
      })),

      reorderAppScreens: (screens: string[]) => set({ appScreens: screens }),

      bootstrapNotebook: async () => {
        const s = get();
        console.log("[Store] Bootstrapping fresh notebook...");
        
        try {
          const data = await initializeNotebook({
            name: s.name,
            activeBlocks: s.activeBlocks,
            blocks: s.blocks,
            uiComponents: s.uiComponents,
            appScreens: s.appScreens,
            theme: s.theme
          });

          if (data && data.id) {
            console.log("[Store] Bootstrap successful. New ID:", data.id);
            set({ notebookId: data.id });
            
            // Sync URL without reload
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("id", data.id);
              window.history.pushState({}, "", url.toString());
            }
            
            return data.id;
          }
          throw new Error("Failed to retrieve ID during bootstrap.");
        } catch (err) {
          console.error("[Store] Bootstrap failed:", err);
          throw err;
        }
      },

      resetStore: () => {
        set({
           activeBlocks: [],
           blocks: {},
           uiComponents: {},
           name: 'Untitled Notebook',
           notebookId: null,
           activePreviewBlockId: null,
           appScreens: [],
           theme: {
              primaryColor: '#000000',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              borderWidth: '1px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              fontFamily: 'font-sans',
              appLabel: 'Poysis Copilot',
              showBanner: true,
           }
        });
      },

      hydrateStore: (data: any, notebookName?: string) => {
        if (!data) return;
        set({
          name: notebookName || 'Untitled Notebook',
          activeBlocks: data.activeBlocks || [],
          blocks: data.blocks || {},
          uiComponents: data.uiComponents || {},
          appScreens: data.appScreens || [],
          theme: data.theme || {
              primaryColor: '#000000',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              borderWidth: '1px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              fontFamily: 'font-sans',
              appLabel: 'Poysis Copilot',
              showBanner: true,
          }
        });
      }
    })
);
