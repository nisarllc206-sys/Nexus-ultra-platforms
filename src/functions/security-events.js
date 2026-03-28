/**
 * security-events.js
 * Centralised security event logger backed by Firestore.
 * All security-relevant actions in the platform should be routed here.
 */

'use strict';

const admin = require('firebase-admin');

/**
 * Writes a structured security event to the `security_logs` collection.
 *
 * @param {Object} event            - Arbitrary event properties.
 * @param {string} event.type       - Event type identifier (e.g. 'DDOS_ATTEMPT').
 * @param {string} [event.ip]       - Source IP address if applicable.
 * @param {string} [event.userId]   - Affected user ID if applicable.
 * @returns {Promise<void>}
 */
async function logSecurityEvent(event) {
  try {
    const db = admin.firestore();
    await db.collection('security_logs').add({
      ...event,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('[logSecurityEvent] failed to write event:', error.message);
  }
}

module.exports = { logSecurityEvent };
