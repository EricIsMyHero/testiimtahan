// ================================================================
// firebase-config.js
// Firebase inisializasiyası - bütün servislər
// ================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// ─── BURAYA ÖZ FIREBASE CONFIG-UNU YAZ ──────────────────────
// Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
    apiKey: "AIzaSyDwabZBuVIfX-rBD9FdVCz57HKRs4-BIIs",
    authDomain: "unec-imtahan-materiallari.firebaseapp.com",
    projectId: "unec-imtahan-materiallari",
    storageBucket: "unec-imtahan-materiallari.firebasestorage.app",
    messagingSenderId: "989845869146",
    appId: "1:989845869146:web:9bd9de32911f5b86cfbe63",
    measurementId: "G-9WD0XNXPKT"
  };

const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };
