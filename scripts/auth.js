// ================================================================
// auth.js  —  Phase 2: Firebase Authentication
// Google login + Email/Password login
// ================================================================

import { auth, db } from "./scripts/firebase-config.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Auth State Observer ──────────────────────────────────────
export function watchAuthState(onLogin, onLogout) {
  onAuthStateChanged(auth, async user => {
    if (user) {
      await ensureUserDoc(user);
      onLogin(user);
    } else {
      onLogout();
    }
  });
}

// ── Google Login ──────────────────────────────────────────────
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(result.user);
    return { ok: true, user: result.user };
  } catch (err) {
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── Email Qeydiyyat ───────────────────────────────────────────
export async function registerWithEmail({ name, email, password, university, faculty }) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Firestore: users collection
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      university: university || "UNEC",
      faculty:    faculty    || "",
      createdAt:  serverTimestamp()
    });

    // İlk progress sənədi
    await setDoc(doc(db, "progress", cred.user.uid), {
      solvedTests: 0,
      streak:      0,
      lastActive:  serverTimestamp(),
      xp:          0,
      rank:        "Freshman"
    });

    return { ok: true, user: cred.user };
  } catch (err) {
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── Email Giriş ───────────────────────────────────────────────
export async function loginWithEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { ok: true, user: cred.user };
  } catch (err) {
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── Çıxış ────────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── Şifrə Yenilə ─────────────────────────────────────────────
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err.code) };
  }
}

// ── İstifadəçi sənədi yoxla / yarat ─────────────────────────
async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);

  if (!snap.exists()) {
    // İlk dəfə Google ilə daxil olan — profil yarat
    await setDoc(userRef, {
      name:       user.displayName || "Tələbə",
      email:      user.email,
      university: "UNEC",
      faculty:    "",
      createdAt:  serverTimestamp()
    });
    await setDoc(doc(db, "progress", user.uid), {
      solvedTests: 0,
      streak:      0,
      lastActive:  serverTimestamp(),
      xp:          0,
      rank:        "Freshman"
    });
  }
}

// ── Xəta mesajları (Azərbaycanca) ─────────────────────────────
function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":    "Bu e-poçt artıq istifadə olunur.",
    "auth/invalid-email":           "E-poçt ünvanı yanlışdır.",
    "auth/weak-password":           "Şifrə ən az 6 simvol olmalıdır.",
    "auth/user-not-found":          "Bu e-poçtla hesab tapılmadı.",
    "auth/wrong-password":          "Şifrə yanlışdır.",
    "auth/too-many-requests":       "Çox cəhd. Bir az gözləyin.",
    "auth/network-request-failed":  "İnternet bağlantısı yoxdur.",
    "auth/popup-closed-by-user":    "Giriş ləğv edildi.",
  };
  return map[code] || "Xəta baş verdi. Yenidən cəhd edin.";
}
