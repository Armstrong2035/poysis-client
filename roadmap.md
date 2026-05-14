# Poysis Commerce & AI Canvas Roadmap

---

## 0. Strategic North Star

Poysis is building the next generation of discovery tools — moving from **search engines** (keyword → crawled pages) to **discovery engines** (intent + user state + domain expertise → high-signal outcomes).

Instead of indexing static web pages like Google, Poysis indexes *how domain experts actually think and reason*. It does this by giving experts simple tools to build their own AI copilots for specific domains (sneakers, hair care, law, etc.). Over time, these expert-built reasoning pipelines form a shared, consented knowledge layer that powers true discovery.

The MVP is honest: it is a no-code pipeline builder. That is a viable business. But every MVP decision should be evaluated against one question: **does this generate data that feeds a central learning loop?** Discovery engines are stateful by definition — and that state starts accumulating on day one.

### Priority Order
1. **Core Architecture** — get the model right before building on top of it
2. **Poysis Guide** — make the builder accessible to real domain experts
3. **Data Infrastructure** — start collecting signal before V2 needs it
4. **Process Tools (full suite)** — depth for complex use cases
5. **Public Discovery Layer** — network effects and distribution flywheel

---

## 0.5. The Core Model

This is the architectural foundation. All product decisions build on it.

### The Loop

Every copilot on Poysis is one repeating unit:

```
User input → default variable → process tools → output
```

Run it once: a single-block copilot. Chain it: a pipeline. The loop does not change — only what sits inside it, and what the Composer routes to next.

### Blocks — Four Scenes

A block is a **user-facing moment**. The user gives input; the copilot responds. Blocks do not hold intelligence. They capture user state and expose it as a variable. What happens to that variable is entirely determined by the process tools attached.

| Block | Interaction | Default variable | Nature |
|---|---|---|---|
| **Chat** | Open conversation, user-driven | `{{ message }}` | Repeating |
| **Diagnostic Chat** | Structured inquiry, system-driven | `{{ answer }}` | Repeating |
| **Search** | Query-based | `{{ query }}` | Repeating |
| **Form** | Field-based, structured | `{{ field_name }}` per field | One-time gate |

**Critical principle:** No block defaults to a knowledge base. The builder chooses what the system does with the user's input — call an LLM, search a knowledge base, query the internet, hit an API. The block is the scene. The process tools are the intelligence.

### Process Tools — The Intelligence Layer

Process tools receive variables, do work, and output new variables. They are composable — the output of one tool is the input of the next.

Each tool has a **type** and a **dependency** — what it needs configured before it can run. The Stack Editor flags unsatisfied dependencies before a block can be deployed. Ouroboros absorbs this complexity for the builder: it selects the right tool, checks dependencies, and pre-fills config based on what is already uploaded or connected. The raw config interface exists for power users and edge cases — it is the escape hatch, not the front door.

**Design principles (settled):**

- **Language** — Tools are named and described for domain experts, not engineers. The builder-facing name describes what the tool does for them. Descriptions use plain language, scenarios, and analogies — never jargon. Technical names exist in the codebase and for power users; the builder never sees them unless they go looking.

- **No raw config interfaces** — Tool setup is guided and conversational, not a form dump. The builder answers questions, not fields. Common integrations are pre-built. Step-by-step flows replace blank inputs. Smart defaults mean most tools are ready to use without touching advanced settings.

- **Context-aware examples** — Every tool's config interface shows a live example built from the variables that already exist in the current DAG namespace. Not generic placeholder text — the builder's actual variable names, their actual uploaded files, their actual domain. If `{{ hair_type }}`, `{{ concern }}`, and `{{ budget }}` already exist, the example for "Search My Catalog" reads: *"When someone is looking for products that suit `{{ hair_type }}` hair with a `{{ budget }}` budget, your copilot will find the best matches from your uploaded catalog."* Variable pickers in condition builders, input selectors, and output namers all draw from the live namespace — the builder picks from what exists, never types a variable name freehand.

