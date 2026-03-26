/**
 * auth.js — Firebase Authentication Module
 * Handles email/password auth, Google OAuth, and auth state management.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─── Firebase config (uses env vars via build tool or window globals) ───────
const firebaseConfig = {
  apiKey:            window.FIREBASE_API_KEY            || 'YOUR_FIREBASE_API_KEY',
  authDomain:        window.FIREBASE_AUTH_DOMAIN        || 'YOUR_PROJECT.firebaseapp.com',
  projectId:         window.FIREBASE_PROJECT_ID         || 'YOUR_PROJECT_ID',
  storageBucket:     window.FIREBASE_STORAGE_BUCKET     || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID|| 'YOUR_SENDER_ID',
  appId:             window.FIREBASE_APP_ID             || 'YOUR_APP_ID',
};

let app, auth, db, googleProvider;

try {
  app          = initializeApp(firebaseConfig);
  auth         = getAuth(app);
  db           = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
} catch (err) {
  console.warn('Firebase init skipped (config not set):', err.message);
}

// ─── Auth State Listener ─────────────────────────────────────────────────────
export function onAuthState(callback) {
  if (!auth) { callback(null); return; }
  return onAuthStateChanged(auth, callback);
}

// ─── Get Current User ────────────────────────────────────────────────────────
export function getCurrentUser() {
  return auth ? auth.currentUser : null;
}

// ─── Sign Up with Email & Password ───────────────────────────────────────────
export async function signUpWithEmail(email, password, displayName) {
  if (!auth) throw new Error('Firebase not initialized');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await createUserProfile(cred.user, { displayName });
  return cred.user;
}

// ─── Sign In with Email & Password ───────────────────────────────────────────
export async function signInWithEmail(email, password) {
  if (!auth) throw new Error('Firebase not initialized');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ─── Sign In with Google ──────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase not initialized');
  const result = await signInWithPopup(auth, googleProvider);
  await createUserProfile(result.user, {});
  return result.user;
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
  localStorage.removeItem('nexus_user_cache');
}

// ─── Create/Update User Profile in Firestore ─────────────────────────────────
export async function createUserProfile(user, extraData = {}) {
  if (!db || !user) return;
  const userRef = doc(db, 'users', user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      uid:         user.uid,
      email:       user.email,
      displayName: user.displayName || extraData.displayName || 'Creator',
      photoURL:    user.photoURL    || null,
      plan:        'free',
      usageCount:  0,
      createdAt:   serverTimestamp(),
      ...extraData,
    });
  }
  return userRef;
}

// ─── Get User Profile from Firestore ─────────────────────────────────────────
export async function getUserProfile(uid) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

// ─── Update User Profile ──────────────────────────────────────────────────────
export async function updateUserProfile(uid, data) {
  if (!db) return;
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── UI Auth State Sync ───────────────────────────────────────────────────────
export function syncAuthUI(user) {
  const loggedOutEls = document.querySelectorAll('[data-auth="logged-out"]');
  const loggedInEls  = document.querySelectorAll('[data-auth="logged-in"]');
  const userNameEls  = document.querySelectorAll('[data-auth-name]');
  const userEmailEls = document.querySelectorAll('[data-auth-email]');

  loggedOutEls.forEach(el => el.classList.toggle('hidden', !!user));
  loggedInEls.forEach(el  => el.classList.toggle('hidden', !user));

  if (user) {
    userNameEls.forEach(el  => { el.textContent = user.displayName || 'Creator'; });
    userEmailEls.forEach(el => { el.textContent = user.email || ''; });
    localStorage.setItem('nexus_user_cache', JSON.stringify({
      uid:         user.uid,
      displayName: user.displayName,
      email:       user.email,
    }));
  }
}

// ─── Wire up auth forms on index.html ────────────────────────────────────────
function wireAuthForms() {
  const emailLoginForm  = document.getElementById('emailLoginForm');
  const emailSignupForm = document.getElementById('emailSignupForm');
  const googleLoginBtn  = document.getElementById('googleLoginBtn');
  const googleSignupBtn = document.getElementById('googleSignupBtn');
  const authModal       = document.getElementById('authModal');

  function closeModal() { authModal && authModal.classList.remove('active'); }
  function showError(formEl, msg) {
    let err = formEl.querySelector('.form-error');
    if (!err) {
      err = document.createElement('p');
      err.className = 'form-error';
      err.style.cssText = 'color:var(--color-danger);font-size:0.8rem;margin-top:8px;';
      formEl.appendChild(err);
    }
    err.textContent = msg;
    setTimeout(() => { err.textContent = ''; }, 5000);
  }

  if (emailLoginForm) {
    emailLoginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const btn = emailLoginForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
      try {
        await signInWithEmail(email, password);
        closeModal();
        window.location.href = 'dashboard.html';
      } catch (err) {
        showError(emailLoginForm, getAuthErrorMessage(err.code));
        btn.disabled = false; btn.textContent = 'Log In';
      }
    });
  }

  if (emailSignupForm) {
    emailSignupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name     = document.getElementById('signupName').value.trim();
      const email    = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const btn = emailSignupForm.querySelector('button[type="submit"]');
      btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';
      try {
        await signUpWithEmail(email, password, name);
        closeModal();
        window.location.href = 'dashboard.html';
      } catch (err) {
        showError(emailSignupForm, getAuthErrorMessage(err.code));
        btn.disabled = false; btn.textContent = 'Create Account';
      }
    });
  }

  [googleLoginBtn, googleSignupBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
      try {
        await signInWithGoogle();
        closeModal();
        window.location.href = 'dashboard.html';
      } catch (err) {
        console.error('Google auth error:', err);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-brands fa-google"></i> Continue with Google';
      }
    });
  });
}

// ─── Auth Error Messages ──────────────────────────────────────────────────────
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use':    'This email is already registered.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user':    'Sign-in popup was closed.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  };
  return messages[code] || 'Authentication failed. Please try again.';
}

// ─── Initialize ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  wireAuthForms();

  // Apply saved theme
  const theme = localStorage.getItem('theme') || 'dark';
  document.body.setAttribute('data-theme', theme);

  // Sync UI on auth state change
  if (auth) {
    onAuthStateChanged(auth, user => {
      syncAuthUI(user);
      // Redirect unauthenticated users away from dashboard
      if (!user && window.location.pathname.includes('dashboard')) {
        // Allow viewing without auth for demo purposes
        // window.location.href = 'index.html';
      }
    });
  }
});

export { auth, db };
