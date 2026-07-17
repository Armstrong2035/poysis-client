# Poysis


Poysis is a no-code platform for building AI copilots — domain-specific assistants that let end-users chat with, search, or generate content from a knowledge base. Builders compose a **Notebook** out of **Blocks** (Chat, Search, Generate) in a visual builder, and Poysis wires up a chat UI, a search UI, or both, deployable as a public link or an embeddable widget.

This repository contains the **Next.js client**, split into two apps in an npm-workspaces monorepo:
- **`apps/studio`** — the builder UI, auth, workspace/dashboard, and the thin worker API proxy. Deployed at `studio.poysis.com`.
- **`apps/marketplace`** — the public, hand-curated notebook gallery and the public playground (`/[slug]`) where visitors try a published notebook and can join the waitlist. Deployed at `poysis.com`. It's a separate app (not just a route inside studio) so it can be a standalone product surface with its own release cadence and, eventually, its own mobile client — both apps talk to the same Supabase project directly, which is the real API boundary between them.

The actual retrieval/AI execution (RAG, embeddings, Pinecone) happens in a separate **Python worker service**, which both apps talk to over HTTP — it is not part of this repository.

If you're new here, read in this order:
1. This README — engineering orientation.
2. [`docs/platform-guide.md`](docs/platform-guide.md) — product/UX explanation of Notebooks, Blocks, and the builder, written for end users but useful for understanding *why* the code is shaped the way it is.
3. [`architecture_spec.md`](architecture_spec.md) — the "Headless Dataflow Architecture" design philosophy behind the block/store model.
4. [`apps/studio/DESIGN_SYSTEM.md`](apps/studio/DESIGN_SYSTEM.md) — visual design tokens (color, type, spacing) used across the landing/marketing surfaces.

---

## Repo layout

```
poysis-client/
├── package.json            # npm workspaces root — { "workspaces": ["apps/*"] }
├── apps/
│   ├── studio/              # Builder, auth, workspace/dashboard (studio.poysis.com)
│   └── marketplace/         # Public gallery + playground + waitlist (poysis.com)
├── supabase/migrations/    # SQL migrations for the Supabase Postgres database
├── email-templates/        # Branded HTML for Supabase auth emails (confirm/reset)
├── docs/platform-guide.md  # End-user-facing product guide
├── architecture_spec.md    # Design doc for the block/canvas data model
├── roadmap.md               # Product roadmap / planning notes
└── .mcp.json                # Supabase MCP server config (read-only, for AI-assisted dev)
```

Almost everything you'll touch day-to-day lives under `apps/studio/`. `apps/marketplace/` is deliberately small — see its own section below.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Client state | Zustand (single store: `notebookStore.ts`) |
| Auth + DB | Supabase (Postgres, Auth, Storage) |
| AI backend | External Python worker (Railway-hosted), not in this repo |
| Vector store | Pinecone (owned/managed by the worker, not called directly from this repo) |
| Animation | Framer Motion, Three.js / react-force-graph-2d (landing page visuals) |
| AI SDK | Vercel `ai` / `@ai-sdk/react` (streaming helpers) |

---

## Getting started

```bash
npm install                          # from the repo root — installs both workspaces
npm run dev --workspace=apps/studio        # http://localhost:3000
npm run dev --workspace=apps/marketplace   # http://localhost:3001 (or next free port)
```

Other scripts (same `--workspace=` pattern): `build`, `start`, `lint`.

### Environment variables

Each app has its own `.env.local` (not committed — ask a teammate for real values, or use the placeholders below for a read-only frontend session against the shared dev Supabase project). `apps/marketplace` only needs the Supabase and worker vars (it has no auth surface of its own); `apps/studio` additionally needs the dev fixture IDs and `NEXT_PUBLIC_MARKETPLACE_URL` (so builder "copy link"/"view live" actions point at the marketplace app instead of a same-origin path).

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key (client + public server actions) |
| `NEXT_PUBLIC_WORKER_URL` | Public worker URL, used client-side (e.g. landing waitlist form) |
| `WORKER_URL` / `LOCAL_WORKER_URL` | Worker base URL used server-side by the `/api/worker/*` proxy routes. `LOCAL_WORKER_URL` is the dev fallback (`http://localhost:8000`) if `WORKER_URL` isn't set. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin used to build auth email redirect links (avoids Supabase falling back to the dashboard-configured Site URL) |
| `DEV_WORKSPACE_ID` / `DEV_USER_ID` | Local-only test fixtures, not used in prod |

