# Operating Procedures — Nexus Ultra Platforms

## Local Development

### Prerequisites

- Node.js ≥ 18
- Docker + Docker Compose (optional, for containerised dev)
- An `.env` file in `backend/` (copy from `backend/.env.example`)

### Start the backend (raw Node)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The server starts on `http://localhost:3000`.

### Start with Docker Compose

```bash
cd infra
docker compose up --build
```

### Run agent CLI

```bash
cd agents
npm install
npm run agent -- --agent FeatureSuggestionAgent --input '{"events":[],"feedback":[]}'
```

## Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Agents unit tests
cd agents && npm test
```

## Environment Variables

| Variable         | Default       | Description                            |
|------------------|---------------|----------------------------------------|
| `PORT`           | `3000`        | HTTP port for the backend              |
| `API_KEY`        | `changeme`    | API key required for `/agent/run`      |
| `STORE_ADAPTER`  | `memory`      | Persistence adapter: `memory`, `supabase`, `mongo` |
| `SUPABASE_URL`   | —             | Supabase project URL (stub)            |
| `SUPABASE_KEY`   | —             | Supabase anon/service key (stub)       |
| `MONGO_URI`      | —             | MongoDB connection string (stub)       |
| `LOG_LEVEL`      | `info`        | Logging verbosity                      |

## Triggering an Agent Run

```bash
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: changeme" \
  -d '{"agent":"FeatureSuggestionAgent","input":{"events":[],"feedback":["Users want dark mode"]}}'
```

## Adding a New Agent

1. Create `agents/src/agents/MyNewAgent.ts` implementing `IAgent`.
2. Register it in `agents/src/registry.ts`.
3. Ensure it is **read-only** (no external write side-effects) or submit it for policy review.
4. Add a unit test in `agents/tests/`.

## Rollback Procedure

1. Identify the faulty deployment commit via GitHub Actions run history.
2. Revert the commit: `git revert <sha>` and open a PR.
3. CI must pass before merging the revert.
4. Redeploy from the reverted commit.

## Safety Checklist

Before any agent is promoted to production:
- [ ] Agent is read-only (no external write side-effects)
- [ ] All tests pass (`npm test`)
- [ ] Security scan passes (`npm audit --audit-level=high`)
- [ ] Human reviewer has approved the PR
- [ ] Change has been documented in `CHANGELOG.md`
