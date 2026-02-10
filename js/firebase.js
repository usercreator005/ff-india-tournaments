// js/firebase.js
// FIREBASE CORE – STABLE AUTH FOUNDATION (PHASE 1 READY)

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyBqr60ogeNe3jVXEDsLK-LlwWNk-AOuKfo",
  authDomain: "ff-india-tournaments-dfdde.firebaseapp.com",
  projectId: "ff-india-tournaments-dfdde",
  storageBucket: "ff-india-tournaments-dfdde.appspot.com",
  messagingSenderId: "299074643361",
  appId: "1:299074643361:web:2522e682e06ad8f2b797e0"
});

/* ================= INIT APP (SAFE RELOAD SUPPORT) ================= */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

/* ================= AUTH SETUP ================= */
const auth = getAuth(app);

// Keep admin logged in after refresh / tab close
setPersistence(auth, browserLocalPersistence).catch(() => {
  console.warn("Auth persistence not available in this browser");
});

/* ================= AUTH STATE DEBUG (DEV HELPER) ================= */
// Helps detect silent logout issues during admin panel usage
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth restored:", user.uid);
  } else {
    console.log("No active auth session");
  }
});

/* ================= EXPORTS ================= */
export { app, auth };
