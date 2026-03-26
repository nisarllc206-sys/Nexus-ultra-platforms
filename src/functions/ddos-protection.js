/**
 * ddos-protection.js
 * Firebase-backed DDoS activity tracker.
 * Tracks per-IP request counts and flags excessive traffic patterns.
 */

'use strict';

const admin = require('firebase-admin');
const { logSecurityEvent } = require('./security-events');

const REQUEST_THRESHOLD = 100;
const TIME_WINDOW_SECONDS = 60;

/**
 * Tracks request activity for a given IP address.
 * Returns 'BLOCK' when the IP exceeds the request threshold within the
 * time window, or 'ALLOW' otherwise.
 *
 * @param {string} ip  - Client IP address.
 * @returns {Promise<'ALLOW'|'BLOCK'>}
 */
async function trackSuspiciousActivity(ip) {
  const db = admin.firestore();
  const now = new Date();
  const activityRef = db.collection('ip_activity').doc(ip);
  const activityDoc = await activityRef.get();

  if (activityDoc.exists) {
    const data = activityDoc.data();
    const lastSeen = data.lastSeen.toDate();
    const timeDiffSeconds = (now - lastSeen) / 1000;

    if (timeDiffSeconds < TIME_WINDOW_SECONDS && data.requestCount > REQUEST_THRESHOLD) {
      await logSecurityEvent({
        type: 'DDOS_ATTEMPT',
        ip,
        requestCount: data.requestCount,
        timestamp: now
      });
      return 'BLOCK';
    }

    await activityRef.update({
      requestCount: admin.firestore.FieldValue.increment(1),
      lastSeen: now
    });
  } else {
    await activityRef.set({
      ip,
      requestCount: 1,
      firstSeen: now,
      lastSeen: now,
      blocked: false
    });
  }

  return 'ALLOW';
}

module.exports = { trackSuspiciousActivity };
