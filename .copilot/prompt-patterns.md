# Nexus Ultra Platforms — Copilot Prompt Patterns

## Overview
This file guides GitHub Copilot suggestions for the Nexus Ultra Platforms codebase
by documenting preferred patterns, naming conventions, and code structures.

---

## Naming Conventions

- **Files**: `kebab-case.js` (e.g., `rate-limiter.js`, `api-key-auth.js`)
- **Functions**: `camelCase` (e.g., `validateApiKey`, `trackSuspiciousActivity`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `RATE_LIMIT_WINDOW`, `MAX_REQUESTS`)
- **Classes**: `PascalCase` (e.g., `SecurityManager`, `RateLimiter`)

---

## Function Signature Patterns

### Middleware functions
```javascript
/**
 * Express middleware — short description.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function middlewareName(req, res, next) { ... }
```

### Firebase helper functions
```javascript
/**
 * Reads / writes a Firestore document.
 * @param {string} collection - Firestore collection name.
 * @param {string} docId      - Document identifier.
 * @returns {Promise<Object>} - Resolved document data.
 */
async function firestoreHelper(collection, docId) { ... }
```

### Security utility functions
```javascript
/**
 * Validates and sanitises user input.
 * @param {string} input - Raw input string.
 * @returns {string}     - Sanitised string.
 */
function sanitize(input) { ... }
```

---

## Error Handling Pattern
```javascript
try {
  // operation
} catch (error) {
  console.error('[ModuleName] error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
}
```

---

## JSDoc Comment Style
Always include `@param`, `@returns`, and a one-line description for exported functions.

---

## Environment Variables
Access via `process.env.VARIABLE_NAME`; never hard-code secrets in source files.
