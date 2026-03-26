/**
 * firebase.js — Firebase Client Configuration
 * Provides Firebase config with environment variable support.
 * Safe for both server-side and client-side use.
 */

// ─── Firebase Web SDK Config ──────────────────────────────────────────────────
// These values are safe to expose client-side (not secrets).
// However, restrict access via Firebase Security Rules.
const FIREBASE_CONFIG = {
  apiKey:            process.env.FIREBASE_API_KEY             || process.env.NEXT_PUBLIC_FIREBASE_API_KEY             || 'YOUR_FIREBASE_API_KEY',
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN         || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         || 'your-project.firebaseapp.com',
  projectId:         process.env.FIREBASE_PROJECT_ID          || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID          || 'your-project-id',
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET      || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      || 'your-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId:             process.env.FIREBASE_APP_ID              || process.env.NEXT_PUBLIC_FIREBASE_APP_ID              || 'YOUR_APP_ID',
  measurementId:     process.env.FIREBASE_MEASUREMENT_ID      || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID      || '',
};

// ─── Firebase Admin SDK Config ────────────────────────────────────────────────
// Server-side only — NEVER expose these to the client.
const FIREBASE_ADMIN_CONFIG = {
  projectId:           process.env.FIREBASE_PROJECT_ID,
  clientEmail:         process.env.FIREBASE_CLIENT_EMAIL,
  privateKey:          (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  databaseURL:         process.env.FIREBASE_DATABASE_URL,
  storageBucket:       process.env.FIREBASE_STORAGE_BUCKET,
  serviceAccountJson:  process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
};

// ─── Firestore Collection Names ───────────────────────────────────────────────
const COLLECTIONS = {
  USERS:       'users',
  CONTENT:     'content',
  LEADS:       'leads',
  ANALYTICS:   'analytics',
  WEBHOOKS:    'webhooks',
};

// ─── Firebase Emulator Config ─────────────────────────────────────────────────
const EMULATOR_CONFIG = {
  enabled:   process.env.FIREBASE_EMULATOR === 'true' || process.env.NODE_ENV === 'development',
  auth:      { host: 'localhost', port: 9099 },
  firestore: { host: 'localhost', port: 8080 },
  functions: { host: 'localhost', port: 5001 },
  storage:   { host: 'localhost', port: 9199 },
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validateFirebaseConfig() {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const isDefault = required.some(k => FIREBASE_CONFIG[k].startsWith('YOUR_') || FIREBASE_CONFIG[k].startsWith('your-'));
  if (isDefault) {
    console.warn('⚠️  Firebase config contains placeholder values. Set environment variables before deploying.');
    return false;
  }
  return true;
}

// ─── Generate Client-Side Config Script ──────────────────────────────────────
// Used to inject config as window globals for static HTML pages.
function generateClientConfigScript() {
  return `<script>
window.FIREBASE_API_KEY             = "${FIREBASE_CONFIG.apiKey}";
window.FIREBASE_AUTH_DOMAIN         = "${FIREBASE_CONFIG.authDomain}";
window.FIREBASE_PROJECT_ID          = "${FIREBASE_CONFIG.projectId}";
window.FIREBASE_STORAGE_BUCKET      = "${FIREBASE_CONFIG.storageBucket}";
window.FIREBASE_MESSAGING_SENDER_ID = "${FIREBASE_CONFIG.messagingSenderId}";
window.FIREBASE_APP_ID              = "${FIREBASE_CONFIG.appId}";
window.STRIPE_PUBLIC_KEY            = "${process.env.STRIPE_PUBLIC_KEY || 'pk_test_YOUR_KEY'}";
</script>`;
}

module.exports = {
  FIREBASE_CONFIG,
  FIREBASE_ADMIN_CONFIG,
  COLLECTIONS,
  EMULATOR_CONFIG,
  validateFirebaseConfig,
  generateClientConfigScript,
};