| Builder-facing name | Internal name | Dependency | What it does |
|---|---|---|---|
| **Ask AI** | LLM Call | Prompt template + model | Have the AI respond using your instructions and what it knows |
| **Search My Documents** | Retrieval | Knowledge base — PDF, docs, text | Search through files you've uploaded to find the most relevant information |
| **Search My Catalog** | Catalog Search | Structured data — spreadsheet, CSV, product list | Find the best matches from your product catalog or data sheet |
| **Search the Web** | Web Search | Search target — open web or specific domain | Look up current information from the internet |
| **Connect to an App** | API Call | Endpoint + auth + request/response mapping | Pull live data from another tool — like your inventory system, CRM, or booking platform |
| **Recall This User** | Memory Read | Persistent store schema + user identifier | Look up what you already know about this person from past conversations |
| **Remember This** | Memory Write | Persistent store schema + write trigger | Save something about this user so your copilot remembers it next time |
| **Refine the Results** | LLM Transform | Transformation instruction + input variable | Have the AI tidy up, rank, or rewrite results before they're shown |
| **Only If...** | Conditional | Condition expression (variable + operator + value) | Run the next step only if a certain condition is true |
| **Choose a Path** | Branching | N conditions + N path names | Send the user down one of several different journeys based on their answer |
| **Use Earlier Information** | Variable | — | Reference something collected earlier in this conversation |
| **Create a Document** | Artifact | Type (Document / Code / Diagram) + input variable | Generate a report, plan, or document the user can read or download |
| **Continue to Next Step** | Handoff | Target block + variables to forward | Move the user forward to the next part of the experience |

### The Process DAG

The process tools inside a block form a **DAG** — a Directed Acyclic Graph. Each tool is a node. Variables are the edges. The namespace accumulates as the DAG runs.

**Key properties:**

- **Acyclic** — no loops inside a block's process layer. Execution always moves forward. Loops are handled by the Composer routing back to the same block.
- **Cumulative namespace** — each tool adds to the variable namespace. Nothing is overwritten. Any tool can reference any variable produced before it in the DAG.
- **Nested DAGs** — conditional branches are themselves DAGs. Each nested DAG inherits the full parent namespace at the point of branching and can add its own variables. Branches can nest arbitrarily deep.
- **Positional scoping** — a tool can only reference variables that exist above it in the DAG. The builder never enters variable names freehand — a picker shows only what is available at that position. Broken references are caught at build time, not at runtime.

**Two kinds of terminal nodes:**

| Terminal node | Does |
|---|---|
| **Artifact** | Renders output within the current block (Document, Code, Diagram) |
| **Handoff** | Signals the Composer to route to the next block |

A DAG can end in one, the other, or both. The same conditional node can fire an Artifact (immediate output) and a Handoff (navigation consequence) simultaneously.

```
Diagnostic Chat DAG:
  LLM Call (generate question)        → {{ question }}
  [user answers                       → {{ answer }}]
  LLM Transform (evaluate confidence) → {{ confidence }}
  If {{ confidence }} > 0.8
    └─ LLM Call (synthesise)          → {{ report }}
       Artifact                       → renders {{ report }} as Document
       Handoff                        → Composer routes to next block
  Else
    └─ Handoff (loop)                 → Composer routes back to same block
```

**Builder UI — The Stack Editor:**

The process DAG is rendered as a **vertical ordered list with relationship keywords** — not a node graph. Each tool is a card. Between cards, a keyword describes the relationship:

| Keyword | Meaning |
|---|---|
| *(default, no keyword)* | Run sequentially after the previous tool |
| **Else** | Run if the previous tool returned empty or false |
| **If** `[condition]` | Run only if this condition is true — opens a nested sub-list |
| **With** | Run in parallel with the previous tool — merge results after |

Conditional branches render as indented sub-lists. Parallel tools group at the same indentation level. The builder sees a recipe, not a graph. The DAG is the underlying model; the list is the surface.

### The Composer — The Router

The Composer has one job: given where the user is now, decide what comes next. It reads the **Handoff** signal emitted by a block's process DAG terminal node.

- **Linear** → next screen
- **Conditional** → this block or that block, based on a variable
- **Branching** → one of N blocks, based on a variable
- **Loop** → back to the same block
- **End** → terminate the session

The Composer does not process variables. It does not hold intelligence. It routes between DAGs.

### Form as Onboarding Gate

Form is a **dynamic prompt assembly machine**. Each field is a dimension of the domain expertise. Each answer is a branch of that dimension. When combined, they produce a prompt personalised to that user's exact profile — without the builder writing every permutation manually.

Form runs **once per user** to establish their profile. Its output is written to Memory and inherited by all subsequent blocks in every session.

```
Form (once)
  → variables → Memory Write

Every session thereafter:
  Memory Read → context injected into [Chat / Diagnostic Chat / Search loops]
```

