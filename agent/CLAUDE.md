# One Insurance Agent Portal — Claude Context

This file configures Claude Code and other Anthropic AI assistants for working on the `agent` app in the oneinsurance monorepo.

## Key Directives
- **Primary Product**: Agent portal for sales, clients, and quotations.
- **Tech Stack**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand v5, TanStack Query v5, Lucide React.
- **Next.js version**: 16.4.6. `experimental.agentUpgrade` is set to `"security"` in `next.config.mjs` — Next.js will prompt for upgrades triggered by published security advisories.
- **Port**: 4000 (`npm run dev`).

## Local Documentation
- Monorepo context: `../AGENTS.md`
- Next.js docs for this version: `node_modules/next/dist/docs/`

## Useful Commands
- `npm run dev`: Starts Next.js development server on port 4000
- `npm run build`: Production build (ESLint disabled via `NEXT_DISABLE_ESLINT=1`)
- `npm run lint`: ESLint check (known pre-existing failure on `FlatConfig` import)
