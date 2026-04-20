# Ismism Wiki App

Interactive Ismism encyclopedia built with Next.js App Router.

## What this app does

- Renders indexed Ism entries from `app/data/ism-index.json`
- Supports bilingual UI and labels (`zh` and `en`)
- Provides layered coordinate navigation (`/select/[step]`)
- Shows entry reading, search, nearby entries, and bookmarks (`/entry/[code]`)

## Project structure

- `app/page.tsx`: home dashboard with coordinate cube and quick navigation
- `app/select/[step]/page.tsx`: step-based coordinate selector
- `app/entry/[code]/page.tsx`: entry reader and related navigation
- `lib/ism-data.ts`: indexed data types and shared data helpers
- `lib/ui-copy.ts`: shared UI copy for all pages
- `scripts/build-ism-index.mjs`: builds `app/data/ism-index.json` from markdown sources

## Requirements

- Node.js 20+
- npm 10+

## Install and run

```bash
npm install
npm run dev
```

The `dev` and `build` scripts automatically run content indexing first:

- `npm run index-content`: regenerate `app/data/ism-index.json`
- `npm run dev`: index content, then start local dev server
- `npm run build`: index content, then create production build
- `npm run lint`: run ESLint

## Content indexing

`scripts/build-ism-index.mjs` reads markdown files from `ISMISM_SOURCE_DIR`.

- default source path: `../ismism-wiki-main/ismism-wiki-main`
- optional fallback source: `app/data/ism-source-site.json`

If your markdown source is in a different location, set the environment variable before running index/build:

```bash
set ISMISM_SOURCE_DIR=D:\path\to\source
npm run index-content
```

## Notes

- UI copy is centralized in `lib/ui-copy.ts` to reduce duplication.
- Indexed entry data is treated as generated output; regenerate after source updates.
