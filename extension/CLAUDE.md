# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScrollStop is a Chrome Extension (Manifest V3) that interrupts doomscrolling by presenting quiz questions generated from uploaded study materials. Users join rooms with friends, compete on a leaderboard, and must answer 5 consecutive questions correctly to unblock a tracked site after exceeding a time limit.

This is the `extension/` directory of a monorepo. The sibling `server/` directory contains the Express + SQLite backend (runs on `localhost:3001`).

## Build Commands

```bash
npm run dev       # Vite build in watch mode (rebuilds on file changes)
npm run build     # TypeScript type-check + Vite production build
```

Output goes to `dist/`. Load in Chrome via `chrome://extensions/` → Developer mode → Load unpacked → select `dist/`.

There are no test or lint scripts configured.

## Architecture

The extension has three isolated execution contexts that communicate via Chrome messaging APIs:

### Popup (`src/popup/`)
React SPA rendered in the extension popup (400x500px). Uses manual page-based navigation (not React Router, despite it being installed). Pages: Login, Dashboard, RoomView, Settings. Connects to the backend API and Socket.io for real-time leaderboard updates.

### Service Worker (`src/background/service-worker.ts`)
Tracks time spent on configured domains using Chrome alarms (15-second intervals). When a domain's accumulated time exceeds the user's limit, it fetches quiz questions from the backend and sends a `BLOCK_PAGE` message to the content script. Handles `QUIZ_COMPLETED` responses to reset time tracking.

### Content Script (`src/content/content.tsx`)
Injected into all pages. Renders a full-page overlay (z-index max) with a quiz UI when it receives a `BLOCK_PAGE` message. Requires 5 consecutive correct answers to dismiss. Communicates results back to the service worker.

### Shared Library (`src/lib/`)
- `types.ts` — TypeScript interfaces and message type unions used across all contexts
- `api.ts` — HTTP client for backend API (`localhost:3001/api`), uses bearer token auth
- `storage.ts` — Chrome storage helpers (sync for settings, local for user/time data)
- `socket.ts` — Socket.io singleton (lazy-initialized)

### Message Flow
```
Popup ←→ Chrome Storage ←→ Service Worker ←→ Content Script
  ↕
Backend API + Socket.io (localhost:3001)
```

### Chrome Message Types
`BLOCK_PAGE`, `UNBLOCK_PAGE`, `QUIZ_COMPLETED`, `GET_STATUS`, `STATUS_RESPONSE` — defined in `lib/types.ts`.

## Key Configuration

- **Vite** (`vite.config.ts`): Three entry points (popup, service-worker, content). Custom plugin copies manifest.json, content.css, and icons to `dist/`. Base path is `./` for extension-relative URLs.
- **TypeScript** (`tsconfig.json`): Strict mode, target ES2022, path alias `@/*` → `src/*`.
- **Tailwind CSS v4**: Integrated via `@tailwindcss/vite` plugin. Dark theme with indigo accents.
- **Manifest** (`manifest.json`): MV3, permissions: tabs, activeTab, storage, alarms, scripting. Content scripts match all URLs.

## Chrome Storage Keys

- `scrollstop_settings` (sync) — tracked domains, time limit config
- `scrollstop_user` (local) — auth token and user ID
- `scrollstop_time_tracking` (local) — per-domain time accumulation data
