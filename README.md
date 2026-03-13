import { useState, useEffect, useRef } from "react";

const PRODUCTS = [
  { asin: "B09G9FPHY6", name: "Echo Dot (5th Gen)", category: "Smart Home", commission: 4.5, clicks: 1840, conversions: 92, revenue: 414.0, trend: "+12%", img: "📦" },
  { asin: "B08N5WRWNW", name: "Fire TV Stick 4K Max", category: "Electronics", commission: 3.0, clicks: 2310, conversions: 138, revenue: 621.0, trend: "+8%", img: "📺" },
  { asin: "B07XJ8C8F5", name: "Kindle Paperwhite", category: "Books & Media", commission: 5.0, clicks: 980, conversions: 49, revenue: 367.5, trend: "+21%", img: "📚" },
  { asin: "B08L5TNJHG", name: "AirPods Pro (2nd Gen)", category: "Audio", commission: 3.0, clicks: 3200, conversions: 160, revenue: 1200.0, trend: "+5%", img: "🎧" },
  { asin: "B09JQMJHXY", name: "Ring Video Doorbell", category: "Smart Home", commission: 5.0, clicks: 760, conversions: 38, revenue: 570.0, trend: "-3%", img: "🔔" },
  { asin: "B08CF3B7N1", name: "Instant Pot Duo 7-in-1", category: "Kitchen", commission: 6.0, clicks: 1450, conversions: 87, revenue: 782.1, trend: "+17%", img: "🍲" },
];

const MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const REV_DATA = [1200, 1850, 2100, 2800, 3200, 3954];
const CLICK_DATA = [4200, 6100, 7800, 9200, 10500, 12540];

const AI_TEMPLATES = [
  { id: "review", label: "Product Review", icon: "⭐" },
  { id: "comparison", label: "Comparison Post", icon: "⚖️" },
  { id: "roundup", label: "Top 10 Roundup", icon: "🏆" },
  { id: "social", label: "Social Caption", icon: "📱" },
];

const CATS = ["All", "Smart Home", "Electronics", "Audio", "Kitchen", "Books & Media"];