The Composer implements this as a **gate**: has this user completed onboarding? If no, route to Form. If yes, skip directly to the experience.

### Variables as the Universal Connector

- User input → first default variable (automatic, no configuration needed)
- Process tool output → named variable
- Block output → named variable available to the next block
- Form output → written to Memory, available everywhere

The variable system is the handoff system. Blocks connect to each other through variables, not through special wiring.

---

## 1. Decision Archetypes — Pipeline Templates

Archetypes are pre-wired configurations of the core model. They do not introduce new primitives — they are **templates** that guide builders toward proven pipeline patterns.

A **decision archetype** is a repeatable pattern of reasoning that experts use to go from unclear input to actionable output. It is not the topic. It is not the industry. It is the shape of thinking that transcends both.

> This reframe is the difference between "a no-code AI builder" and "a platform for encoding how experts think."

---

### The 4 Archetypes

#### 1. Qualification / Triage — *"Is this worth my time?"*

**Core function:** Filter signal from noise.

| | |
|---|---|
| **Inputs** | Vague user intent, constraints (budget, urgency, context), basic descriptors |
| **Process** | Identify disqualifiers quickly → apply heuristics → bucket into categories |
| **Outputs** | Yes / No / Maybe, priority level, recommended next step |

**Example pipeline:** Form (capture constraints) → Diagnostic Chat (qualify via structured questions) → Conditional (route to yes/no/maybe screen)

**Examples across domains:** Lawyer assessing case viability. SaaS founder qualifying a lead. Doctor deciding if something is urgent or routine.

---

#### 2. Diagnosis — *"What's actually going on?"*

**Core function:** Turn symptoms into understanding.

| | |
|---|---|
| **Inputs** | Observations (often incomplete), symptoms/signals, history/context |
| **Process** | Pattern recognition → hypothesis generation → elimination → iterative questioning |
| **Outputs** | Root cause(s), confidence level, suggested interventions |

**Example pipeline:** Form (capture context) → Diagnostic Chat (systematic narrowing) → LLM Transform (confidence scoring) → Chat (deliver conclusion + alternatives)

**Examples:** Debugging code. Medical diagnosis. "Why is my startup not growing?"

---

#### 3. Matching — *"What is best for me?"*

**Core function:** Map a user to the optimal option.

| | |
|---|---|
| **Inputs** | Preferences, constraints, context, trade-offs |
| **Process** | Weight variables → compare options → balance trade-offs → rank |
| **Outputs** | Top recommendation(s), why it fits, trade-offs explained |

**Example pipeline:** Form (capture preferences → dynamic prompt assembly) → Search (Retrieval + LLM Transform for ranking) → Formatter (ranked cards with reasoning)

**Examples:** "Best CRM for my business." Product recommendations. "Which investment strategy fits me?"

---

#### 4. Planning / Sequencing — *"What should I do next?"*

**Core function:** Turn a goal into step-by-step action.

| | |
|---|---|
| **Inputs** | Goal, starting point, constraints (time, resources) |
| **Process** | Break into stages → order actions → adapt based on progress → account for dependencies |
| **Outputs** | Step-by-step plan, milestones, decision checkpoints |

**Example pipeline:** Form (capture goal + starting point) → Chat (LLM Call, plan generation) → Memory Write (save progress) → loop back with Memory Read for adaptive follow-up

**Examples:** Fitness plan. "Learn backend in 3 months." Startup roadmap.

---

### Archetypes Chain Together

```
Triage     → Is this startup idea worth exploring?
Diagnosis  → Why is it weak?
Matching   → Which market/opportunity fits better?
Planning   → What should I do next?
```

That is a full discovery pipeline built from four blocks, each with process tools, connected by the Composer.

### Action Items

- [ ] One pre-wired template per archetype — each ships with block sequence, process tool configuration, starter persona, and formatter layout tuned to that archetype's output shape
- [ ] Store archetype metadata on blocks: `archetype: "triage" | "diagnosis" | "matching" | "planning"`
- [ ] Archetype-aware Poysis Guide: first question is always "What kind of thinking does this copilot do?" → selects archetype → pre-wires template
- [ ] Confidence / uncertainty output for Diagnostic Chat: surface structured uncertainty (confidence level, alternative hypotheses) as an optional output mode

---

## Current State — What Exists Today

A functional end-to-end builder is already live. The core loop works: a builder can create a notebook, configure blocks, upload files, and deploy a shareable copilot. The main gap is depth — the process tools layer inside blocks does not exist yet, and blocks currently delegate all intelligence directly to the worker.

