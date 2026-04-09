# Poysis Commerce & AI Canvas Roadmap

---

## 0. Strategic North Star

Poysis is building the next generation of discovery tools — moving from **search engines** (keyword → crawled pages) to **discovery engines** (intent + user state + domain expertise → high-signal outcomes).

Instead of indexing static web pages like Google, Poysis indexes *how domain experts actually think and reason*. It does this by giving experts simple tools to build their own AI copilots for specific domains (sneakers, hair care, law, etc.). Over time, these expert-built reasoning pipelines form a shared, consented knowledge layer that powers true discovery.

The MVP is honest: it is a no-code RAG builder with embedding. That is a viable business. But every MVP decision should be evaluated against one question: **does this generate data that feeds a central learning loop?** Discovery engines are stateful by definition — and that state starts accumulating on day one.

### Priority Order
1. **Poysis Guide** — make the builder accessible to real domain experts (highest leverage)
2. **Data Infrastructure** — start collecting signal before V2 needs it
3. **Advanced Logic Tools** — variables, branching, conditionals (depth for complex use cases)
4. **Public Discovery Layer** — network effects and distribution flywheel

---

## 1. Product Scout Migration Strategy
**Objective:** Seamlessly migrate existing Shopify merchants using "Product Scout" over to the new Poysis platform, demonstrating the platform's extensible power without overwhelming them.

### Action Items
- [ ] **Create "Product Scout" Native Templates:** Add predefined templates on the `/workspace` dashboard specifically for the Product Scout use-case.
- [ ] **Pre-configured Canvas Layouts:** When a user selects a Product Scout template, the Notebook/Canvas should boot up with the exact existing feature set already pre-wired (e.g., Semantic Search Input bound to a Retrieval Engine and Product Catalog Source).
- [ ] **Extensibility Flow:** Ensure that while the template ships with the core Product Scout features, the canvas remains unlocked. This allows merchants to discover the "+ Add Engine" / "+ Add Interface" buttons and dynamically upgrade their copilot with new Poysis capabilities (like Classifiers or Check-out Streams) if they want to.

---

## 2. Poysis Guide — The Builder Co-Pilot (High Priority)
**Objective:** A meta co-pilot that helps domain experts build their own co-pilot. The biggest barrier to Poysis achieving its vision is not technical infrastructure — it's making the builder usable by non-technical experts (sneaker curators, hair specialists, solo lawyers) who have deep knowledge but won't want to write prompts, design logic flows, or debug vector schemas.

> *"While you build a co-pilot for your customers, Poysis Guide builds one for you."*

### Why This Comes First
Without Guide, advanced features (variables, branching, conditionals) risk being unused by the target audience. With Guide, those same features become accessible — the Guide can teach and suggest exactly when to use them. Experts get a thinking partner, not a configuration panel. Better-built copilots also produce richer signal for the long-term discovery layer.

### What Poysis Guide Does
- **Proactive onboarding** — triggers automatically on new notebook creation or after first file upload
- **File analysis** — reads uploaded documents and suggests key domain variables and factors to configure
- **Persona authoring** — helps write and refine system personas while preserving the expert's authentic voice
- **Flow suggestions** — recommends smart block setups, handoff chains, and multi-screen flows based on the domain
- **Formatter assistance** — suggests layout configurations for Search result cards based on detected schema fields
- **Playground debugging** — analyzes poor responses in the Playground and suggests prompt or config improvements
- **Expert extraction** — asks targeted questions to surface real expertise rather than auto-generating everything. Acts as a thinking partner, not an autocomplete.

### Design Decisions (Settled)
- **Deeply context-aware.** Guide knows all blocks, uploaded files, detected schemas, current tab, and which settings are unconfigured. It does not give generic advice.
- **Separate memory per notebook.** Guide's conversation history is scoped to the notebook. It never bleeds into the end-user copilot's context.
- **Always Preview & Apply.** Every suggestion Guide makes shows a before/after preview with a one-click Apply. Never mutates config silently.
- **Start cheap, escalate when needed.** Default to a fast/low-cost model for routine suggestions; escalate to a more capable model for complex prompt rewrites or multi-block flow design.
- **Not a modal.** Implemented as a floating panel or a dedicated side tab — always present, never blocking.

### Visual Direction
Dual phone mockup concept: one showing the end-user copilot being built; the other showing Guide actively helping the builder in real time.

### Action Items
- [ ] Design Guide's context payload: `{ notebookId, activeBlocks, blocks (configs), uploadedFiles, currentTab, missingConfigs }` — assembled client-side and sent with each Guide message.
- [ ] Create `guide_conversations` Supabase table: `(id, notebook_id, role, content, timestamp)`. Scoped per notebook, separate from any end-user data.
- [ ] Build `GuidePanel` component — floating or side-tab UI in the Notebook Builder. Persists across tab changes, collapses to an icon.
- [ ] Implement proactive trigger: on new notebook creation, Guide opens automatically with a domain-scoping question ("What is this copilot for? Who will use it?").
- [ ] Implement file-upload trigger: after ingestion completes, Guide analyzes the detected schema fields and surfaces config suggestions.
- [ ] Implement "Apply" action protocol: Guide can emit structured `{ action: 'setSystemPrompt' | 'addBlock' | 'setUIConfig', payload }` objects that the builder applies with user confirmation.
- [ ] Integrate Guide awareness into Playground: when a query returns poor results, a "Ask Guide to improve this" button appears.

