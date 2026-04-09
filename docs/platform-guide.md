# Poysis Platform Guide
### How to build, deploy, and share a domain expert copilot

---

## What is Poysis?

Poysis is a platform for building AI copilots — focused, domain-specific assistants that help end-users discover, search, or converse with a specific body of knowledge.

You bring the expertise. Poysis gives you the tools to encode it into a working AI application that can be shared as a link or embedded on any website — without writing code.

---

## The Core Idea: Notebooks

Everything in Poysis is organised around **Notebooks**.

A Notebook is one copilot. It has a name, a set of logic blocks that define how it works, a screen layout that defines what the end-user sees, and a deploy URL that makes it publicly accessible.

You can have multiple Notebooks — one per domain, use case, or product. Each is independent.

---

## Getting Started

### 1. Create a Notebook

From the Workspace (`/workspace`), you have two options:

**Blank Canvas** — starts a fresh Notebook with no blocks. You build from scratch.

**Use a Template** — starts from a pre-configured Notebook wired for a specific use case. Templates are the fastest path to a working copilot.

Once created, you land in the **Notebook Builder**.

---

## The Notebook Builder

The builder has three zones:

```
┌─────────────┬──────────────────────────┬──────────────────┐
│ Left Sidebar│     Center Canvas        │   Right Panel    │
│             │                          │                  │
│ Title       │  Block Index             │  App Composer    │
│ Save status │  (your logic blocks)     │  (live preview)  │
│ Navigation  │                          │                  │
└─────────────┴──────────────────────────┴──────────────────┘
```

**Left Sidebar** — notebook title (click to rename), save status (auto-saves every 2 seconds after changes), and navigation back to Workspace or into Project Config.

**Center Canvas** — where you add and manage blocks. This is the logic layer of your copilot.

**Right Panel** — the App Composer. Shows a live mobile phone mockup of your copilot as you build it. Also where you deploy.

---

## Blocks — The Building Blocks of Your Copilot

A block is a single unit of intelligence. Every block has a type (what it does), a knowledge base (what it knows), and a persona (how it behaves).

You add blocks from the **Block Picker** — click the `+ Add block` button on the canvas.

### The Three Block Types

---

### 💬 Chat

**What it does:** Lets end-users have a natural language conversation with your knowledge base. The AI reads the question, searches your documents, and streams a reply with cited sources.

**Use when:** Your users need to ask freeform questions. FAQs, product manuals, policy documents, support knowledge bases.

**Accepts:** PDFs

**Example:** A hair care specialist uploads their treatment guides. Clients can ask "What should I do for dry, low-porosity hair?" and receive a personalised, cited answer.

---

### 🔍 Search

**What it does:** Lets end-users type a query and receive a list of matching results rendered as cards. Think semantic search — it understands meaning, not just keywords.

**Use when:** Your users need to browse or find items from a structured catalogue. Products, inventory, listings, records.

**Accepts:** Spreadsheets (CSV, XLSX)

**Example:** A sneaker curator uploads their inventory spreadsheet. Users search "clean white low-top under £120" and see matching product cards with image, price, and brand.

---

### 🧠 Generate

**What it does:** A direct AI completion block. No knowledge base required — just a system persona and a conversation. The AI generates responses from its own training, shaped entirely by your instructions.

**Use when:** You want the AI to create content, write something, reason through a problem, or respond to open-ended prompts without needing to search documents.

**Accepts:** Nothing — no file upload

**Example:** A copywriter builds a Generate block with a persona for their brand voice. Users enter a product name and receive a social media caption on demand.

---

## Configuring a Block

Click any block card on the canvas to open the **Block Detail Panel**. It has three tabs.

---

### Logic Tab — How the Block Thinks

This is where you define the block's intelligence.

#### Library & Context (Chat and Search blocks only)

Upload the documents or data that power this block. The file is sent to the Poysis ingestion pipeline, processed, and stored as vectors in Pinecone — scoped to this notebook so it never bleeds into other copilots.

**Progress states:**
1. **Uploading your file** — file is being sent to the server
2. **File processed** — ingestion complete, vectors stored
3. **Data fields ready** — a sample query has run and your schema is ready for the Formatter

Once uploaded, the data persists. You do not need to re-upload between sessions.

> **Chat blocks** accept PDFs. **Search blocks** accept spreadsheets (CSV or XLSX).

---

#### System Persona

This is the instruction set for your block's AI. It defines the assistant's personality, tone, goals, and constraints.

Think of it as briefing a new team member. Write it in plain language. Be specific about who they are and what they should and shouldn't do.

**Example for a sneaker Search block:**
```
You are a sneaker curator at a premium retailer. You help customers find the right pair 
based on their lifestyle, style preferences, and budget. Always ask about usage context 
if the user hasn't mentioned it. Never recommend products outside the catalogue.
```

