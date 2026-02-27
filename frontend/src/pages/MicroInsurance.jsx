import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// ── helpers ──────────────────────────────────────────────────
const api = (path, opts = {}) =>
  axios({ url: `/api/insurance${path}`, ...opts });

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const riskColor = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#ef4444" };
const riskBg   = { LOW: "#f0fdf4", MEDIUM: "#fffbeb", HIGH: "#fef2f2" };
const riskBorder={ LOW: "#86efac", MEDIUM: "#fcd34d", HIGH: "#fca5a5" };

const confColor = (c) => c >= 70 ? "#22c55e" : c >= 45 ? "#f59e0b" : "#ef4444";

function Spinner() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:60 }}>
      <div style={{ width:28, height:28, border:"3px solid #e2e8f0",
        borderTop:"3px solid #3b82f6", borderRadius:"50%",
        animation:"spin 0.8s linear infinite" }} />
    </div>
  );
}

// ── Risk Gauge ────────────────────────────────────────────────
function RiskGauge({ score = 50 }) {
  const angle = -135 + (score / 100) * 270;
  const c = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg viewBox="0 0 120 80" style={{ width:160, overflow:"visible" }}>
      {/* Track arcs */}
      {[["#ef4444",0],[" #f59e0b",33],["#22c55e",67]].map(([col,start],i)=>(
        <path key={i} d={describeArc(60,70,48, -135+start*(270/100), -135+(start+(i<2?33:30))*(270/100))}
          fill="none" stroke={col} strokeWidth={7} strokeLinecap="round" opacity={0.3}/>
      ))}
      <path d={describeArc(60,70,48, -135, -135+(score/100)*270)}
        fill="none" stroke={c} strokeWidth={7} strokeLinecap="round"/>
      {/* needle */}
      <line x1="60" y1="70"
        x2={60+36*Math.cos(((angle-90)*Math.PI)/180)}
        y2={70+36*Math.sin(((angle-90)*Math.PI)/180)}
        stroke={c} strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx="60" cy="70" r="5" fill={c}/>
      <text x="60" y="58" textAnchor="middle" fontSize="13" fontWeight="bold" fill={c}>{score}</text>
      <text x="60" y="82" textAnchor="middle" fontSize="7" fill="#94a3b8">RISK SCORE</text>
    </svg>
  );
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const toRad = (d) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

// ── Countdown Timer ───────────────────────────────────────────
function Countdown({ endTime }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000));
    setRemaining(calc());
    const iv = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(iv);
  }, [endTime]);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span style={{ fontFamily:"monospace", fontSize:22, fontWeight:700, color:"#fff",
      letterSpacing:2 }}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

