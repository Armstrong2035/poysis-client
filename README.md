# Poysis

Poysis is a no-code platform for building AI copilots — domain-specific assistants that let end-users chat with, search, or generate content from a knowledge base. Builders compose a **Notebook** out of **Blocks** (Chat, Search, Generate) in a visual builder, and Poysis wires up a chat UI, a search UI, or both, deployable as a public link or an embeddable widget.

This repository contains the **Next.js client** (builder UI, public-facing app, auth, and thin API proxy). The actual retrieval/AI execution (RAG, embeddings, Pinecone) happens in a separate **Python worker service**, which this repo talks to over HTTP — it is not part of this repository.

If you're new here, read in this order:
1. This README — engineering orientation.
2. [`docs/platform-guide.md`](docs/platform-guide.md) — product/UX explanation of Notebooks, Blocks, and the builder, written for end users but useful for understanding *why* the code is shaped the way it is.
3. [`architecture_spec.md`](architecture_spec.md) — the "Headless Dataflow Architecture" design philosophy behind the block/store model.
4. [`app/DESIGN_SYSTEM.md`](app/DESIGN_SYSTEM.md) — visual design tokens (color, type, spacing) used across the landing/marketing surfaces.

---

## Repo layout

```
poysis-client/
├── app/                    # The Next.js application (this is what you run)
├── supabase/migrations/    # SQL migrations for the Supabase Postgres database
├── email-templates/        # Branded HTML for Supabase auth emails (confirm/reset)
├── docs/platform-guide.md  # End-user-facing product guide
├── architecture_spec.md    # Design doc for the block/canvas data model
├── roadmap.md               # Product roadmap / planning notes
└── .mcp.json                # Supabase MCP server config (read-only, for AI-assisted dev)
```

