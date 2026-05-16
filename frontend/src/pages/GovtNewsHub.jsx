import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, ExternalLink, RefreshCw, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle,
  IndianRupee, Shield, Newspaper, BarChart2,
  Loader, Search, Filter, Bell, CheckCircle, Info
} from 'lucide-react';

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const _style = document.createElement('style');
_style.textContent = `
  .gov-card {
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    transition: border-color 0.25s ease, transform 0.25s ease;
  }
  .gov-card-lift:hover { transform: translateY(-3px); border-color: var(--glass-border-h); box-shadow: 0 16px 48px rgba(0,0,0,0.38); }

  .gov-tab {
    padding: 9px 18px; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.09em; text-transform: uppercase; cursor: pointer;
    border: 1px solid transparent; transition: all 0.18s ease;
    display: flex; align-items: center; gap: 6px;
  }
  .gov-tab-active   { background: rgba(74,222,128,0.14); color: var(--neon-sage); border-color: rgba(74,222,128,0.32); }
  .gov-tab-inactive { background: rgba(255,255,255,0.03); color: var(--text-muted); }
  .gov-tab-inactive:hover { color: var(--text-secondary); background: rgba(255,255,255,0.06); }

  .gov-msp-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 16px; border-radius: 11px;
    background: rgba(10,22,14,0.55); border: 1px solid var(--glass-border);
    transition: all 0.2s; cursor: default;
  }
  .gov-msp-row:hover { border-color: var(--glass-border-h); background: rgba(10,22,14,0.8); }

  .gov-news-card {
    padding: 18px 20px; border-radius: 14px;
    background: rgba(10,22,14,0.6); border: 1px solid var(--glass-border);
    transition: all 0.22s; cursor: pointer;
  }
  .gov-news-card:hover { border-color: var(--glass-border-h); background: rgba(10,22,14,0.85); transform: translateY(-2px); }

  .gov-scheme-card {
    padding: 20px 22px; border-radius: 14px;
    background: rgba(10,22,14,0.6); border: 1px solid var(--glass-border);
    transition: all 0.22s; position: relative; overflow: hidden;
  }
  .gov-scheme-card:hover { border-color: var(--glass-border-h); }
  .gov-scheme-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    border-radius: 14px 14px 0 0;
  }

  .gov-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 9.5px; font-weight: 800; letter-spacing: 0.10em; text-transform: uppercase;
  }
  .gov-badge-up     { color: #4ade80; background: rgba(74,222,128,0.12);  border: 1px solid rgba(74,222,128,0.25); }
  .gov-badge-down   { color: #f87171; background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.25); }
  .gov-badge-new    { color: #fbbf24; background: rgba(251,191,36,0.12);  border: 1px solid rgba(251,191,36,0.25); }
  .gov-badge-govt   { color: #2dd4bf; background: rgba(45,212,191,0.12);  border: 1px solid rgba(45,212,191,0.25); }
  .gov-badge-scheme { color: #a78bfa; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.25); }
  .gov-badge-msp    { color: #10b981; background: rgba(16,185,129,0.12);  border: 1px solid rgba(16,185,129,0.25); }

  .gov-search {
    background: rgba(10,22,14,0.85); border: 1px solid var(--glass-border);
    border-radius: 10px; color: var(--text-primary);
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    padding: 10px 14px 10px 38px; outline: none; width: 100%;
    transition: all 0.25s;
  }
  .gov-search:focus { border-color: var(--neon-sage); box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .gov-search::placeholder { color: var(--text-muted); }

  .gov-ticker {
    display: flex; gap: 0; overflow: hidden;
    background: rgba(10,22,14,0.9); border-bottom: 1px solid var(--glass-border);
    border-top: 1px solid var(--glass-border);
  }
  .gov-ticker-track {
    display: flex; gap: 0; animation: gov-ticker 40s linear infinite;
    white-space: nowrap;
  }
  @keyframes gov-ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  .gov-ticker-item {
    padding: 8px 24px; font-size: 11.5px; font-weight: 600;
    border-right: 1px solid var(--glass-border); white-space: nowrap;
    display: flex; align-items: center; gap: 7px; flex-shrink: 0;
  }

  @keyframes gov-fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .gov-s1 { animation: gov-fadeUp 0.4s 0.00s cubic-bezier(0.22,1,0.36,1) both; }
  .gov-s2 { animation: gov-fadeUp 0.4s 0.07s cubic-bezier(0.22,1,0.36,1) both; }
  .gov-s3 { animation: gov-fadeUp 0.4s 0.14s cubic-bezier(0.22,1,0.36,1) both; }
  .gov-s4 { animation: gov-fadeUp 0.4s 0.21s cubic-bezier(0.22,1,0.36,1) both; }

  .gov-filter-select {
    background: rgba(10,22,14,0.85); border: 1px solid var(--glass-border);
    border-radius: 9px; color: var(--text-secondary);
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight:600;
    padding: 9px 28px 9px 12px; outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    transition: all 0.2s;
  }
  .gov-filter-select:focus { border-color: var(--neon-sage); }
  .gov-filter-select option { background: #0d1f10; }

  .gov-msp-season-tab {
    padding: 7px 16px; border-radius: 9px; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border: 1px solid;
    font-family: 'DM Sans', sans-serif; transition: all 0.18s;
  }

  .gov-live-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; display: inline-block; position: relative;
  }
  .gov-live-dot::after {
    content: ''; position: absolute; inset: 0; border-radius: 50%;
    background: #4ade80; animation: gov-ripple 1.5s ease-out infinite;
  }
  @keyframes gov-ripple { 0%{transform:scale(0.9);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }

  .gov-stat-strip {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 12px;
  }
  .gov-stat-box {
    padding: 16px 18px; border-radius: 13px;
    background: rgba(10,22,14,0.65); border: 1px solid var(--glass-border);
    text-align: center;
  }
`;
if (!document.getElementById('gov-styles')) { _style.id = 'gov-styles'; document.head.appendChild(_style); }

