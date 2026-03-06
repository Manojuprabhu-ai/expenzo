import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
// XLSX loaded via SheetJS CDN

const CATEGORIES = [
  { name: "Daily Expenses", icon: "🧾", color: "#f97316" },
  { name: "Grocery", icon: "🥦", color: "#22c55e" },
  { name: "Shopping", icon: "🛍️", color: "#ec4899" },
  { name: "Rent", icon: "🏠", color: "#3b82f6" },
  { name: "Fuel", icon: "⛽", color: "#f59e0b" },
  { name: "Travel", icon: "✈️", color: "#06b6d4" },
  { name: "Other", icon: "✏️", color: "#a78bfa" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const initialExpenses = [
  {
    id: 1,
    amount: 850,
    category: "Daily Expenses",
    date: new Date().toISOString().split("T")[0],
    note: "Canteen lunch",
  },
  {
    id: 2,
    amount: 500,
    category: "Grocery",
    date: new Date().toISOString().split("T")[0],
    note: "Vegetables & fruits",
  },
  {
    id: 3,
    amount: 2200,
    category: "Fuel",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    note: "Petrol refill",
  },
];

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      return triggerShake("Please fill in all fields.");
    }

    try {
      if (mode === "register") {
        if (!name.trim()) return triggerShake("Please enter your name.");
        if (password.length < 6)
          return triggerShake("Password must be at least 6 characters.");

        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        // Save name to Firebase profile
        await updateProfile(cred.user, { displayName: name.trim() });

        // Continue to app
        onLogin({
          uid: cred.user.uid,
          name: name.trim(),
          email: cred.user.email,
        });
      } else {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        onLogin({
          uid: cred.user.uid,
          name: cred.user.displayName || "User",
          email: cred.user.email,
        });
      }
    } catch (e) {
      console.log("Firebase auth error:", e.code, e.message);
      triggerShake(e?.message || "Login failed.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f0",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .auth-card { animation: fadeUp 0.35s cubic-bezier(.22,.68,0,1.1); }
        .shake-card { animation: shake 0.45s ease; }
        input:focus { border-color: #f59e0b !important; outline: none; }
        .auth-btn { transition: all 0.18s; }
        .auth-btn:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div
        className={`auth-card${shake ? " shake-card" : ""}`}
        style={{
          width: "100%",
          maxWidth: 390,
          background: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 8px 40px #00000012, 0 2px 8px #00000008",
          padding: "40px 32px 36px",
          border: "1px solid #00000010",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1a14",
            }}
          >
            Expenzo
          </div>
          <div style={{ fontSize: 12, color: "#aaaaaa", marginTop: 4 }}>
            Your personal expense tracker
          </div>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: "#f0efe8",
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                background: mode === m ? "#ffffff" : "transparent",
                color: mode === m ? "#1a1a14" : "#8a8a80",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: mode === m ? 600 : 400,
                boxShadow: mode === m ? "0 1px 4px #00000012" : "none",
                transition: "all 0.18s",
              }}
            >
              {m === "login" ? "Login" : "Register"}
            </button>
          ))}
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6b7260",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              Full Name
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Your name"
              style={{
                width: "100%",
                background: "#f7f6f1",
                border: "1.5px solid #00000015",
                borderRadius: 12,
                padding: "13px 16px",
                fontSize: 15,
                fontFamily: "inherit",
                color: "#1a1a14",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7260",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="you@example.com"
            style={{
              width: "100%",
              background: "#f7f6f1",
              border: "1.5px solid #00000015",
              borderRadius: 12,
              padding: "13px 16px",
              fontSize: 15,
              fontFamily: "inherit",
              color: "#1a1a14",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7260",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Password
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder={
                mode === "register" ? "Min 6 characters" : "Enter password"
              }
              style={{
                width: "100%",
                background: "#f7f6f1",
                border: "1.5px solid #00000015",
                borderRadius: 12,
                padding: "13px 44px 13px 16px",
                fontSize: 15,
                fontFamily: "inherit",
                color: "#1a1a14",
                boxSizing: "border-box",
              }}
            />
            <span
              onClick={() => setShowPw((v) => !v)}
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 17,
                cursor: "pointer",
                opacity: 0.5,
                userSelect: "none",
              }}
            >
              {showPw ? "🙈" : "👁️"}
            </span>
          </div>
        </div>

        {error && (
          <div
            style={{
              fontSize: 11,
              color: "#ef4444",
              marginBottom: 10,
              marginTop: 4,
            }}
          >
            {error}
          </div>
        )}

        <button
          className="auth-btn"
          onClick={handleSubmit}
          style={{
            width: "100%",
            background: "#f59e0b",
            border: "none",
            borderRadius: 13,
            padding: "14px",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            marginTop: 12,
          }}
        >
          {mode === "login" ? "Login →" : "Create Account →"}
        </button>

        {mode === "login" && (
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#cccccc",
              marginTop: 18,
            }}
          >
            Demo: <span style={{ color: "#f59e0b" }}>demo@expenzo.com</span> /{" "}
            <span style={{ color: "#f59e0b" }}>expenzo123</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile Section ───────────────────────────────────────────────────────────
function ProfileSection({ currentUser, onLogout, isDark, setIsDark }) {
  const T = isDark
    ? {
        bg: "#0c0c0f",
        card: "#13131a",
        card2: "#1a1a26",
        text: "#e8e4dc",
        textMuted: "#6b7280",
        textFaint: "#374151",
        border: "#ffffff0a",
        inputBg: "#1e1e28",
      }
    : {
        bg: "#f5f5f0",
        card: "#ffffff",
        card2: "#f0efe8",
        text: "#1a1a14",
        textMuted: "#6b7260",
        textFaint: "#aaaaaa",
        border: "#00000010",
        inputBg: "#f7f6f1",
      };
  const [name, setName] = useState(currentUser.name || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    currentUser.name = name.trim();
    currentUser.email = email.trim();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const avatar = name.trim()
    ? name
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div>
      {/* Avatar card */}
      <div
        style={{
          background: T.card,
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          padding: "28px 20px",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 700,
            color: "#fff",
            margin: "0 auto 14px",
            boxShadow: "0 4px 16px #f59e0b33",
          }}
        >
          {avatar}
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 20,
            fontWeight: 700,
            color: T.text,
          }}
        >
          {currentUser.name}
        </div>
        <div style={{ fontSize: 12, color: "#aaaaaa", marginTop: 4 }}>
          {currentUser.email}
        </div>
      </div>

      {/* Edit profile */}
      <div
        style={{
          background: T.card,
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          padding: "20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#aaaaaa",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 16,
          }}
        >
          Edit Profile
        </div>

        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7260",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 6,
            }}
          >
            Full Name
          </div>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Your full name"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              color: T.text,
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7260",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 6,
            }}
          >
            Email
          </div>
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSaved(false);
            }}
            type="email"
            placeholder="you@example.com"
            style={{
              width: "100%",
              background: T.inputBg,
              border: `1.5px solid ${T.border}`,
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 14,
              fontFamily: "inherit",
              color: T.text,
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            width: "100%",
            background: saved ? "#22c55e" : "#f59e0b",
            border: "none",
            borderRadius: 12,
            padding: "13px",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {saved ? "✓ Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Theme toggle */}
      <div
        style={{
          background: T.card,
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          padding: "20px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textFaint,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          Appearance
        </div>
        <div
          style={{
            display: "flex",
            background: isDark ? "#1a1a26" : "#f0efe8",
            borderRadius: 12,
            padding: 4,
          }}
        >
          {[
            ["light", "☀️ Light"],
            ["dark", "🌙 Dark"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setIsDark(mode === "dark")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 9,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                background:
                  (mode === "dark") === isDark
                    ? isDark
                      ? "#2e2e3e"
                      : "#ffffff"
                    : "transparent",
                color:
                  (mode === "dark") === isDark
                    ? isDark
                      ? "#f0ece4"
                      : "#1a1a14"
                    : T.textMuted,
                fontWeight: (mode === "dark") === isDark ? 700 : 400,
                fontSize: 13,
                boxShadow:
                  (mode === "dark") === isDark ? "0 1px 4px #00000018" : "none",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div
        style={{
          background: T.card,
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          padding: "20px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textFaint,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 14,
          }}
        >
          Account
        </div>

        {!showLogoutConfirm ? (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: "100%",
              background: "#fff0f0",
              border: "1.5px solid #ef444422",
              borderRadius: 12,
              padding: "13px",
              color: "#ef4444",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            🚪 Log Out
          </button>
        ) : (
          <div>
            <div
              style={{
                fontSize: 13,
                color: T.textMuted,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Are you sure you want to log out?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  background: T.card2,
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  color: T.textMuted,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1,
                  background: "#ef4444",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExpenseTracker() {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const [expenses, setExpenses] = useState([]);
  const [viewDate, setViewDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [activeTab, setActiveTab] = useState("calendar");
  const [selectedCalDate, setSelectedCalDate] = useState(todayStr);

  // Single-step popup: { date, amount, category, note }
  const [popup, setPopup] = useState(null);
  const [drawerDate, setDrawerDate] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [budget, setBudget] = useState(null);
  const [exportModal, setExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const amountRef = useRef(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "users", currentUser.uid, "expenses"),
      orderBy("date", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rows = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setExpenses(rows);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email,
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── Theme tokens ──────────────────────────────────────────
  const T = isDark
    ? {
        bg: "#0c0c0f",
        card: "#13131a",
        card2: "#1a1a26",
        header: "linear-gradient(160deg,#1c1c24 0%,#0c0c0f 100%)",
        text: "#e8e4dc",
        textMuted: "#6b7280",
        textFaint: "#374151",
        border: "#ffffff0a",
        border2: "#ffffff06",
        inputBg: "#1e1e28",
        tabActive: "#f59e0b",
        tabInactive: "transparent",
        tabTextInactive: "#6b7280",
        btnNav: "#1e1e28",
        btnNavText: "#6b7280",
        overlay: "#000000b8",
        delBtnHover: "opacity:1",
        selectBg: "#1e1e28",
        calCellHover: "#1a1a24",
        scrollThumb: "#f59e0b44",
        handleBar: "#2e2e3e",
      }
    : {
        bg: "#f5f5f0",
        card: "#ffffff",
        card2: "#f0efe8",
        header: "linear-gradient(160deg,#e8e7e0 0%,#f5f5f0 100%)",
        text: "#1a1a14",
        textMuted: "#6b7260",
        textFaint: "#aaaaaa",
        border: "#00000010",
        border2: "#00000008",
        inputBg: "#f7f6f1",
        tabActive: "#f59e0b",
        tabInactive: "transparent",
        tabTextInactive: "#6b7260",
        btnNav: "#eaeae4",
        btnNavText: "#6b7260",
        overlay: "#00000055",
        delBtnHover: "opacity:1",
        selectBg: "#f0efe8",
        calCellHover: "#f7f6f1",
        scrollThumb: "#f59e0b44",
        handleBar: "#c8c7c0",
      };

  useEffect(() => {
    if (!window.XLSX) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (popup) setTimeout(() => amountRef.current?.focus(), 120);
  }, [popup?.date]);

  /* ── derived ── */
  const expensesByDate = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [expenses]);

  const daysInMonth = useMemo(() => {
    const { year, month } = viewDate;
    return {
      firstDay: new Date(year, month, 1).getDay(),
      totalDays: new Date(year, month + 1, 0).getDate(),
    };
  }, [viewDate]);

  const monthTotal = useMemo(
    () =>
      expenses
        .filter((e) => {
          const d = new Date(e.date + "T00:00:00");
          return (
            d.getFullYear() === viewDate.year && d.getMonth() === viewDate.month
          );
        })
        .reduce((s, e) => s + e.amount, 0),
    [expenses, viewDate]
  );

  const categoryTotals = useMemo(() => {
    const { year, month } = viewDate;
    const out = Object.fromEntries(CATEGORIES.map((c) => [c.name, 0]));
    expenses.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month)
        out[e.category] = (out[e.category] || 0) + e.amount;
    });
    return out;
  }, [expenses, viewDate]);

  const getCellDate = (day) =>
    `${viewDate.year}-${String(viewDate.month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

  const getDayTotal = (dateStr) =>
    (expensesByDate[dateStr] || []).reduce((s, e) => s + e.amount, 0);

  const maxDayTotal = useMemo(() => {
    let max = 0;
    for (let d = 1; d <= daysInMonth.totalDays; d++) {
      const t = getDayTotal(getCellDate(d));
      if (t > max) max = t;
    }
    return max;
  }, [daysInMonth, expensesByDate, viewDate]);

  // Running total for selected date+category
  const existingCatTotal = useMemo(() => {
    if (!popup) return 0;
    return (expensesByDate[popup.date] || [])
      .filter((e) => e.category === popup.category)
      .reduce((s, e) => s + e.amount, 0);
  }, [popup, expensesByDate]);

  /* ── actions ── */
  const openPopup = (dateStr) =>
    setPopup({
      date: dateStr,
      amount: "",
      category: "Daily Expenses",
      note: "",
      editId: null,
    });

  const openEditPopup = (exp) =>
    setPopup({
      date: exp.date,
      amount: String(exp.amount),
      category: exp.category,
      note: exp.note,
      editId: exp.id,
    });

  const handleAdd = async () => {
    const amt = parseFloat(popup.amount);
    if (amt === null || isNaN(amt) || amt < 0 || popup.amount === "") return;
    if (!currentUser?.uid) return;

    if (popup.editId) {
      await updateDoc(
        doc(db, "users", currentUser.uid, "expenses", popup.editId),
        {
          amount: amt,
          category: popup.category,
          note: popup.note.trim(),
          date: popup.date,
          updatedAt: serverTimestamp(),
        }
      );
      setPopup(null);
    } else {
      await addDoc(collection(db, "users", currentUser.uid, "expenses"), {
        amount: amt,
        category: popup.category,
        note: popup.note.trim(),
        date: popup.date,
        createdAt: serverTimestamp(),
      });
      setPopup((p) => ({ ...p, amount: "", note: "", editId: null }));
      setTimeout(() => amountRef.current?.focus(), 50);
    }
  };

  const handleDelete = async (id) => {
    if (!currentUser?.uid) return;
    await deleteDoc(doc(db, "users", currentUser.uid, "expenses", id));
  };

  const doExport = (from, to) => {
    if (!from || !to) return;

    const filtered = expenses.filter((e) => e.date >= from && e.date <= to);

    const dateMap = {};
    filtered.forEach((e) => {
      if (!dateMap[e.date]) dateMap[e.date] = { entries: [], dayTotal: 0 };
      dateMap[e.date].entries.push(e);
      dateMap[e.date].dayTotal += e.amount;
    });

    const fmtDate = (dateStr) => {
      const d = new Date(dateStr + "T00:00:00");
      return `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const rows = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { entries, dayTotal }]) => {
        const labels = entries.map((e) =>
          e.category === "Other" ? e.note || "Other" : e.category
        );

        return {
          Date: fmtDate(date),
          Category: [...new Set(labels)].join(", "),
          "Total Expense (₹)": dayTotal,
        };
      });

    if (rows.length === 0) {
      alert("No expenses found in this date range!");
      return;
    }

    const XLSX = window.XLSX;
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 40 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `Expenzo_${from}_to_${to}.xlsx`);

    setExportModal(false);
  };
  /* ── selected category object ── */
  const popupCat = popup
    ? CATEGORIES.find((c) => c.name === popup.category)
    : null;
  const enteredAmt =
    popup && popup.amount !== "" ? parseFloat(popup.amount) ?? 0 : null;
  const newTotal = existingCatTotal + (enteredAmt ?? 0);

  if (!currentUser) {
    return <AuthScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        color: T.text,
        overflowX: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #f59e0b44; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .cal-cell { transition: background 0.12s; cursor: pointer; }
        .cal-cell:hover { background: ${
          isDark ? "#1a1a24" : "#f7f6f1"
        } !important; }
        .tab-btn { transition: all 0.18s; border: none; cursor: pointer; font-family: inherit; }
        .del-btn { cursor: pointer; opacity: 0.4; transition: opacity 0.15s; }
        .del-btn:hover { opacity: 1; }
        .view-link { cursor: pointer; color: #f59e0b66; font-size: 8px; transition: color 0.15s; line-height: 1; }
        .view-link:hover { color: #f59e0b; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input, select, textarea { outline: none; }
        input:focus, select:focus, textarea:focus { border-color: #f59e0b !important; }
        input[type=date] { color-scheme: ${isDark ? "dark" : "light"}; }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .sheet   { animation: slideUp 0.22s cubic-bezier(.22,.68,0,1.2); }
        .overlay { animation: fadeIn  0.15s ease; }
        select option { background: ${isDark ? "#1e1e28" : "#f0efe8"}; color: ${
        isDark ? "#e8e4dc" : "#1a1a14"
      }; }
      `}</style>

      {/* ── Header ── */}
      <div
        style={{
          background: T.header,
          borderBottom: `1px solid ${T.border}`,
          padding: "22px 20px 0",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 27,
                  fontWeight: 700,
                  color: "#1a1a14",
                  letterSpacing: "-0.5px",
                }}
              >
                Expenzo
              </div>
              <div style={{ fontSize: 11, color: "#8a8a80", marginTop: 3 }}>
                Tap any date to log an expense
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#aaaaaa",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 3,
                }}
              >
                This Month
              </div>
              <div
                style={{
                  fontSize: 23,
                  fontWeight: 700,
                  color: "#f59e0b",
                  marginBottom: 6,
                }}
              >
                {formatCurrency(monthTotal)}
              </div>
              <button
                onClick={() => {
                  const now = new Date().toISOString().split("T")[0];
                  const monthStart = `${viewDate.year}-${String(
                    viewDate.month + 1
                  ).padStart(2, "0")}-01`;

                  setExportFrom(monthStart);
                  setExportTo(now);
                  setExportModal(true);
                }}
                style={{
                  background: "#1a2e1a",
                  border: "1px solid #22c55e44",
                  borderRadius: 8,
                  padding: "5px 10px",
                  color: "#22c55e",
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginLeft: "auto",
                }}
              >
                <span style={{ fontSize: 12 }}>📊</span> Export Excel
              </button>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: isDark ? "#ffffff10" : "#00000010",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {[
              ["calendar", "📅 Calendar"],
              ["stats", "📊 Analysis"],
              ["profile", "👤 Profile"],
            ].map(([t, label]) => (
              <button
                key={t}
                className="tab-btn"
                onClick={() => setActiveTab(t)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  background: activeTab === t ? "#f59e0b" : "transparent",
                  color: activeTab === t ? "#fff" : T.tabTextInactive,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 80px" }}
      >
        {activeTab === "calendar" ? (
          <>
            {/* Month nav */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <button
                onClick={() =>
                  setViewDate((v) => {
                    const d = new Date(v.year, v.month - 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                style={{
                  background: T.btnNav,
                  border: "none",
                  color: T.btnNavText,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ‹
              </button>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                {MONTHS[viewDate.month]} {viewDate.year}
              </div>
              <button
                onClick={() =>
                  setViewDate((v) => {
                    const d = new Date(v.year, v.month + 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                style={{
                  background: T.btnNav,
                  border: "none",
                  color: T.btnNavText,
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ›
              </button>
            </div>

            {/* Calendar */}
            <div
              style={{
                background: T.card,
                borderRadius: 16,
                border: `1px solid ${T.border}`,
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                  borderBottom: "1px solid #0000000e",
                }}
              >
                {DAYS.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      padding: "9px 0",
                      fontSize: 9,
                      color: "#6b7260",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                }}
              >
                {Array.from({ length: daysInMonth.firstDay }).map((_, i) => (
                  <div
                    key={`e${i}`}
                    style={{
                      minHeight: 60,
                      borderRight: "1px solid #00000008",
                      borderBottom: "1px solid #00000008",
                    }}
                  />
                ))}
                {Array.from({ length: daysInMonth.totalDays }).map((_, i) => {
                  const day = i + 1;
                  const cellDate = getCellDate(day);
                  const dayTotal = getDayTotal(cellDate);
                  const isToday = cellDate === todayStr;
                  const isActive = popup?.date === cellDate;
                  const intensity =
                    maxDayTotal > 0 ? dayTotal / maxDayTotal : 0;

                  return (
                    <div
                      key={day}
                      className="cal-cell"
                      onClick={() => {
                        setSelectedCalDate(cellDate);
                        openPopup(cellDate);
                      }}
                      style={{
                        minHeight: 60,
                        padding: "7px 4px 5px",
                        borderRight: "1px solid #00000008",
                        borderBottom: "1px solid #00000008",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background:
                          selectedCalDate === cellDate
                            ? "#f59e0b0d"
                            : "transparent",
                        outline:
                          selectedCalDate === cellDate
                            ? "1px inset #f59e0b33"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: isToday ? 700 : 400,
                          background: isToday ? "#f59e0b" : "transparent",
                          color: isToday ? "#f5f5f0" : "#8a8a80",
                        }}
                      >
                        {day}
                      </div>
                      {expensesByDate[cellDate]?.length > 0 && (
                        <>
                          <div
                            style={{
                              marginTop: 4,
                              width: 28,
                              height: 3,
                              borderRadius: 2,
                              background:
                                dayTotal === 0
                                  ? "#aaaaaa"
                                  : `rgba(245,158,11,${0.2 + intensity * 0.8})`,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 10,
                              color: dayTotal === 0 ? "#8a8a80" : "#f59e0b",
                              marginTop: 2,
                              fontWeight: 700,
                            }}
                          >
                            {dayTotal === 0
                              ? "₹0"
                              : dayTotal >= 1000
                              ? `${(dayTotal / 1000).toFixed(1)}k`
                              : dayTotal}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Selected date detail panel ── */}
            {selectedCalDate &&
              (() => {
                const dayExps = expensesByDate[selectedCalDate] || [];
                const dayTotal = getDayTotal(selectedCalDate);
                const selDateLabel = new Date(
                  selectedCalDate + "T00:00:00"
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <div
                    style={{
                      marginTop: 16,
                      background: "#ffffff",
                      border: "1px solid #00000012",
                      borderRadius: 16,
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1a1a14",
                          }}
                        >
                          {selDateLabel}
                        </div>
                        {dayExps.length > 0 && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#8a8a80",
                              marginTop: 2,
                            }}
                          >
                            Total:{" "}
                            <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                              {formatCurrency(dayTotal)}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCalDate(selectedCalDate);
                          openPopup(selectedCalDate);
                        }}
                        style={{
                          background: "#f59e0b18",
                          border: "1px solid #f59e0b44",
                          borderRadius: 8,
                          padding: "5px 10px",
                          color: "#f59e0b",
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        + Add
                      </button>
                    </div>

                    {dayExps.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🌿</div>
                        <div style={{ fontSize: 13, color: "#aaaaaa" }}>
                          No expense updated yet
                        </div>
                      </div>
                    ) : (
                      (() => {
                        // Group by category key (category name, or "Other::<note>" for Other entries)
                        const grouped = {};
                        dayExps.forEach((exp) => {
                          const key =
                            exp.category === "Other"
                              ? `Other::${exp.note || "Other"}`
                              : exp.category;
                          if (!grouped[key])
                            grouped[key] = {
                              key,
                              category: exp.category,
                              note: exp.note,
                              amount: 0,
                              ids: [],
                            };
                          grouped[key].amount += exp.amount;
                          grouped[key].ids.push(exp.id);
                        });
                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {Object.values(grouped).map((grp) => {
                              const cat =
                                CATEGORIES.find(
                                  (c) => c.name === grp.category
                                ) || CATEGORIES[0];
                              return (
                                <div
                                  key={grp.key}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    background: "#f7f6f1",
                                    borderRadius: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 9,
                                      background: cat.color + "18",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 16,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {cat.icon}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#555550",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {grp.category === "Other" && grp.note
                                        ? grp.note
                                        : grp.category}
                                    </div>
                                    {grp.ids.length > 1 && (
                                      <div
                                        style={{
                                          fontSize: 9,
                                          color: "#aaaaaa",
                                          marginTop: 1,
                                        }}
                                      >
                                        {grp.ids.length} entries
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color:
                                        grp.amount === 0
                                          ? "#8a8a80"
                                          : "#f59e0b",
                                      marginRight: 8,
                                    }}
                                  >
                                    {grp.amount === 0
                                      ? "₹0"
                                      : formatCurrency(grp.amount)}
                                  </div>
                                  <span
                                    className="del-btn"
                                    onClick={() =>
                                      openEditPopup(
                                        dayExps.find((e) =>
                                          grp.ids.includes(e.id)
                                        )
                                      )
                                    }
                                    style={{ fontSize: 13, opacity: 0.4 }}
                                  >
                                    ✏️
                                  </span>
                                  <span
                                    className="del-btn"
                                    onClick={() =>
                                      grp.ids.forEach((id) => handleDelete(id))
                                    }
                                    style={{ fontSize: 13 }}
                                  >
                                    🗑️
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              })()}
          </>
        ) : activeTab === "stats" ? (
          <>
            {/* Analysis */}
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 26,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              {MONTHS[viewDate.month]} Analysis
            </div>

            {/* ── Budget Panel ── */}
            {(() => {
              const balance = budget !== null ? budget - monthTotal : null;
              const avgDailyBudget =
                budget !== null ? budget / daysInMonth.totalDays : null;
              // Count distinct days with expenses this month
              const daysWithExpenses = new Set(
                expenses
                  .filter((e) => {
                    const d = new Date(e.date + "T00:00:00");
                    return (
                      d.getFullYear() === viewDate.year &&
                      d.getMonth() === viewDate.month
                    );
                  })
                  .map((e) => e.date)
              ).size;
              const expectedByNow =
                avgDailyBudget !== null
                  ? avgDailyBudget * daysWithExpenses
                  : null;
              const isOverspending =
                expectedByNow !== null && monthTotal > expectedByNow;
              const spentPct = budget
                ? Math.min((monthTotal / budget) * 100, 100)
                : 0;

              return (
                <div
                  style={{
                    background: T.card,
                    border: `1px solid ${T.border}`,
                    borderRadius: 20,
                    padding: "18px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#aaaaaa",
                      marginBottom: 20,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Monthly Budget
                  </div>

                  {/* Three fields */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    {/* Budget input */}
                    <div
                      style={{
                        background: T.card2,
                        borderRadius: 14,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "#8a8a80",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}
                      >
                        Budget
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, color: "#f59e0b66" }}>
                          ₹
                        </span>
                        <input
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              parseFloat(budgetInput) > 0
                            )
                              setBudget(parseFloat(budgetInput));
                          }}
                          placeholder="0"
                          style={{
                            flex: 1,
                            background: "none",
                            border: "none",
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#f59e0b",
                            fontFamily: "inherit",
                            width: "100%",
                            minWidth: 0,
                          }}
                        />
                      </div>
                      {budget !== null && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "#8a8a80",
                            marginTop: 4,
                          }}
                        >
                          Set: {formatCurrency(budget)}
                        </div>
                      )}
                    </div>

                    {/* Total Expense */}
                    <div
                      style={{
                        background: T.card2,
                        borderRadius: 12,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#8a8a80",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}
                      >
                        Spent
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: isOverspending ? "#ef4444" : "#f59e0b",
                        }}
                      >
                        {formatCurrency(monthTotal)}
                      </div>
                      <div
                        style={{ fontSize: 9, color: "#aaaaaa", marginTop: 4 }}
                      >
                        this month
                      </div>
                    </div>

                    {/* Balance */}
                    <div
                      style={{
                        background: T.card2,
                        borderRadius: 12,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#8a8a80",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          marginBottom: 6,
                        }}
                      >
                        Balance
                      </div>
                      {balance !== null ? (
                        <>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: balance >= 0 ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {formatCurrency(Math.abs(balance))}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: balance >= 0 ? "#22c55e66" : "#ef444466",
                              marginTop: 4,
                            }}
                          >
                            {balance >= 0 ? "remaining" : "over budget"}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "#aaaaaa" }}>—</div>
                      )}
                    </div>
                  </div>

                  {/* Submit budget button */}
                  <button
                    onClick={() => {
                      if (parseFloat(budgetInput) > 0)
                        setBudget(parseFloat(budgetInput));
                    }}
                    style={{
                      width: "100%",
                      background: "#f59e0b18",
                      border: "1px solid #f59e0b44",
                      borderRadius: 10,
                      padding: "10px",
                      color: "#f59e0b",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      marginBottom: budget !== null ? 16 : 0,
                      transition: "all 0.2s",
                    }}
                  >
                    Current Status
                  </button>

                  {/* Progress bar + smart comment */}
                  {budget !== null && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <div
                          style={{
                            height: 6,
                            background: "#eaeae4",
                            borderRadius: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${spentPct}%`,
                              background: isOverspending
                                ? "#ef4444"
                                : spentPct > 90
                                ? "#ef4444"
                                : spentPct > 70
                                ? "#f59e0b"
                                : "#22c55e",
                              borderRadius: 4,
                              transition: "width 0.5s ease",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 5,
                          }}
                        >
                          <span style={{ fontSize: 9, color: "#aaaaaa" }}>
                            ₹0
                          </span>
                          <span style={{ fontSize: 9, color: "#aaaaaa" }}>
                            {spentPct.toFixed(0)}% used
                          </span>
                          <span style={{ fontSize: 9, color: "#aaaaaa" }}>
                            {formatCurrency(budget)}
                          </span>
                        </div>
                      </div>

                      {/* Smart comment based on pace */}
                      {daysWithExpenses > 0 &&
                        (() => {
                          let emoji, headline, sub, bg, border;
                          if (isOverspending) {
                            emoji = "🚨";
                            headline = "Overspending!";
                            sub = `You've spent ${formatCurrency(
                              monthTotal
                            )} in ${daysWithExpenses} day${
                              daysWithExpenses > 1 ? "s" : ""
                            }, but your ${daysWithExpenses}-day budget allowance is only ${formatCurrency(
                              Math.round(expectedByNow)
                            )}.`;
                            bg = "#fde8e8";
                            border = "#ef444444";
                          } else if (spentPct > 90) {
                            emoji = "⚠️";
                            headline = "Almost at limit!";
                            sub = `Only ${formatCurrency(
                              balance
                            )} left for the rest of the month.`;
                            bg = "#fef3cd";
                            border = "#f59e0b44";
                          } else if (spentPct > 70) {
                            emoji = "👀";
                            headline = "Watch your spending";
                            sub = `You've used ${spentPct.toFixed(
                              0
                            )}% of your budget. Pace yourself.`;
                            bg = "#e8f5e9";
                            border = "#eab30844";
                          } else {
                            emoji = "✅";
                            headline = "You're on track!";
                            sub = `Great job — spending is within your ${daysWithExpenses}-day budget pace of ${formatCurrency(
                              Math.round(expectedByNow)
                            )}.`;
                            bg = "#dcf5e4";
                            border = "#22c55e44";
                          }
                          return (
                            <div
                              style={{
                                background: bg,
                                border: `1px solid ${border}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#2a2a20",
                                  marginBottom: 4,
                                }}
                              >
                                {emoji} {headline}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#6b7260",
                                  lineHeight: 1.5,
                                }}
                              >
                                {sub}
                              </div>
                            </div>
                          );
                        })()}
                    </>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          <>
            {/* ── Profile Tab ── */}
            <ProfileSection
              currentUser={currentUser}
              onLogout={() => setCurrentUser(null)}
              isDark={isDark}
              setIsDark={setIsDark}
            />
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          QUICK-ENTRY POPUP
          Amount input first → category dropdown below
         ══════════════════════════════════════════ */}
      {popup && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopup(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: T.overlay,
            backdropFilter: "blur(8px)",
            zIndex: 60,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            className="sheet"
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: T.card,
              borderRadius: "24px 24px 0 0",
              border: `1px solid ${T.border}`,
              padding: "16px 20px 44px",
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "#c8c7c0",
                  borderRadius: 2,
                }}
              />
              {popup.editId && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: -4,
                    background: "#a78bfa22",
                    border: "1px solid #a78bfa55",
                    borderRadius: 6,
                    padding: "3px 8px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#a78bfa",
                    letterSpacing: 0.5,
                  }}
                >
                  ✏️ EDIT MODE
                </div>
              )}
            </div>

            {/* Date + close */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#8a8a80",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 6,
                  }}
                >
                  Date
                </div>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#eaeae4",
                      border: "1.5px solid #f59e0b44",
                      borderRadius: 10,
                      padding: "7px 12px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📅</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#1a1a14",
                      }}
                    >
                      {new Date(popup.date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    <span style={{ fontSize: 10, color: "#f59e0b88" }}>▾</span>
                  </div>
                  <input
                    type="date"
                    value={popup.date}
                    onChange={(e) =>
                      e.target.value &&
                      setPopup((p) => ({ ...p, date: e.target.value }))
                    }
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      zIndex: 2,
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "#8a8a80", marginTop: 6 }}>
                  Day total:{" "}
                  <span style={{ color: "#f59e0b" }}>
                    {formatCurrency(getDayTotal(popup.date))}
                  </span>
                </div>
              </div>
              <span
                onClick={() => setPopup(null)}
                style={{
                  cursor: "pointer",
                  color: "#aaaaaa",
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ✕
              </span>
            </div>

            {/* ── AMOUNT INPUT (primary, big) ── */}
            <div
              style={{
                background: T.card2,
                borderRadius: 18,
                border: `1px solid ${T.border}`,
                padding: "20px 20px 16px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#aaaaaa",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 12,
                }}
              >
                {popup.editId ? "Edit Amount" : "Enter Amount"}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 30,
                    color: "#f59e0b66",
                    fontWeight: 700,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ₹
                </span>
                <input
                  ref={amountRef}
                  type="number"
                  value={popup.amount}
                  onChange={(e) =>
                    setPopup((p) => ({ ...p, amount: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdd();
                  }}
                  placeholder="0"
                  style={{
                    flex: 1,
                    background: "none",
                    border: "none",
                    fontSize: 42,
                    fontWeight: 700,
                    color: "#f59e0b",
                    fontFamily: "inherit",
                    minWidth: 0,
                  }}
                />
              </div>

              {/* Running sum preview */}
              {enteredAmt !== null &&
                enteredAmt >= 0 &&
                existingCatTotal > 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid #00000010",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#8a8a80" }}>
                      {formatCurrency(existingCatTotal)} +{" "}
                      {formatCurrency(enteredAmt)} =
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: popupCat?.color || "#f59e0b",
                      }}
                    >
                      {formatCurrency(newTotal)}
                    </span>
                  </div>
                )}
              {enteredAmt !== null &&
                enteredAmt >= 0 &&
                existingCatTotal === 0 && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: "1px solid #00000010",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#8a8a80" }}>
                      Adding
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: popupCat?.color || "#f59e0b",
                      }}
                    >
                      {formatCurrency(enteredAmt)}
                    </span>
                  </div>
                )}
            </div>

            {/* ── CATEGORY DROPDOWN ── */}
            <div style={{ marginBottom: popup.category === "Other" ? 12 : 16 }}>
              <div
                style={{
                  fontSize: 9,
                  color: "#aaaaaa",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 8,
                }}
              >
                Category
              </div>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 18,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                >
                  {popupCat?.icon}
                </div>
                <select
                  value={popup.category}
                  onChange={(e) =>
                    setPopup((p) => ({
                      ...p,
                      category: e.target.value,
                      note: "",
                    }))
                  }
                  style={{
                    width: "100%",
                    background: T.card2,
                    border: `1.5px solid ${popupCat?.color || T.border}`,
                    borderRadius: 12,
                    padding: "13px 16px 13px 44px",
                    color: T.text,
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "inherit",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8a8a80",
                    pointerEvents: "none",
                    fontSize: 12,
                  }}
                >
                  ▾
                </div>
              </div>

              {existingCatTotal > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#8a8a80",
                    marginTop: 6,
                    paddingLeft: 4,
                  }}
                >
                  {popupCat?.icon} Already logged today:{" "}
                  <span style={{ color: popupCat?.color }}>
                    {formatCurrency(existingCatTotal)}
                  </span>
                </div>
              )}
            </div>

            {/* ── INLINE NOTE — only shown when "Other" is selected ── */}
            {popup.category === "Other" && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: "#a78bfa88",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    marginBottom: 8,
                  }}
                >
                  What is it?{" "}
                  <span style={{ color: "#aaaaaa" }}>(type your own note)</span>
                </div>
                <input
                  value={popup.note}
                  onChange={(e) =>
                    setPopup((p) => ({ ...p, note: e.target.value }))
                  }
                  placeholder="e.g. Petrol, Medicine, Rent…"
                  style={{
                    width: "100%",
                    background: "#ede8f8",
                    border: "1.5px solid #a78bfa55",
                    borderRadius: 12,
                    padding: "13px 14px",
                    color: "#3a3a30",
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                />
              </div>
            )}

            {/* ── ADD BUTTON ── */}
            <button
              onClick={handleAdd}
              disabled={enteredAmt === null || enteredAmt < 0}
              style={{
                width: "100%",
                background:
                  enteredAmt !== null
                    ? popupCat?.color || "#f59e0b"
                    : "#eaeae4",
                border: "none",
                borderRadius: 14,
                padding: "15px",
                color: enteredAmt !== null ? "#fff" : "#c8c7c0",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: enteredAmt !== null ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                letterSpacing: 0.3,
              }}
            >
              {popup.editId
                ? enteredAmt !== null
                  ? `Save ${formatCurrency(enteredAmt)}`
                  : "Update Amount"
                : enteredAmt !== null
                ? enteredAmt === 0
                  ? "Submit ₹0 (No Expense)"
                  : `Add ${formatCurrency(enteredAmt)}`
                : "Enter an amount to add"}
            </button>
          </div>
        </div>
      )}
      {/* ── Export Date Range Modal ── */}
      {exportModal && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setExportModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: T.overlay,
            backdropFilter: "blur(8px)",
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="sheet"
            style={{
              width: "100%",
              maxWidth: 400,
              background: T.card,
              borderRadius: 24,
              border: `1px solid ${T.border}`,
              padding: "28px 24px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  Export to Excel
                </div>
                <div style={{ fontSize: 12, color: T.textFaint, marginTop: 3 }}>
                  Select a date range to export
                </div>
              </div>
              <span
                onClick={() => setExportModal(false)}
                style={{ cursor: "pointer", color: T.textFaint, fontSize: 20 }}
              >
                ✕
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  From
                </div>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  style={{
                    width: "100%",
                    background: T.card2,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 12,
                    padding: "11px 12px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: T.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    marginBottom: 8,
                  }}
                >
                  To
                </div>
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  style={{
                    width: "100%",
                    background: T.card2,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 12,
                    padding: "11px 12px",
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: T.text,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {[
                [
                  "This Month",
                  () => {
                    const s = `${viewDate.year}-${String(
                      viewDate.month + 1
                    ).padStart(2, "0")}-01`;
                    const e = new Date(viewDate.year, viewDate.month + 1, 0)
                      .toISOString()
                      .split("T")[0];
                    setExportFrom(s);
                    setExportTo(e);
                  },
                ],
                [
                  "Last 7 Days",
                  () => {
                    const e = new Date().toISOString().split("T")[0];
                    const s = new Date(Date.now() - 6 * 86400000)
                      .toISOString()
                      .split("T")[0];
                    setExportFrom(s);
                    setExportTo(e);
                  },
                ],
                [
                  "Last 30 Days",
                  () => {
                    const e = new Date().toISOString().split("T")[0];
                    const s = new Date(Date.now() - 29 * 86400000)
                      .toISOString()
                      .split("T")[0];
                    setExportFrom(s);
                    setExportTo(e);
                  },
                ],
              ].map(([label, fn]) => (
                <button
                  key={label}
                  onClick={fn}
                  style={{
                    background: T.card2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 500,
                    color: T.textMuted,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => doExport(exportFrom, exportTo)}
              disabled={!exportFrom || !exportTo || exportFrom > exportTo}
              style={{
                width: "100%",
                background:
                  !exportFrom || !exportTo || exportFrom > exportTo
                    ? T.card2
                    : "#22c55e",
                border: "none",
                borderRadius: 14,
                padding: "14px",
                color:
                  !exportFrom || !exportTo || exportFrom > exportTo
                    ? T.textFaint
                    : "#fff",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor:
                  !exportFrom || !exportTo || exportFrom > exportTo
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
              }}
            >
              📊 Download Excel
            </button>
          </div>
        </div>
      )}
      {/* ══════════════════
          DAY DETAIL DRAWER
         ══════════════════ */}
      {drawerDate && (
        <div
          className="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerDate(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: T.overlay,
            backdropFilter: "blur(8px)",
            zIndex: 60,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div
            className="sheet"
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: "#ffffff",
              borderRadius: "24px 24px 0 0",
              border: "1px solid #00000010",
              padding: "18px 20px 42px",
              maxHeight: "65vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  background: "#c8c7c0",
                  borderRadius: 2,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {formatDate(drawerDate)}
                </div>
                <div style={{ fontSize: 11, color: "#6b7260", marginTop: 2 }}>
                  Total:{" "}
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                    {formatCurrency(getDayTotal(drawerDate))}
                  </span>
                </div>
              </div>
              <span
                onClick={() => setDrawerDate(null)}
                style={{ cursor: "pointer", color: "#aaaaaa", fontSize: 20 }}
              >
                ✕
              </span>
            </div>
            {(expensesByDate[drawerDate] || []).length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#aaaaaa",
                  fontSize: 13,
                  padding: "30px 0",
                }}
              >
                No expenses recorded
              </div>
            ) : (
              (expensesByDate[drawerDate] || []).map((exp) => {
                const cat =
                  CATEGORIES.find((c) => c.name === exp.category) ||
                  CATEGORIES[0];
                return (
                  <div
                    key={exp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      paddingBottom: 12,
                      marginBottom: 12,
                      borderBottom: "1px solid #0000000c",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: cat.color + "18",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {cat.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#555550",
                          fontWeight: 500,
                        }}
                      >
                        {exp.category}
                      </div>
                      {exp.note && (
                        <div
                          style={{
                            fontSize: 10,
                            color: "#aaaaaa",
                            marginTop: 1,
                          }}
                        >
                          {exp.note}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: exp.amount === 0 ? "#8a8a80" : "#f59e0b",
                        marginRight: 8,
                      }}
                    >
                      {exp.amount === 0 ? "₹0" : formatCurrency(exp.amount)}
                    </div>
                    <span
                      className="del-btn"
                      onClick={() => {
                        handleDelete(exp.id);
                        if ((expensesByDate[drawerDate] || []).length <= 1)
                          setDrawerDate(null);
                      }}
                      style={{ fontSize: 14 }}
                    >
                      🗑️
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
