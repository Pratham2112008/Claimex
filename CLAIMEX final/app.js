// ===== CLAIMEX - Shared App Logic =====

// ========== CONFIG ==========
const GEMINI_API_KEY = "AQ.Ab8RN6LlN0UglN5i5gMuuuDnYCZO8GPjx0JfvMfStfePErlMFw";

const firebaseConfig = {
  apiKey: "AIzaSyAg3bNWnBl5wF0dtAWDk8rxOmRa3CkvUf8",
  authDomain: "claimex.firebaseapp.com",
  projectId: "claimex",
  storageBucket: "claimex.firebasestorage.app",
  messagingSenderId: "1045991829274",
  appId: "1:1045991829274:web:1ecd196b41f5d3f6efc6a3",
  measurementId: "G-Z4524FYZS4"
};
// ============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function initTheme() {
  const saved = localStorage.getItem("claimex-theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("claimex-theme", next);
    });
  }
}

function initCursor() {
  // Skip on touch / coarse pointers
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
    document.body.style.cursor = "auto";
    return;
  }

  const cursor = document.createElement("div");
  cursor.className = "cursor";
  document.body.appendChild(cursor);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let isHover = false;
  let isClick = false;
  let visible = false;

  cursor.style.opacity = "0";

  const interactive = "button, a, .role-card, .claim-item, .theme-toggle, input, select, textarea, .btn, .nav-link, .logo";

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!visible) {
      visible = true;
      cursor.style.opacity = "";
      cursorX = mouseX;
      cursorY = mouseY;
    }
  }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    isHover = !!e.target.closest(interactive);
  }, { passive: true });

  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.(interactive)) {
      isHover = false;
    }
  }, { passive: true });

  document.addEventListener("mousedown", () => { isClick = true; }, { passive: true });
  document.addEventListener("mouseup", () => { isClick = false; }, { passive: true });

  document.addEventListener("mouseleave", () => {
    cursor.style.opacity = "0";
  });
  document.addEventListener("mouseenter", () => {
    if (visible) cursor.style.opacity = "";
  });

  function tick() {
    cursorX += (mouseX - cursorX) * 0.4;
    cursorY += (mouseY - cursorY) * 0.4;

    cursor.style.transform =
      `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) scale(${isClick ? 0.5 : isHover ? 1.8 : 1})`;

    cursor.classList.toggle("hover", isHover);
    cursor.classList.toggle("click", isClick);

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function getSelectedRole() {
  return localStorage.getItem("claimex-role") || "employee";
}

function setSelectedRole(role) {
  localStorage.setItem("claimex-role", role);
}

async function handleSignup(email, password, name, role) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCred.user, { displayName: name });
  setSelectedRole(role);
  return userCred.user;
}

async function handleLogin(email, password, role) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  setSelectedRole(role);
  return userCred.user;
}

async function handleLogout() {
  await signOut(auth);
  localStorage.removeItem("claimex-role");
  window.location.href = "index.html";
}

async function analyzeClaimWithGemini(claimData) {
  const prompt = `You are an expert claims approval AI for a company expense system called Claimex.
Analyze this expense claim and decide if it should be AUTO-APPROVED or ESCALATED to a manager (PENDING).

Claim Details:
- Category: ${claimData.category}
- Amount: $${claimData.amount}
- Description: ${claimData.description}
- Date: ${claimData.date || "Not specified"}
- Receipt URL: ${claimData.receiptUrl || "None provided"}

Rules for AUTO-APPROVE:
- Amount under $750 AND category is reasonable (Meals, Travel, Office Supplies, Software)
- Description is clear and professional
- No red flags (personal items, luxury, vague wording)

Rules for PENDING (escalate):
- Amount >= $750
- Suspicious or vague description
- Category that needs review (Entertainment, Other)
- Missing important details

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "decision": "auto-approved" or "pending",
  "confidence": 0.0 to 1.0,
  "reason": "short explanation (1-2 sentences)",
  "risk_level": "low" or "medium" or "high"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
        })
      }
    );
    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return fallbackAnalysis(claimData);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini analysis failed:", err);
    return fallbackAnalysis(claimData);
  }
}

function fallbackAnalysis(claimData) {
  const amount = parseFloat(claimData.amount) || 0;
  if (amount < 750 && ["Meals", "Travel", "Office Supplies", "Software"].includes(claimData.category)) {
    return {
      decision: "auto-approved",
      confidence: 0.85,
      reason: "Amount is under threshold and category is standard. (Demo mode - add Gemini API key for real AI)",
      risk_level: "low"
    };
  }
  return {
    decision: "pending",
    confidence: 0.7,
    reason: "Amount or category requires manager review. (Demo mode - add Gemini API key for real AI)",
    risk_level: amount > 1500 ? "high" : "medium"
  };
}

async function submitClaim(claimData, user) {
  const analysis = await analyzeClaimWithGemini(claimData);
  const claim = {
    ...claimData,
    amount: parseFloat(claimData.amount),
    status: analysis.decision,
    aiReason: analysis.reason,
    aiConfidence: analysis.confidence,
    riskLevel: analysis.risk_level,
    employeeId: user.uid,
    employeeName: user.displayName || user.email,
    employeeEmail: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const docRef = await addDoc(collection(db, "claims"), claim);
  return { id: docRef.id, ...claim, analysis };
}

async function getEmployeeClaims(uid) {
  // No orderBy to avoid composite index requirement
  const q = query(collection(db, "claims"), where("employeeId", "==", uid));
  const snap = await getDocs(q);
  const claims = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort client-side
  claims.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    return tb - ta;
  });
  return claims;
}

async function getAllClaims() {
  const q = query(collection(db, "claims"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getPendingClaims() {
  const q = query(collection(db, "claims"), where("status", "==", "pending"));
  const snap = await getDocs(q);
  const claims = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  claims.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    const tb = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    return tb - ta;
  });
  return claims;
}

async function updateClaimStatus(claimId, newStatus) {
  await updateDoc(doc(db, "claims", claimId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    reviewedBy: "manager"
  });
}

function listenToClaims(callback) {
  const q = query(collection(db, "claims"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 5000);
}

function showLoading(show = true) {
  const overlay = document.querySelector(".loading-overlay");
  if (overlay) overlay.classList.toggle("show", show);
}

window.Claimex = {
  auth, db, initTheme, initCursor, handleSignup, handleLogin, handleLogout,
  submitClaim, getEmployeeClaims, getAllClaims, getPendingClaims, updateClaimStatus,
  listenToClaims, analyzeClaimWithGemini, formatDate, formatCurrency, showError,
  showLoading, getSelectedRole, setSelectedRole, onAuthStateChanged
};
