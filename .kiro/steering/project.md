---
inclusion: always
---
# OneInsurance Monorepo — Project Context

## Monorepo Overview
This repository contains three independent Next.js applications, managed by npm. Each app has its own package.json and node_modules (no shared workspaces/turborepo).

1. **admin**: Next.js 15 App. Administrator operations (commissions, applicants, reports). Port 5000 (`oneinsurance-admin` in PM2).
2. **agent**: Next.js 15 App. Agent portal (sales, clients, quotations). Port 4000 (`oneinsurance-agent` in PM2).
3. **ecommerce**: Next.js 16 (Canary). Client storefront (travel, health, motor insurance). Port 3000 (`oneinsurance` in PM2). Route structure relies heavily on dynamic `/[agent-code]` affiliate routes.

## Tech Stack
- **Framework**: Next.js 15/16 (App Router), React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui (Radix), Lucide React
- **State/Data**: Zustand (client state), TanStack Query (server state), Axios
- **Auth**: NextAuth v5 (beta)
- **Forms**: React Hook Form + Zod

## Architecture & Conventions
- **App Router**: Pages in `src/app/`.
- **Components**: Reusable UI in `src/components/ui/` (shadcn). Feature components in `src/components/`.
- **State & API**: Zustand in `src/store/`, API services in `src/services/` using Axios + TanStack Query.
- **Typing**: Strict TypeScript. Zod for form validation schemas.
- **Styling**: Tailwind utility classes. Use `cn()` from `src/lib/utils` for class merging. No inline styles.

## Common Commands
Use npm commands (e.g. `cd admin && npm run dev`).
Deploy is via GitHub Actions -> SSH -> PM2 restart.
