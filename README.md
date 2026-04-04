# Nexus Ultra Platforms

A minimal, runnable foundation for a **self-evolving AI platform** with controlled automation,
evaluation gates, and a human-in-the-loop PR workflow.

> **Safety first**: All agents are read-only in this initial scaffold. Write actions are blocked
> at the policy layer. See the [Safety Model](#safety-model) section below.

---

## Quickstart

### Prerequisites

- Node.js >= 18
- Docker + Docker Compose (optional)

### 1. Run the backend locally

```bash
cd backend
cp .env.example .env          # review and edit values
npm install
npm run dev
```

The API is available at `http://localhost:3000`.

### 2. Run with Docker Compose

```bash
cd infra
docker compose up --build
```

### 3. Run agents from the CLI

```bash
cd agents
npm install

# List available agents
npm run agent -- --list

# Run the feature suggestion agent
npm run agent -- --agent FeatureSuggestionAgent \
  --input '{"feedback":["Users want dark mode","App is slow"]}'

# Generate release notes
npm run agent -- --agent ReleaseNotesAgent \
  --input '{"version":"v1.0.0","prTitles":["feat: dark mode","fix: login crash"]}'
```

---

## API Endpoints

| Method | Path         | Auth      | Description              |
|--------|--------------|-----------|--------------------------|
| GET    | `/health`    | None      | Liveness check           |
| POST   | `/events`    | None      | Ingest a telemetry event |
| POST   | `/feedback`  | None      | Ingest user feedback     |
| POST   | `/agent/run` | X-API-Key | Trigger an agent run     |

### Example: trigger an agent run

```bash
curl -X POST http://localhost:3000/agent/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: changeme" \
  -d '{"agent":"FeatureSuggestionAgent","input":{"feedback":["Need offline mode"]}}'
```

---

## Environment Variables

| Variable        | Default    | Description                                           |
|-----------------|------------|-------------------------------------------------------|
| `PORT`          | `3000`     | HTTP port                                             |
| `API_KEY`       | `changeme` | API key for protected endpoints                       |
| `STORE_ADAPTER` | `memory`   | Persistence adapter: `memory`, `supabase`, or `mongo` |
| `SUPABASE_URL`  | --         | Supabase project URL (when `STORE_ADAPTER=supabase`)  |
| `SUPABASE_KEY`  | --         | Supabase anon/service key                             |
| `MONGO_URI`     | --         | MongoDB URI (when `STORE_ADAPTER=mongo`)              |
| `LOG_LEVEL`     | `info`     | Logging level                                         |

---

## Agents

Three read-only agents are included:

| Agent                    | Description                                                |
|--------------------------|------------------------------------------------------------|
| `FeatureSuggestionAgent` | Summarizes telemetry + feedback into prioritized backlog   |
| `QACheckAgent`           | Runs lint/test commands and reports pass/fail              |
| `ReleaseNotesAgent`      | Generates release notes from PR titles or a changelog      |

---

## Safety Model

This platform uses a **human-in-the-loop** approach:

1. **Read-only agents only** - All agents produce text/JSON output; they do not write to external systems.
2. **Policy gate** - The `PolicyEvaluator` in `agents/src/policy.ts` blocks all "write" actions.
   A human must update the policy after a safety review to enable write actions.
3. **CI gates** - Every PR must pass lint, type-check, unit tests, and `npm audit` before merge.
4. **No auto-merge** - GitHub Actions flags issues but never merges automatically.

---

## Repository Structure

```
/
├── backend/         Node.js + TypeScript API service
│   ├── src/
│   │   ├── config.ts
│   │   ├── index.ts
│   │   ├── middleware/      API key auth
│   │   ├── persistence/     IStore, MemoryStore, SupabaseStore (stub)
│   │   └── routes/          health, events, feedback, agent
│   └── tests/
├── agents/          Agent runner framework + sample agents
│   ├── src/
│   │   ├── IAgent.ts        Agent interface
│   │   ├── policy.ts        Policy/evaluation gate
│   │   ├── runner.ts        AgentRunner
│   │   ├── registry.ts      Agent registry
│   │   └── agents/          FeatureSuggestionAgent, QACheckAgent, ReleaseNotesAgent
│   └── tests/
├── infra/           Docker Compose + Kubernetes manifests
│   ├── docker-compose.yml
│   └── k8s/
├── docs/            Architecture + operating procedures + spec
└── .github/
    └── workflows/   CI pipeline (lint + test + security)
```

---

## Running Tests

```bash
# Backend
cd backend && npm test

# Agents
cd agents && npm test
```

---

## Documentation

- [Architecture](docs/architecture.md) - system design, agents, persistence, CI/CD
- [Operating Procedures](docs/operating-procedures.md) - runbooks, env vars, rollback
- [Platform Spec](docs/spec.md) - original vision and feature roadmap
