// ================================================================
// db-service.js  —  Phase 2: Firestore Database Xidməti
// users, progress, gpa, study_sessions, teacher_reviews, quiz_results
// ================================================================

import { db } from "./scripts/firebase-config.js";
import {
  doc, getDoc, setDoc, updateDoc, addDoc, getDocs,
  collection, query, where, orderBy, limit,
  serverTimestamp, increment, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ══════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════

export async function getUser(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

// ══════════════════════════════════════════════════════════════
// PROGRESS
// ══════════════════════════════════════════════════════════════

export async function getProgress(uid) {
  const snap = await getDoc(doc(db, "progress", uid));
  return snap.exists() ? snap.data() : null;
}

export async function updateProgress(uid, updates) {
  await updateDoc(doc(db, "progress", uid), updates);
}

// XP əlavə et + rank yenilə
export async function addXP(uid, amount) {
  const ref  = doc(db, "progress", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const current = snap.data().xp || 0;
  const newXP   = current + amount;
  const newRank = calcRank(newXP);

  await updateDoc(ref, { xp: increment(amount), rank: newRank });
  return { newXP, newRank, gained: amount };
}

function calcRank(xp) {
  if (xp < 100)  return "Freshman";
  if (xp < 300)  return "Scholar";
  if (xp < 700)  return "Analyst";
  if (xp < 1500) return "Expert";
  if (xp < 3000) return "Master";
  return "Professor";
}

export const RANKS = ["Freshman","Scholar","Analyst","Expert","Master","Professor"];

export function rankToXP(rank) {
  const thresholds = { Freshman:0, Scholar:100, Analyst:300, Expert:700, Master:1500, Professor:3000 };
  return thresholds[rank] || 0;
}

// ══════════════════════════════════════════════════════════════
// GPA
// ══════════════════════════════════════════════════════════════

export async function getGPA(uid) {
  const snap = await getDoc(doc(db, "gpa", uid));
  return snap.exists() ? snap.data() : { current: null, history: [] };
}

// GPA yadda saxla + tarixçəyə əlavə et
export async function saveGPA(uid, gpaValue) {
  const ref   = doc(db, "gpa", uid);
  const entry = { value: gpaValue, date: new Date().toISOString().split("T")[0] };

  await setDoc(ref, {
    current: gpaValue,
    history: arrayUnion(entry)
  }, { merge: true });
}

// ══════════════════════════════════════════════════════════════
// STUDY SESSIONS
// ══════════════════════════════════════════════════════════════

// Yeni study session əlavə et (PDF oxuma, timer)
export async function addStudySession(uid, { subject, duration, type = "study" }) {
  await addDoc(collection(db, "study_sessions"), {
    uid,
    subject,
    duration, // saniyə
    type,     // "pdf" | "timer" | "quiz"
    date:      new Date().toISOString().split("T")[0],
    timestamp: serverTimestamp()
  });
}

// İstifadəçinin bu gün study etdiyini yoxla (streak üçün)
export async function hasStudyToday(uid) {
  const today = new Date().toISOString().split("T")[0];
  const q = query(
    collection(db, "study_sessions"),
    where("uid",  "==", uid),
    where("date", "==", today),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

// ══════════════════════════════════════════════════════════════
// TEACHER REVIEWS
// ══════════════════════════════════════════════════════════════

export async function addTeacherReview(uid, { teacher, rating, comment, subject }) {
  await addDoc(collection(db, "teacher_reviews"), {
    uid, teacher, rating, comment, subject,
    timestamp: serverTimestamp()
  });
}

export async function getTeacherReviews(teacher) {
  const q = query(
    collection(db, "teacher_reviews"),
    where("teacher", "==", teacher),
    orderBy("timestamp", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ══════════════════════════════════════════════════════════════
// QUIZ RESULTS
// ══════════════════════════════════════════════════════════════

export async function saveQuizResult(uid, { subject, score, total, mistakes }) {
  await addDoc(collection(db, "quiz_results"), {
    uid, subject, score, total, mistakes,
    percentage: Math.round((score / total) * 100),
    timestamp:  serverTimestamp()
  });
}

export async function getUserQuizResults(uid, limitN = 20) {
  const q = query(
    collection(db, "quiz_results"),
    where("uid", "==", uid),
    orderBy("timestamp", "desc"),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Analytics helpers ─────────────────────────────────────────
// Hansı fənn çox açılır
export async function logSubjectOpen(uid, subject) {
  await addStudySession(uid, { subject, duration: 0, type: "pdf_open" });
}

// Hansı quizdə səhv çoxdur
export async function getTopMistakes(uid) {
  const results = await getUserQuizResults(uid, 50);
  const map = {};
  results.forEach(r => {
    if (!map[r.subject]) map[r.subject] = 0;
    map[r.subject] += (r.total - r.score);
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, mistakes]) => ({ subject, mistakes }));
}