---

### Blocks (3 implemented)

| Block | What it does today |
|---|---|
| **Chat** | Conversational RAG over uploaded documents. Streams responses with source citations. |
| **Search** | Semantic search over a knowledge base. Returns ranked results rendered via the Blueprint Designer. |
| **Generate** | Pure LLM completion with no knowledge base. Streams a response from a system prompt + user input. |

All three blocks support: model selection (Gemini 3 Flash default, Claude 3.5 Sonnet available), temperature, max tokens, system prompt, and input binding from other blocks via `{{ block_slug.output_key }}` template syntax.

**Not yet built:** Diagnostic Chat, Form.

---

### Notebook Builder

The builder is a full-page canvas UI with the following components:

- **Block cards** — each block in the notebook has a card showing config status (sources, instructions, formatter, chaining). Blocks can be renamed, expanded, collapsed, or deleted.
- **Block Detail Panel** — opens on block click, three tabs:
  - **Logic** — sources setup, input bindings, system prompt, model + state settings
  - **Review** — block output preview, chaining target selection
  - **Interface** — visual layout builder for Search result cards (Blueprint Designer)
- **Blueprint Designer** — drag-to-add layout components (title, paragraph, image, price, button, chip, link) with `{{ item.field_name }}` variable injection into result card layouts
- **App Composer** — right panel showing which blocks are added to the app (ordered screens), a mobile preview, and deploy controls (share link + embed script)
- **Theme Customizer** — primary color, background, border radius, font family, app label

**Not yet built:** Process Tools panel (Stack Editor), Form field builder, Composer transition map, Ouroboros/Guide panel.

---

### Block Chaining

Blocks connect to each other today via:
- `chainingTarget` — a block can pipe its output as the input to another block
- `{{ block_slug.output_key }}` — template syntax for injecting any block's output into another block's input or system prompt

This is the predecessor to the full variable system. It works for linear chaining but has no conditional logic, branching, or DAG structure.

---

### Worker & AI Integration

All AI calls are proxied through a Next.js API layer to an external Fly.io worker:

| Route | Does |
|---|---|
| `POST /api/worker/ask` | Streaming RAG or generation — returns token stream + sources |
| `POST /api/worker/search` | Semantic search — returns ranked results array |
| `POST /api/worker/ingest-file` | Uploads and vectorises a file against a notebook |
| `GET /api/notebook/public` | Returns safe public notebook config for the preview page |

The frontend never calls LLM providers directly. All model logic lives in the worker.

---

### Preview & Deployment

- **Standalone preview** — `/preview?id=<notebookId>` renders the copilot as a mobile-first phone mockup with screen navigation between blocks
- **Embed mode** — `/preview?id=<notebookId>&embed=true` fills an iframe with no chrome, for external website embedding
- **Theme** — CSS variables injected at preview time from the notebook's theme config

---

### Persistence & Auth

- **Supabase `notebooks` table** — `id`, `user_id`, `name`, `config` (full builder state as JSON). Auto-saves every 2 seconds after a state change.
- **Supabase `documents` table** — tracks uploaded files (`name`, `file_type`, `storage_path`, `status`, `metadata`)
- **Supabase Storage** — files stored at `{user_id}/{timestamp}-{filename}`
- **Auth** — Supabase email/password auth with session refresh in middleware. Protected routes: `/workspace`, `/notebook`. Public route: `/preview`.

---

### What Phase 1 Builds On Top Of

The foundation is solid. The store architecture (Zustand), the worker proxy pattern, the block lifecycle, the template variable syntax, and the preview system all carry forward. Phase 1 extends this foundation — it does not replace it.

---

## Phase 1 — MVP

**Definition:** The smallest deployable version of Poysis that a non-technical domain expert can use to build and deploy a functional copilot end-to-end, and that generates signal from day one.

**Criteria to ship Phase 1:**
- A non-technical builder can go from signup to deployed copilot without support
- At least one archetype template produces a working copilot end-to-end
- Execution traces are flowing for every deployed notebook

---

### 1.1 Block Architecture Cleanup

