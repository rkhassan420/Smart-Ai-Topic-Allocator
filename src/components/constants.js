/* ══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
══════════════════════════════════════════════════════ */
export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const LS = {
  students:    "rta_students",
  topics:      "rta_topics",
  assignments: "rta_assignments",
  history:     "rta_history",
};

export const uid       = () => Math.random().toString(36).slice(2, 9);
export const toItems   = (arr) => arr.map((v) => ({ id: uid(), value: v }));
export const fromItems = (arr) => arr.map((i) => i.value);
export const load      = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
export const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));
