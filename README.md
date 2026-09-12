# Microgravity Intelligence

Microgravity Intelligence is a source-backed research and commercial intelligence platform for founders, investors, business development teams, and scientists. It connects experiments to evidence, organizations, missions, platforms, technologies, mechanisms, and commercial opportunity hypotheses.

## Current vertical slice

The first release prioritizes the complete journey:

`source → PostgreSQL → API → search → experiment explorer → experiment detail → commercial intelligence → evidence`

The database currently includes 24 deliberately labelled public/demo seed records across 8 organizations, 6 platforms, 5 missions, 8 technologies, 4 opportunity hypotheses, and linked source records. The seed data prefers explicit uncertainty over invented scientific results or market numbers.

## Architecture

- `artifacts/microgravity-intelligence` — React + Vite frontend and shared product shell
- `artifacts/api-server` — Express API server with generated contract validation
- `lib/api-spec/openapi.yaml` — API source of truth
- `lib/api-client-react` — generated React Query hooks
- `lib/api-zod` — generated request/response validators
- `lib/db` — PostgreSQL schema and Drizzle ORM models
- `artifacts/api-server/src/seed.ts` — idempotent development seed data
- `docs/data-dictionary.md` — database fields, taxonomy, and source rules
- `microgravity_experiment_template.csv` — import template

## Run

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
```

The frontend is managed by its Replit workflow. The API is available at `/api`; the frontend uses the generated client against that path.

## API

Implemented read endpoints:

- `/api/experiments` and `/api/experiments/:id`
- `/api/organizations` and `/api/organizations/:id`
- `/api/missions` and `/api/missions/:id`
- `/api/platforms`
- `/api/technologies` and `/api/technologies/:id`
- `/api/opportunities` and `/api/opportunities/:id`
- `/api/sources`
- `/api/search`
- `/api/analytics/overview`
- `/api/analytics/domains`
- `/api/analytics/timeline`
- `/api/analytics/organizations`
- `/api/analytics/platforms`
- `/api/analytics/white-spaces`

## Scoring

Commercial relevance is a normalized analytical heuristic based on public evidence. The UI reports a score and a confidence level; it does not present the score as objective truth, investment advice, or a market forecast. Missing market sizes are shown as `Not yet quantified`.

## Data ingestion

The initial seed is local and does not depend on live APIs. The next ingestion step should add source adapters with `fetch`, `parse`, `normalize`, `validate`, and `save` stages for NASA, ESA, ISS National Laboratory, and publication sources. Adapters must tolerate unavailable APIs and must never replace a verified database record with an unverified scrape.

## Checks

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/microgravity-intelligence run typecheck
```

For a new source, add the URL and evidence note first, then import or curate the record, review the verification status, and only then promote it to `Verified`.