---

## 3. UX Paradigm Exploration (Ongoing)
**Objective:** Finalize the mental model for how non-technical merchants build copilots.

### The Two Paradigms (To be decided):
- **Logic-Driven Flow (Current Canvas):** The creator drops a strictly invisible backend "Engine" (e.g. Retrieval Block) first, and then binds "Data" and "UI Interactions" into that pipe.
- **Interface-Driven Flow (Proposed Alternative):** The creator drops a visual "UI component" (e.g. Search Bar) onto the screen first, and then opens a settings panel to wire up backend "Engines" to power it.

---

## 4. Backend Integration (Next Steps)
- [ ] Replace mock `executeBlock` DAG logic in `useNotebookStore` with active REST/WebSocket calls to the Poysis Worker tier.
- [ ] Wire up real file ingestions (FileUploader -> LlamaParse pipeline).
- [ ] Implement database persistence for Canvas States (saving/loading templates).

---

## 5. Specialized Intelligence Blocks (V2)
- [ ] **Diagnosis Block:** A guided conversation engine using an empath/doctor model. Designed to arrive at the core of a user's intent through clinical-style discovery.
  - **Use Cases:** Guided onboarding, complex triage, needs-assessment for high-ticket commerce.
  - **UI:** Multi-turn chat with structured "Discovery Progress" indicators.
- [ ] **Onboarding Block:** A structured multi-step form/survey block that collects user information and feeds it into downstream blocks as variables.
  - **Use Cases:** New user intake, preference capture, product recommendation quizzes.
  - **UI:** Step-by-step card flow with progress indicator. Output is a named variable bag passed to subsequent blocks.

---

## 6. Process Tools (V2)
**Objective:** Give blocks a middleware layer — optional steps that run between retrieval and output, allowing data to be enriched, transformed, or iterated before it surfaces to the user.

### Design Decisions (Settled)
- **Not a block type.** A shared toolset available to all blocks, configured inside the block detail panel (likely a "Process" tab).
- **Composable.** Multiple tools can be chained within a single block's process step.

### Tool Anatomy
Every tool follows the same contract: **receives a variable → does work → outputs one or more variables.** This keeps the system composable — the output of any tool can be the input of the next.

### Tools
- [ ] **Variable** — Already exists implicitly ({{ }} injection, block chaining). Needs to be surfaced as a first-class tool. The foundational primitive — all other tools depend on it for referencing and passing data through the pipeline.
- [ ] **API Call** — Receives a variable (or fields from one), calls any HTTP endpoint, outputs the response as a new variable. Covers enrichment, live pricing, third-party validation, and write actions (CRM updates, cart mutations, webhooks). This is what enables agent-like behavior — blocks that don't just read data but affect systems outside Poysis.
- [ ] **LLM Transform** — Receives a variable, runs it through a prompt, outputs the result as a new variable. Pick the best match, score relevance, summarize, reformat. A lightweight model call that shapes data without needing a full chat block.
- [ ] **Conditional** — Receives a variable, evaluates a condition against it, outputs one of two variables depending on the result (true branch / false branch). Enables binary logic — show different UI, call different APIs, or skip steps based on data values.
- [ ] **Branching** — Receives a variable, evaluates it against N rules, and routes to one of N named paths. Where Conditional handles binary if/else logic at the data level, Branching handles multi-path routing at the screen/flow level — e.g. route a user to a Returns flow, an Orders flow, or a General Support flow based on intent classification. Each path is a named output that maps to a downstream block or screen. Think switch/case, not if/else.
- [ ] **Loop** — Standalone iteration tool. Can operate at the block level (iterate over each result) or at the composer level (repeat a screen/flow). Exact scope TBD — deferred to later.
- [ ] **Memory** — Previously considered as a block type, reclassified as a tool. Receives a variable, writes it to a persistent store, and outputs it for downstream use. Enables blocks to remember context across sessions — user preferences, past interactions, accumulated state. Unlike retrieval (which searches a knowledge base), Memory is stateful and user-scoped.

---

## 7. Artifacts (V2)
**Objective:** Allow AI blocks to produce rich, persistent secondary outputs alongside the conversational thread — similar to Claude's artifact panel or ChatGPT Canvas.

### Design Decisions (Settled)
- **Who configures it:** The Poysis builder, via an "Output Mode" setting on any block in `BlockDetailPanel`.
- **Options:** `Chat` (default), `Artifact — Document`, `Artifact — Code`, `Artifact — Diagram`.
- **No triggers for MVP:** Output mode alone determines rendering. Triggers are a v3 consideration.
- **Persistence:** TBD — ephemeral per-session first, Supabase persistence in a later pass.

