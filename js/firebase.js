// js/firebase.js
// Firebase v9 (MODULAR) – FINAL & SAFE VERSION

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqr60ogeNe3jVXEDsLK-LlwWNk-AOuKfo",
  authDomain: "ff-india-tournaments-dfdde.firebaseapp.com",
  projectId: "ff-india-tournaments-dfdde",
  storageBucket: "ff-india-tournaments-dfdde.appspot.com",
  messagingSenderId: "299074643361",
  appId: "1:299074643361:web:2522e682e06ad8f2b797e0"
};

// Initialize Firebase ONLY ONCE
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Export what is needed
export { app, auth };