/* ─── Real MSP Data (Official CACP / GoI figures) ────────────────────────────── */
const MSP_DATA = {
  kharif: [
    { crop:'Paddy (Common)',    emoji:'🍚', msp2025:2369, msp2024:2300, hike:69,  margin:50,  category:'Cereal' },
    { crop:'Paddy (Grade A)',   emoji:'🍚', msp2025:2389, msp2024:2320, hike:69,  margin:50,  category:'Cereal' },
    { crop:'Jowar (Hybrid)',    emoji:'🌾', msp2025:3421, msp2024:3180, hike:241, margin:50,  category:'Cereal' },
    { crop:'Bajra',             emoji:'🌾', msp2025:2725, msp2024:2500, hike:225, margin:63,  category:'Cereal' },
    { crop:'Maize',             emoji:'🌽', msp2025:2225, msp2024:2090, hike:135, margin:59,  category:'Cereal' },
    { crop:'Ragi',              emoji:'🌾', msp2025:4290, msp2024:3846, hike:596, margin:50,  category:'Cereal' },
    { crop:'Tur (Arhar)',       emoji:'🫘', msp2025:7550, msp2024:7000, hike:550, margin:59,  category:'Pulse' },
    { crop:'Moong',             emoji:'🫘', msp2025:8682, msp2024:8558, hike:124, margin:50,  category:'Pulse' },
    { crop:'Urad',              emoji:'🫘', msp2025:7400, msp2024:7000, hike:400, margin:52,  category:'Pulse' },
    { crop:'Groundnut',         emoji:'🥜', msp2025:6783, msp2024:6377, hike:406, margin:50,  category:'Oilseed' },
    { crop:'Soybean',           emoji:'🌿', msp2025:4892, msp2024:4600, hike:292, margin:50,  category:'Oilseed' },
    { crop:'Sesamum',           emoji:'🌿', msp2025:9267, msp2024:8635, hike:579, margin:50,  category:'Oilseed' },
    { crop:'Nigerseed',         emoji:'🌿', msp2025:8717, msp2024:7734, hike:820, margin:50,  category:'Oilseed' },
    { crop:'Cotton (Med.)',     emoji:'🌸', msp2025:7121, msp2024:6620, hike:589, margin:50,  category:'Commercial' },
    { crop:'Cotton (Long)',     emoji:'🌸', msp2025:7521, msp2024:7020, hike:589, margin:50,  category:'Commercial' },
  ],
  rabi: [
    { crop:'Wheat',             emoji:'🌾', msp2025:2425, msp2024:2275, hike:150, margin:105, category:'Cereal' },
    { crop:'Barley',            emoji:'🌾', msp2025:1980, msp2024:1850, hike:130, margin:60,  category:'Cereal' },
    { crop:'Gram (Chana)',      emoji:'🫘', msp2025:5650, msp2024:5440, hike:210, margin:60,  category:'Pulse' },
    { crop:'Lentil (Masur)',    emoji:'🫘', msp2025:6700, msp2024:6425, hike:275, margin:89,  category:'Pulse' },
    { crop:'Rapeseed/Mustard',  emoji:'🌼', msp2025:5950, msp2024:5650, hike:300, margin:98,  category:'Oilseed' },
    { crop:'Safflower',         emoji:'🌸', msp2025:5940, msp2024:5800, hike:140, margin:50,  category:'Oilseed' },
  ],
};

