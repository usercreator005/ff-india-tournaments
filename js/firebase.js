// js/firebase.js
// Firebase v9 (MODULAR) – FINAL, SAFE & PRODUCTION READY

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* =========================
   FIREBASE CONFIG
========================= */
const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyBqr60ogeNe3jVXEDsLK-LlwWNk-AOuKfo",
  authDomain: "ff-india-tournaments-dfdde.firebaseapp.com",
  projectId: "ff-india-tournaments-dfdde",
  storageBucket: "ff-india-tournaments-dfdde.appspot.com",
  messagingSenderId: "299074643361",
  appId: "1:299074643361:web:2522e682e06ad8f2b797e0"
});

/* =========================
   INIT FIREBASE (SAFE)
========================= */
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

/* =========================
   AUTH SETUP
========================= */
const auth = getAuth(app);

// Persist login even after refresh / app background
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Silent fail (Safari private / restricted browsers)
});

/* =========================
   EXPORTS
========================= */
export { app, auth };