- [ ] Remove default knowledge base assumption from all blocks — blocks capture input only
- [ ] Add **Process Tools panel** (Stack Editor) to each block: V1 tools are LLM Call, Retrieval, Web Search, Memory Read, Memory Write, Conditional, Artifact, Handoff
- [ ] Implement variable system: user input automatically becomes `{{ message }}` / `{{ query }}` / `{{ answer }}` / `{{ field_name }}`
- [ ] Implement variable picker — at each tool's input config, show only variables that exist above it in the DAG. Validate at build time. Never expose raw variable syntax to the builder — pickers, not freehand entry.
- [ ] Implement context-aware tool examples — each tool's config panel renders a live example sentence using the actual variables in the current namespace. Example updates in real time as the builder configures inputs and as new variables are added to the DAG above it.
- [ ] Implement guided tool config flows — each tool type registers a step-by-step setup flow (questions, not form fields). No blank inputs. Each step has a plain language label, a one-sentence explanation, and a pre-filled suggestion where Ouroboros can infer the right value.
- [ ] Add **Diagnostic Chat** block: system-driven inquiry with structured output (conclusion + confidence level). Maps to Triage and Diagnosis archetypes.
- [ ] Add **Form** block: field builder UI (add field, choose type, name it, mark required). Variable bag output. Each field name becomes a variable.
- [ ] Implement Form gate in Composer: has this user completed onboarding? If no, route to Form. If yes, skip.
- [ ] Add **Memory** as a process tool (Read + Write). Memory Write automatically linked to Form output on submit.
- [ ] Implement **Artifact** as a process tool terminal node: renders a variable as Document / Code / Diagram alongside the block. Triggered conditionally via If node in the DAG.
- [ ] Implement **Handoff** as a process tool terminal node: signals the Composer with optional variable payload. Multiple terminal nodes (Artifact + Handoff) can fire from the same conditional branch.

### 1.2 Composer

- [ ] Define next-block routing per block: linear, conditional (binary), end
- [ ] Composer reads Handoff terminal node signals from the block's process DAG — not a separate wiring step
- [ ] Replace handoff chaining with variable-based block connections — variables passed forward via Handoff node payload
- [ ] Render Composer as a visible transition map in the canvas — blocks as nodes, routes as edges
- [ ] Implement Form gate logic as a built-in Composer pattern

### 1.3 Poysis Guide (Ouroboros)

> *"While you build a co-pilot for your customers, Poysis Guide builds one for you."*

Guide is the meta co-pilot that helps domain experts build their own copilot. The biggest barrier to Poysis achieving its vision is not technical infrastructure — it's making the builder usable by non-technical experts who have deep knowledge but won't want to configure process pipelines or debug variable schemas.

**Design decisions (settled):**
- Deeply context-aware. Guide knows all blocks, their process tools, form fields, memory keys, composer routes, and which configs are missing. It does not give generic advice.
- Separate memory per notebook. Guide's conversation history is scoped to the notebook.
- Always Preview & Apply. Every suggestion shows a before/after with one-click Apply. Never mutates config silently.
- Not a modal. Floating panel or dedicated side tab — always present, never blocking.

**Action Items:**
- [ ] Design Guide context payload: `{ notebookId, activeBlocks, blockProcessTools, formFields, memoryKeys, composerRoutes, missingConfigs, selectedArchetype }` — assembled client-side and sent with each Guide message
- [ ] Create `guide_conversations` Supabase table: `(id, notebook_id, role, content, timestamp)`
- [ ] Build `GuidePanel` component — floating or side-tab in the Notebook Builder, persists across tab changes
- [ ] Implement proactive trigger: on new notebook creation, Guide opens with "What kind of thinking does this copilot do?" → archetype selection → pre-wires template
- [ ] Implement file-upload trigger: after ingestion, Guide analyzes detected schema fields and suggests form fields and process tool configurations
- [ ] Implement Apply action protocol: Guide emits `{ action: 'setProcessTool' | 'addBlock' | 'setFormField' | 'setComposerRoute' | 'setSystemPrompt', payload }` objects applied with user confirmation
- [ ] Integrate Guide into Playground: when a query returns poor results, "Ask Guide to improve this" appears

### 1.4 Data Infrastructure

Ship silently alongside MVP. No UI. Execution traces are the product.

- [ ] **Feedback table** — `(id, notebook_id, block_id, query, response_summary, rating, timestamp)`. Wire silently to every block execution.
- [ ] **Usage logging** — in `/preview`, log anonymous session events: time on screen, whether user continued, abandonment mid-flow. Store in `usage_events`. No PII.
- [ ] **Execution trace** — extend blocks schema with `last_trace: { query, results_count, latency_ms, timestamp }`. Updated on every execution.
- [ ] **Block graph schema** — blocks stored with `next_block_id` (nullable) and optional `condition` field. Compatible with Branching without migration.

