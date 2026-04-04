# Architecture — Nexus Ultra Platforms

## Overview

The platform is organized into three main packages:

```
/
├── backend/      Node.js + TypeScript API service (Express)
├── agents/       Agent runner framework and sample agents
├── infra/        Docker Compose + Kubernetes manifests
└── docs/         This documentation
```

## Backend Service

A stateless HTTP API that:
1. Ingests **telemetry events** and **user feedback** into a pluggable persistence store.
2. Exposes a secured `/agent/run` endpoint to trigger agent workflows.
3. Returns structured JSON for all responses.

### Persistence Abstraction

| Adapter        | Status       | Notes                              |
|----------------|--------------|------------------------------------|
| `MemoryStore`  | ✅ Included  | Default for local dev / tests      |
| `SupabaseStore`| 🔧 Stub      | Requires `SUPABASE_URL` + key env  |
| `MongoStore`   | 🔧 Stub      | Requires `MONGO_URI` env           |

The `IStore` interface is defined in `backend/src/persistence/IStore.ts`.

## Agent Framework

Agents implement the `IAgent` interface:

```typescript
interface IAgent {
  name: string;
  description: string;
  inputSchema: Record<string, string>;
  run(input: AgentInput): Promise<AgentResult>;
}
```

### Included Agents

| Agent                  | Type      | Description                                    |
|------------------------|-----------|------------------------------------------------|
| `FeatureSuggestionAgent` | Read-only | Summarizes telemetry + feedback → backlog items|
| `QACheckAgent`         | Read-only | Runs lint/test command and reports results     |
| `ReleaseNotesAgent`    | Read-only | Generates release notes from PR titles/changelog|

### Evaluation Gate

Before any agent "write" action is executed, the `PolicyEvaluator` must return `PASS`.
In this initial scaffold **all agents are read-only** and write actions are disabled entirely.

```
AgentRunner.run(agentName, input)
  → PolicyEvaluator.evaluate(action)
    → PASS  → execute read-only agent
    → BLOCK → return error (no write actions allowed yet)
```

## Security Model

- `/agent/run` is protected by an `X-API-Key` header checked against `API_KEY` env var.
- No secrets are committed to the repository; use `.env` files or environment injection.
- All "write" actions are disabled at the policy layer in this initial version.

## Human-in-the-Loop Workflow

```
Agent produces suggestion
  → Stored as a GitHub Issue draft (future) OR returned as JSON
  → Human reviews and approves
  → PR opened manually (or via future automation with human approval)
  → CI runs lint + tests
  → Human merges
```

No code is auto-merged or auto-deployed without human approval.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):
1. `npm ci` — install dependencies
2. `npm run lint` — ESLint
3. `npm test` — Jest unit tests
4. `npm audit --audit-level=high` — security scan

Runs on every PR and push to `main`.
