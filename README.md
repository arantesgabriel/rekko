# Rekko

**Reconstrua seu tempo. Entenda sua jornada.**

Rekko is a modular Next.js application for recording, reconstructing, and understanding work time. This repository currently contains the Phase 0 foundation: executable shells, local PostgreSQL infrastructure, quality tooling, and observability boundaries. Product features are introduced incrementally according to [`ROADMAP.md`](./ROADMAP.md).

## Prerequisites

- Node.js 24 LTS (`.nvmrc` is included);
- Corepack with pnpm 11.19.0;
- Docker Desktop or another Docker-compatible runtime for Supabase local.

The Supabase CLI is installed as a workspace dependency; a global installation is not required.

## Local setup

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm supabase:start
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The auth shell is available at `/login` and the initial product shell at `/app`.

`pnpm supabase:status` prints the local database URL. Update `DATABASE_URL` in `.env` if the local ports differ from the documented defaults.

Stop local services with:

```bash
pnpm supabase:stop
```

## Environment

Copy `.env.example` to `.env`. Environment values are runtime-validated with Zod.

- `DATABASE_URL` is required for database commands and server boundaries that use PostgreSQL.
- `REKKO_SEED_ENV` must be `local` or `test`; production seeding is always rejected.
- Sentry and PostHog variables are optional locally. Both integrations remain disabled when their keys are absent.
- Secrets never use a `NEXT_PUBLIC_` prefix. Sentry's browser DSN and PostHog project key are public identifiers, not account secrets.

Do not commit `.env` files or real credentials.

## Commands

```bash
pnpm dev            # Next.js development server
pnpm build          # production build
pnpm lint           # ESLint
pnpm format         # write formatting
pnpm format:check   # verify formatting
pnpm typecheck      # strict TypeScript checks in every workspace
pnpm test           # Vitest unit tests
pnpm test:e2e       # Playwright on desktop and mobile Chromium

pnpm supabase:start
pnpm supabase:status
pnpm supabase:stop

pnpm db:generate    # generate a reviewed Drizzle migration after schema changes
pnpm db:migrate     # apply committed Drizzle migrations
pnpm db:seed        # local/test seed only
pnpm db:studio
```

Install Playwright's local browser once before the first E2E run:

```bash
pnpm exec playwright install chromium
```

## Repository structure

```text
apps/web       Next.js full-stack application and application modules
packages/db    Drizzle schema, migrations, PostgreSQL client, local seed
packages/shared framework-independent validation and shared code
supabase       local Supabase configuration
```

Business modules stay in `apps/web/src/modules` and are added only by the roadmap phase that owns them. Domain tables are deliberately absent from the Foundation migration.

## Database workflow

Every schema change follows this sequence:

1. edit `packages/db/src/schema.ts`;
2. run `pnpm db:generate`;
3. review the generated SQL in `packages/db/drizzle`;
4. run `pnpm db:migrate` against local Supabase;
5. test and commit schema plus migration together.

The Phase 0 migration enables PostgreSQL `pgcrypto`, required for secure UUID generation in later domain migrations. It does not anticipate product tables.

## Quality and CI

Pull requests run lint, formatting, strict type checks, Vitest, the production build, and Playwright through GitHub Actions. Before handing off work, run the same commands locally.

Refer to [`CONTEXT.md`](./CONTEXT.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DESIGN.md`](./DESIGN.md), [`ROADMAP.md`](./ROADMAP.md), and [`AGENTS.md`](./AGENTS.md) before implementation.
