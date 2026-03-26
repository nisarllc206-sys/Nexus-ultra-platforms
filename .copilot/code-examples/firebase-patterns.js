/**
 * firebase-patterns.js
 * Copilot code-example: Firestore CRUD helper patterns
 * for Nexus Ultra Platforms.
 */

const admin = require('firebase-admin');

/**
 * Reads a single Firestore document.
 * @param {string} collection - Collection name.
 * @param {string} docId      - Document ID.
 * @returns {Promise<Object|null>} - Document data or null if not found.
 */
async function getDocument(collection, docId) {
  const db = admin.firestore();
  const doc = await db.collection(collection).doc(docId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/**
 * Creates or overwrites a Firestore document.
 * @param {string} collection - Collection name.
 * @param {string} docId      - Document ID.
 * @param {Object} data       - Data to write.
 * @returns {Promise<void>}
 */
async function setDocument(collection, docId, data) {
  const db = admin.firestore();
  await db.collection(collection).doc(docId).set({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Deletes a Firestore document.
 * @param {string} collection - Collection name.
 * @param {string} docId      - Document ID.
 * @returns {Promise<void>}
 */
async function deleteDocument(collection, docId) {
  const db = admin.firestore();
  await db.collection(collection).doc(docId).delete();
}

module.exports = { getDocument, setDocument, deleteDocument };
