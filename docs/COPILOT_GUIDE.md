# Nexus Ultra Platforms — GitHub Copilot Guide

## Getting Started

1. Install the **GitHub Copilot** extension from `.vscode/extensions.json`.
2. Sign in with your GitHub account that has an active Copilot subscription.
3. Copilot is pre-configured via `.vscode/settings.json` and `.copilot/config.json`.

---

## Code Patterns

Reference implementations live in `.copilot/code-examples/`:

| File | Purpose |
|------|---------|
| `auth-patterns.js` | Firebase token verification, role checks |
| `api-patterns.js` | Express route handlers, standard response helpers |
| `firebase-patterns.js` | Firestore CRUD helpers |
| `security-patterns.js` | Input sanitisation, XSS protection |

---

## Naming Conventions

See `.copilot/prompt-patterns.md` for the full conventions reference.

- **Files**: `kebab-case.js`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Classes**: `PascalCase`

---

## Tips for Better Suggestions

- Write JSDoc comments above functions before implementing them — Copilot will
  infer parameter types and suggest the body.
- Keep functions short and single-purpose.
- Use descriptive variable names; avoid single-letter names outside loop counters.
- Add a one-line comment describing the intent before complex blocks.

---

## Disabling Copilot for Sensitive Files

In `.vscode/settings.json`, Copilot is disabled for `plaintext` and `markdown`
to avoid suggestions in documentation or plain-text config files that may
contain sensitive data.