Almost everything you'll touch day-to-day lives under `app/`.

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
cd app
npm install
npm run dev        # http://localhost:3000
```

Other scripts (run from `app/`): `npm run build`, `npm run start`, `npm run lint`.

### Environment variables

Defined in `app/.env.local` (not committed — ask a teammate for real values, or use the placeholders below for a read-only frontend session against the shared dev Supabase project):

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
- `add_notebook_slug.sql` — adds the public `slug` used by `/p/[slug]`
- `add_topic_overrides.sql` — consolidation/topic override support

The `.mcp.json` at the repo root wires up a **read-only** Supabase MCP server, so an AI assistant with MCP access can inspect schema/data directly.

---

## Core domain model: Notebooks, Blocks, and the Store

Everything in the builder revolves around one Zustand store: [`app/store/notebookStore.ts`](app/store/notebookStore.ts). Types are defined in [`app/types/canvas.ts`](app/types/canvas.ts).

- **Notebook** — one copilot: a `name`, a set of `blocks`, an `appScreens` ordering, and a `theme`. Persisted to the Supabase `notebooks` table as `{ id, name, config, user_id, slug }`, where `config` is essentially the serialized store (`activeBlocks`, `blocks`, `uiComponents`, `appScreens`, `theme`).
- **Block** (`ComputeBlock`) — a logic node with a type (`chat` | `search` | `generate`), `stateSettings` (static config), `inputBindings` (where its inputs come from — `user_generated`, `dynamic`, `static_default`, or `templated`), `triggers`, and `outputs`. This triad (settings / bindings / triggers) is the "Configuration Triad" described in `architecture_spec.md`.
- **ActiveBlock** — the builder-UI-facing sibling of a `ComputeBlock`: display name, slug (used in `{{slug.output}}` variable injection), upload formats, expanded/collapsed state, and `uiConfig` (the Formatter layout for Search blocks).
- **`executeBlock(blockId)`** — the central action. Resolves inputs (`resolveInputs`), then either:
  - **Search**: single POST to `/api/worker/search`, results mapped into cards.
  - **Chat / Generate**: streams from `/api/worker/ask`, parsing a `\n\n__SOURCES__` sentinel out of the stream to separate the answer text from citation JSON.
- Autosave: the builder debounces store changes and calls the `saveNotebook` server action (see [`app/lib/actions.ts`](app/lib/actions.ts)) roughly every 2 seconds.

If you're adding a new block type, start in `types/canvas.ts` (input/output shapes), then `notebookStore.ts` (`BLOCK_DEFAULTS` + `executeBlock` branch), then the corresponding UI in `components/notebook/`.

---

## Application structure (`app/app/`)

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
`/login`, `/signup`, `/forgot`, `/reset`, `/onboarding`, `/query`, `/dashboard`, `/enterprise`, and `/p/[slug]` (playground view for a notebook accessed by its public slug — see [`app/app/p/[slug]/PlaygroundView.tsx`](app/app/p/%5Bslug%5D/PlaygroundView.tsx)).

---

## The worker proxy pattern

The Next.js server never talks to Pinecone or the LLM directly — everything goes through the Python worker at `WORKER_URL`. Routes under `app/app/(workspace)/api/worker/` are thin, consistent proxies:

1. Authenticate the caller via Supabase (`createClient(cookies())` → `auth.getUser()`); reject with 401 if no session (public routes like the `/preview` search path check differently — check the route before assuming auth is required).
2. Forward the JSON body to `${WORKER_URL}/retrieval/<endpoint>`, attaching `X-User-ID`.
3. Stream or relay the response back untouched.

Example: [`app/app/(workspace)/api/worker/ask/route.ts`](app/app/(workspace)/api/worker/ask/route.ts) proxies to `/retrieval/ask` and streams the response body straight through (this is what powers Chat/Generate blocks). `search`, `ingest-file`, and the `consolidation/*` endpoints (topics, clustering, stories, indexed-count) follow the same shape.

Why proxy instead of calling the worker from the browser: keeps the worker unauthenticated-but-trusted (only reachable with a valid Supabase session), keeps Pinecone/API keys server-side, and lets Next.js attach the authenticated user id.

---

## Auth

Supabase Auth (email/password) via `@supabase/ssr`. Key pieces:
- [`app/utils/supabase/{client,server,middleware}.ts`](app/utils/supabase/) — client factories for browser, server component/action, and middleware contexts respectively.
- [`app/middleware.ts`](app/middleware.ts) — runs on every request (excluding static assets) to refresh the session cookie. It does **not** redirect unauthenticated users — that's deliberately left to individual server components (e.g. `notebook/page.tsx` redirects to `/login` itself) so server actions and public routes aren't broken by blanket middleware redirects. It also forwards `?code=` landing on `/` to `/auth/callback`, working around Supabase sometimes falling back to the Site URL instead of the configured callback.
- [`app/lib/auth.ts`](app/lib/auth.ts) — server actions: `login`, `signup`, `requestPasswordReset`, `updatePassword`, `logout`. Signup calls `ensureWorkspace` immediately if email confirmation is off; otherwise workspace creation is deferred to `/auth/callback`.
- [`app/lib/workspace.ts`](app/lib/workspace.ts) — `ensureWorkspace` is idempotent and safe to call from any auth entry point; every user has exactly one row in `workspaces`.

---

## Key files reference

| File | What it's for |
|---|---|
| `app/store/notebookStore.ts` | The single Zustand store — all builder state and block execution logic |
| `app/types/canvas.ts` | Core domain types: blocks, bindings, triggers, theme, UI config |
| `app/lib/actions.ts` | Server actions for CRUD on notebooks/documents (save, create, delete, fetch by id/slug, public fetch) |
| `app/lib/auth.ts` | Server actions for login/signup/password reset/logout |
| `app/lib/workspace.ts` | Workspace bootstrap helper |
| `app/middleware.ts` | Session refresh + auth-code redirect handling |
| `app/components/notebook/` | Builder UI: block cards, detail panel, block picker, Blueprint (Formatter) designer, theme customizer, App Composer |
| `app/components/ui/` | Reusable chat/search/display primitives (Chat, ChatThread, StreamPanel, SourceAccordion, SearchBar, FileUploader, LayoutRenderer) |
| `app/app/(workspace)/api/worker/` | Server-side proxy routes to the Python worker |
| `supabase/migrations/` | Database schema history |

---

## Notes and gotchas

- **This repo is frontend-only.** RAG, embeddings, and Pinecone all live in the Python worker. If a `/api/worker/*` route fails, check whether `WORKER_URL`/`LOCAL_WORKER_URL` is set and the worker is actually running.
- **`app/AGENTS.md` / `app/CLAUDE.md`** warn that the installed Next.js version has breaking changes vs. training-data assumptions — check `node_modules/next/dist/docs/` before assuming API behavior from memory.
- **Two READMEs exist**: this one (engineering overview) and [`app/README.md`](app/README.md) (default `create-next-app` boilerplate — safe to ignore/replace).
- **Notebook `config` is a loosely-typed JSON blob** in Postgres — the shape is enforced by TypeScript in this repo, not by a DB schema, so keep `notebookStore.ts`'s `hydrateStore`/save shape and any migration scripts in sync.