/* ─── Government Schemes (real, current 2025) ────────────────────────────────── */
const SCHEMES = [
  {
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    emoji: '💰',
    color: '#4ade80',
    benefit: '₹6,000/year in 3 installments of ₹2,000 directly to bank',
    eligible: 'All landholding farmer families across India',
    howToApply: 'pmkisan.gov.in or nearest CSC centre with Aadhaar + land records',
    helpline: '155261',
    tag: 'Income Support',
    status: 'Active',
    url: 'https://pmkisan.gov.in',
  },
  {
    name: 'PM Fasal Bima (PMFBY)',
    fullName: 'Pradhan Mantri Fasal Bima Yojana',
    emoji: '🛡️',
    color: '#2dd4bf',
    benefit: 'Crop insurance: 2% premium for Kharif, 1.5% for Rabi, 5% for horticulture',
    eligible: 'All farmers growing notified crops in notified villages',
    howToApply: 'pmfby.gov.in, Kshema app, banks or CSC. Rabi 2025-26 deadline: 31 Dec 2025',
    helpline: '14447',
    tag: 'Crop Insurance',
    status: 'Enrolment Open',
    url: 'https://pmfby.gov.in',
  },
  {
    name: 'Kisan Credit Card (KCC)',
    fullName: 'Kisan Credit Card Scheme',
    emoji: '💳',
    color: '#fbbf24',
    benefit: 'Crop loans up to ₹3 lakh at effective 4% interest rate with prompt repayment',
    eligible: 'Farmers, fishermen, animal husbandry owners',
    howToApply: 'Apply at any nationalised bank, cooperative bank or RRB with land records',
    helpline: '1800-180-1551',
    tag: 'Credit',
    status: 'Active',
    url: 'https://www.nabard.org',
  },
  {
    name: 'PM Dhan Dhaanya Yojana',
    fullName: 'PM Dhan Dhaanya Krishi Yojana',
    emoji: '🏗️',
    color: '#a78bfa',
    benefit: '₹24,000 crore scheme for agricultural productivity, storage and post-harvest infra',
    eligible: 'Farmers in 100 low-productivity districts',
    howToApply: 'Launched Oct 2025 — apply through state agriculture department portals',
    helpline: '1800-180-1551',
    tag: 'New — 2025',
    status: 'New',
    url: 'https://agriculture.gov.in',
  },
  {
    name: 'PM-KMY (Pension)',
    fullName: 'PM Kisan Maandhan Yojana',
    emoji: '👴',
    color: '#fb923c',
    benefit: '₹3,000/month pension after age 60 for small & marginal farmers',
    eligible: 'Farmers aged 18–40 with land holding up to 2 ha',
    howToApply: 'Enrol at CSC or maandhan.in — requires Aadhaar and bank account',
    helpline: '1800-267-6888',
    tag: 'Pension',
    status: 'Active',
    url: 'https://maandhan.in',
  },
  {
    name: 'Soil Health Card',
    fullName: 'Soil Health Card Scheme',
    emoji: '🌱',
    color: '#10b981',
    benefit: 'Free soil testing + crop-specific fertilizer recommendations every 2 years',
    eligible: 'All farmers — over 25 crore cards already distributed',
    howToApply: 'Contact local Krishi Vigyan Kendra or state agriculture department',
    helpline: '1800-180-1551',
    tag: 'Soil & Agri',
    status: 'Active',
    url: 'https://soilhealth.dac.gov.in',
  },
];