To run against a real backend locally you'll also need the Python worker running (default `http://localhost:8000`) — that's a separate repo/service.

### Database

Supabase is the source of truth for auth, notebooks, documents, and workspaces. Migrations live in [`supabase/migrations/`](supabase/migrations/) and are applied via the Supabase CLI or dashboard — this repo doesn't run migrations automatically. Notable ones:
- `enable_rls_on_vectors.sql` — row-level security for vector-adjacent tables
- `cascade_user_deletion.sql` — cleans up dependent rows when a user is deleted
- `add_notebook_slug.sql` — adds the public `slug` used by `apps/marketplace`'s `/[slug]` route
- `add_waitlist.sql` — the `waitlist` table the marketplace's email-capture form writes to
- `add_topic_overrides.sql` — consolidation/topic override support

The `.mcp.json` at the repo root wires up a **read-only** Supabase MCP server, so an AI assistant with MCP access can inspect schema/data directly.

---

## Core domain model: Notebooks, Blocks, and the Store

Everything in the builder revolves around one Zustand store: [`apps/studio/store/notebookStore.ts`](apps/studio/store/notebookStore.ts). Types are defined in [`apps/studio/types/canvas.ts`](apps/studio/types/canvas.ts) (a copy of this file, kept in sync by hand, also lives in `apps/marketplace/types/canvas.ts` for the playground's `Chat` component).

- **Notebook** — one copilot: a `name`, a set of `blocks`, an `appScreens` ordering, and a `theme`. Persisted to the Supabase `notebooks` table as `{ id, name, config, user_id, slug }`, where `config` is essentially the serialized store (`activeBlocks`, `blocks`, `uiComponents`, `appScreens`, `theme`).
- **Block** (`ComputeBlock`) — a logic node with a type (`chat` | `search` | `generate`), `stateSettings` (static config), `inputBindings` (where its inputs come from — `user_generated`, `dynamic`, `static_default`, or `templated`), `triggers`, and `outputs`. This triad (settings / bindings / triggers) is the "Configuration Triad" described in `architecture_spec.md`.
- **ActiveBlock** — the builder-UI-facing sibling of a `ComputeBlock`: display name, slug (used in `{{slug.output}}` variable injection), upload formats, expanded/collapsed state, and `uiConfig` (the Formatter layout for Search blocks).
- **`executeBlock(blockId)`** — the central action. Resolves inputs (`resolveInputs`), then either:
  - **Search**: single POST to `/api/worker/search`, results mapped into cards.
  - **Chat / Generate**: streams from `/api/worker/ask`, parsing a `\n\n__SOURCES__` sentinel out of the stream to separate the answer text from citation JSON.
- Autosave: the builder debounces store changes and calls the `saveNotebook` server action (see [`apps/studio/lib/actions.ts`](apps/studio/lib/actions.ts)) roughly every 2 seconds.

If you're adding a new block type, start in `types/canvas.ts` (input/output shapes), then `notebookStore.ts` (`BLOCK_DEFAULTS` + `executeBlock` branch), then the corresponding UI in `components/notebook/`.

---

## Application structure (`apps/studio/app/`)

Routing uses Next.js route groups. Two top-level groups plus a handful of ungrouped pages:

### `(landing)/` — marketing site
The public marketing homepage (`/`) with a scene-based, canvas-animated storytelling UI (`chrome/`, `navigation/`, `scenes/`). Mostly self-contained; not part of the app's functional surface.

### `(workspace)/` — the authenticated product
| Route | Purpose |
|---|---|
| `/workspace` | Dashboard — list notebooks, workspace sidebar, chat/sources/visualize/integrations sub-pages |
| `/notebook?id=<id>` | The Notebook Builder (canvas + block config + App Composer). Auth-gated in `page.tsx`; redirects to `/login` if no session |
| `/preview?id=<id>` | Public, unauthenticated deployed-copilot view (phone mockup) |
| `/templates` | Template picker for new notebooks |
| `/auth/callback` | Supabase PKCE/email-confirmation/recovery callback handler |
| `/api/worker/*` | Server-side proxy routes to the Python worker (see below) |
| `/api/notebook/public` | Public notebook fetch by id/slug |
| `/api/drive/*`, `/api/auth/google-drive` | Google Drive integration (connect/status/resync/disconnect) |

### Ungrouped pages
`/login`, `/signup`, `/forgot`, `/reset`, `/onboarding`, `/query`, `/dashboard`, `/enterprise`.

---

## `apps/marketplace/` — the public gallery + playground

A deliberately small Next.js app, separate from studio. It's **seeded directly from the `notebooks` table** — no separate curation file — so publishing a notebook with `ceiling: "public"` in Studio is the entire act of listing it:
- `/` — home feed (Just Dropped / Trending / Latest / domains), `/search` — results, `/[slug]` — a notebook's bio page, `/[slug]/chat` — the real playground. [`lib/creators.ts`](apps/marketplace/lib/creators.ts) queries every published (`slug IS NOT NULL`) notebook via `getPublicNotebooks()`, keeps only ones with `config.canvas.ceiling === "public"`, and builds each card from an optional `config.marketplace` object on the notebook itself — `{ creator, domain, topics, tagline, description, questions, sourceCount, color, featured, trending }`, the same pattern as the existing `config.canvas` metadata. Every field is optional; a published public notebook with none of it set still gets listed, just with a plainer card. There's no Studio UI for these fields yet — set them by hand in Supabase (`notebooks.config`) until one exists.
- `/api/notebook/[id]/chat` — its own copy of the notebook chat proxy, patched to allow **anonymous** callers when the notebook's ceiling is `public` (studio's equivalent route still requires auth — it's never hit by an anonymous visitor since studio has no public playground route of its own).
- `lib/actions.ts` here is a trimmed copy of studio's — `getNotebookBySlug`, `getPublicNotebooks`, and `joinWaitlist`, not the full authenticated CRUD surface.

Gallery → bio → chat stays a same-app client-side transition (no page reload) — that's the reason this app owns the whole browse-and-try loop, instead of the playground staying behind in studio.

---

## The worker proxy pattern

The Next.js server never talks to Pinecone or the LLM directly — everything goes through the Python worker at `WORKER_URL`. Routes under `apps/studio/app/(workspace)/api/worker/` are thin, consistent proxies:

1. Authenticate the caller via Supabase (`createClient(cookies())` → `auth.getUser()`); reject with 401 if no session (public routes like the `/preview` search path check differently — check the route before assuming auth is required).
2. Forward the JSON body to `${WORKER_URL}/retrieval/<endpoint>`, attaching `X-User-ID`.
3. Stream or relay the response back untouched.

Example: [`apps/studio/app/(workspace)/api/worker/ask/route.ts`](apps/studio/app/(workspace)/api/worker/ask/route.ts) proxies to `/retrieval/ask` and streams the response body straight through (this is what powers Chat/Generate blocks). `search`, `ingest-file`, and the `consolidation/*` endpoints (topics, clustering, stories, indexed-count) follow the same shape.

Why proxy instead of calling the worker from the browser: keeps the worker unauthenticated-but-trusted (only reachable with a valid Supabase session), keeps Pinecone/API keys server-side, and lets Next.js attach the authenticated user id.

---

## Auth

Supabase Auth (email/password) via `@supabase/ssr`. Key pieces:
- [`apps/studio/utils/supabase/{client,server,middleware}.ts`](apps/studio/utils/supabase/) — client factories for browser, server component/action, and middleware contexts respectively (a copy of `server.ts` also lives in `apps/marketplace/utils/supabase/` — it needs no cookie-write path there, just `auth.getUser()`).
- [`apps/studio/middleware.ts`](apps/studio/middleware.ts) — runs on every request (excluding static assets) to refresh the session cookie. It does **not** redirect unauthenticated users — that's deliberately left to individual server components (e.g. `notebook/page.tsx` redirects to `/login` itself) so server actions and public routes aren't broken by blanket middleware redirects. It also forwards `?code=` landing on `/` to `/auth/callback`, working around Supabase sometimes falling back to the Site URL instead of the configured callback.
- [`apps/studio/lib/auth.ts`](apps/studio/lib/auth.ts) — server actions: `login`, `signup`, `requestPasswordReset`, `updatePassword`, `logout`. Signup calls `ensureWorkspace` immediately if email confirmation is off; otherwise workspace creation is deferred to `/auth/callback`.
- [`apps/studio/lib/workspace.ts`](apps/studio/lib/workspace.ts) — `ensureWorkspace` is idempotent and safe to call from any auth entry point; every user has exactly one row in `workspaces`. (`getWorkspaceId` alone is duplicated into `apps/marketplace/lib/workspace.ts` for its chat route.)

---

## Key files reference

| File | What it's for |
|---|---|
| `apps/studio/store/notebookStore.ts` | The single Zustand store — all builder state and block execution logic |
| `apps/studio/types/canvas.ts` | Core domain types: blocks, bindings, triggers, theme, UI config |
| `apps/studio/lib/actions.ts` | Server actions for CRUD on notebooks/documents (save, create, delete, fetch by id, public fetch) |
| `apps/studio/lib/auth.ts` | Server actions for login/signup/password reset/logout |
| `apps/studio/lib/workspace.ts` | Workspace bootstrap helper |
| `apps/studio/middleware.ts` | Session refresh + auth-code redirect handling |
| `apps/studio/components/notebook/` | Builder UI: block cards, detail panel, block picker, Blueprint (Formatter) designer, theme customizer, App Composer |
| `apps/studio/components/ui/` | Reusable chat/search/display primitives (Chat, ChatThread, StreamPanel, SourceAccordion, SearchBar, FileUploader, LayoutRenderer) |
| `apps/studio/app/(workspace)/api/worker/` | Server-side proxy routes to the Python worker |
| `apps/marketplace/lib/creators.ts` | Derives marketplace listings live from the `notebooks` table + each row's `config.marketplace` |
| `apps/marketplace/app/[slug]/` | A notebook's public bio page; `[slug]/chat/` is the real playground |
| `supabase/migrations/` | Database schema history (shared by both apps) |

---

## Notes and gotchas

- **This repo is frontend-only.** RAG, embeddings, and Pinecone all live in the Python worker. If a `/api/worker/*` or `/api/notebook/*` route fails, check whether `WORKER_URL`/`LOCAL_WORKER_URL` is set and the worker is actually running.
- **`apps/studio/AGENTS.md` / `apps/studio/CLAUDE.md`** warn that the installed Next.js version has breaking changes vs. training-data assumptions — check `node_modules/next/dist/docs/` before assuming API behavior from memory.
- **Two READMEs exist**: this one (engineering overview) and [`apps/studio/README.md`](apps/studio/README.md) (default `create-next-app` boilerplate — safe to ignore/replace).
- **A handful of files are intentionally duplicated** between `apps/studio` and `apps/marketplace` (`Chat.tsx`, `MarkdownContent.tsx`, `types/canvas.ts`, `lib/workspace.ts`, `lib/connectionScope.ts`, `utils/supabase/server.ts`) rather than extracted into a shared package — they're small and rarely change. If you edit one copy in a way that matters for both apps, check the other.
- **Notebook `config` is a loosely-typed JSON blob** in Postgres — the shape is enforced by TypeScript in this repo, not by a DB schema, so keep `notebookStore.ts`'s `hydrateStore`/save shape and any migration scripts in sync.
