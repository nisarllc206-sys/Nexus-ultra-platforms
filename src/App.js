import { useState } from "react";

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

const clr = {
  purple: "#a78bfa",
  blue: "#38bdf8",
  pink: "#f472b6",
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
  dark: "#0f0c29",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.1)",
};

const MiniBar = ({ data, color }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 48 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : `${color}55`,
            borderRadius: "3px 3px 0 0",
            height: `${(v / max) * 100}%`,
            transition: "height 0.4s",
          }}
        />
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, data }) => (
  <div
    style={{
      background: clr.card,
      border: `1px solid ${clr.border}`,
      borderRadius: 16,
      padding: "20px",
      flex: 1,
      backdropFilter: "blur(8px)",
      borderTop: `3px solid ${color}`,
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
          {icon} {label}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{sub}</div>
      </div>
      {data && (
        <div style={{ width: 80 }}>
          <MiniBar data={data} color={color} />
        </div>
      )}
    </div>
  </div>
);

const Pill = ({ label, color, onClick, active }) => (
  <button
    onClick={onClick}
    style={{
      padding: "5px 14px",
      borderRadius: 20,
      border: `1.5px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
      background: active ? `${color}22` : "transparent",
      color: active ? color : "#94a3b8",
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.2s",
    }}
  >
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

  const filtered = PRODUCTS.filter(
    (p) =>
      (cat === "All" || p.category === cat) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.asin.includes(search))
  );

  const generateContent = async () => {
    setAiLoading(true);
    setAiOutput("");
    try {
      const tpl = AI_TEMPLATES.find((t) => t.id === aiTemplate);
      const prompt = `You are an expert Amazon affiliate content writer for Nexus Ultra Platforms (Pakistan-based digital company). Write a ${tpl.label} for the product: "${aiProduct}". Keep it engaging, SEO-optimized, and conversion-focused. Include a strong CTA. Max 150 words.`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b) => b.text || "").join("") || "Failed to generate.";
      setAiOutput(text);
    } catch {
      setAiOutput("⚠️ Error generating content. Please try again.");
    }
    setAiLoading(false);
  };

  const addLink = () => {
    if (!asinInput.trim()) return;
    const newLink = {
      id: Date.now(),
      name: `New Link (${asinInput})`,
      asin: asinInput.toUpperCase(),
      url: `https://nisar.llc/go/${asinInput.toLowerCase()}`,
      clicks: 0,
      active: true,
    };
    setLinks((prev) => [newLink, ...prev]);
    setAsinInput("");
    notify("✅ Affiliate link created!");
  };

  const s = {
    app: {
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${clr.dark}, #302b63, #24243e)`,
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', sans-serif",
      paddingBottom: 48,
    },
    header: {
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${clr.border}`,
      padding: "16px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: {
      fontSize: 22,
      fontWeight: 900,
      background: "linear-gradient(90deg, #a78bfa, #38bdf8, #f472b6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    tabs: { display: "flex", gap: 6, padding: "24px 32px 0" },
    tabBtn: (a) => ({
      padding: "9px 22px",
      borderRadius: 30,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 13,
      background: a ? "linear-gradient(90deg,#a78bfa,#38bdf8)" : "rgba(255,255,255,0.07)",
      color: a ? "#fff" : "#94a3b8",
      transition: "all 0.2s",
    }),
    body: { padding: "24px 32px" },
    card: {
      background: clr.card,
      borderRadius: 16,
      border: `1px solid ${clr.border}`,
      padding: "22px 24px",
      backdropFilter: "blur(8px)",
    },
    input: {
      background: "rgba(255,255,255,0.07)",
      border: `1px solid ${clr.border}`,
      borderRadius: 8,
      color: "#e2e8f0",
      padding: "9px 14px",
      fontSize: 13,
      outline: "none",
    },
    btn: (bg, outline) => ({
      padding: "8px 18px",
      borderRadius: 9,
      border: outline ? `1.5px solid ${bg}` : "none",
      background: outline ? "transparent" : bg,
      color: outline ? bg : "#fff",
      fontWeight: 700,
      fontSize: 13,
      cursor: "pointer",
    }),
    badge: (c) => ({
      background: `${c}22`,
      border: `1px solid ${c}55`,
      color: c,
      borderRadius: 20,
      padding: "2px 10px",
      fontSize: 11,
      fontWeight: 700,
    }),
    notif: (c) => ({
      position: "fixed",
      top: 22,
      right: 22,
      background: c,
      color: "#fff",
      borderRadius: 10,
      padding: "12px 22px",
      fontWeight: 700,
      zIndex: 9999,
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }),
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
          <div style={{ fontSize: 11, color: "#64748b" }}>
            Affiliate Marketing Intelligence · Nisar LLC · Pakistan
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={s.badge(clr.green)}>🟢 Live</span>
          <span style={s.badge(clr.purple)}>Amazon Associates</span>
          <span style={s.badge(clr.blue)}>nisarllc206@gmail.com</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((t) => (
          <button key={t.id} style={s.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.body}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <StatCard icon="💰" label="Total Revenue" value={`$${totalRevenue.toFixed(0)}`} sub="Last 30 days" color={clr.green} data={REV_DATA} />
              <StatCard icon="🖱️" label="Total Clicks" value={totalClicks.toLocaleString()} sub="Across all products" color={clr.blue} data={CLICK_DATA} />
              <StatCard icon="🛒" label="Conversions" value={totalConversions} sub={`${avgCR}% conv. rate`} color={clr.purple} data={[38, 52, 71, 85, 102, 118]} />
              <StatCard icon="📈" label="Active Links" value={links.filter((l) => l.active).length} sub={`${links.length} total links`} color={clr.pink} data={[2, 3, 3, 4, 4, links.filter((l) => l.active).length]} />
            </div>

            {/* Top Earners */}
            <div style={s.card}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 18 }}>🏆 Top Earning Products</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...PRODUCTS]
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 4)
                  .map((p, i) => (
                    <div
                      key={p.asin}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <span style={{ fontSize: 18, fontWeight: 900, color: [clr.yellow, "#94a3b8", "#cd7f32", clr.purple][i], width: 24 }}>
                        #{i + 1}
                      </span>
                      <span style={{ fontSize: 22 }}>{p.img}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {p.asin} · {p.category}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, color: clr.green, fontSize: 15 }}>${p.revenue.toFixed(2)}</div>
                        <div style={{ fontSize: 11, color: p.trend.startsWith("+") ? clr.green : clr.red }}>
                          {p.trend}
                        </div>
                      </div>
                      <div style={{ width: 80, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                        <div>{p.clicks.toLocaleString()} clicks</div>
                        <div style={{ marginTop: 3, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${(p.conversions / p.clicks) * 100 * 8}%`,
                              maxWidth: "100%",
                              background: clr.purple,
                              borderRadius: 2,
                            }}
                          />
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
                      <div style={{ fontSize: 11, color: isLast ? clr.green : "#64748b", fontWeight: isLast ? 700 : 400 }}>
                        ${v}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          background: isLast ? `linear-gradient(180deg,${clr.green},${clr.blue})` : `${clr.purple}55`,
                          borderRadius: "6px 6px 0 0",
                          height: `${(v / max) * 90}%`,
                          minHeight: 6,
                          transition: "height 0.5s",
                        }}
                      />
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
              <input
                style={{ ...s.input, width: 260 }}
                placeholder="🔍 Search product or ASIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATS.map((c) => (
                  <Pill key={c} label={c} color={clr.purple} active={cat === c} onClick={() => setCat(c)} />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((p) => (
                <div key={p.asin} style={{ ...s.card, display: "flex", alignItems: "center", gap: 16, padding: "16px 22px" }}>
                  <span style={{ fontSize: 30 }}>{p.img}</span>
                  <div style={{ minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>ASIN: {p.asin}</div>
                    <span style={{ ...s.badge(clr.blue), marginTop: 6, display: "inline-block" }}>{p.category}</span>
                  </div>
                  <div style={{ flex: 1, display: "flex", gap: 24, justifyContent: "center" }}>
                    {[
                      ["Clicks", p.clicks.toLocaleString(), clr.blue],
                      ["Conv.", p.conversions, clr.purple],
                      ["CR%", `${((p.conversions / p.clicks) * 100).toFixed(1)}%`, clr.yellow],
                    ].map(([k, v, c]) => (
                      <div key={k} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{k}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: clr.green }}>${p.revenue.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{p.commission}% commission</div>
                    <div style={{ fontSize: 12, color: p.trend.startsWith("+") ? clr.green : clr.red, fontWeight: 700 }}>
                      {p.trend} MoM
                    </div>
                  </div>
                  <button
                    style={s.btn(clr.purple)}
                    onClick={() => {
                      setAiProduct(p.name);
                      setTab("ai");
                    }}
                  >
                    ✍️ Write Content
                  </button>
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
                <input
                  style={{ ...s.input, width: 200 }}
                  placeholder="Enter ASIN (e.g. B09G9FPHY6)"
                  value={asinInput}
                  onChange={(e) => setAsinInput(e.target.value.toUpperCase())}
                />
                <button style={s.btn(clr.purple)} onClick={addLink}>
                  ⚡ Generate Link
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {links.map((l) => (
                <div key={l.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 14, padding: "16px 22px" }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: l.active ? clr.green : clr.red,
                      boxShadow: l.active ? `0 0 8px ${clr.green}` : "none",
                      flexShrink: 0,
                    }}
                  />
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
                    <button
                      style={s.btn(clr.yellow, true)}
                      onClick={() => {
                        navigator.clipboard?.writeText(l.url);
                        notify("📋 Link copied!");
                      }}
                    >
                      Copy
                    </button>
                    <button
                      style={s.btn(l.active ? clr.red : clr.green, true)}
                      onClick={() => {
                        setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, active: !x.active } : x)));
                        notify(l.active ? "⏸️ Link paused" : "▶️ Link activated", l.active ? clr.red : clr.green);
                      }}
                    >
                      {l.active ? "Pause" : "Activate"}
                    </button>
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
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
                Powered by Claude · Optimized for Amazon Affiliate SEO
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                {AI_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAiTemplate(t.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: `1.5px solid ${aiTemplate === t.id ? clr.purple : clr.border}`,
                      background: aiTemplate === t.id ? `${clr.purple}22` : "rgba(255,255,255,0.04)",
                      color: aiTemplate === t.id ? clr.purple : "#94a3b8",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 6 }}>
                    Product Name
                  </label>
                  <input
                    style={{ ...s.input, width: "100%" }}
                    value={aiProduct}
                    onChange={(e) => setAiProduct(e.target.value)}
                    placeholder="Enter product name..."
                  />
                </div>
                <div style={{ paddingTop: 20 }}>
                  <button
                    style={s.btn("linear-gradient(90deg,#a78bfa,#38bdf8)")}
                    onClick={generateContent}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "⏳ Generating..." : "✨ Generate Content"}
                  </button>
                </div>
              </div>
              {aiOutput && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    padding: "16px 20px",
                    border: `1px solid ${clr.border}`,
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: "#e2e8f0",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {aiOutput}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