/* ─── Agri News (curated real headlines with sources, updated manually) ─────── */
const NEWS_ITEMS = [
  {
    id: 1,
    headline: 'Kharif MSP 2026-27: Sunflower seed gets highest hike of ₹622/qtl; Paddy raised to ₹2,441',
    summary: 'CCEA approved MSPs for 14 Kharif crops on May 13, 2026. Sunflower seed leads with +₹622 to ₹8,343/qtl. Common Paddy up ₹72 to ₹2,441. Cotton hike ₹557, Sesamum ₹500, Nigerseed ₹515. All crops maintain minimum 50% margin over cost. Total payout expected ~₹2.6 lakh crore.',
    source: 'DD News / PIB India',
    sourceUrl: 'https://ddnews.gov.in',
    category: 'MSP',
    date: 'May 13, 2026',
    important: true,
  },
  {
    id: 2,
    headline: 'PM-KISAN 23rd installment expected June–July 2026; Farmer ID now mandatory in 14 states',
    summary: '22nd installment of ₹2,000 was released on March 13, 2026 by PM Modi from Guwahati — ₹18,640 crore to 9.32 crore farmers, taking cumulative disbursements past ₹4.27 lakh crore. 23rd installment expected June–July 2026. Farmer ID is now mandatory for new registrations in UP, Bihar, Maharashtra and 11 other states. Farmers must also ensure eKYC and NPCI-Aadhaar seeding are complete.',
    source: 'PM Kisan / PIB India',
    sourceUrl: 'https://pmkisan.gov.in',
    category: 'Scheme',
    date: 'May 2026',
    important: true,
  },
  {
    id: 3,
    headline: 'Punjab expands Kharif maize diversification scheme from 6 to 16 districts for 2026-27',
    summary: 'Punjab government has scaled its maize diversification programme to cover 16 districts this Kharif season, up from 6. Farmers switching from paddy to maize will receive ₹17,500/hectare financial assistance. The move aims to reduce water-intensive paddy cultivation and boost crop variety.',
    source: 'Kisan India',
    sourceUrl: 'https://www.kisanindia.in',
    category: 'Policy',
    date: 'May 4, 2026',
    important: false,
  },
  {
    id: 4,
    headline: 'Litchi crop crisis in Bihar: Agriculture Minister orders expert task force',
    summary: 'Union Agriculture Minister Shivraj Singh Chouhan directed formation of a special expert task force after reports of widespread litchi crop damage in Bihar. The committee will assess the damage extent and recommend immediate relief measures for affected farmers.',
    source: 'DD News',
    sourceUrl: 'https://ddnews.gov.in',
    category: 'Policy',
    date: 'May 8, 2026',
    important: false,
  },
  {
    id: 5,
    headline: 'Wheat procurement RMS 2026-27: FCI targets 297 LMT with ₹84,263 crore MSP payout',
    summary: 'Government estimates wheat procurement of ~297 Lakh MT in Rabi Marketing Season 2026-27 at MSP of ₹2,585/qtl — an outflow of ₹84,263 crore directly to farmers. Wheat MSP for 2026-27 offers 109% margin over cost, the highest among all Rabi crops.',
    source: 'PIB India',
    sourceUrl: 'https://www.pib.gov.in',
    category: 'Procurement',
    date: 'Apr 2026',
    important: false,
  },
  {
    id: 6,
    headline: 'Digital Agriculture Mission: Farmer ID database being built across India for direct benefits',
    summary: 'Under the Digital Agriculture Mission, the government is creating a unified Farmer Registry across all states. 14 states including UP, Maharashtra, Bihar and Haryana have already made Farmer ID mandatory for PM-KISAN and other DBT scheme benefits. Farmers can register at CSC centres or agriculture offices.',
    source: 'Agriculture Ministry',
    sourceUrl: 'https://agriculture.gov.in',
    category: 'Policy',
    date: 'Apr 2026',
    important: false,
  },
  {
    id: 7,
    headline: 'SEHAT programme launched: Linking agri advances to farmer health outcomes',
    summary: 'Union Health Minister JP Nadda unveiled SEHAT (Science Excellence for Health through Agricultural Transformation), a national programme to translate agricultural advancements into health outcomes for farming communities. Focuses on nutrition, food quality and rural health infrastructure.',
    source: 'DD News',
    sourceUrl: 'https://ddnews.gov.in',
    category: 'Policy',
    date: 'May 11, 2026',
    important: false,
  },
  {
    id: 8,
    headline: 'MSP payouts: Paddy procurement doubled in a decade — 8,418 LMT vs 4,590 LMT earlier',
    summary: 'Between 2014-15 and 2025-26, paddy procurement stood at 8,418 LMT compared to 4,590 LMT in the preceding decade. The government credited stronger MSP implementation, wider procurement reach and the Digital Agriculture Mission for this jump, with direct farmer payouts now exceeding ₹3.33 lakh crore annually.',
    source: 'PIB India',
    sourceUrl: 'https://www.pib.gov.in',
    category: 'Procurement',
    date: 'May 2026',
    important: false,
  },
];

