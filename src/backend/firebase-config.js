/**
 * firebase-config.js — Firebase Admin SDK Configuration
 * Used by Cloud Functions and backend services.
 */

const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {
  if (initialized) return admin;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential:   admin.credential.cert(serviceAccount),
      databaseURL:  process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Auto-detect credentials in Cloud Run / GCE environments
    admin.initializeApp({
      credential:   admin.credential.applicationDefault(),
      projectId:    process.env.FIREBASE_PROJECT_ID,
      databaseURL:  process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.warn('Firebase Admin: No credentials found. Using emulator or limited functionality.');
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'nexus-ultra-dev',
    });
  }

  initialized = true;
  return admin;
}

const firebaseAdmin = initFirebase();
const db            = firebaseAdmin.firestore();
const auth          = firebaseAdmin.auth();
const storage       = firebaseAdmin.storage();

// ─── Firestore Helper Utilities ───────────────────────────────────────────────
const Firestore = {
  /**
   * Get a user document by UID.
   */
  async getUser(uid) {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  },

  /**
   * Update user document fields.
   */
  async updateUser(uid, data) {
    await db.collection('users').doc(uid).set({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  },

  /**
   * Save a content generation record.
   */
  async saveContent(uid, contentData) {
    const docRef = db.collection('users').doc(uid)
                     .collection('content').doc();
    await docRef.set({
      ...contentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get content history for a user (paginated).
   */
  async getContentHistory(uid, { limit = 20, startAfter = null } = {}) {
    let q = db.collection('users').doc(uid)
               .collection('content')
               .orderBy('createdAt', 'desc')
               .limit(limit);
    if (startAfter) q = q.startAfter(startAfter);
    const snap = await q.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  /**
   * Increment usage counter atomically.
   */
  async incrementUsage(uid) {
    await db.collection('users').doc(uid).update({
      usageCount:   admin.firestore.FieldValue.increment(1),
      monthlyUsage: admin.firestore.FieldValue.increment(1),
    });
  },

  /**
   * Get a user's current plan and usage.
   */
  async getUserPlanAndUsage(uid) {
    const user = await this.getUser(uid);
    return {
      plan:         user?.plan         || 'free',
      usageCount:   user?.usageCount   || 0,
      monthlyUsage: user?.monthlyUsage || 0,
    };
  },

  /**
   * Save Stripe subscription info.
   */
  async saveSubscription(uid, subscriptionData) {
    await db.collection('users').doc(uid).set({
      stripeCustomerId:     subscriptionData.customerId,
      stripeSubscriptionId: subscriptionData.subscriptionId,
      plan:                 subscriptionData.plan,
      planStatus:           subscriptionData.status,
      currentPeriodEnd:     subscriptionData.currentPeriodEnd,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  },

  /**
   * Save a WhatsApp lead.
   */
  async saveLead(leadData) {
    const docRef = await db.collection('leads').add({
      ...leadData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  },
};

// ─── Auth Utilities ───────────────────────────────────────────────────────────
const Auth = {
  /**
   * Verify a Firebase ID token.
   */
  async verifyIdToken(idToken) {
    return auth.verifyIdToken(idToken);
  },

  /**
   * Get user record by UID.
   */
  async getUserRecord(uid) {
    return auth.getUser(uid);
  },
};

module.exports = { admin, db, auth, storage, Firestore, Auth };
