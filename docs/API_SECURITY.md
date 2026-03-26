# Nexus Ultra Platforms — API Security

## Authentication

All private API endpoints require one of the following:

- **Firebase ID Token** — passed as `Authorization: Bearer <token>`
- **API Key** — passed as `x-api-key: <key>` (server-to-server calls)

## Rate Limiting

| Tier | Endpoint pattern | Limit |
|------|-----------------|-------|
| Auth | `/auth/*` | 5 req / 15 min (failed only) |
| General API | `/api/*` | 100 req / 15 min |
| Public | `/public/*` | 30 req / 1 min |

Limits are enforced per IP address and tracked in Redis.

## Input Validation

All `POST` / `PUT` endpoints that accept user content must apply
`validateContentInput` from `src/middleware/input-validator.js`.

Validation rules:
- `title`: 1–500 characters, no HTML / script tags
- `content`: 1–10 000 characters, no HTML / script tags

## API Key Lifecycle

1. Keys are stored in the `api_keys` Firestore collection.
2. Each key has `active` (boolean) and optional `expiresAt` (timestamp) fields.
3. Inactive or expired keys are rejected with HTTP 401.
4. Keys should be rotated every 90 days.

## CORS

Cross-Origin Resource Sharing is restricted to:
- `https://nexus-ultra.com`
- `https://app.nexus-ultra.com`
- `https://admin.nexus-ultra.com`

Configure additional origins in `src/middleware/cors-config.js`.