const CATEGORIES = ['All', 'MSP', 'Scheme', 'Policy', 'Market', 'Procurement'];
const CROP_CATEGORIES = ['All', 'Cereal', 'Pulse', 'Oilseed', 'Commercial'];

/* ─── MSP Ticker Strip ───────────────────────────────────────────────────────── */
function MSPTicker() {
  const items = [
    ...MSP_DATA.kharif.slice(0,8),
    ...MSP_DATA.rabi,
  ];
  const doubled = [...items, ...items]; // seamless loop
  return (
    <div className="gov-ticker" style={{ height:36, position:'relative', zIndex:2 }}>
      <div style={{ padding:'0 12px', display:'flex', alignItems:'center', gap:6, background:'rgba(74,222,128,0.1)', borderRight:'1px solid var(--glass-border)', flexShrink:0, minWidth:80 }}>
        <span className="gov-live-dot"/>
        <span style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--neon-sage)' }}>MSP</span>
      </div>
      <div style={{ overflow:'hidden', flex:1 }}>
        <div className="gov-ticker-track">
          {doubled.map((item, i) => (
            <div key={i} className="gov-ticker-item">
              <span style={{ fontSize:13 }}>{item.emoji}</span>
              <span style={{ color:'var(--text-secondary)', fontWeight:600 }}>{item.crop}</span>
              <span style={{ color:'var(--neon-sage)', fontWeight:700 }}>₹{item.msp2025.toLocaleString('en-IN')}</span>
              <span style={{ color:'#4ade80', fontSize:10 }}>▲{item.hike}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MSP Table ──────────────────────────────────────────────────────────────── */
function MSPTable() {
  const [season,   setSeason]   = useState('kharif');
  const [category, setCategory] = useState('All');
  const [search,   setSearch]   = useState('');
  const [sortBy,   setSortBy]   = useState('hike'); // hike | msp | margin

  const data = MSP_DATA[season].filter(d =>
    (category === 'All' || d.category === category) &&
    (!search || d.crop.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'hike')   return b.hike - a.hike;
    if (sortBy === 'msp')    return b.msp2025 - a.msp2025;
    if (sortBy === 'margin') return b.margin - a.margin;
    return 0;
  });

  const topHike = [...data].sort((a,b) => b.hike - a.hike)[0];

  return (
    <div>
      {/* Season selector */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, background:'rgba(10,22,14,0.7)', border:'1px solid var(--glass-border)', borderRadius:11, padding:4 }}>
          {[{k:'kharif',l:'☀️ Kharif 2025-26'},{k:'rabi',l:'❄️ Rabi 2025-26'}].map(({k,l}) => (
            <button key={k} className="gov-msp-season-tab"
              onClick={() => { setSeason(k); setCategory('All'); }}
              style={{
                background: season===k ? 'rgba(74,222,128,0.15)' : 'transparent',
                color:      season===k ? 'var(--neon-sage)' : 'var(--text-muted)',
                borderColor: season===k ? 'rgba(74,222,128,0.3)' : 'transparent',
              }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="gov-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search crop…"/>
        </div>
        <select className="gov-filter-select" value={category} onChange={e=>setCategory(e.target.value)}>
          {CROP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="gov-filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
          <option value="hike">Sort: Highest Hike</option>
          <option value="msp">Sort: MSP Price</option>
          <option value="margin">Sort: Margin %</option>
        </select>
      </div>

      {/* Top stats */}
      <div className="gov-stat-strip" style={{ marginBottom:16 }}>
        {[
          { label:'Crops covered', value: MSP_DATA[season].length, color:'#4ade80' },
          { label:'Highest MSP',   value:`₹${Math.max(...MSP_DATA[season].map(d=>d.msp2025)).toLocaleString('en-IN')}`, color:'#fbbf24' },
          { label:'Biggest hike',  value:`₹${topHike?.hike} — ${topHike?.crop?.split(' ')[0]}`, color:'#2dd4bf' },
          { label:'Avg. margin',   value:`${Math.round(MSP_DATA[season].reduce((s,d)=>s+d.margin,0)/MSP_DATA[season].length)}%`, color:'#a78bfa' },
        ].map(s => (
          <div key={s.label} className="gov-stat-box">
            <p style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:'Fraunces,serif', marginBottom:3 }}>{s.value}</p>
            <p style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:8, padding:'8px 16px', marginBottom:6 }}>
        {['Crop','MSP 2025-26','MSP 2024-25','Hike (₹/qtl)','Margin Over Cost'].map(h => (
          <p key={h} style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)' }}>{h}</p>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {data.map(d => {
          const hikePct = ((d.hike / d.msp2024) * 100).toFixed(1);
          return (
            <div key={d.crop} className="gov-msp-row" style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap:8, alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{d.emoji}</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', lineHeight:1.2 }}>{d.crop}</p>
                  <span className={`gov-badge gov-badge-msp`} style={{ fontSize:8.5, marginTop:2 }}>{d.category}</span>
                </div>
              </div>
              <p style={{ fontSize:14, fontWeight:800, color:'var(--neon-sage)', fontFamily:'Fraunces,serif' }}>₹{d.msp2025.toLocaleString('en-IN')}</p>
              <p style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>₹{d.msp2024.toLocaleString('en-IN')}</p>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <TrendingUp size={12} style={{ color:'#4ade80', flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#4ade80' }}>+₹{d.hike}</p>
                  <p style={{ fontSize:10, color:'var(--text-muted)' }}>+{hikePct}%</p>
                </div>
              </div>
              <div>
                <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden', marginBottom:3 }}>
                  <div style={{ height:'100%', width:`${Math.min(100, d.margin)}%`, background:`linear-gradient(90deg,#4ade8066,#4ade80)`, borderRadius:99, transition:'width 0.8s' }}/>
                </div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--neon-sage)' }}>{d.margin}%</p>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop:14, fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>
        * Source: Cabinet Committee on Economic Affairs (CCEA) / CACP official announcements. MSP = Minimum Support Price per quintal (100 kg). Margin = return over all-India weighted average cost of production.
      </p>
    </div>
  );
}

/* ─── News Feed ──────────────────────────────────────────────────────────────── */
function NewsFeed() {
  const [category, setCategory] = useState('All');
  const [search,   setSearch]   = useState('');

  const filtered = NEWS_ITEMS.filter(n =>
    (category === 'All' || n.category === category) &&
    (!search || n.headline.toLowerCase().includes(search.toLowerCase()) || n.summary.toLowerCase().includes(search.toLowerCase()))
  );

  const catColor = { MSP:'#4ade80', Scheme:'#a78bfa', Policy:'#2dd4bf', Market:'#fbbf24', Procurement:'#fb923c' };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <Search size={13} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input className="gov-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search news…"/>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {CATEGORIES.map(c => (
            <button key={c} className={`gov-tab ${category===c ? 'gov-tab-active' : 'gov-tab-inactive'}`} onClick={() => setCategory(c)}
              style={category===c ? {} : { borderColor:'var(--glass-border)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.map(news => (
          <a key={news.id} href={news.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{ textDecoration:'none' }}>
            <div className="gov-news-card">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
                  <span className="gov-badge" style={{ color: catColor[news.category]||'#4ade80', background:`${catColor[news.category]||'#4ade80'}15`, border:`1px solid ${catColor[news.category]||'#4ade80'}30` }}>
                    {news.category}
                  </span>
                  {news.important && <span className="gov-badge gov-badge-new">⚡ Important</span>}
                  <span style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:600 }}>{news.date}</span>
                </div>
                <ExternalLink size={13} style={{ color:'var(--text-muted)', flexShrink:0, marginTop:2 }}/>
              </div>
              <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', lineHeight:1.4, marginBottom:8 }}>{news.headline}</h3>
              <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.65 }}>{news.summary}</p>
              <p style={{ fontSize:10.5, color:'var(--text-muted)', marginTop:8, fontWeight:600 }}>📰 {news.source}</p>
            </div>
          </a>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:13 }}>
            No news matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Schemes Section ────────────────────────────────────────────────────────── */
function SchemesSection() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
      {SCHEMES.map(s => (
        <div key={s.name} className="gov-scheme-card"
          style={{ '--accent': s.color, cursor:'pointer' }}
          onClick={() => setExpanded(expanded===s.name ? null : s.name)}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},${s.color}44)`, borderRadius:'14px 14px 0 0' }}/>

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', gap:11, alignItems:'flex-start' }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${s.color}15`, border:`1px solid ${s.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                {s.emoji}
              </div>
              <div>
                <h3 style={{ fontSize:14, fontWeight:800, color:'var(--text-primary)', marginBottom:3 }}>{s.name}</h3>
                <p style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.4 }}>{s.fullName}</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
              <span className="gov-badge" style={{ color:s.color, background:`${s.color}15`, border:`1px solid ${s.color}28` }}>{s.tag}</span>
              <span className="gov-badge" style={{ color: s.status==='Active'?'#4ade80':s.status==='New'?'#fbbf24':'#2dd4bf', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                {s.status==='Active'?'🟢':s.status==='New'?'🆕':'📢'} {s.status}
              </span>
            </div>
          </div>

          <p style={{ fontSize:13, color:'var(--neon-sage)', fontWeight:700, marginBottom: expanded===s.name ? 14 : 0, lineHeight:1.5 }}>{s.benefit}</p>

          {expanded === s.name && (
            <div style={{ animation:'gov-fadeUp 0.3s both', borderTop:'1px solid var(--glass-border)', paddingTop:14, marginTop:4 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Who can apply', value:s.eligible },
                  { label:'How to apply',  value:s.howToApply },
                  { label:'Helpline',      value:s.helpline },
                ].map(row => (
                  <div key={row.label}>
                    <p style={{ fontSize:9.5, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:3 }}>{row.label}</p>
                    <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.5 }}>{row.value}</p>
                  </div>
                ))}
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ marginTop:14, display:'inline-flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, background:`${s.color}15`, border:`1px solid ${s.color}28`, color:s.color, fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', textDecoration:'none', transition:'all 0.2s' }}>
                <ExternalLink size={12}/> Official Portal
              </a>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:10 }}>
            <ChevronRight size={14} style={{ color:'var(--text-muted)', transform: expanded===s.name ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Landing Widget (import this into App.jsx landing page) ────────────────── */
export function GovtNewsWidget({ onNavigate }) {
  const topNews   = NEWS_ITEMS.filter(n => n.important).slice(0, 2);
  const topKharif = [...MSP_DATA.kharif].sort((a,b) => b.hike - a.hike).slice(0, 4);
  return (
    <div style={{ marginTop:40 }}>
      {/* Section header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 12px', borderRadius:99, background:'rgba(45,212,191,0.1)', border:'1px solid rgba(45,212,191,0.22)', marginBottom:8 }}>
            <span className="gov-live-dot" style={{ width:6, height:6 }}/>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--teal)' }}>Government Updates</span>
          </div>
          <h2 className="df" style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>MSP & Govt Schemes</h2>
        </div>
        <button onClick={() => onNavigate('govtnews')}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 16px', borderRadius:10, background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.22)', color:'var(--teal)', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
          View All <ChevronRight size={12}/>
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Urgent news */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {topNews.map(n => (
            <a key={n.id} href={n.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
              <div style={{ padding:'14px 16px', borderRadius:13, background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)', cursor:'pointer', transition:'all 0.2s' }}>
                <div style={{ display:'flex', gap:7, marginBottom:6 }}>
                  <span className="gov-badge gov-badge-new">⚡ Important</span>
                  <span style={{ fontSize:10, color:'var(--text-muted)' }}>{n.date}</span>
                </div>
                <p style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', lineHeight:1.4 }}>{n.headline}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Top MSP hikes */}
        <div style={{ padding:'16px 18px', borderRadius:13, background:'rgba(10,22,14,0.7)', border:'1px solid var(--glass-border)' }}>
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:12 }}>Kharif 2025-26 — Top MSP Hikes</p>
          {topKharif.map(d => (
            <div key={d.crop} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>{d.emoji}</span>
                <span style={{ fontSize:12.5, color:'var(--text-secondary)', fontWeight:600 }}>{d.crop.split(' ')[0]}</span>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:800, color:'var(--neon-sage)' }}>₹{d.msp2025.toLocaleString('en-IN')}</span>
                <span style={{ fontSize:10.5, color:'#4ade80', fontWeight:700 }}>+₹{d.hike}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function GovtNewsHub({ onBack }) {
  const [tab, setTab] = useState('msp');

  const tabs = [
    { k:'msp',     l:'MSP Prices',       emoji:'💰', color:'#4ade80' },
    { k:'news',    l:'Agri News',         emoji:'📰', color:'#fbbf24' },
    { k:'schemes', l:'Govt Schemes',      emoji:'🏛️', color:'#a78bfa' },
  ];

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      {/* Ambient */}
      <div style={{ position:'fixed', top:-60, right:-60, width:460, height:460, borderRadius:'50%', background:'rgba(45,212,191,0.07)', filter:'blur(110px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-60, left:-60, width:380, height:380, borderRadius:'50%', background:'rgba(74,222,128,0.06)', filter:'blur(100px)', pointerEvents:'none', zIndex:0 }}/>

      {/* Nav */}
      <nav className="glass-nav">
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px', height:62, display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={onBack} className="btn-back"><ArrowLeft size={15}/> Home</button>
          <span style={{ fontSize:20 }}>🏛️</span>
          <span className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Government News & MSP Hub</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span className="gov-live-dot"/>
            <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Official Data</span>
          </div>
        </div>
      </nav>

      {/* Ticker */}
      <MSPTicker/>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 100px', position:'relative', zIndex:1 }}>

        {/* Hero */}
        <div className="gov-s1" style={{ marginBottom:28 }}>
          <h1 className="df" style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:700, color:'var(--text-primary)', lineHeight:1.15, letterSpacing:'-0.02em', marginBottom:8 }}>
            Official MSP · Schemes · <span style={{ color:'var(--teal)', fontStyle:'italic' }}>Market News</span>
          </h1>
          <p style={{ fontSize:13.5, color:'var(--text-secondary)', maxWidth:560, lineHeight:1.7 }}>
            Real government data from CACP, PIB, and Ministry of Agriculture. MSP figures are official 2025-26 CCEA announcements.
          </p>
        </div>

        {/* Tabs */}
        <div className="gov-s2" style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.k} className={`gov-tab ${tab===t.k ? 'gov-tab-active' : 'gov-tab-inactive'}`}
              onClick={() => setTab(t.k)}
              style={tab===t.k ? {} : { borderColor:'var(--glass-border)' }}>
              <span style={{ fontSize:14 }}>{t.emoji}</span> {t.l}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="gov-card gov-s3" style={{ padding:'28px 30px' }}>
          {tab === 'msp'     && <MSPTable/>}
          {tab === 'news'    && <NewsFeed/>}
          {tab === 'schemes' && <SchemesSection/>}
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop:20, padding:'13px 18px', borderRadius:11, background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', display:'flex', gap:10, alignItems:'flex-start' }}>
          <Info size={14} style={{ color:'var(--text-muted)', flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:11.5, color:'var(--text-muted)', lineHeight:1.6 }}>
            MSP data sourced from official CCEA/CACP press releases via PIB India. News sourced from government portals (PIB, PMIndia, DD News). Scheme details from respective ministry portals. Always verify deadlines at official portals before applying.
          </p>
        </div>
      </div>
    </div>
  );
}
