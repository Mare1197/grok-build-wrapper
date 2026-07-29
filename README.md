# Grok Build Wrapper

**GitHub:** https://github.com/Mare1197/grok-build-wrapper  

**Local worktree:** `C:\Users\marko\worktrees\grok-build-wrapper` (`feature/wrapper-ui`)  
**Local main checkout:** `C:\Users\marko\repos\grok-build-wrapper`

A local **web wrapper for [Grok Build](https://x.ai)** (the Grok CLI) with a first-class **Imagine image studio**.

This is intentionally separate from `~/grok-cli-ui` — developed on a git worktree so wrapper work stays isolated.

## What it is

| Surface | Role |
|---------|------|
| **Build** | Chat UI that runs headless `grok -p --output-format json` against your local Grok Build install. Optional managed `grok agent serve`. |
| **Imagine** | Studio-level multi-provider image generation (xAI Grok Imagine + Pollinations free + Google stub). |
| **Gallery** | Local filesystem history under `server/data/gallery`. |
| **Edit** | Image edit/remix via xAI when configured. |
| **Settings** | Server-side API keys (never exposed raw to the browser). |

## Architecture

```
Browser (Vite :5173)
   │  /api proxy
   ▼
Wrapper API (Hono :8787, bind 127.0.0.1)
   ├── Imagine providers → xAI / Pollinations / Google(stub)
   ├── Gallery FS
   └── Grok Build bridge → spawn `grok -p` / manage `grok agent serve`
```

Image generation talks to providers **directly** (fast, reliable).  
Grok Build is the coding/agent companion and prompt enhancer — not required for free Pollinations gens.

## Prerequisites

- Node.js 20+
- Optional: Grok CLI on PATH (`%USERPROFILE%\.grok\bin`)
- Optional: `XAI_API_KEY` from [console.x.ai](https://console.x.ai)

## Setup (this worktree)

```powershell
cd C:\Users\marko\worktrees\grok-build-wrapper
copy .env.example .env
npm install
npm run dev
```

Open **http://127.0.0.1:5173**

- API: http://127.0.0.1:8787/api/health  
- Pollinations works with **no** key  
- xAI Imagine needs `XAI_API_KEY` in `.env` or Settings  

## Git worktree

```powershell
# list
git -C C:\Users\marko\repos\grok-build-wrapper worktree list

# develop here
cd C:\Users\marko\worktrees\grok-build-wrapper
git status   # branch: feature/wrapper-ui
```

Main stays clean at `repos/grok-build-wrapper` (branch `main`).

## API (local)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health + Grok CLI status |
| GET | `/api/providers` | Provider capabilities |
| POST | `/api/generate` | Image generation → gallery |
| POST | `/api/edit` | Image edit |
| GET | `/api/gallery` | List history |
| GET | `/api/gallery/:id/image` | Image bytes |
| GET/PUT | `/api/settings` | Settings (masked secrets) |
| POST | `/api/grok/prompt` | Headless Grok Build turn |
| POST | `/api/grok/agent/start` | Manage `grok agent serve` |
| POST | `/api/grok/agent/stop` | Stop managed agent |

## Adding a provider

1. Implement `ImageProvider` in `server/src/providers/your.ts`
2. Register in `server/src/providers/registry.ts`
3. UI picks it up from `GET /api/providers` automatically

## Security

- Server binds **127.0.0.1** only by default  
- API keys stored in `server/data/settings.json` (gitignored) or env  
- “Trusted local agent” enables permission bypass — only for your machine  

## Scripts

```bash
npm run dev        # API + Vite
npm run build      # production build
npm run start      # serve API (+ static client if built)
```

## Relation to `grok-cli-ui`

`C:\Users\marko\grok-cli-ui` was the earlier scaffold. **This worktree** is the Grok Build–oriented product: Build-first shell, process management, and the same multi-provider Imagine studio requirements you specified.