### Open Questions Before Implementation
- Who is the primary consumer — end-user or builder?
- What artifact types are highest priority (reports, summaries, code, diagrams)?
- Should artifacts persist across sessions for the end-user?

### Action Items
- [ ] Add "Output Mode" selector to `BlockDetailPanel` (alongside model selector).
- [ ] Update `executeBlock` in the store to route output to `artifacts` array vs. chat `history` based on mode.
- [ ] Build `ArtifactPanel` component for rendering `code`, `markdown`, `mermaid`, `html` types.
- [ ] Update `preview/page.tsx` and `AppComposer.tsx` with split-view layout when artifact is active.
- [ ] Update block system prompt instructions to use the correct output format per mode.

---

## 8. Data Infrastructure (Ship Before V2)
**Objective:** Ensure that every notebook deployment generates data that feeds the platform's central learning loop. Do not wait for V2 to start collecting the signal V2 will need.

### Design Decisions (Settled)
- **Start invisible.** No UI for feedback collection in the MVP. Log to a `feedback` table silently. Expose controls to end-users in V2 once the schema is proven.
- **Execution traces are the product.** Every query, which block handled it, latency, and whether the user continued — these are more valuable than star ratings.

### Action Items
- [ ] **Feedback Table** — Create a `feedback` Supabase table: `(id, notebook_id, block_id, query, response_summary, rating, timestamp)`. Ship a `POST /api/feedback` endpoint. Wire it silently to every `executeBlock` call.
- [ ] **Usage Logging** — In `/preview`, log anonymous session events: time on screen, whether the user clicked "Continue," whether they abandoned mid-flow. Store in a `usage_events` table. No PII.
- [ ] **Execution Trace Storage** — Extend the `blocks` schema to support an optional `last_trace` field: `{ query, results_count, latency_ms, timestamp }`. Updated on every `executeBlock`. Used later for ranking and recommendation.
- [ ] **Block Graph Schema** — Ensure blocks are stored with `next_block_id` (nullable) and an optional `condition` field, not just a flat ordered list. This makes the data model compatible with Branching and Conditional without a migration.

---

## 9. Public Discovery Layer (V2)
**Objective:** Turn Poysis from a builder tool into a destination. Every deployed copilot should be findable, shareable, and forkable — creating a crawlable index of functional knowledge assets on the open web.

### Design Decisions (Settled)
- **Embedding is the distribution flywheel.** The embed script turns every builder into a distributor. A copilot embedded on a sneaker blog is free placement that feeds the discovery index.
- **Ship the gallery before you think you're ready.** Even 20 public notebooks on `/explore` will drive retention and give builders an immediate distribution win.

### Action Items
- [ ] **`/explore` Gallery** — A public page listing all notebooks where `is_public = true`. Searchable by name/domain. No login required to browse. Each card links to `/preview?id=<id>`.
- [ ] **`is_public` Flag** — Add a toggle in the Deploy modal: "Make this copilot publicly discoverable." Defaults to false. When enabled, sets `is_public = true` on the notebook row.
- [ ] **Fork / Use as Template** — On each public gallery card, a "Use this as a template" button that clones the notebook config into the viewer's workspace (requires login).
- [ ] **Quickstart Wizard** — A short guided flow in `/templates`: "What's your domain? Upload 3 files. Answer 5 questions." The system pre-configures the first block automatically and opens the notebook ready to deploy. Dramatically reduces time-to-first-deployed-copilot.

---

## 10. Builder UX Hardening (Ongoing)
**Objective:** Lower the barrier from signup to first deployed copilot. The target user is a domain expert, not an ML engineer.

### Design Decisions (Settled)
- Advanced controls (model selector, temperature, top K) are currently always visible. These are levers for power users — they introduce decision fatigue for domain experts and slow completion rates.

### Action Items
- [ ] **Progressive Disclosure** — Hide model selector, temperature, and top K behind an "Advanced" toggle in the block settings. Defaults should be good enough to deploy without touching them.
- [ ] **Completion Rate Tracking** — Log how far builders get in the configure → deploy flow. Identify the drop-off step. Fix it before building new features.
- [ ] **Empty State Improvements** — When a block has no knowledge base and no instructions configured, the empty playground state should prompt the next action directly ("Upload a file to get started") rather than just showing a blank canvas.
- [ ] **Builder Analytics Dashboard** — A view inside the notebook (or workspace card) showing the builder how their deployed copilot is performing: total queries, active sessions, most-used screens, and drop-off points between chained blocks. Distinct from the platform-internal usage logging (Section 8) — this is builder-facing and visible. Gives experts a feedback loop to iterate on their copilot without guessing. Surface it as a tab in the App Composer or a dedicated `/notebook/analytics?id=<id>` page.
