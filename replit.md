# Microgravity Intelligence

The commercial intelligence layer for microgravity research: source-backed experiments, evidence trails, and opportunity analysis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Frontend: `artifacts/microgravity-intelligence/src/App.tsx`
- API: `artifacts/api-server/src/routes/microgravity.ts`
- API contract: `lib/api-spec/openapi.yaml`
- Database schema: `lib/db/src/schema/microgravity.ts`
- Seed records: `artifacts/api-server/src/seed.ts`
- Data dictionary: `docs/data-dictionary.md`
- Import template: `microgravity_experiment_template.csv`

## Architecture decisions

- The database is the source of truth; the frontend uses generated API hooks and does not hardcode analytics counts.
- Public/demo records explicitly carry verification status, confidence, source notes, and `Not available`/`Not yet quantified` values when evidence is incomplete.
- Commercial relevance is an analytical heuristic, not a factual claim or investment forecast.
- The API seeds development data idempotently at startup, but production schema changes should follow Replit publish-time database migration behavior.

## Product

The app lets users search and compare microgravity experiments, follow source evidence, inspect organizations, missions, platforms, technologies, and commercial opportunity hypotheses, and view database-backed analytics and white-space signals.

## User preferences

- Prioritize data credibility and traceability over record count or feature count.
- Keep source facts visually separate from analyst intelligence and commercial inference.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Do not hardcode dashboard numbers or fabricate URLs, results, TRLs, customers, patents, or market sizes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