### 1.5 Archetype Templates

- [ ] One pre-wired template per archetype available in `/templates`
- [ ] Each template ships with: block sequence, process tool config, starter persona, formatter layout
- [ ] Templates are the default entry point for new notebooks — blank canvas is secondary

---

## Phase 2 — Depth

**Criteria to start Phase 2:**
- 50+ notebooks deployed
- Execution traces flowing and queryable
- At least one non-technical builder has deployed without support

### 2.1 Full Process Tools Suite

- [ ] **API Call** — variables → HTTP request → response. Covers live pricing, CRM updates, cart mutations, webhooks. Enables agent-like behavior — blocks that affect systems outside Poysis.
- [ ] **LLM Transform** — lightweight model call to rank, score, summarize, or reformat between retrieval and output
- [ ] **Conditional** — binary if/else routing at the data level
- [ ] **Branching** — N-path routing at the flow level. Each path maps to a downstream block or screen. Think switch/case, not if/else.

### 2.2 Artifact Tool — Rich Output Rendering

Artifact is a process tool terminal node, not a block or output mode. It renders conditionally when a branch in the block's process DAG reaches it. Implemented in Phase 1 as a node type; expanded here with full rendering support.

- [ ] Build `ArtifactPanel` component — split-view panel alongside the block's chat surface. Renders `markdown`, `code`, `mermaid`, `html` based on artifact type.
- [ ] Update `preview/page.tsx` and `AppComposer.tsx` with split-view layout when an Artifact node fires
- [ ] Artifact persistence — ephemeral per-session in Phase 2. Supabase persistence (`artifacts` table) in Phase 3.
- [ ] Artifact types: Document, Code, Diagram. Each maps to a renderer in `ArtifactPanel`.

### 2.3 Product Scout Migration

- [ ] Create Product Scout native templates — pre-configured for Shopify merchant use case
- [ ] Pre-wired canvas: Semantic Search block with Retrieval process tool bound to product catalog source
- [ ] Extensibility flow: template ships with core features, canvas remains open for upgrades (additional blocks, new process tools)

### 2.4 Builder Analytics Dashboard

Builder-facing analytics distinct from the platform-internal usage logging.

- [ ] Surface: total queries, active sessions, most-used screens, drop-off points between blocks
- [ ] Location: tab in App Composer or dedicated `/notebook/analytics?id=<id>` page
- [ ] Gives experts a feedback loop to iterate on their copilot without guessing

---

## Phase 3 — Distribution

**Criteria to start Phase 3:**
- Builder analytics show healthy 30-day retention
- Multiple domains represented in deployed copilots
- At least one copilot embedded on an external site

### 3.1 Public Discovery Layer

Every deployed copilot should be findable, shareable, and forkable.

- [ ] **`/explore` gallery** — public page listing all notebooks where `is_public = true`. Searchable by name/domain. No login required to browse.
- [ ] **`is_public` flag** — toggle in Deploy modal. Defaults to false.
- [ ] **Fork / Use as Template** — "Use this as a template" button clones notebook config into viewer's workspace (requires login)
- [ ] **Quickstart Wizard** — in `/templates`: domain → upload 3 files → 5 questions → system pre-configures first block → notebook ready to deploy

### 3.2 Embed + Distribution Flywheel

- [ ] Embed script for external sites — every embedded copilot is free placement that feeds the discovery index
- [ ] Deployed copilots crawlable and indexable on `/explore`

---

## Ongoing

### Builder UX Hardening

- [ ] **Progressive disclosure** — hide model selector, temperature, top K behind "Advanced" toggle in block settings
- [ ] **Empty state for blocks with no process tools** — prompt directly: "What should happen when someone uses this?" with options (Talk to AI, Search knowledge base, Search internet, Collect input for later)
- [ ] **Completion rate tracking** — log how far builders get in configure → deploy flow. Fix the drop-off step before building new features.
- [ ] **Empty state improvements** — when a block has no process tools configured, playground shows a direct next-action prompt rather than a blank response

### Resolved Decisions

**UX Paradigm — closed.**
Interface-driven flow wins. Blocks are UI-first — they are scenes the user experiences. The canvas is a map of scenes (blocks) and transitions (Composer routes). Logic lives in process tools, not on the canvas surface. The builder always thinks from the user experience inward.
