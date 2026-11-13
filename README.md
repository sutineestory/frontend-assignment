# Frontend Assignment

Solutions to the [7 Solutions frontend assignment](docs/README.md).

| App                    | Assignment               | Stack                                             | Live          |
| ---------------------- | ------------------------ | ------------------------------------------------- | ------------- |
| [`apps/web`](apps/web) | 1. Auto Delete Todo List | Next.js, React, TypeScript, Tailwind CSS, Zustand | _coming soon_ |
| [`apps/api`](apps/api) | 2. Create data from API  | Node.js, Fastify, TypeScript (ESM)                | _coming soon_ |

## Getting started

Requires Node.js 24 and pnpm (`corepack enable pnpm`).

```bash
pnpm install
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:3000 (run one at a time, or set PORT)
```

## Scripts

| Command          | What it does                   |
| ---------------- | ------------------------------ |
| `pnpm lint`      | ESLint in every app            |
| `pnpm typecheck` | TypeScript checks in every app |
| `pnpm test`      | Vitest in every app            |
| `pnpm build`     | Production build of every app  |
| `pnpm format`    | Prettier on the whole repo     |