**Variable injection:** You can reference the output of other blocks using `{{ block_slug.output }}` syntax. For example, if a Chat block captures a user's budget, a downstream Search block can reference `{{ chat_block.stream }}` in its persona to personalise results.

> **Amber indicator:** If the System Persona is empty for a Generate block, the section header turns amber. Generate blocks have no knowledge base — their persona is everything.

---

#### Engine Dashboard

Controls the AI engine powering this block.

| Setting | What it does | Default |
|---|---|---|
| **Foundation Model** | Which AI model handles this block | Gemini 3 Flash |
| **Creativity** | Temperature — lower is more factual, higher is more expressive | 0.5 |
| **Max Tokens** | Maximum length of each response | 1000 |
| **Top K** *(Search only)* | How many results to return per query | 5 |

For most use cases, defaults work well. The model selector is useful if a domain requires a specific capability (e.g. Claude for nuanced reasoning, GPT-4o for tool use).

---

#### Handoff Action

Connects this block to another block in the same Notebook. When the block finishes running, a **"Continue →"** button appears in the app, routing the user to the next screen.

**Example flow:**
```
Search block (find a product) 
  → [Continue →] 
    Chat block (ask questions about it)
```

Handoffs are what turn a single block into a multi-screen experience. The first block added to the App Composer must have a handoff defined before any subsequent block can be added.

---

### Playground Tab — Test Your Block Live

A live sandbox environment. Enter a query, hit **Run**, and see exactly what your end-users will see — before you deploy.

**Output view** — renders results using your Formatter layout (if configured) or the default card UI.

**Raw JSON view** — shows the exact API response from the Poysis worker. Useful for debugging schema, checking scores, and verifying the right fields are being returned.

The status bar shows:
- A green dot when the run completes successfully
- Result count (Search blocks)
- Response time in seconds

---

### Formatter Tab — How Results Look (Search blocks only)

The Formatter maps your data fields to visual UI components. It's what turns raw search results into polished, branded cards.

**Blueprint Designer** — a drag-and-drop layout builder. Detected fields from your uploaded spreadsheet appear as available variables (e.g. `{{item.title}}`, `{{item.price}}`, `{{item.image}}`). Drop components onto the canvas and bind fields to them.

**Available components:** Text, Heading, Badge, Image, Price, Divider.

**Raw API Response** — a collapsible inspector at the bottom of the Formatter tab showing the live Pinecone output. Use this to verify exactly what fields are available before building your layout.

> If no Formatter layout is configured, Search results render as default data cards with all fields displayed. The Formatter is optional but produces significantly more polished output.

---

## The App Composer — Building the End-User Experience

The right panel of the builder shows a live mobile phone mockup of your copilot. This is the App Composer.

### Screens Tab

Shows the blocks you've added to the app via the **+ Add to App** button on each block card. These are the screens your end-users will navigate through.

- **Drag to reorder** — rearrange screens by dragging block cards
- **Live preview** — the phone mockup updates in real-time as you configure blocks
- **Screen rendering:**
  - Chat/Generate blocks → conversation thread with input bar
  - Search blocks → search input + results list

### Design Tab

Customise the visual identity of your copilot.

| Setting | What it controls |
|---|---|
| **Primary Color** | Button color, accent color throughout |
| **Background Color** | App background |
| **Border Radius** | Roundness of cards and buttons |
| **Font Family** | Typography throughout |
| **App Label** | The name shown in the copilot header |
| **Powered by Poysis banner** | Toggle the "Live" badge in the header |

---

## Deploying Your Copilot

Click **Deploy** in the App Composer to open the deploy modal.

### Share Link

Generates a public URL: `/preview?id=<notebook-id>`

Anyone with this link can use your copilot as a standalone app. No login required. Works on any device.

### Embed Widget

Generates a `<script>` tag you paste into any website. The copilot loads as a floating widget.

```html
<script
  src="https://poysis.app/embed.js"
  data-notebook-id="your-notebook-id"
  data-label="Ask us anything"
  data-color="#000000"
  async>
</script>
```

Works on Webflow, WordPress, Shopify, or any platform that supports custom scripts.

**Embed mode** strips all Poysis chrome so the copilot fills the frame cleanly — no Poysis branding visible to end-users unless you choose to show it.

---

## The Preview Page

`/preview?id=<notebook-id>` is the public-facing version of your copilot.

- Renders as a phone mockup on desktop, full-screen on mobile
- Displays screens in the order set in the App Composer
- If multiple blocks are chained, a **"Continue →"** button advances the user to the next screen
- **Share button** re-opens the deploy modal so you can copy the link or embed code from the preview itself
- A floating **"Return to Builder"** pill is visible only to the authenticated owner

