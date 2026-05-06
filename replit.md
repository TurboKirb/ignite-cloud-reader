# EPUB Reader

A web-based EPUB reader with rich typography controls, chapter navigation, and multiple reading themes.

## Run & Operate

- `pnpm --filter @workspace/epub-reader run dev` — run the frontend (reads PORT env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, wouter
- EPUB rendering: epubjs
- No backend — fully client-side

## Where things live

- `artifacts/epub-reader/src/` — all frontend source
  - `pages/home.tsx` — upload/landing screen
  - `pages/reader.tsx` — main reader with epubjs integration
  - `context/reader-context.tsx` — global state, settings, localStorage persistence
  - `App.tsx` — wouter router
  - `index.css` — theme palette (light, sepia, dark)

## Architecture decisions

- **Fully client-side**: EPUB files are read via the FileReader API as ArrayBuffer and passed directly to epubjs — no server upload needed.
- **epubjs rendition themes**: Font, letter-spacing, line-height, and color theme are applied via `rendition.themes.override()` and `rendition.themes.select()` so they affect content inside the iframe.
- **Settings persistence**: All reader preferences (font, spacing, margins, theme) are stored in localStorage and rehydrated on load.
- **No backend**: No database, no API server — this is a pure frontend artifact.

## Product

Upload any EPUB file and read it in a calm, focused reading environment. Control typography (7 font choices, kerning, line spacing, margins) and choose between White, Sepia, or Dark page themes. A toggleable table of contents lets you jump between chapters instantly.

## User preferences

_Populate as you build._

## Gotchas

- epubjs renders content in an iframe — CSS overrides must go through `rendition.themes` not regular stylesheets.
- Google Font `@import url(...)` must be the very first line in `index.css`, before `@import "tailwindcss"`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure and TypeScript setup
- epubjs docs: https://github.com/futurepress/epub.js/
