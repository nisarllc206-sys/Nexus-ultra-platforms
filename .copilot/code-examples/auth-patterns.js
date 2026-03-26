/**
 * auth-patterns.js
 * Copilot code-example: Firebase Authentication helper patterns
 * for Nexus Ultra Platforms.
 */

const admin = require('firebase-admin');

/**
 * Verifies a Firebase ID token from the Authorization header.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing token' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('[verifyFirebaseToken] error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

/**
 * Checks whether the authenticated user has a specific role claim.
 * @param {string} role - Required role (e.g. 'admin').
 * @returns {import('express').RequestHandler}
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyFirebaseToken, requireRole };