---

## How the Data Flows

Understanding this helps you reason about performance and troubleshoot issues.

**When a builder uploads a file:**
```
File upload (browser)
  → /api/worker/ingest-file (Next.js proxy)
    → Python worker /retrieval/ingest-file
      → Vectors indexed in Pinecone
        (namespace = notebook_id, so each copilot is isolated)
          → 2-second settle delay
            → Auto-sample query fires
              → Schema detected + saved to block config
                → Formatter fields become available
```

**When an end-user queries the copilot:**
```
User input (Search bar or Chat thread)
  → executeBlock fires in the store
    → Python worker /retrieval/search or /retrieval/chat
      → Pinecone vector search
        (scoped to this notebook_id only)
          → Results mapped and filtered
            → Rendered via Formatter layout or default card UI
```

**Every change in the builder:**
```
Any config change
  → Zustand store updates (client state)
    → 2-second debounce timer resets
      → saveNotebook fires (server action)
        → Supabase upsert
          → Config persisted
```

---

## Completion Indicators

Blocks display visual cues about what has and hasn't been configured yet.

**On the block card:**
- `○ Knowledge Base` (amber chip) — no file has been uploaded yet
- `○ Instructions` (amber chip) — System Persona is empty (Generate blocks)
- `○ Formatter` (amber chip) — no Formatter layout configured (Search blocks)

**In the Block Detail Panel:**
- Section header bars turn **amber** for unconfigured sections
- "— Not configured" label appears next to the section heading
- Formatter tab shows a small amber dot when a Search block has no layout

These indicators disappear as each section is configured.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Esc` | Close the Block Detail Panel |
| `Enter` | Submit a query in the Playground (Search blocks) |
| `Shift + Enter` | New line in Chat/Generate Playground input |

---

## Worked Example: Sneaker Search Copilot

Here is a complete walkthrough from blank canvas to deployed copilot.

**Goal:** A sneaker curator wants to let their Instagram followers search their current inventory by vibe, budget, and size — embedded on their Linktree page.

---

**Step 1 — Create a Notebook**

From Workspace, click **Blank Canvas**. Name it "Sneaker Finder."

---

**Step 2 — Add a Search Block**

Click `+ Add block`. Select **Search**. The Block Detail Panel opens automatically.

---

**Step 3 — Upload the inventory**

In the Logic tab, under Library & Context, upload `inventory.csv`. The file contains columns: `title`, `brand`, `price`, `size`, `image_url`, `colorway`, `style`.

Watch the three-step progress: uploading → file processed → data fields ready. When complete, all seven fields are available in the Formatter.

---

**Step 4 — Write the System Persona**

```
You are a sneaker curator helping customers find their next pair. 
You know your inventory inside out. Focus on fit, style vibe, and usage. 
If someone asks for "clean" or "minimal", lean toward white, grey, and 
earth-tone colourways. Always stay within the catalogue.
```

---

**Step 5 — Build the Formatter layout**

Go to the Formatter tab. The Blueprint Designer shows detected fields. Build this layout:

- Image component → bind to `{{item.image_url}}`
- Heading component → bind to `{{item.title}}`
- Badge component → bind to `{{item.brand}}`
- Text component → bind to `{{item.price}}`

---

**Step 6 — Test in the Playground**

Go to the Playground tab. Type: `clean white low-top under £100`

Results appear as formatted cards. Toggle Raw JSON to confirm the right fields are returning.

---

**Step 7 — Add to App and configure design**

Click **+ Add to App** on the Search block card. In the App Composer Design tab, set Primary Color to `#000000`, App Label to "Sneaker Finder."

---

**Step 8 — Deploy**

Click **Deploy** → **Embed Widget**. Copy the script tag. Paste it into the Linktree custom code field.

Done. The copilot is live.

---

## Glossary

| Term | Meaning |
|---|---|
| **Notebook** | One complete copilot — its blocks, config, and deploy URL |
| **Block** | A single unit of AI logic (Chat, Search, or Generate) |
| **Persona** | The system instructions that define a block's behaviour |
| **Formatter** | The drag-and-drop layout builder for Search result cards |
| **App Composer** | The right panel — live preview + deploy tools |
| **App Screens** | The blocks added to the App Composer, in the order users navigate them |
| **Handoff** | A connection between two blocks — routes users from one screen to the next |
| **Namespace** | Pinecone's isolation layer — each notebook's vectors are stored separately |
| **Embed** | The `<script>` tag that loads a copilot as a widget on a third-party website |
| **Preview** | The public, auth-free URL for a deployed copilot |
| **Variable injection** | `{{ block_slug.output }}` syntax for passing data between blocks |
