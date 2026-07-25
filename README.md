# Handoff: Poysis Studio — Notebook Build & Publish

## Overview
Poysis Studio, redesigned around a single goal: **how fast can a person build and publish a notebook?** A notebook is a source-grounded, shareable knowledge page (à la NotebookLM). The core screen is a three-panel studio — **Sources · Test & Chat · Notebook config** — with Publish always in reach. Target time from empty to a live, shareable notebook: under a minute.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, etc.) using its established patterns, component library, and state tooling. If no environment exists yet, pick the most appropriate framework and implement there.

The HTML uses a lightweight in-house template runtime (`.dc.html`); ignore that mechanism — reproduce the *UI and behavior*, not the runtime.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions. Recreate the UI pixel-accurately using the codebase's own libraries. Two files:
- `Poysis Studio.dc.html` — **the real deliverable**: the full interactive 3-panel studio. Build this.
- `Poysis Quick Publish.dc.html` — direction-exploration canvas (three static concepts, 1a/1b/1c). Context only; **1b was chosen** and became the studio above.

## Layout — the Studio (`Poysis Studio.dc.html`)
Full-viewport app, `100vh`, `overflow:hidden`. Vertical stack:

1. **Top chrome bar** — `height:60px`, flex space-between, `border-bottom:1px solid rgba(35,38,31,.09)`, bg `#FBF9F3`.
   - Left: 24px icon (`assets/poysis-icon.svg`), 1px divider, notebook title in Source Serif 4 18px/600, and a status pill (`Draft · saves as you go` → `Auto-saved` once published; bg `#F0EDE3`, radius 6px).
   - Right: collaborator avatar stack (two 30px circles, `#B9762F` "AK" + `#3C4A3A` "JR", overlapped -8px, 2px `#FBF9F3` border), a `● Published` pill when live (`#EBF0E5`/`#DCE4D2`), and the primary **Publish**/**Share** button (`#3C4A3A`, white, radius 10px, `10px 20px`).

2. **Three panels** — flex row, `flex:1`, `min-height:0`.

### Left panel — Sources
`width:300px`, bg `#F7F4EC`, `border-right:1px solid rgba(35,38,31,.09)`, column.
- Header row: uppercase label "SOURCES" (12px/700, letter-spacing .09em, `#6B6D62`) + "+ Add" button (`#3C4A3A`, 13px/600) toggling the add tray.
- **Add tray** (conditional, `animation:pz-fade .18s`): white card, radius 12px, shadow `0 12px 24px -16px rgba(35,38,31,.4)`. Row of three quick buttons — **↑ Upload / ◧ Link / ✎ Text** (each `#EBF0E5` bg, `#DCE4D2` border, `#3C4A3A` text, radius 8px). Below: "OR ADD AN EXAMPLE" + a list of preset source buttons (icon chip + title + "+").
- **Source list** (scrollable): each item = white card (radius 10px, `1px rgba(35,38,31,.08)`), 26px rounded icon chip (kind-tinted), title 13.5px/500 `#23261F` (ellipsis), meta 11.5px `#9A9C90`, and a "×" remove button (`#B7B9AD`). New items animate `pz-fade .2s`.
- **Empty state** (0 sources): dashed card (`1.5px dashed rgba(35,38,31,.18)`), "◧" glyph, "No sources yet", helper copy, and a filled "Add your first source" button.
- Footer: `border-top`, 12px `#9A9C90`, "N sources · grounding every answer".

### Middle panel — Test & Chat
`flex:1`, `min-width:0`, bg `#FBF9F3`, column.
- **Empty state** (0 sources): centered — 44px icon @ 50% opacity, Source Serif 4 34px/600 "Add a source to begin.", 16px `#6B6D62` subcopy (max-width 440px).
- **Generating** (transient ~1.3s after first source or on regenerate): centered 34px spinner (3px ring, `#DCE4D2` track, `#3C4A3A` top, `pz-spin .8s linear infinite`) + "Reading N sources & drafting your notebook…".
- **Ready** (content column, `max-width:720px`, centered):
  - Overview block (`animation:pz-fade .35s`): uppercase accent label "OVERVIEW · AUTO-GENERATED" + "↻ Regenerate" button; H1 title Source Serif 4 30px/600; body 16px/1.62 `#3A3C33` with an inline highlight span (`background:#EBF0E5; border-bottom:1.5px solid #3C4A3A`).
  - Three stat cards (flex, gap 12px): white, radius 12px; big number Source Serif 4 22px/600 in the **accent** color (`~0%`, `+62%`, `57 → 71`), label 12.5px `#6B6D62`.
  - Suggested-questions row (only when no messages): pill buttons, white/`#DCE4D2`, 13.5px.
  - Chat thread: user bubbles right-aligned (`#3C4A3A` bg, `#F3F1E8` text, radius `14px 14px 4px 14px`, max 76%); assistant bubbles left (white, `1px rgba(35,38,31,.08)`, radius `14px 14px 14px 4px`, max 86%, `#3A3C33`) with citation chips beneath (`#EBF0E5`, `#3C4A3A`, 11px/600, radius 6px). Thinking indicator = three `#3C4A3A` dots animating `pz-dot 1.2s` staggered .2s.
- **Ask bar** (pinned bottom, `max-width:720px`): white pill, `1.5px rgba(35,38,31,.14)`, radius 14px, shadow `0 8px 20px -14px`. Text input + "N sources" chip (`#F0EDE3`) + 38px send button (`#3C4A3A`, "↑"). Submits on Enter or click.

### Right panel — Notebook config
`width:330px`, bg `#F7F4EC`, `border-left`, column. Scrollable body + sticky footer card.
- Uppercase "NOTEBOOK" header.
- **Title** — labeled text input, Source Serif 4 16px/600, white, radius 9px.
- **Description** — labeled textarea (2 rows, no resize), 13.5px, white, radius 9px. *(Bind via `value`, controlled — do not set via child text node.)*
- **Sections** — header with "N shown" count. Each row: white card, drag handle "⋮⋮" (`#C3C5B9`), name 13.5px/600 (`#23261F` when on, `#9A9C90` when off), "↻" redo, and a **toggle switch** (36×21px track, `#8FA57E` on / `rgba(35,38,31,.18)` off; 17px white knob sliding left 2px↔18px, `transition .15s`). Below: dashed "+ Add section" button. Defaults: Overview✓, Key evidence✓, Objections & limits✓, Recommendation✗, FAQ✗.
- **Appearance** — three theme swatch buttons (Sage / Paper / Ink); selected gets `#3C4A3A` border, others `rgba(35,38,31,.12)`. Swatches are gradients (see tokens). Theme drives the middle-panel **accent** color.
- **Who can see it** — three radio-style option cards: **Private** / **Anyone with the link** / **Public on the web**. Selected: `#EBF0E5` bg, `#3C4A3A` border + filled dot. Each has label + sub.
- **Sticky publish/share card** (bottom, `#3C4A3A`, radius 14px):
  - Not published: "Ready to publish" (Source Serif 4 16px/600 white) + visibility summary + full-width "Publish notebook ↗" button (`#EAEFE2` bg, `#3C4A3A` text).
  - Published: "● Live", URL row with Copy, "Share options" + "Unpublish" buttons.

### Publish modal (overlay)
`position:fixed; inset:0`, scrim `rgba(35,38,31,.42)`, centered card `width:480px`, bg `#FBF9F3`, radius 18px, shadow `0 40px 80px -30px`, `animation:pz-pop .22s`. Header (title/sub + ×), share-URL row with Copy, two option tiles (◧ Embed / ↓ Export PDF), footer with visibility summary + **Publish →** (or **Done** once published). Clicking scrim closes; inner click stops propagation.

### Toast
`position:fixed; bottom:24px; center`, `#23261F` bg, `#F3F1E8` text, radius 999px, `pz-pop .2s`; auto-dismiss ~1.9s.

## Interactions & Behavior
- **Add source** (preset or Upload/Link/Text): appends to sources; presets leave the example list. Adding the **first** source triggers the ~1.3s generate animation, then reveals the overview. Manual adds show a "Source added" toast.
- **Remove source**: drops it; preset sources return to the example list.
- **Ask**: pushes user bubble, shows thinking dots ~950ms, then an assistant answer. Answer text is keyword-matched (drop/industry → dip figures; evidence/strong → Iceland+global trial; objection/limit → coverage/billing; meeting → meeting redesign; else a grounded summary) — **in production, replace with a real RAG call over the sources**; keep the citation-chip pattern.
- **Regenerate**: replays the generate spinner (~1.3s) + toast.
- **Section toggle**: flips visibility, updates "N shown". **Redo**: toast (stub for per-section regeneration). **Add section**: appends "New section".
- **Theme pick**: sets accent used by overview label + stat numbers.
- **Visibility pick**: updates selection + summary copy used in the card and modal.
- **Publish**: opens modal → confirm sets `published:true`, "● Published"/"● Live" states, toast. **Unpublish** reverts. **Copy** writes the URL to clipboard, button reads "Copied" ~1.5s, toast.

## State Management
- `sources[]`, `libIds[]` (available presets), `addOpen`
- `generating` (transient), `title`, `desc`
- `sections[]` ({ id, name, on })
- `theme` ('sage'|'paper'|'ink'), `visibility` ('private'|'link'|'public')
- `published`, `publishOpen`
- `messages[]` ({ role, text, cites[] }), `draft`, `thinking`
- `copyLabel`, `toast`
Derived: `hasSources`, `ready = hasSources && !generating`, `visibleCount`, accent from theme, visibility summary from visibility.

## Design Tokens
Colors:
- Paper bg `#FBF9F3`; panel bg `#F7F4EC`; canvas/outer `#ECE7DB`
- Ink text `#23261F`; body `#3A3C33`; muted `#6B6D62`; faint `#9A9C90` / `#8A8C80`
- Brand green (primary) `#3C4A3A`; hover `#2F3A2E`; deep panel `#33402F`; light tint `#EBF0E5`, border `#DCE4D2`, on-green text `#EAEFE2`, sage accent `#8FA57E`
- Amber (secondary) `#B9762F`; red (PDF chip) `#B9422F`
- Borders: hairline `rgba(35,38,31,.08–.14)`
Theme swatch gradients: Sage `linear-gradient(135deg,#3C4A3A,#6E8060)`; Paper `linear-gradient(135deg,#E4D8BE,#B9762F)`; Ink `linear-gradient(135deg,#3A3C33,#23261F)`.
Typography: **Source Serif 4** (400–700) for titles/numbers/wordmark; **Hanken Grotesk** (400–700) for UI/body.
Radii: chips 6px; inputs/cards 9–12px; pills/bubbles 14px; modal 18px; toggles/avatars 999px.
Shadows: card `0 8–12px 20–30px -14…-18px rgba(35,38,31,.35–.4)`; modal `0 40px 80px -30px rgba(35,38,31,.6)`.
Animations: `pz-fade` (6px rise), `pz-pop` (scale .96), `pz-spin`, `pz-dot` (staggered .2s). Toggle/switch transitions .15s.

## Assets
- `assets/poysis-icon.svg` — spiral curl mark (green).
- `assets/poysis-icon-reversed.svg` — reversed (for dark bg).
- `assets/poysis-logo-full.svg` — full wordmark.
- `assets/Poysis Brand Design.pdf` — brand guide.
Fonts via Google Fonts (Source Serif 4, Hanken Grotesk). Icon glyphs are Unicode symbols (◧ ▤ ✎ ↑ ↻ ⋮⋮ ●) — swap for the codebase's icon set.

## Files
- `Poysis Studio.dc.html` — the interactive studio (build this).
- `Poysis Quick Publish.dc.html` — direction exploration (1a/1b/1c); reference only.
- `assets/` — logos + brand PDF.