const clr = { purple: "#a78bfa", blue: "#38bdf8", pink: "#f472b6", green: "#22c55e", yellow: "#f59e0b", red: "#ef4444", dark: "#0f0c29", card: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" };

const MiniBar = ({ data, color }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, background: i === data.length - 1 ? color : `${color}55`, borderRadius: "3px 3px 0 0", height: `${(v / max) * 100}%`, transition: "height 0.4s" }} />
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, data }) => (
  <div style={{ background: clr.card, border: `1px solid ${clr.border}`, borderRadius: 16, padding: "20px", flex: 1, backdropFilter: "blur(8px)", borderTop: `3px solid ${color}` }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>{icon} {label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>
      </div>
      {data && <div style={{ width: 80 }}><MiniBar data={data} color={color} /></div>}
    </div>
  </div>
);

const Pill = ({ label, color, onClick, active }) => (
  <button onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${active ? color : "rgba(255,255,255,0.12)"}`, background: active ? `${color}22` : "transparent", color: active ? color : "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
    {label}
  </button>
);

export default function App() {
  const [tab, setTab] = useState("overview");
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [asinInput, setAsinInput] = useState("");
  const [aiTemplate, setAiTemplate] = useState("review");
  const [aiProduct, setAiProduct] = useState(PRODUCTS[0].name);
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [links, setLinks] = useState([
    { id: 1, name: "Echo Dot Review Post", asin: "B09G9FPHY6", url: "https://nisar.llc/go/echo-dot", clicks: 840, active: true },
    { id: 2, name: "Fire TV Comparison", asin: "B08N5WRWNW", url: "https://nisar.llc/go/fire-tv", clicks: 1240, active: true },
    { id: 3, name: "AirPods Pro Deal Alert", asin: "B08L5TNJHG", url: "https://nisar.llc/go/airpods", clicks: 2100, active: false },
  ]);

  const notify = (msg, color = clr.green) => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 2800);
  };

  const totalRevenue = PRODUCTS.reduce((s, p) => s + p.revenue, 0);
  const totalClicks = PRODUCTS.reduce((s, p) => s + p.clicks, 0);
  const totalConversions = PRODUCTS.reduce((s, p) => s + p.conversions, 0);
  const avgCR = ((totalConversions / totalClicks) * 100).toFixed(2);

  const filtered = PRODUCTS.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.asin.includes(search))
  );

  const generateContent = async () => {
    setAiLoading(true);
    setAiOutput("");
    try {
      const tpl = AI_TEMPLATES.find(t => t.id === aiTemplate);
      const prompt = `You are an expert Amazon affiliate content writer for Nexus Ultra Platforms (Pakistan-based digital company). Write a ${tpl.label} for the product: "${aiProduct}". Keep it engaging, SEO-optimized, and conversion-focused. Include a strong CTA. Max 150 words.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Failed to generate.";
      setAiOutput(text);
    } catch (e) {
      setAiOutput("⚠️ Error generating content. Please try again.");
    }
    setAiLoading(false);
  };

  const addLink = () => {
    if (!asinInput.trim()) return;
    const newLink = { id: Date.now(), name: `New Link (${asinInput})`, asin: asinInput.toUpperCase(), url: `https://nisar.llc/go/${asinInput.toLowerCase()}`, clicks: 0, active: true };
    setLinks(prev => [newLink, ...prev]);
    setAsinInput("");
    notify("✅ Affiliate link created!");
  };

  const s = {
    app: { minHeight: "100vh", background: `linear-gradient(135deg, ${clr.dark}, #302b63, #24243e)`, color: "#e2e8f0", fontFamily: "'Segoe UI', sans-serif", paddingBottom: 48 },
    header: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${clr.border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontSize: 22, fontWeight: 900, background: "linear-gradient(90deg, #a78bfa, #38bdf8, #f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    tabs: { display: "flex", gap: 6, padding: "24px 32px 0" },
    tabBtn: (a) => ({ padding: "9px 22px", borderRadius: 30, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: a ? "linear-gradient(90deg,#a78bfa,#38bdf8)" : "rgba(255,255,255,0.07)", color: a ? "#fff" : "#94a3b8", transition: "all 0.2s" }),
    body: { padding: "24px 32px" },
    card: { background: clr.card, borderRadius: 16, border: `1px solid ${clr.border}`, padding: "22px 24px", backdropFilter: "blur(8px)" },
    input: { background: "rgba(255,255,255,0.07)", border: `1px solid ${clr.border}`, borderRadius: 8, color: "#e2e8f0", padding: "9px 14px", fontSize: 13, outline: "none" },
    btn: (bg, outline) => ({ padding: "8px 18px", borderRadius: 9, border: outline ? `1.5px solid ${bg}` : "none", background: outline ? "transparent" : bg, color: outline ? bg : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
    badge: (c) => ({ background: `${c}22`, border: `1px solid ${c}55`, color: c, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }),
    notif: (c) => ({ position: "fixed", top: 22, right: 22, background: c, color: "#fff", borderRadius: 10, padding: "12px 22px", fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }),
  };

  const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "products", label: "📦 Products" },
    { id: "links", label: "🔗 Link Manager" },
    { id: "ai", label: "🤖 AI Content" },
  ];

  return (
    <div style={s.app}>
      {notification && <div style={s.notif(notification.color)}>{notification.msg}</div>}

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.logo}>⚡ NEXUS ULTRA PLATFORMS</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Affiliate Marketing Intelligence · Nisar LLC · Pakistan</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={s.badge(clr.green)}>🟢 Live</span>
          <span style={s.badge(clr.purple)}>Amazon Associates</span>
          <span style={s.badge(clr.blue)}>nisarllc206@gmail.com</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => <button key={t.id} style={s.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      <div style={s.body}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} sub="Last 30 days" color={clr.green} data={REV_DATA} />
              <StatCard icon="🖱️" label="Total Clicks" value={totalClicks.toLocaleString()} sub="Across all products" color={clr.blue} data={CLICK_DATA} />
              <StatCard icon="🛒" label="Conversions" value={totalConversions} sub={`${avgCR}% conv. rate`} color={clr.purple} data={[38,52,71,85,102,118]} />
              <StatCard icon="📈" label="Active Links" value={links.filter(l=>l.active).length} sub={`${links.length} total links`} color={clr.pink} data={[2,3,3,4,4,links.filter(l=>l.active).length]} />
            </div>

            {/* Top Earners */}
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>🏆 Top Earning Products</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...PRODUCTS].sort((a,b)=>b.revenue-a.revenue).slice(0,4).map((p,i) => (
                  <div key={p.asin} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: [clr.yellow, "#94a3b8", "#cd7f32", clr.purple][i], width: 24 }}>#{i+1}</span>
                    <span style={{ fontSize: 22 }}>{p.img}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{p.asin} · {p.category}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: clr.green, fontSize: 15 }}>${p.revenue.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: p.trend.startsWith("+") ? clr.green : clr.red }}>{p.trend}</div>
                    </div>
                    <div style={{ width: 80, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                      <div>{p.clicks.toLocaleString()} clicks</div>
                      <div style={{ marginTop: 3, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}>
                        <div style={{ height: "100%", width: `${(p.conversions/p.clicks)*100*8}%`, maxWidth: "100%", background: clr.purple, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>📈 Revenue Trend (6 months)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
                {REV_DATA.map((v, i) => {
                  const max = Math.max(...REV_DATA);
                  const isLast = i === REV_DATA.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ fontSize: 11, color: isLast ? clr.green : "#64748b", fontWeight: isLast ? 700 : 400 }}>${v}</div>
                      <div style={{ width: "100%", background: isLast ? `linear-gradient(180deg,${clr.green},${clr.blue})` : `${clr.purple}55`, borderRadius: "6px 6px 0 0", height: `${(v/max)*90}%`, minHeight: 6, transition: "height 0.5s" }} />
                      <div style={{ fontSize: 11, color: "#64748b" }}>{MONTHS[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {tab === "products" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input style={{ ...s.input, width: 260 }} placeholder="🔍 Search product or ASIN..." value={search} onChange={e => setSearch(e.target.value)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATS.map(c => <Pill key={c} label={c} color={clr.purple} active={cat===c} onClick={() => setCat(c)} />)}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(p => (
                <div key={p.asin} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px" }}>
                  <span style={{ fontSize: 30 }}>{p.img}</span>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>ASIN: {p.asin}</div>
                    <span style={{ ...s.badge(clr.blue), marginTop: 6, display: "inline-block" }}>{p.category}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", gap: 24, justifyContent: "center" }}>
                    {[["Clicks", p.clicks.toLocaleString(), clr.blue], ["Conv.", p.conversions, clr.purple], ["CR%", `${((p.conversions/p.clicks)*100).toFixed(1)}%`, clr.yellow]].map(([k,v,c]) => (
                      <div key={k} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{k}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: clr.green }}>${p.revenue.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{p.commission}% commission</div>
                    <div style={{ fontSize: 12, color: p.trend.startsWith("+") ? clr.green : clr.red, fontWeight: 700 }}>{p.trend} MoM</div>
                  </div>
                  <button style={s.btn(clr.purple)} onClick={() => { setAiProduct(p.name); setTab("ai"); }}>✍️ Write Content</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LINK MANAGER ── */}
        {tab === "links" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 14 }}>➕ Create New Affiliate Link</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input style={{ ...s.input, width: 200 }} placeholder="Enter ASIN (e.g. B09G9FPHY6)" value={asinInput} onChange={e => setAsinInput(e.target.value.toUpperCase())} />
                <button style={s.btn(clr.purple)} onClick={addLink}>⚡ Generate Link</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {links.map(l => (
                <div key={l.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 14, padding: "16px 22px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.active ? clr.green : clr.red, boxShadow: l.active ? `0 0 8px ${clr.green}` : "none", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: clr.blue, marginTop: 2 }}>{l.url}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>ASIN: {l.asin}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: clr.blue }}>{l.clicks.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Clicks</div>
                  </div>
                  <span style={s.badge(l.active ? clr.green : clr.red)}>{l.active ? "Active" : "Paused"}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={s.btn(clr.yellow, true)} onClick={() => { navigator.clipboard?.writeText(l.url); notify("📋 Link copied!"); }}>Copy</button>
                    <button style={s.btn(l.active ? clr.red : clr.green, true)} onClick={() => {
                      setLinks(prev => prev.map(x => x.id === l.id ? { ...x, active: !x.active } : x));
                      notify(l.active ? "⏸️ Link paused" : "▶️ Link activated", l.active ? clr.red : clr.green);
                    }}>{l.active ? "Pause" : "Activate"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI CONTENT ── */}
        {tab === "ai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>🤖 AI Content Generator</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Powered by Claude · Optimized for Amazon Affiliate SEO</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {AI_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setAiTemplate(t.id)} style={{ padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${aiTemplate===t.id ? clr.purple : clr.border}`, background: aiTemplate===t.id ? `${clr.purple}22` : "rgba(255,255,255,0.04)", color: aiTemplate===t.id ? clr.purple : "#94a3b8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>Product Name</label>
                  <input style={{ ...s.input, width: "100%" }} value={aiProduct} onChange={e => setAiProduct(e.target.value)} placeholder="Enter product name..." />
                </div>
                <div style={{ paddingTop: 20 }}>
                  <button style={{ ...s.btn("linear-gradient(90deg,#a78bfa,#38<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>NEXUS WALLS — AI Wallpaper Platform</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
:root{
  --cyan:#00f5ff;--purple:#bf00ff;--pink:#ff0080;--green:#00ff88;--gold:#ffd700;
  --bg:#020408;--card:#060d14;--card2:#0a1520;--card3:#0d1828;
  --border:rgba(0,245,255,0.18);--dim:#6b8fa8;--text:#e0f4ff;
  --glow-c:0 0 20px rgba(0,245,255,0.4);--glow-p:0 0 20px rgba(191,0,255,0.4);
  --glow-n:0 0 20px rgba(0,255,136,0.4);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Rajdhani',sans-serif;min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(0,245,255,0.2);border-radius:2px}

/* ─── BG CANVAS ─── */
#bgCanvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:.35}

/* ─── NAVBAR ─── */
nav{
  position:fixed;top:0;left:0;right:0;z-index:1000;
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 24px;
  background:rgba(2,4,8,.88);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);gap:12px;
}
.nav-logo{
  font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.15rem;
  background:linear-gradient(90deg,var(--cyan),var(--purple));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  letter-spacing:2px;white-space:nowrap;
}
.nav-links{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.nav-links a{
  color:var(--dim);text-decoration:none;font-size:.85rem;
  font-weight:500;letter-spacing:1px;transition:.3s;
  padding:6px 12px;border-radius:6px;
}
.nav-links a:hover,.nav-links a.active{color:var(--cyan);background:rgba(0,245,255,.06)}
.nav-links a.active{border:1px solid rgba(0,245,255,.2)}
.nav-right{display:flex;align-items:center;gap:10px}
.nav-cta{
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  border:none;padding:8px 18px;border-radius:4px;
  color:#000;font-family:'Orbitron',sans-serif;
  font-size:.72rem;font-weight:700;letter-spacing:1px;
  cursor:pointer;transition:.3s;white-space:nowrap;
}
.nav-cta:hover{transform:scale(1.04);box-shadow:0 0 20px rgba(0,245,255,.5)}
.gh-pill{
  display:flex;align-items:center;gap:6px;
  border:1px solid rgba(0,245,255,.25);border-radius:20px;
  padding:5px 12px;font-family:'Share Tech Mono',monospace;font-size:.72rem;
  color:var(--cyan);cursor:pointer;transition:.3s;background:rgba(0,245,255,.04);
}
.gh-pill:hover{border-color:var(--cyan);background:rgba(0,245,255,.08)}
.gh-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px var(--green);animation:blink 2s infinite;flex-shrink:0}
.gh-dot.off{background:#444;box-shadow:none;animation:none}
.burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}
.burger span{display:block;width:22px;height:2px;background:var(--cyan);border-radius:2px;transition:.3s}
.burger.open span:nth-child(1){transform:rotate(45deg) translate(5px,5px)}
.burger.open span:nth-child(2){opacity:0}
.burger.open span:nth-child(3){transform:rotate(-45deg) translate(5px,-5px)}
.mobile-menu{
  display:none;position:fixed;top:58px;left:0;right:0;z-index:999;
  background:rgba(2,4,8,.97);backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);padding:16px 24px;
  flex-direction:column;gap:4px;
}
.mobile-menu.open{display:flex}
.mobile-menu a{color:var(--dim);text-decoration:none;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.95rem}
.mobile-menu a:hover{color:var(--cyan)}

/* ─── PAGE VIEWS ─── */
.page{display:none}
.page.active{display:block}

/* ─── HERO ─── */
.hero{
  position:relative;z-index:1;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:100px 24px 60px;
}
.hero-badge{
  display:inline-flex;align-items:center;gap:8px;
  border:1px solid rgba(0,245,255,.3);border-radius:20px;
  padding:6px 16px;margin-bottom:24px;
  font-size:.73rem;letter-spacing:2px;color:var(--cyan);
  animation:pulse-border 2s ease-in-out infinite;
}
.hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes pulse-border{0%,100%{border-color:rgba(0,245,255,.3)}50%{border-color:rgba(0,245,255,.7)}}
.hero h1{
  font-family:'Orbitron',sans-serif;
  font-size:clamp(2.4rem,8vw,5.5rem);
  font-weight:900;line-height:1.1;margin-bottom:16px;
}
.line1{background:linear-gradient(135deg,#fff 30%,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.line2{background:linear-gradient(135deg,var(--purple),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{font-size:1.05rem;color:var(--dim);max-width:580px;line-height:1.7;margin-bottom:36px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
.btn-primary{
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  border:none;padding:13px 30px;border-radius:4px;
  color:#000;font-family:'Orbitron',sans-serif;font-size:.78rem;
  font-weight:700;letter-spacing:2px;cursor:pointer;transition:.3s;text-transform:uppercase;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,245,255,.4)}
.btn-outline{
  background:transparent;border:1px solid var(--border);
  padding:13px 30px;border-radius:4px;color:var(--cyan);
  font-family:'Orbitron',sans-serif;font-size:.78rem;
  font-weight:600;letter-spacing:2px;cursor:pointer;transition:.3s;text-transform:uppercase;
}
.btn-outline:hover{border-color:var(--cyan);background:rgba(0,245,255,.05)}
.hero-stats{display:flex;gap:40px;margin-top:56px;flex-wrap:wrap;justify-content:center}
.stat{text-align:center}
.stat-num{font-family:'Orbitron',sans-serif;font-size:1.7rem;font-weight:900;color:var(--cyan)}
.stat-lbl{font-size:.72rem;color:var(--dim);letter-spacing:1px;text-transform:uppercase}

/* ─── COMMON ─── */
.wrap{position:relative;z-index:1;padding:0 24px 80px;max-width:1400px;margin:0 auto}
.section-title{font-family:'Orbitron',sans-serif;font-size:1.35rem;font-weight:700;color:var(--text);margin-bottom:6px;letter-spacing:2px}
.section-sub{color:var(--dim);font-size:.92rem;margin-bottom:28px}
.sep{height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:50px 0}

/* ─── GENERATOR ─── */
.gen-box{
  background:var(--card);border:1px solid var(--border);border-radius:12px;
  padding:28px;margin-bottom:56px;position:relative;overflow:hidden;
}
.gen-box::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--cyan),var(--purple),transparent);
  animation:scanline 3s linear infinite;
}
@keyframes scanline{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
.gen-row{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.gen-input{
  flex:1;min-width:200px;background:rgba(0,245,255,.04);
  border:1px solid var(--border);border-radius:6px;padding:13px 16px;
  color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.95rem;
  outline:none;transition:.3s;
}
.gen-input:focus{border-color:var(--cyan)}
.gen-input::placeholder{color:var(--dim)}
.gen-select{
  background:rgba(0,245,255,.04);border:1px solid var(--border);
  border-radius:6px;padding:13px 16px;color:var(--text);
  font-family:'Rajdhani',sans-serif;font-size:.9rem;outline:none;cursor:pointer;
}
.gen-select option{background:#060d14}
.gen-btn{
  background:linear-gradient(135deg,var(--cyan),var(--purple));
  border:none;padding:13px 26px;border-radius:6px;
  color:#000;font-family:'Orbitron',sans-serif;font-size:.76rem;
  font-weight:700;letter-spacing:1px;cursor:pointer;transition:.3s;white-space:nowrap;
}
.gen-btn:hover{transform:scale(1.03);box-shadow:0 0 24px rgba(0,245,255,.4)}
.gen-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{
  padding:6px 14px;border-radius:20px;font-size:.76rem;
  border:1px solid rgba(0,245,255,.18);color:var(--dim);
  cursor:pointer;transition:.2s;letter-spacing:.5px;
}
.chip:hover,.chip.on{border-color:var(--cyan);color:var(--cyan);background:rgba(0,245,255,.07)}
.ai-thinking{display:none;padding:38px;text-align:center;border:1px solid var(--border);border-radius:8px;margin-top:22px}
.ai-thinking.show{display:block}
.thinking-orb{
  width:58px;height:58px;border-radius:50%;margin:0 auto 14px;
  background:conic-gradient(var(--cyan),var(--purple),var(--pink),var(--cyan));
  animation:spin 1s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.thinking-txt{color:var(--dim);font-size:.88rem}
.thinking-desc{color:var(--cyan);font-size:.82rem;margin-top:7px;min-height:22px}
.gen-result{display:none;margin-top:22px;border:1px solid rgba(0,245,255,.18);border-radius:8px;overflow:hidden}
.gen-result.show{display:block}
.result-hdr{
  padding:11px 18px;background:rgba(0,245,255,.04);
  display:flex;justify-content:space-between;align-items:center;
  border-bottom:1px solid var(--border);
}
.result-title{font-family:'Orbitron',sans-serif;font-size:.77rem;color:var(--cyan)}
#genCanvas{width:100%;height:300px;display:block}
.result-actions{display:flex;gap:9px;padding:13px 18px;background:rgba(0,0,0,.3);flex-wrap:wrap}
.r-btn{padding:7px 18px;border-radius:4px;font-size:.76rem;font-family:'Orbitron',sans-serif;cursor:pointer;transition:.2s;letter-spacing:.8px;border:none}
.r-btn.dl{background:var(--green);color:#000;font-weight:700}
.r-btn.dl:hover{box-shadow:var(--glow-n)}
.r-btn.save{background:transparent;border:1px solid var(--purple);color:var(--purple)}
.r-btn.save:hover{background:rgba(191,0,255,.1)}
.r-btn.regen{background:transparent;border:1px solid var(--dim);color:var(--dim)}
.r-btn.regen:hover{border-color:var(--cyan);color:var(--cyan)}

/* ─── FILTER BAR ─── */
.filter-bar{display:flex;align-items:center;gap:10px;margin-bottom:28px;flex-wrap:wrap}
.f-btn{
  padding:7px 18px;border-radius:4px;font-size:.76rem;
  border:1px solid rgba(0,245,255,.18);color:var(--dim);
  cursor:pointer;transition:.2s;background:transparent;
  font-family:'Orbitron',sans-serif;letter-spacing:1px;
}
.f-btn.on,.f-btn:hover{border-color:var(--cyan);color:var(--cyan);background:rgba(0,245,255,.06)}
.search-wrap{margin-left:auto;position:relative}
.search-inp{
  background:rgba(0,245,255,.04);border:1px solid var(--border);
  border-radius:6px;padding:8px 14px 8px 36px;
  color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.88rem;
  outline:none;width:210px;transition:.3s;
}
.search-inp:focus{border-color:var(--cyan);width:260px}
.search-ico{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--dim);font-size:.85rem}

/* ─── WALLPAPER GRID ─── */
.wall-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
.wall-card{
  border-radius:10px;overflow:hidden;position:relative;
  cursor:pointer;transition:.3s;border:1px solid rgba(0,245,255,.08);
  background:var(--card);aspect-ratio:16/10;
}
.wall-card:hover{transform:translateY(-4px);border-color:var(--cyan);box-shadow:0 8px 32px rgba(0,245,255,.18)}
.wall-card canvas{width:100%;height:100%;display:block}
.wall-ov{
  position:absolute;inset:0;
  background:linear-gradient(to top,rgba(0,0,0,.9) 0%,transparent 60%);
  opacity:0;transition:.3s;padding:14px;
  display:flex;flex-direction:column;justify-content:flex-end;
}
.wall-card:hover .wall-ov{opacity:1}
.wall-name{font-family:'Orbitron',sans-serif;font-size:.72rem;color:#fff;font-weight:700;margin-bottom:3px}
.wall-tag{font-size:.67rem;color:var(--cyan);letter-spacing:1px;margin-bottom:9px}
.wall-acts{display:flex;gap:7px}
.w-btn{padding:5px 11px;border-radius:3px;font-size:.65rem;font-family:'Orbitron',sans-serif;cursor:pointer;transition:.2s;letter-spacing:.5px;border:none}
.w-btn.dl{background:var(--cyan);color:#000;font-weight:700}
.w-btn.prev{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)}
.wall-res{
  position:absolute;top:9px;right:9px;background:rgba(0,0,0,.7);
  border:1px solid rgba(0,245,255,.28);border-radius:3px;padding:2px 7px;
  font-size:.62rem;color:var(--cyan);font-family:'Orbitron',sans-serif;
}
.wall-new{
  position:absolute;top:9px;left:9px;background:var(--pink);color:#000;
  border-radius:3px;padding:2px 7px;font-size:.62rem;font-weight:700;
  font-family:'Orbitron',sans-serif;
}

/* ─── TRENDING ─── */
.trending-scroll{display:flex;gap:14px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory;-ms-overflow-style:none;scrollbar-width:none}
.trending-scroll::-webkit-scrollbar{display:none}
.trend-card{flex:0 0 190px;border-radius:8px;overflow:hidden;position:relative;cursor:pointer;scroll-snap-align:start;transition:.3s;border:1px solid rgba(0,245,255,.08)}
.trend-card:hover{border-color:var(--cyan);transform:scale(1.03)}
.trend-card canvas{width:190px;height:125px;display:block}
.trend-info{padding:9px 11px;background:var(--card2)}
.trend-name{font-size:.75rem;color:var(--text);font-weight:600;margin-bottom:2px}
.trend-count{font-size:.66rem;color:var(--dim)}

/* ─── FEATURED ─── */
.feat-row{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:56px}
.feat-big{grid-row:span 2}
.feat-card{border-radius:10px;overflow:hidden;position:relative;cursor:pointer;transition:.3s;border:1px solid rgba(0,245,255,.12)}
.feat-card:hover{border-color:var(--purple);box-shadow:var(--glow-p)}
.feat-card canvas{width:100%;display:block}
.feat-big canvas{height:480px}
.feat-card:not(.feat-big) canvas{height:232px}
.feat-card .wall-ov{opacity:.4}
.feat-card:hover .wall-ov{opacity:1}

/* ─── MODAL ─── */
.modal-bg{display:none;position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.92);backdrop-filter:blur(10px);align-items:center;justify-content:center;padding:20px}
.modal-bg.open{display:flex}
.modal{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;max-width:900px;width:100%;animation:minIn .3s ease}
@keyframes minIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
.modal-top{display:flex;justify-content:space-between;align-items:center;padding:15px 22px;border-bottom:1px solid var(--border)}
.modal-title{font-family:'Orbitron',sans-serif;font-size:.85rem;color:var(--cyan)}
.modal-close{background:none;border:none;color:var(--dim);font-size:1.3rem;cursor:pointer}
.modal-close:hover{color:var(--pink)}
#modalCanvas{width:100%;max-height:440px;display:block}
.modal-info{padding:18px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}
.modal-name{font-family:'Orbitron',sans-serif;font-size:1rem;color:#fff;margin-bottom:4px}
.modal-tags{display:flex;gap:7px;flex-wrap:wrap}
.modal-tag{padding:3px 9px;border-radius:10px;font-size:.7rem;border:1px solid rgba(0,245,255,.28);color:var(--cyan)}
.modal-dl{background:linear-gradient(135deg,var(--cyan),var(--green));border:none;padding:10px 22px;border-radius:4px;color:#000;font-family:'Orbitron',sans-serif;font-size:.75rem;font-weight:700;letter-spacing:1px;cursor:pointer;transition:.3s}
.modal-dl:hover{box-shadow:var(--glow-n)}

/* ─── SETTINGS MODAL ─── */
.settings-bg{display:none;position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.87);backdrop-filter:blur(12px);align-items:center;justify-content:center;padding:20px}
.settings-bg.open{display:flex}
.settings-modal{background:var(--card);border:1px solid var(--border);border-radius:14px;width:100%;max-width:500px;animation:minIn .3s ease;overflow:hidden}
.settings-hdr{padding:18px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(90deg,rgba(0,245,255,.05),transparent)}
.settings-title{font-family:'Orbitron',sans-serif;font-size:.9rem;color:var(--cyan);letter-spacing:2px}
.settings-body{padding:26px 22px}
.s-label{font-size:.75rem;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:7px;display:block}
.api-wrap{position:relative;margin-bottom:14px}
.api-inp{width:100%;background:rgba(0,245,255,.04);border:1px solid var(--border);border-radius:8px;padding:13px 46px 13px 15px;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.9rem;outline:none;transition:.3s;letter-spacing:1px}
.api-inp:focus{border-color:var(--cyan)}
.api-inp.ok{border-color:var(--green)}
.api-inp.err{border-color:var(--pink)}
.eye-btn{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--dim);cursor:pointer;font-size:.95rem;transition:.2s}
.eye-btn:hover{color:var(--cyan)}
.api-hint{font-size:.73rem;color:var(--dim);line-height:1.6;margin-bottom:18px;padding:11px;border-radius:6px;background:rgba(0,245,255,.03);border:1px solid rgba(0,245,255,.07)}
.api-hint a{color:var(--cyan);text-decoration:none}
.api-hint a:hover{text-decoration:underline}
.api-status-bar{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:6px;margin-bottom:18px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.05);font-size:.78rem;transition:.3s}
.api-status-bar.ok{border-color:rgba(0,255,136,.25)}
.api-status-bar.err{border-color:rgba(255,0,128,.25)}
.api-sdot{width:7px;height:7px;border-radius:50%;background:#444;flex-shrink:0;transition:.3s}
.api-sdot.ok{background:var(--green);box-shadow:0 0 5px var(--green)}
.api-sdot.err{background:var(--pink);box-shadow:0 0 5px var(--pink)}
.api-stxt{color:var(--dim)}

/* ─── GITHUB PAGE ─── */
.gh-page{position:relative;z-index:1;padding:90px 24px 0}
.gh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
.gsc{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:13px 16px;position:relative;overflow:hidden;transition:.25s}
.gsc::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px}
.gsc.c::after{background:linear-gradient(90deg,var(--cyan),transparent)}
.gsc.p::after{background:linear-gradient(90deg,var(--purple),transparent)}
.gsc.n::after{background:linear-gradient(90deg,var(--green),transparent)}
.gsc.g::after{background:linear-gradient(90deg,var(--gold),transparent)}
.gsc:hover{transform:translateY(-2px);border-color:rgba(0,245,255,.2)}
.gsc-n{font-family:'Orbitron',sans-serif;font-size:22px;font-weight:900;line-height:1;margin-bottom:2px}
.gsc.c .gsc-n{color:var(--cyan)}.gsc.p .gsc-n{color:var(--purple)}.gsc.n .gsc-n{color:var(--green)}.gsc.g .gsc-n{color:var(--gold)}
.gsc-l{font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--dim);letter-spacing:2px;text-transform:uppercase}

/* gh tabs */
.gh-tabs{display:flex;gap:3px;padding:8px 0;overflow-x:auto;margin-bottom:22px}
.gh-tabs::-webkit-scrollbar{display:none}
.gtab{flex-shrink:0;padding:8px 18px;background:transparent;border:1px solid transparent;border-radius:8px;cursor:pointer;font-family:'Orbitron',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;color:var(--dim);transition:.2s;white-space:nowrap}
.gtab.on{color:var(--cyan);background:rgba(0,245,255,.07);border-color:rgba(0,245,255,.22)}
.gtab:hover:not(.on){color:var(--text);background:rgba(255,255,255,.03)}

/* gh panels */
.gpanel{display:none;animation:fu .3s ease}
.gpanel.on{display:block}
@keyframes fu{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}

/* cards */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.sp2{grid-column:span 2}
.gcard{background:var(--card);border:1pxhttps://github.com/nisarllc206-sys/bookish-octo-succotash.gitsoftware that offers a range of features for creating and managing websites. It's built with modern technologies like Flutter Web, Firebase, and Clean Architecture, ensuring a scalable and maintainable solution.
‎
‎Some key features of Nexus Ultra Platforms include
‎Drag-and-drop builderCreate stunning websites without coding
‎Full-stack capabilitiesDesign, develop, and deploy with ease
‎-Group website managementHandle multiple sites and teams seamlessly
‎Trendy and responsive designs Modern looks that work on any device
‎
‎It's a great option for businesses and creators looking to build and grow their online presence. ¹
‎
‎Want to know more about Nexus Ultra Platforms' features or how to get started?
‎