// ── USSD Widget ───────────────────────────────────────────────
function USSDWidget({ token }) {
  const [screen, setScreen] = useState("idle");
  const [display, setDisplay] = useState("");
  const [menuText, setMenuText] = useState("");
  const [path, setPath] = useState("");

  const dial = async (selection) => {
    const newPath = path ? `${path}*${selection}` : selection;
    setPath(newPath);
    try {
      const res = await api("/ussd", {
        method: "POST",
        headers: { ...authHeader(token), "Content-Type": "application/json" },
        data: { sessionId: "sim-" + Date.now(), phoneNumber: "0000000000", text: newPath },
      });
      const text = res.data;
      const isEnd = text.startsWith("END");
      const cleaned = text.replace(/^CON |^END /, "");
      setMenuText(cleaned);
      setScreen(isEnd ? "end" : "menu");
    } catch {
      setMenuText("Service unavailable. Retry later.");
      setScreen("end");
    }
  };

  const reset = () => { setScreen("idle"); setDisplay(""); setMenuText(""); setPath(""); };

  const handleKey = (k) => {
    if (screen === "idle") setDisplay((d) => d + k);
  };

  const handleDial = async () => {
    if (display === "*123#") { setDisplay(""); await dial(""); }
  };

  const menuLines = menuText.split("\n");
  const options = menuLines.filter((l) => /^\d+\./.test(l.trim()));
  const headerLines = menuLines.filter((l) => !/^\d+\./.test(l.trim()) && l.trim());

  return (
    <div style={{ background:"#1e293b", borderRadius:24, padding:24, width:240,
      boxShadow:"0 25px 60px rgba(0,0,0,0.4)", fontFamily:"monospace" }}>
      {/* Screen */}
      <div style={{ background:"#0f172a", borderRadius:12, padding:16, minHeight:130,
        marginBottom:16, border:"1px solid #334155" }}>
        {screen === "idle" && (
          <div>
            <div style={{ color:"#64748b", fontSize:10, marginBottom:6 }}>Dial Insurance Menu</div>
            <div style={{ color:"#22d3ee", fontSize:18, letterSpacing:2 }}>
              {display || <span style={{ color:"#334155" }}>*123#</span>}
            </div>
            <div style={{ color:"#475569", fontSize:9, marginTop:8 }}>Type *123# then press CALL</div>
          </div>
        )}
        {(screen === "menu" || screen === "end") && (
          <div>
            {headerLines.map((l,i) => (
              <div key={i} style={{ color: i===0?"#22d3ee":"#94a3b8",
                fontSize: i===0?11:9, marginBottom:3, fontWeight: i===0?"bold":"normal" }}>{l}</div>
            ))}
            {options.map((opt,i) => (
              <div key={i} style={{ color:"#e2e8f0", fontSize:9, marginBottom:2 }}>{opt}</div>
            ))}
            {screen==="end" && <div style={{ color:"#ef4444", fontSize:8, marginTop:6 }}>--- End ---</div>}
          </div>
        )}
      </div>
      {/* Keypad */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
          <button key={k} onClick={() => {
            if (screen === "menu" && options.length) { dial(k); }
            else handleKey(k);
          }} style={{ background:"#334155", color:"#e2e8f0", border:"none",
            borderRadius:8, padding:"10px 0", fontSize:14, cursor:"pointer",
            transition:"background 0.15s" }}
            onMouseEnter={e=>e.target.style.background="#475569"}
            onMouseLeave={e=>e.target.style.background="#334155"}>
            {k}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
        <button onClick={() => setDisplay(d => d.slice(0,-1))}
          style={{ background:"#7f1d1d", color:"#fca5a5", border:"none",
            borderRadius:8, padding:"8px 0", fontSize:11, cursor:"pointer" }}>⌫ DEL</button>
        {screen === "idle"
          ? <button onClick={handleDial}
              style={{ background:"#166534", color:"#86efac", border:"none",
                borderRadius:8, padding:"8px 0", fontSize:11, cursor:"pointer" }}>📞 CALL</button>
          : <button onClick={reset}
              style={{ background:"#7f1d1d", color:"#fca5a5", border:"none",
                borderRadius:8, padding:"8px 0", fontSize:11, cursor:"pointer" }}>✕ END</button>
        }
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function MicroInsurance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = authHeader(token);

  const [loading, setLoading] = useState(true);
  const [risk, setRisk] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [claimsTabLoading, setClaimsTabLoading] = useState(false);
  const [chain, setChain] = useState([]);
  const [chainVerification, setChainVerification] = useState(null);
  const [ledgerLoaded, setLedgerLoaded] = useState(false);
  const [ledgerTabLoading, setLedgerTabLoading] = useState(false);

  const [activating, setActivating] = useState(false);
  const [activateType, setActivateType] = useState(null);

  const [claimForm, setClaimForm] = useState({ incidentType:"accident", description:"" });
  const [claimFile, setClaimFile] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [latestClaimResult, setLatestClaimResult] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const [tab, setTab] = useState("overview"); // overview | claims | ledger | ussd | aipicks
  const [recs, setRecs] = useState(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(null);

  // ── Load Google Fonts (non-blocking) ────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // ── Fetch core data (only what overview tab needs) ──────────
  const fetchCore = async () => {
    try {
      const [riskRes, activePolicyRes, policiesRes] = await Promise.all([
        api("/risk-assessment", { headers }),
        api("/active-policy", { headers }),
        api("/policies", { headers }),
      ]);
      setRisk(riskRes.data);
      setActivePolicy(activePolicyRes.data.policy);
      setPolicies(policiesRes.data.policies || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Lazy-load claims (only when claims tab opened) ──────────
  const fetchClaims = async () => {
    if (claimsLoaded) return;
    setClaimsTabLoading(true);
    try {
      const res = await api("/claims", { headers });
      setClaims(res.data.claims || []);
      setClaimsLoaded(true);
    } catch (err) {
      console.error("Claims fetch error:", err);
    } finally {
      setClaimsTabLoading(false);
    }
  };

  // ── Lazy-load blockchain ledger (only when ledger tab opened) ──
  const fetchLedger = async () => {
    if (ledgerLoaded) return;
    setLedgerTabLoading(true);
    try {
      const res = await api("/blockchain-ledger", { headers });
      setChain(res.data.chain || []);
      setChainVerification(res.data.verification);
      setLedgerLoaded(true);
    } catch (err) {
      console.error("Ledger fetch error:", err);
    } finally {
      setLedgerTabLoading(false);
    }
  };

  useEffect(() => { fetchCore(); }, []);

  // ── Fetch AI Recommendations (lazy — only when tab opened) ──
  const fetchRecommendations = async () => {
    if (recs !== null) return; // already loaded
    setRecsLoading(true);
    setRecsError(null);
    try {
      const res = await api("/recommendations", { headers });
      setRecs(res.data);
    } catch (err) {
      setRecsError("Could not load recommendations. Make sure the AI service is running.");
    } finally {
      setRecsLoading(false);
    }
  };

  // ── Activate Policy ─────────────────────────────────────────
  const handleActivate = async (type) => {
    setActivating(true);
    setActivateType(type);
    try {
      await api("/activate", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        data: { policyType: type, locationZone: "urban" },
      });
      await fetchCore();
      setClaimsLoaded(false);
      setLedgerLoaded(false);
    } catch (err) {
      alert(err.response?.data?.message || "Activation failed");
    } finally {
      setActivating(false);
      setActivateType(null);
    }
  };

  // ── File Claim ──────────────────────────────────────────────
  const handleFileClaim = async (e) => {
    e.preventDefault();
    if (!activePolicy) return alert("No active policy. Activate insurance first.");
    setClaimLoading(true);
    try {
      const fd = new FormData();
      fd.append("policyId", activePolicy._id);
      fd.append("incidentType", claimForm.incidentType);
      fd.append("description", claimForm.description);
      if (claimFile) fd.append("proof", claimFile);

      const res = await api("/claim", { method:"POST", headers, data: fd });
      setLatestClaimResult(res.data.claim);
      setShowClaimForm(false);
      setClaimForm({ incidentType:"accident", description:"" });
      setClaimFile(null);
      await fetchCore();
      setClaimsLoaded(false);
      setLedgerLoaded(false);
    } catch (err) {
      alert(err.response?.data?.message || "Claim submission failed");
    } finally {
      setClaimLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#0f172a", display:"flex",
        alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:60, height:60, border:"4px solid #1e293b",
            borderTop:"4px solid #3b82f6", borderRadius:"50%",
            animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
          <p style={{ color:"#64748b", fontFamily:"Inter,sans-serif" }}>Loading GigShield...</p>
        </div>
      </div>
    );
  }

  const premium = risk?.premiumOptions;
  const rs = risk?.riskAssessment;

  return (
    <div style={{ minHeight:"100vh", background:"#0f172a", fontFamily:"'Inter',sans-serif",
      color:"#e2e8f0" }}>
      <style>{`

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }
        .card { background:#1e293b; border-radius:16px; border:1px solid #334155;
          transition:box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow:0 8px 32px rgba(0,0,0,0.4); transform:translateY(-1px); }
        .btn { border:none; border-radius:10px; padding:12px 20px; font-weight:600;
          font-size:14px; cursor:pointer; transition:all 0.2s; font-family:inherit; }
        .btn:disabled { opacity:0.5; cursor:not-allowed; }
        .tab { background:transparent; border:none; color:#64748b; padding:10px 20px;
          font-size:14px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent;
          font-family:inherit; transition:all 0.2s; }
        .tab.active { color:#3b82f6; border-bottom-color:#3b82f6; }
        .tag { display:inline-block; padding:3px 10px; border-radius:99px;
          font-size:11px; font-weight:700; }
        .input { background:#0f172a; border:1px solid #334155; border-radius:10px;
          color:#e2e8f0; padding:10px 14px; font-size:14px; font-family:inherit;
          width:100%; box-sizing:border-box; outline:none; }
        .input:focus { border-color:#3b82f6; }
        textarea.input { resize:vertical; min-height:90px; }
        select.input { cursor:pointer; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ background:"#0d1117", borderBottom:"1px solid #1e293b",
        padding:"14px 24px", display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => navigate("/dashboard")}
            style={{ background:"#1e293b", border:"none", color:"#94a3b8",
              borderRadius:8, padding:"6px 12px", cursor:"pointer", fontSize:13 }}>
            ← Dashboard
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:36, height:36, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",
              borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:18 }}>🛡️</div>
            <div>
              <div style={{ fontWeight:800, fontSize:16, letterSpacing:-0.5 }}>GigShield</div>
              <div style={{ color:"#64748b", fontSize:11 }}>Micro-Insurance Platform</div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#94a3b8", fontSize:13 }}>Hi, {user?.name}</span>
          {activePolicy ? (
            <span className="tag" style={{ background:"#166534", color:"#86efac" }}>
              🟢 Covered
            </span>
          ) : (
            <span className="tag" style={{ background:"#7f1d1d", color:"#fca5a5" }}>
              🔴 Unprotected
            </span>
          )}
        </div>
      </nav>

      {/* ── Active Policy Banner ── */}
      {activePolicy && (
        <div style={{ background:"linear-gradient(135deg,#1e3a5f,#1e293b)",
          borderBottom:"1px solid #1d4ed8", padding:"16px 32px",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:28 }}>🛡️</div>
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:"#93c5fd" }}>
                {activePolicy.policyType === "shift" ? "Shift Insurance" : "Daily Insurance"} — Active
              </div>
              <div style={{ fontSize:12, color:"#64748b" }}>
                Coverage: ₹{activePolicy.coverageAmount?.toLocaleString()} •
                Risk: {activePolicy.riskClassification} •
                Premium Paid: ₹{activePolicy.premium}
              </div>
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#64748b", fontSize:11, marginBottom:2 }}>TIME REMAINING</div>
            <Countdown endTime={activePolicy.endTime} />
          </div>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 16px" }}>
        {/* ── Tabs ── */}
        <div style={{ borderBottom:"1px solid #1e293b", marginBottom:24,
          display:"flex", gap:4, overflowX:"auto" }}>
          {[
            ["overview","📊 Overview"],
            ["claims","📋 Claims"],
            ["ledger","⛓️ Blockchain"],
            ["ussd","📱 USSD"],
            ["aipicks","🤖 AI Picks"],
          ].map(([id,label])=>(
            <button key={id} className={`tab ${tab===id?"active":""}`}
              onClick={() => { setTab(id); if(id==="aipicks") fetchRecommendations(); if(id==="claims") fetchClaims(); if(id==="ledger") fetchLedger(); }}>
              {label}
            </button>
          ))}
        </div>

        {/* ════════════ OVERVIEW TAB ════════════ */}
        {tab === "overview" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>

            {/* Row 1: Risk + Quick Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>

              {/* Risk Assessment Card */}
              <div className="card" style={{ padding:24, gridColumn:"span 1" }}>
                <div style={{ fontWeight:700, fontSize:14, color:"#94a3b8",
                  marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>
                  AI Risk Assessment
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <RiskGauge score={rs?.riskScore || 50} />
                  <div>
                    <div style={{ background: riskBg[rs?.riskClassification || "MEDIUM"],
                      border:`1px solid ${riskBorder[rs?.riskClassification||"MEDIUM"]}`,
                      borderRadius:8, padding:"4px 12px", display:"inline-block",
                      marginBottom:8 }}>
                      <span style={{ color: riskColor[rs?.riskClassification||"MEDIUM"],
                        fontWeight:700, fontSize:13 }}>
                        {rs?.riskClassification || "MEDIUM"} RISK
                      </span>
                    </div>
                    {rs?.scoreBreakdown && Object.entries(rs.scoreBreakdown).map(([k,v]) => (
                      <div key={k} style={{ marginBottom:5 }}>
                        <div style={{ fontSize:10, color:"#64748b", marginBottom:2,
                          textTransform:"capitalize" }}>
                          {k.replace(/([A-Z])/g," $1")}
                        </div>
                        <div style={{ background:"#0f172a", borderRadius:99, height:5, width:120 }}>
                          <div style={{ width:`${v}%`, height:5, borderRadius:99,
                            background:`linear-gradient(90deg,#3b82f6,#8b5cf6)` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {rs?.coverageSuggestions?.length > 0 && (
                  <div style={{ marginTop:12, padding:12, background:"#0f172a",
                    borderRadius:10, fontSize:12 }}>
                    <div style={{ color:"#64748b", marginBottom:6, fontWeight:600 }}>
                      💡 Suggested Coverage
                    </div>
                    {rs.coverageSuggestions.map((s,i)=>(
                      <div key={i} style={{ color:"#94a3b8", marginBottom:3 }}>✓ {s}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Premium Options */}
              <div style={{ gridColumn:"span 2", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { type:"shift", label:"Per Shift", icon:"⚡", subtitle:"8-hour coverage", color:"#3b82f6" },
                  { type:"daily", label:"Per Day", icon:"☀️", subtitle:"Full day coverage", color:"#8b5cf6" },
                ].map(({ type, label, icon, subtitle, color }) => {
                  const p = premium?.[type];
                  const isActive = activePolicy?.policyType === type && activePolicy?.status === "active";
                  return (
                    <div key={type} className="card" style={{ padding:24 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                        <div>
                          <div style={{ fontSize:24 }}>{icon}</div>
                          <div style={{ fontWeight:700, fontSize:16, marginTop:4 }}>{label}</div>
                          <div style={{ color:"#64748b", fontSize:12 }}>{subtitle}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:28, fontWeight:800, color }}>
                            ₹{p?.finalPremium || "—"}
                          </div>
                          <div style={{ color:"#64748b", fontSize:11 }}>premium</div>
                        </div>
                      </div>

                      {p && (
                        <div style={{ marginBottom:12 }}>
                          {p.coverageItems?.map((ci,i)=>(
                            <div key={i} style={{ display:"flex", justifyContent:"space-between",
                              fontSize:11, color:"#64748b", marginBottom:3 }}>
                              <span>{ci.item}</span>
                              <span style={{ color:"#94a3b8" }}>₹{ci.limit?.toLocaleString()}</span>
                            </div>
                          ))}
                          <div style={{ borderTop:"1px solid #334155", paddingTop:8,
                            display:"flex", justifyContent:"space-between",
                            fontSize:12, fontWeight:700, color:"#e2e8f0" }}>
                            <span>Total Coverage</span>
                            <span>₹{p.coverageAmount?.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize:10, color:"#64748b", marginTop:4 }}>
                            Base ₹{p.basePremium} × {p.premiumMultiplier}× risk multiplier
                          </div>
                        </div>
                      )}

                      <button className="btn"
                        disabled={!!activePolicy || activating}
                        onClick={() => handleActivate(type)}
                        style={{ width:"100%", background: activePolicy
                          ? "#1e293b" : `linear-gradient(135deg,${color},${color}cc)`,
                          color: activePolicy ? "#475569" : "#fff" }}>
                        {activating && activateType===type ? (
                          <span>Activating...</span>
                        ) : isActive ? (
                          "✓ Currently Active"
                        ) : activePolicy ? (
                          "Policy Active"
                        ) : (
                          `Activate ${label}`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Claim Filing */}
            <div className="card" style={{ padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom: showClaimForm ? 20 : 0 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>📋 File an Insurance Claim</div>
                  <div style={{ color:"#64748b", fontSize:12, marginTop:2 }}>
                    AI-powered validation with RAG policy analysis
                  </div>
                </div>
                <button className="btn"
                  onClick={() => setShowClaimForm(!showClaimForm)}
                  style={{ background: showClaimForm ? "#334155" : "linear-gradient(135deg,#dc2626,#b91c1c)",
                    color:"#fff" }}>
                  {showClaimForm ? "✕ Cancel" : "+ File Claim"}
                </button>
              </div>

              {showClaimForm && (
                <form onSubmit={handleFileClaim} style={{ animation:"fadeIn 0.3s ease" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                    <div>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6 }}>
                        Incident Type
                      </label>
                      <select className="input" value={claimForm.incidentType}
                        onChange={e=>setClaimForm(f=>({...f,incidentType:e.target.value}))}>
                        {["accident","medical","equipment_damage","theft","liability","other"].map(t=>(
                          <option key={t} value={t}>
                            {t.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6 }}>
                        Upload Proof (Optional)
                      </label>
                      <input type="file" accept="image/*,.pdf"
                        onChange={e=>setClaimFile(e.target.files[0])}
                        className="input" style={{ padding:8 }}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6 }}>
                      Incident Description
                    </label>
                    <textarea className="input" required
                      placeholder="Describe the incident in detail — what happened, when, and where..."
                      value={claimForm.description}
                      onChange={e=>setClaimForm(f=>({...f,description:e.target.value}))}/>
                  </div>
                  <button type="submit" className="btn" disabled={claimLoading || !activePolicy}
                    style={{ background:"linear-gradient(135deg,#1d4ed8,#4f46e5)", color:"#fff",
                      width:"100%" }}>
                    {claimLoading ? "🤖 AI Analyzing Claim..." : "Submit Claim for AI Review"}
                  </button>
                  {!activePolicy && (
                    <p style={{ fontSize:11, color:"#ef4444", marginTop:8, textAlign:"center" }}>
                      ⚠ You need an active policy to file a claim.
                    </p>
                  )}
                </form>
              )}

              {/* Latest Claim Result */}
              {latestClaimResult && (
                <div style={{ marginTop:20, background:"#0f172a", borderRadius:14,
                  padding:20, border:"1px solid #1e3a5f", animation:"fadeIn 0.4s ease" }}>
                  <div style={{ fontWeight:700, color:"#93c5fd", marginBottom:16, fontSize:15 }}>
                    🤖 AI Claim Analysis Complete
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Summary</div>
                      <p style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.6 }}>
                        {latestClaimResult.llmAnalysis?.summary}
                      </p>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      <div>
                        <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>
                          Approval Confidence
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1, background:"#1e293b", borderRadius:99, height:10 }}>
                            <div style={{ width:`${latestClaimResult.llmAnalysis?.approvalConfidence||0}%`,
                              height:10, borderRadius:99,
                              background:`linear-gradient(90deg,${confColor(latestClaimResult.llmAnalysis?.approvalConfidence)},${confColor(latestClaimResult.llmAnalysis?.approvalConfidence)}88)`,
                              transition:"width 1s ease" }}/>
                          </div>
                          <span style={{ fontWeight:700, color:confColor(latestClaimResult.llmAnalysis?.approvalConfidence), fontSize:14 }}>
                            {latestClaimResult.llmAnalysis?.approvalConfidence}%
                          </span>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <div className="tag" style={{
                          background: latestClaimResult.llmAnalysis?.recommendation==="APPROVE"?"#166534":
                            latestClaimResult.llmAnalysis?.recommendation==="REJECT"?"#7f1d1d":"#713f12",
                          color: latestClaimResult.llmAnalysis?.recommendation==="APPROVE"?"#86efac":
                            latestClaimResult.llmAnalysis?.recommendation==="REJECT"?"#fca5a5":"#fde68a",
                        }}>
                          {latestClaimResult.llmAnalysis?.recommendation}
                        </div>
                        <div className="tag" style={{
                          background: {LOW:"#172554",MEDIUM:"#713f12",HIGH:"#7f1d1d"}[latestClaimResult.llmAnalysis?.fraudRisk],
                          color: {LOW:"#93c5fd",MEDIUM:"#fde68a",HIGH:"#fca5a5"}[latestClaimResult.llmAnalysis?.fraudRisk],
                        }}>
                          Fraud: {latestClaimResult.llmAnalysis?.fraudRisk}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* RAG clauses */}
                  {latestClaimResult.ragRetrievedClauses?.length > 0 && (
                    <div style={{ marginTop:16 }}>
                      <div style={{ fontSize:11, color:"#64748b", marginBottom:8, fontWeight:600 }}>
                        📚 Matched Policy Clauses (RAG)
                      </div>
                      {latestClaimResult.ragRetrievedClauses.map((c,i)=>(
                        <div key={i} style={{ background:"#1e293b", borderRadius:10,
                          padding:12, marginBottom:8, borderLeft:"3px solid #3b82f6" }}>
                          <div style={{ fontWeight:600, fontSize:12, color:"#93c5fd",
                            marginBottom:4 }}>
                            {c.clauseId}: {c.title}
                            <span style={{ float:"right", fontSize:10, color:"#64748b" }}>
                              {Math.round(c.relevanceScore*100)}% match
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5 }}>{c.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Policies */}
            {policies.length > 0 && (
              <div className="card" style={{ padding:24 }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>
                  📜 Recent Policies
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid #334155" }}>
                        {["Type","Premium","Coverage","Status","Risk","Start","End"].map(h=>(
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left",
                            color:"#64748b", fontWeight:600, fontSize:11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {policies.slice(0,5).map((p)=>(
                        <tr key={p._id} style={{ borderBottom:"1px solid #1e293b" }}>
                          <td style={{ padding:"10px 12px" }}>
                            {p.policyType==="shift"?"⚡ Shift":"☀️ Daily"}
                          </td>
                          <td style={{ padding:"10px 12px", color:"#60a5fa" }}>₹{p.premium}</td>
                          <td style={{ padding:"10px 12px" }}>₹{p.coverageAmount?.toLocaleString()}</td>
                          <td style={{ padding:"10px 12px" }}>
                            <span className="tag" style={{
                              background: p.status==="active"?"#166534":p.status==="expired"?"#1e293b":"#7f1d1d",
                              color: p.status==="active"?"#86efac":p.status==="expired"?"#64748b":"#fca5a5",
                            }}>{p.status}</span>
                          </td>
                          <td style={{ padding:"10px 12px" }}>
                            <span style={{ color: riskColor[p.riskClassification] }}>
                              {p.riskClassification}
                            </span>
                          </td>
                          <td style={{ padding:"10px 12px", color:"#64748b", fontSize:12 }}>
                            {new Date(p.startTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                          </td>
                          <td style={{ padding:"10px 12px", color:"#64748b", fontSize:12 }}>
                            {new Date(p.endTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════ CLAIMS TAB ════════════ */}
        {tab === "claims" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:20 }}>
              My Claims
            </div>
            {claimsTabLoading ? <Spinner /> : (
            <>
            {claims.length === 0 ? (
              <div className="card" style={{ padding:48, textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ color:"#64748b" }}>No claims filed yet.</div>
                <button className="btn" onClick={()=>setTab("overview")}
                  style={{ background:"linear-gradient(135deg,#1d4ed8,#4f46e5)",
                    color:"#fff", marginTop:16 }}>
                  Go to Overview
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {claims.map((c)=>(
                  <div key={c._id} className="card" style={{ padding:24 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"flex-start", marginBottom:16 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15 }}>
                          {c.incidentType.replace(/_/g," ").replace(/\b\w/g,ch=>ch.toUpperCase())}
                        </div>
                        <div style={{ color:"#64748b", fontSize:12, marginTop:2 }}>
                          {new Date(c.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <span className="tag" style={{
                          background:{pending:"#1e293b",approved:"#166534",rejected:"#7f1d1d",ai_reviewed:"#172554",under_review:"#713f12"}[c.status]||"#1e293b",
                          color:{pending:"#64748b",approved:"#86efac",rejected:"#fca5a5",ai_reviewed:"#93c5fd",under_review:"#fde68a"}[c.status]||"#64748b",
                        }}>{c.status.replace(/_/g," ").toUpperCase()}</span>
                        {c.llmAnalysis?.fraudRisk && (
                          <span className="tag" style={{
                            background:{LOW:"#172554",MEDIUM:"#713f12",HIGH:"#7f1d1d"}[c.llmAnalysis.fraudRisk],
                            color:{LOW:"#93c5fd",MEDIUM:"#fde68a",HIGH:"#fca5a5"}[c.llmAnalysis.fraudRisk],
                          }}>Fraud: {c.llmAnalysis.fraudRisk}</span>
                        )}
                      </div>
                    </div>
                    <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.6, marginBottom:16 }}>
                      {c.description}
                    </p>
                    {c.llmAnalysis?.summary && (
                      <div style={{ background:"#0f172a", borderRadius:10, padding:14, marginBottom:12 }}>
                        <div style={{ fontSize:11, color:"#3b82f6", fontWeight:600, marginBottom:6 }}>
                          🤖 AI Summary
                        </div>
                        <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>
                          {c.llmAnalysis.summary}
                        </p>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                          <div style={{ flex:1, background:"#1e293b", borderRadius:99, height:6 }}>
                            <div style={{ width:`${c.llmAnalysis.approvalConfidence}%`,
                              height:6, borderRadius:99,
                              background:confColor(c.llmAnalysis.approvalConfidence),
                              transition:"width 1s" }}/>
                          </div>
                          <span style={{ fontSize:12, fontWeight:700,
                            color:confColor(c.llmAnalysis.approvalConfidence) }}>
                            {c.llmAnalysis.approvalConfidence}% confidence
                          </span>
                        </div>
                      </div>
                    )}
                    {c.payoutAmount > 0 && (
                      <div style={{ background:"#14532d", borderRadius:10, padding:12,
                        display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:20 }}>💰</span>
                        <div>
                          <div style={{ fontWeight:700, color:"#86efac" }}>
                            Payout: ₹{c.payoutAmount?.toLocaleString()}
                          </div>
                          <div style={{ fontSize:11, color:"#4ade80" }}>
                            Smart contract release authorized
                          </div>
                        </div>
                      </div>
                    )}
                    {c.blockHash && (
                      <div style={{ marginTop:10, fontSize:10, color:"#475569",
                        fontFamily:"monospace", wordBreak:"break-all" }}>
                        ⛓ Block #{c.blockHeight} • {c.blockHash?.slice(0,32)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </>)}
          </div>
        )}

        {/* ════════════ BLOCKCHAIN TAB ════════════ */}
        {tab === "ledger" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            {ledgerTabLoading ? <Spinner /> : (
            <>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:20 }}>⛓️ Blockchain Ledger</div>
                <div style={{ color:"#64748b", fontSize:13, marginTop:2 }}>
                  Tamper-proof SHA-256 hash-chained records
                </div>
              </div>
              {chainVerification && (
                <div style={{ background: chainVerification.isValid ? "#14532d" : "#7f1d1d",
                  borderRadius:12, padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:18 }}>{chainVerification.isValid ? "✅" : "❌"}</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:12,
                      color: chainVerification.isValid ? "#86efac" : "#fca5a5" }}>
                      Chain {chainVerification.isValid ? "VALID" : "INVALID"}
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8" }}>
                      {chainVerification.totalBlocks} blocks verified
                    </div>
                  </div>
                </div>
              )}
            </div>

            {chain.length === 0 ? (
              <div className="card" style={{ padding:48, textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>⛓️</div>
                <div style={{ color:"#64748b" }}>No blocks yet. Activate a policy to create the genesis block.</div>
              </div>
            ) : (
              <div style={{ position:"relative" }}>
                {/* Vertical line */}
                <div style={{ position:"absolute", left:20, top:24, bottom:24,
                  width:2, background:"linear-gradient(180deg,#3b82f6,#8b5cf6)",
                  zIndex:0 }}/>
                {chain.map((block, i) => (
                  <div key={i} style={{ display:"flex", gap:16, marginBottom:16,
                    position:"relative", zIndex:1 }}>
                    {/* Block type icon */}
                    <div style={{ width:42, height:42, flexShrink:0,
                      background: block.type==="POLICY"
                        ? "linear-gradient(135deg,#1d4ed8,#4f46e5)"
                        : "linear-gradient(135deg,#b45309,#92400e)",
                      borderRadius:"50%", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:18,
                      boxShadow:"0 0 0 3px #0f172a" }}>
                      {block.type==="POLICY" ? "🛡️" : "📋"}
                    </div>
                    <div className="card" style={{ flex:1, padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <span className="tag" style={{
                            background: block.type==="POLICY"?"#1e3a5f":"#451a03",
                            color: block.type==="POLICY"?"#93c5fd":"#fcd34d",
                            marginRight:8 }}>
                            {block.type}
                          </span>
                          <span style={{ fontSize:12, color:"#64748b" }}>Block #{block.blockHeight}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:10, color:"#64748b" }}>
                            {new Date(block.timestamp).toLocaleString()}
                          </span>
                          {block.isVerified && (
                            <span style={{ color:"#22c55e", fontSize:12 }}>✓</span>
                          )}
                        </div>
                      </div>

                      {/* Block data */}
                      {block.type==="POLICY" && (
                        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:8 }}>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Type: </span>
                            <span>{block.data.policyType}</span>
                          </div>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Premium: </span>
                            <span style={{ color:"#60a5fa" }}>₹{block.data.premium}</span>
                          </div>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Coverage: </span>
                            <span>₹{block.data.coverageAmount?.toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Status: </span>
                            <span style={{ color: block.data.status==="active"?"#22c55e":"#94a3b8" }}>
                              {block.data.status}
                            </span>
                          </div>
                        </div>
                      )}
                      {block.type==="CLAIM" && (
                        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:8 }}>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Incident: </span>
                            <span>{block.data.incidentType?.replace(/_/g," ")}</span>
                          </div>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>AI Confidence: </span>
                            <span style={{ color:confColor(block.data.approvalConfidence) }}>
                              {block.data.approvalConfidence}%
                            </span>
                          </div>
                          <div style={{ fontSize:12 }}>
                            <span style={{ color:"#64748b" }}>Status: </span>
                            <span>{block.data.status}</span>
                          </div>
                          {block.data.payoutAmount > 0 && (
                            <div style={{ fontSize:12 }}>
                              <span style={{ color:"#64748b" }}>Payout: </span>
                              <span style={{ color:"#22c55e" }}>₹{block.data.payoutAmount?.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hashes */}
                      <div style={{ fontFamily:"monospace", fontSize:10, color:"#475569" }}>
                        <div>🔑 Hash: <span style={{ color:"#64748b" }}>
                          {block.blockHash?.slice(0,48)}...
                        </span></div>
                        {block.previousHash !== "0" && (
                          <div>⬅ Prev: <span style={{ color:"#64748b" }}>
                            {block.previousHash?.slice(0,48)}...
                          </span></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>)}
          </div>
        )}

        {/* ════════════ USSD TAB ════════════ */}
        {tab === "ussd" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontWeight:700, fontSize:20, marginBottom:8 }}>
              📱 USSD Access — *123#
            </div>
            <div style={{ color:"#64748b", fontSize:13, marginBottom:32 }}>
              Feature-phone accessible insurance services. Dial *123# then press CALL.
            </div>
            <div style={{ display:"flex", gap:40, alignItems:"flex-start", flexWrap:"wrap" }}>
              <USSDWidget token={token} />
              <div style={{ flex:1, minWidth:280 }}>
                <div className="card" style={{ padding:24, marginBottom:16 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>
                    📋 Available USSD Commands
                  </div>
                  {[
                    { code:"*123#", desc:"Open main insurance menu" },
                    { code:"*123*1#", desc:"Go directly to activation menu" },
                    { code:"*123*1*1#", desc:"Activate shift insurance (8 hrs)" },
                    { code:"*123*1*2#", desc:"Activate daily insurance" },
                    { code:"*123*2#", desc:"Check current policy status" },
                    { code:"*123*3#", desc:"Track latest claim status" },
                  ].map((cmd,i)=>(
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:12,
                      padding:"10px 12px", background:"#0f172a", borderRadius:10 }}>
                      <code style={{ color:"#22d3ee", fontFamily:"monospace",
                        fontSize:13, minWidth:100 }}>{cmd.code}</code>
                      <span style={{ color:"#94a3b8", fontSize:13 }}>{cmd.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ padding:24 }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>
                    ℹ️ How It Works
                  </div>
                  <p style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7 }}>
                    GigShield USSD (*123#) enables gig workers without smartphones to
                    access insurance services on any mobile network. The service integrates
                    with Africa's Talking USSD Gateway for real telecom deployment.
                    This simulator demonstrates the full menu flow in your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ AI PICKS TAB ════════════ */}
        {tab === "aipicks" && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:700, fontSize:20, marginBottom:6 }}>🤖 AI Plan Recommendations</div>
              <div style={{ color:"#64748b", fontSize:13 }}>
                Gemini AI analysed 8 real insurance plans from 5 providers and matched them to your profile.
              </div>
            </div>

            {/* Worker profile pill */}
            {recs?.worker_profile && (
              <div style={{ background:"#1e293b", border:"1px solid #334155",
                borderRadius:14, padding:"14px 20px", marginBottom:24,
                display:"flex", gap:24, flexWrap:"wrap" }}>
                <div style={{ fontSize:12, color:"#64748b" }}>
                  Worker Type <span style={{ color:"#e2e8f0", fontWeight:600,
                    marginLeft:6, textTransform:"capitalize" }}>
                    {recs.worker_profile.employment_type}
                  </span>
                </div>
                <div style={{ fontSize:12, color:"#64748b" }}>
                  Risk <span style={{ color: riskColor[recs.worker_profile.risk_classification],
                    fontWeight:600, marginLeft:6 }}>
                    {recs.worker_profile.risk_classification} ({recs.worker_profile.risk_score})
                  </span>
                </div>
                <div style={{ fontSize:12, color:"#64748b" }}>
                  Plans evaluated <span style={{ color:"#e2e8f0", fontWeight:600, marginLeft:6 }}>
                    {recs.total_plans_evaluated}
                  </span>
                </div>
              </div>
            )}

            {/* Loading */}
            {recsLoading && (
              <div className="card" style={{ padding:48, textAlign:"center" }}>
                <div style={{ width:48, height:48, border:"4px solid #1e293b",
                  borderTop:"4px solid #8b5cf6", borderRadius:"50%",
                  animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
                <div style={{ color:"#64748b", fontSize:14 }}>🤖 Gemini AI is matching plans to your profile...</div>
                <div style={{ color:"#475569", fontSize:12, marginTop:6 }}>This takes about 10-15 seconds</div>
              </div>
            )}

            {/* Error state */}
            {recsError && !recsLoading && (
              <div className="card" style={{ padding:32, textAlign:"center",
                border:"1px solid #dc2626" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
                <div style={{ color:"#fca5a5", fontWeight:600, marginBottom:8 }}>{recsError}</div>
                <div style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>
                  Start the AI service:{" "}
                  <code style={{ color:"#22d3ee", background:"#0f172a",
                    padding:"2px 8px", borderRadius:6 }}>
                    cd insurance-ai && uvicorn main:app --reload
                  </code>
                </div>
                <button className="btn"
                  onClick={() => { setRecs(null); setRecsError(null); setTimeout(fetchRecommendations, 100); }}
                  style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"#fff" }}>
                  Retry
                </button>
              </div>
            )}

            {/* Service unavailable */}
            {recs && !recs.serviceAvailable && !recsLoading && (
              <div className="card" style={{ padding:32, textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:12 }}>🔧</div>
                <div style={{ color:"#fde68a", fontWeight:600, marginBottom:8 }}>
                  AI Recommendation Service Starting Up
                </div>
                <div style={{ color:"#64748b", fontSize:13, marginBottom:20 }}>{recs.message}</div>
                <button className="btn"
                  onClick={() => { setRecs(null); fetchRecommendations(); }}
                  style={{ background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"#fff" }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Recommendations */}
            {recs?.serviceAvailable && recs.recommendations?.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {recs.recommendations.map((rec, i) => {
                  const plan = rec.plan;
                  const exp = rec.ai_explanation;
                  const rankLabels = ["🥇 Best Match","🥈 Runner Up","🥉 Also Great"];
                  const scoreCol = rec.match_score>=75?"#22c55e":rec.match_score>=55?"#f59e0b":"#ef4444";
                  return (
                    <div key={plan.plan_id} className="card" style={{ padding:0, overflow:"hidden" }}>
                      {/* Header */}
                      <div style={{ background:"linear-gradient(135deg,#1e293b,#0f172a)",
                        padding:"20px 24px", borderBottom:"1px solid #334155",
                        display:"flex", justifyContent:"space-between",
                        alignItems:"center", flexWrap:"wrap", gap:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ fontSize:32 }}>{plan.provider_logo}</div>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                              <span className="tag" style={{ background:"#1e3a5f", color:"#93c5fd", fontSize:10 }}>
                                {rankLabels[i] || `#${i+1}`}
                              </span>
                              <span style={{ fontSize:11, color:"#64748b" }}>{plan.provider}</span>
                            </div>
                            <div style={{ fontWeight:700, fontSize:17 }}>{plan.plan_name}</div>
                            <div style={{ color:"#64748b", fontSize:12 }}>{plan.tagline}</div>
                          </div>
                        </div>
                        <div style={{ textAlign:"center", minWidth:80 }}>
                          <div style={{ fontSize:32, fontWeight:800, color:scoreCol }}>{rec.match_score}%</div>
                          <div style={{ fontSize:10, color:"#64748b" }}>AI MATCH</div>
                          <div style={{ background:"#1e293b", borderRadius:99, height:6, marginTop:4, width:70 }}>
                            <div style={{ width:`${rec.match_score}%`, height:6, borderRadius:99,
                              background:scoreCol, transition:"width 1s ease" }}/>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding:"20px 24px" }}>
                        {/* Why it fits */}
                        <div style={{ background:"#0f172a", borderRadius:12,
                          padding:16, marginBottom:20, borderLeft:"3px solid #22c55e" }}>
                          <div style={{ fontSize:11, color:"#22c55e", fontWeight:700, marginBottom:6 }}>
                            💡 WHY IT FITS YOU
                          </div>
                          <div style={{ fontSize:13, color:"#86efac", marginBottom:8 }}>{rec.why_it_fits}</div>
                          <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7 }}>
                            {exp?.plain_explanation}
                          </div>
                          {exp?.affordability_note && (
                            <div style={{ marginTop:10, fontSize:12, color:"#64748b",
                              borderTop:"1px solid #1e293b", paddingTop:8 }}>
                              💰 {exp.affordability_note}
                            </div>
                          )}
                        </div>

                        {/* 3-column grid: covered / not covered / premiums */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                          gap:16, marginBottom:20 }}>
                          <div>
                            <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:8 }}>
                              ✅ COVERED
                            </div>
                            {(exp?.simple_what_covered || plan.inclusions.slice(0,3)).map((item,j)=>(
                              <div key={j} style={{ display:"flex", gap:6, marginBottom:6 }}>
                                <span style={{ color:"#22c55e", fontSize:12, flexShrink:0 }}>✓</span>
                                <span style={{ fontSize:12, color:"#94a3b8", lineHeight:1.4 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:8 }}>
                              ❌ NOT COVERED
                            </div>
                            {(exp?.simple_what_not_covered || plan.exclusions.slice(0,2)).map((item,j)=>(
                              <div key={j} style={{ display:"flex", gap:6, marginBottom:6 }}>
                                <span style={{ color:"#ef4444", fontSize:12, flexShrink:0 }}>✗</span>
                                <span style={{ fontSize:12, color:"#94a3b8", lineHeight:1.4 }}>{item}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize:11, color:"#64748b", fontWeight:600, marginBottom:8 }}>
                              💰 PREMIUM
                            </div>
                            {[["Per Shift", plan.premium.per_shift],["Per Day", plan.premium.per_day],
                              ["Per Month", plan.premium.per_month]].map(([label,val])=>(
                              <div key={label} style={{ display:"flex", justifyContent:"space-between",
                                marginBottom:6, fontSize:12, borderBottom:"1px dashed #1e293b",
                                paddingBottom:4 }}>
                                <span style={{ color:"#64748b" }}>{label}</span>
                                <span style={{ color:"#60a5fa", fontWeight:600 }}>₹{val}</span>
                              </div>
                            ))}
                            <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>
                              Coverage: ₹{plan.coverage_amount?.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* How to claim + bottom line */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                          <div style={{ background:"#0f172a", borderRadius:10, padding:14 }}>
                            <div style={{ fontSize:11, color:"#3b82f6", fontWeight:600, marginBottom:6 }}>
                              📋 HOW TO CLAIM
                            </div>
                            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.5 }}>
                              {exp?.simple_how_to_claim || plan.claim_process}
                            </div>
                          </div>
                          <div style={{ background:"linear-gradient(135deg,#172554,#1e293b)",
                            borderRadius:10, padding:14, border:"1px solid #1d4ed8" }}>
                            <div style={{ fontSize:11, color:"#93c5fd", fontWeight:600, marginBottom:6 }}>
                              🎯 BOTTOM LINE
                            </div>
                            <div style={{ fontSize:13, color:"#e2e8f0", lineHeight:1.5, fontWeight:500 }}>
                              {exp?.bottom_line || plan.best_for}
                            </div>
                          </div>
                        </div>

                        {/* Footer: rating + actions */}
                        <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", marginTop:16, paddingTop:16,
                          borderTop:"1px solid #1e293b", flexWrap:"wrap", gap:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ color:"#f59e0b" }}>{'★'.repeat(Math.round(plan.rating))}</span>
                            <span style={{ fontSize:13, color:"#94a3b8" }}>{plan.rating}/5</span>
                            {plan.irdai_registered && (
                              <span className="tag" style={{ background:"#14532d",
                                color:"#86efac", fontSize:10 }}>IRDAI ✓</span>
                            )}
                          </div>
                          <div style={{ display:"flex", gap:10 }}>
                            <a href={plan.provider_website} target="_blank" rel="noopener noreferrer"
                              style={{ background:"#1e293b", color:"#94a3b8",
                                borderRadius:8, padding:"8px 16px", fontSize:13,
                                fontWeight:600, textDecoration:"none", border:"1px solid #334155" }}>
                              🔗 Visit {plan.provider.split(" ")[0]}
                            </a>
                            <button className="btn"
                              onClick={() => setTab("overview")}
                              style={{ background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
                                color:"#fff", padding:"8px 16px" }}>
                              🛡️ Use GigShield Instead
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Disclaimer */}
                <div style={{ background:"#1e293b", borderRadius:12, padding:16,
                  border:"1px dashed #334155" }}>
                  <div style={{ fontSize:11, color:"#475569", lineHeight:1.6 }}>
                    ⚖️ <strong style={{ color:"#64748b" }}>Disclaimer:</strong>{" "}
                    {recs.disclaimer}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
