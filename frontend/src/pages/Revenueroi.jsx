// RevenueROI.jsx
// Combines Price Forecast (Prophet/LSTM) + Yield Estimation (XGBoost)
// to produce a full Revenue Forecast + ROI Calculator with uncertainty bands

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Brain, Loader, Download, AlertCircle,
  TrendingUp, Target, IndianRupee, Calculator,
  ChevronDown, RefreshCw, Info, Layers, BarChart2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine
} from 'recharts';

/* ─── Inline CSS ──────────────────────────────────────────────────────────── */
const _s = document.createElement('style');
_s.textContent = `
  .roi-card {
    background: rgba(18,38,24,0.65); backdrop-filter: blur(14px);
    border: 1px solid #2d4a35; border-radius: 1.25rem;
    transition: border-color 0.25s;
  }
  .roi-input {
    background: rgba(10,22,14,0.85); border: 1px solid #2d4a35;
    border-radius: 0.65rem; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
    font-size: 13px; padding: 10px 14px; width: 100%; outline: none;
    transition: all 0.22s; appearance: none;
  }
  .roi-input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .roi-select {
    background: rgba(10,22,14,0.85); border: 1px solid #2d4a35;
    border-radius: 0.65rem; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
    font-size: 13px; padding: 10px 36px 10px 14px; width: 100%; outline: none;
    transition: all 0.22s; appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
  }
  .roi-select:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .roi-select option { background: #0d1f10; }
  .roi-label { display:block; font-size:10px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:#64748b; margin-bottom:6px; }
  .roi-stat { padding:18px 20px; background:rgba(10,22,14,0.6); border:1px solid #2d4a35; border-radius:12px; }
  .roi-stat-accent { padding:18px 20px; border-radius:12px; }
  @keyframes roi-fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  .roi-animate { animation: roi-fadeUp 0.44s cubic-bezier(0.22,1,0.36,1) both; }
  .roi-tab { padding:9px 18px; border-radius:9px; border:none; font-family:'DM Sans',sans-serif; font-size:11.5px; font-weight:700; letter-spacing:0.07em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
  .roi-tab.active { background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3); }
  .roi-tab.inactive { background:transparent; color:#64748b; border:1px solid transparent; }
  .roi-tab.inactive:hover { color:#94a3b8; border-color:#2d4a35; }
  .uncertainty-band { opacity:0.18; }
  .roi-tooltip { background:rgba(8,18,10,0.96) !important; border:1px solid #2d4a35 !important; border-radius:10px !important; font-family:'DM Sans',sans-serif !important; font-size:12px !important; }
`;
if (!document.getElementById('roi-styles')) { _s.id = 'roi-styles'; document.head.appendChild(_s); }

/* ─── API ─────────────────────────────────────────────────────────────────── */
const API = 'http://localhost:5000/api';
const post = (path, data) =>
  fetch(`${API}${path}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r => r.json());

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmtRs = (n) => {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

const CROP_OPTS = ['Wheat','Rice','Maize','Pulses','Sugarcane','Millet','Groundnut','Cotton'];
const MARKET_OPTS = ['Delhi','Mumbai','Rajkot','Ahmedabad'];
const SOIL_OPTS  = ['loamy','clay','sandy','black soil'];
const STATE_OPTS = ['Gujarat','Maharashtra','Punjab','UP','Bihar'];
const SEASON_OPTS= ['Kharif','Rabi','Zaid'];
const SEED_OPTS  = ['Local','Hybrid','HYV','DroughtResistant'];
const FERT_OPTS  = ['NPK','Organic','Mixed','Low'];

/* ─── Default cost presets (₹/ha) ─────────────────────────────────────────── */
const COST_PRESETS = {
  Wheat:      { seeds:3200, fertilizer:5500, labor:8000, irrigation:2000, pesticides:1500, misc:1200 },
  Rice:       { seeds:2800, fertilizer:6500, labor:10000, irrigation:4000, pesticides:2000, misc:1500 },
  Maize:      { seeds:2500, fertilizer:5000, labor:7000, irrigation:1800, pesticides:1200, misc:1000 },
  Pulses:     { seeds:4000, fertilizer:3500, labor:6000, irrigation:1200, pesticides:800,  misc:800  },
  Sugarcane:  { seeds:8000, fertilizer:9000, labor:15000, irrigation:6000, pesticides:2500, misc:2000 },
  Millet:     { seeds:1500, fertilizer:3000, labor:5000, irrigation:800,  pesticides:600,  misc:700  },
  Groundnut:  { seeds:5000, fertilizer:4500, labor:7500, irrigation:2500, pesticides:1000, misc:900  },
  Cotton:     { seeds:4500, fertilizer:7000, labor:9000, irrigation:3500, pesticides:3500, misc:1500 },
};

/* ─── ErrorBox ─────────────────────────────────────────────────────────────── */
function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div style={{ background:'rgba(248,113,113,0.10)',border:'1px solid rgba(248,113,113,0.28)',borderRadius:10,padding:'13px 16px',marginTop:14,display:'flex',gap:10,alignItems:'flex-start' }}>
      <AlertCircle size={16} style={{ color:'#f87171',flexShrink:0,marginTop:1 }}/>
      <pre style={{ fontSize:11.5,color:'#fca5a5',overflowX:'auto',whiteSpace:'pre-wrap',fontFamily:'DM Sans,sans-serif',margin:0 }}>{error}</pre>
    </div>
  );
}

/* ─── ConfidenceMeter ──────────────────────────────────────────────────────── */
function ConfMeter({ confidence, label='Confidence Score' }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  const color = pct>=80?'#4ade80':pct>=60?'#fbbf24':'#f87171';
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
        <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'#64748b' }}>{label}</span>
        <span style={{ fontSize:14,fontWeight:700,color }}>{pct}%</span>
      </div>
      <div style={{ height:5,background:'rgba(255,255,255,0.07)',borderRadius:99,overflow:'hidden' }}>
        <div style={{ width:`${pct}%`,height:'100%',borderRadius:99,background:`linear-gradient(90deg,${color}88,${color})`,transition:'width 1.1s cubic-bezier(0.22,1,0.36,1)' }}/>
      </div>
    </div>
  );
}

/* ─── Custom tooltip for chart ─────────────────────────────────────────────── */
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(8,18,10,0.96)',border:'1px solid #2d4a35',borderRadius:10,padding:'10px 14px',fontFamily:'DM Sans,sans-serif' }}>
      <p style={{ fontSize:11,color:'#64748b',marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ fontSize:12.5,color:p.color,fontWeight:700 }}>{p.name}: {fmtRs(p.value)}</p>
      ))}
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */
export default function RevenueROI({ onBack, prefillProfile = null }) {
  /* ── Form state ── */
  const [form, setForm] = useState({
    crop_name:       prefillProfile?.primary_crop || 'Wheat',
    market:          'Delhi',
    state:           prefillProfile?.state || 'Gujarat',
    season:          prefillProfile?.season || 'Kharif',
    soil_type:       prefillProfile?.soil_type || 'loamy',
    area_hectare:    prefillProfile?.area_hectare || 1,
    rainfall_mm:     prefillProfile?.rainfall_mm || 500,
    temperature_c:   prefillProfile?.temperature_c || 25,
    seed_variety:    prefillProfile?.seed_variety || 'Local',
    fertilizer_used: prefillProfile?.fertilizer_used || 'NPK',
    model_type:      'prophet',
    periods:         30,
    previous_crop:   'Wheat',
  });

  /* ── Cost inputs per ha ── */
  const [costs, setCosts] = useState({ ...COST_PRESETS['Wheat'] });

  /* ── Results ── */
  const [loading, setLoading]       = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [yieldResult, setYieldResult] = useState(null);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('revenue'); // revenue | breakdown | forecast

  /* ── Load cost preset when crop changes ── */
  useEffect(() => {
    const preset = COST_PRESETS[form.crop_name];
    if (preset) setCosts({ ...preset });
  }, [form.crop_name]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setCost = (k, v) => setCosts(c => ({ ...c, [k]: parseFloat(v) || 0 }));

  /* ── Run both APIs in parallel ── */
  const runAnalysis = useCallback(async () => {
    setLoading(true); setError(null); setPriceResult(null); setYieldResult(null);
    try {
      const [priceRes, yieldRes] = await Promise.all([
        post('/predict_price', { crop_name: form.crop_name, market: form.market, model_type: form.model_type, periods: form.periods }),
        post('/estimate_yield', { crop_name: form.crop_name, soil_type: form.soil_type, rainfall_mm: form.rainfall_mm, area_hectare: form.area_hectare, seed_variety: form.seed_variety, fertilizer_used: form.fertilizer_used, state: form.state, season: form.season }),
      ]);

      const forecast = priceRes?.forecast || priceRes?.predictions || priceRes?.results;
      const yieldVal = yieldRes?.predicted_yield ?? yieldRes?.yield ?? yieldRes?.prediction ?? yieldRes?.estimated_yield;

      if (!forecast) throw new Error(priceRes?.error || 'Price API returned no forecast.');
      if (yieldVal == null) throw new Error(yieldRes?.error || 'Yield API returned no value.');

      setPriceResult({ forecast, warning: priceRes?.warning });
      setYieldResult({
        yield: parseFloat(yieldVal),
        yieldPerHa: yieldRes?.yield_per_hectare ?? yieldRes?.yield_per_ha ?? parseFloat(yieldVal),
        confidence: yieldRes?.confidence ?? yieldRes?.probability,
        totalYield: parseFloat(yieldVal) * form.area_hectare,
      });
    } catch (e) {
      setError(e.message || 'Failed to connect. Ensure Flask server is running on port 5000.');
    }
    setLoading(false);
  }, [form]);

  /* ── Derived financials ── */
  const financials = React.useMemo(() => {
    if (!priceResult || !yieldResult) return null;
    const forecast = priceResult.forecast;
    const avgPrice     = forecast.reduce((s, i) => s + (i.yhat ?? i.predicted_price ?? i.price ?? 0), 0) / forecast.length;
    const peakPrice    = Math.max(...forecast.map(i => i.yhat ?? i.predicted_price ?? i.price ?? 0));
    const lowPrice     = Math.min(...forecast.map(i => i.yhat ?? i.predicted_price ?? i.price ?? 0));
    const totalYieldQtl = yieldResult.totalYield / 100;      // kg → quintal
    const revenueAvg   = totalYieldQtl * avgPrice;
    const revenuePeak  = totalYieldQtl * peakPrice;
    const revenueLow   = totalYieldQtl * lowPrice;
    const totalCostHa  = Object.values(costs).reduce((s, v) => s + v, 0);
    const totalCost    = totalCostHa * form.area_hectare;
    const profitAvg    = revenueAvg - totalCost;
    const profitPeak   = revenuePeak - totalCost;
    const profitLow    = revenueLow - totalCost;
    const roiAvg       = totalCost > 0 ? (profitAvg / totalCost) * 100 : 0;
    const breakEvenQtl = totalCost > 0 ? totalCost / avgPrice : 0;
    const breakEvenPct = totalYieldQtl > 0 ? (breakEvenQtl / totalYieldQtl) * 100 : 0;

    // Build daily revenue series
    const revenueSeries = forecast.map((item, idx) => {
      const price = item.yhat ?? item.predicted_price ?? item.price ?? 0;
      const rev = totalYieldQtl * price;
      return {
        day:     item.ds || item.date || `Day ${idx+1}`,
        revenue: Math.round(rev),
        upper:   Math.round(totalYieldQtl * (item.yhat_upper ?? price * 1.08)),
        lower:   Math.round(totalYieldQtl * (item.yhat_lower ?? price * 0.92)),
        cost:    Math.round(totalCost),
        profit:  Math.round(rev - totalCost),
      };
    });

    return {
      avgPrice, peakPrice, lowPrice, totalYieldQtl,
      revenueAvg, revenuePeak, revenueLow,
      totalCost, totalCostHa, profitAvg, profitPeak, profitLow,
      roiAvg, breakEvenQtl, breakEvenPct, revenueSeries,
    };
  }, [priceResult, yieldResult, costs, form.area_hectare]);

  /* ── Export report ── */
  const handleExport = () => {
    if (!financials) return;
    const lines = [
      `KrushiConnect – Revenue & ROI Report`,
      `Generated: ${new Date().toLocaleString()}`,
      '═'.repeat(52),
      `Crop: ${form.crop_name}  |  Market: ${form.market}  |  State: ${form.state}`,
      `Area: ${form.area_hectare} ha  |  Season: ${form.season}`,
      `Soil: ${form.soil_type}  |  Seed: ${form.seed_variety}`,
      '─'.repeat(52),
      `YIELD`,
      `  Total Yield  : ${yieldResult.totalYield.toFixed(0)} kg (${financials.totalYieldQtl.toFixed(2)} qtl)`,
      `  Per Hectare  : ${yieldResult.yieldPerHa.toFixed(0)} kg/ha`,
      yieldResult.confidence ? `  Confidence   : ${(yieldResult.confidence*100).toFixed(1)}%` : '',
      '─'.repeat(52),
      `PRICE (${form.periods}-day forecast)`,
      `  Avg Price    : ₹${financials.avgPrice.toFixed(2)}/qtl`,
      `  Peak Price   : ₹${financials.peakPrice.toFixed(2)}/qtl`,
      `  Low Price    : ₹${financials.lowPrice.toFixed(2)}/qtl`,
      '─'.repeat(52),
      `FINANCIALS`,
      `  Revenue (Avg): ${fmtRs(financials.revenueAvg)}`,
      `  Revenue (Best):${fmtRs(financials.revenuePeak)}`,
      `  Revenue (Worst):${fmtRs(financials.revenueLow)}`,
      `  Total Cost   : ${fmtRs(financials.totalCost)}`,
      `  Profit (Avg) : ${fmtRs(financials.profitAvg)}`,
      `  ROI          : ${financials.roiAvg.toFixed(1)}%`,
      `  Break-even   : ${financials.breakEvenQtl.toFixed(1)} qtl (${financials.breakEvenPct.toFixed(0)}% of yield)`,
      '─'.repeat(52),
      `COST BREAKDOWN (per ha)`,
      ...Object.entries(costs).map(([k,v])=>`  ${k.charAt(0).toUpperCase()+k.slice(1)}: ₹${v.toLocaleString('en-IN')}`),
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`KrushiConnect_ROI_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tabs ── */
  const TABS = [
    { id:'revenue',   label:'Revenue Overview', icon:<TrendingUp size={13}/> },
    { id:'breakdown', label:'Cost Breakdown',    icon:<Layers size={13}/> },
    { id:'forecast',  label:'Daily Forecast',    icon:<BarChart2 size={13}/> },
  ];

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1, background:'var(--bg-deep,#08120a)' }}>
      {/* Ambient */}
      <div style={{ position:'fixed',top:-80,right:-80,width:480,height:480,borderRadius:'50%',background:'rgba(251,191,36,0.07)',filter:'blur(110px)',pointerEvents:'none',zIndex:0 }}/>
      <div style={{ position:'fixed',bottom:-80,left:-80,width:380,height:380,borderRadius:'50%',background:'rgba(16,185,129,0.07)',filter:'blur(90px)',pointerEvents:'none',zIndex:0 }}/>

      {/* Nav */}
      <nav style={{ background:'rgba(8,18,10,0.84)',backdropFilter:'blur(18px)',borderBottom:'1px solid #2d4a35',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px',height:62,display:'flex',alignItems:'center',gap:14 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'1px solid #2d4a35',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer' }}>
            <ArrowLeft size={14}/> Home
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <span style={{ fontSize:20 }}>💰</span>
            <span style={{ fontFamily:'Fraunces,serif',fontSize:19,fontWeight:700,color:'#e2e8f0' }}>Revenue & ROI Calculator</span>
          </div>
          {prefillProfile && (
            <span style={{ marginLeft:8,padding:'4px 12px',borderRadius:99,fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#4ade80',background:'rgba(74,222,128,0.10)',border:'1px solid rgba(74,222,128,0.22)' }}>
              📋 {prefillProfile.name}
            </span>
          )}
        </div>
      </nav>

      <div style={{ maxWidth:1100,margin:'0 auto',padding:'32px 24px 100px',position:'relative',zIndex:1 }}>

        {/* ── Input Section ── */}
        <div className="roi-card roi-animate" style={{ padding:28,marginBottom:22 }}>
          <h2 style={{ fontFamily:'Fraunces,serif',fontSize:20,fontWeight:700,color:'#e2e8f0',marginBottom:6 }}>⚙️ Configure Analysis</h2>
          <p style={{ fontSize:13,color:'#64748b',marginBottom:22 }}>Combine price forecast + yield model to compute projected revenue, profit, and ROI.</p>

          {/* Farm inputs grid */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:14,marginBottom:20 }}>
            {[
              { label:'Crop',            key:'crop_name',       type:'select', opts:CROP_OPTS },
              { label:'Market',          key:'market',          type:'select', opts:MARKET_OPTS },
              { label:'State',           key:'state',           type:'select', opts:STATE_OPTS },
              { label:'Season',          key:'season',          type:'select', opts:SEASON_OPTS },
              { label:'Soil Type',       key:'soil_type',       type:'select', opts:SOIL_OPTS },
              { label:'Seed Variety',    key:'seed_variety',    type:'select', opts:SEED_OPTS },
              { label:'Fertilizer',      key:'fertilizer_used', type:'select', opts:FERT_OPTS },
              { label:'Price Model',     key:'model_type',      type:'select', opts:[{v:'prophet',l:'Prophet'},{v:'lstm',l:'LSTM'}], isObj:true },
            ].map(({ label, key, type, opts, isObj }) => (
              <div key={key}>
                <label className="roi-label">{label}</label>
                <select className="roi-select" value={form[key]} onChange={e=>set(key,e.target.value)}>
                  {isObj ? opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>) : opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            {[
              { label:'Area (ha)',        key:'area_hectare',   step:0.1, min:0.1 },
              { label:'Rainfall (mm)',    key:'rainfall_mm',    step:10,  min:0   },
              { label:'Temperature (°C)', key:'temperature_c',  step:0.5, min:0   },
              { label:'Forecast Days',    key:'periods',        step:1,   min:7, max:90 },
            ].map(({ label, key, step, min, max }) => (
              <div key={key}>
                <label className="roi-label">{label}</label>
                <input type="number" step={step} min={min} max={max} value={form[key]}
                  onChange={e=>set(key,parseFloat(e.target.value)||0)} className="roi-input"/>
              </div>
            ))}
          </div>

          {/* Cost inputs */}
          <div style={{ marginBottom:20,padding:'18px 20px',background:'rgba(10,22,14,0.5)',border:'1px solid #2d4a35',borderRadius:12 }}>
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <Calculator size={15} style={{ color:'#fbbf24' }}/>
              <span style={{ fontSize:12,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#94a3b8' }}>Cost Inputs (₹ per hectare)</span>
              <span style={{ marginLeft:'auto',fontSize:11,color:'#64748b' }}>
                Total: ₹{Object.values(costs).reduce((s,v)=>s+v,0).toLocaleString('en-IN')}/ha
              </span>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12 }}>
              {Object.entries(costs).map(([key, val]) => (
                <div key={key}>
                  <label className="roi-label">{key.charAt(0).toUpperCase()+key.slice(1)}</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:12,color:'#64748b' }}>₹</span>
                    <input type="number" step={100} min={0} value={val} onChange={e=>setCost(key,e.target.value)}
                      className="roi-input" style={{ paddingLeft:26 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'flex',gap:12 }}>
            <button onClick={runAnalysis} disabled={loading} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:9,padding:'14px 24px',borderRadius:10,border:'none',background:loading?'rgba(74,222,128,0.5)':'#4ade80',color:'#08120a',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,letterSpacing:'0.11em',textTransform:'uppercase',cursor:loading?'not-allowed':'pointer',boxShadow:'0 0 18px rgba(74,222,128,0.3)',transition:'all 0.22s' }}>
              {loading ? <><Loader size={16} style={{ animation:'roi-spin 0.85s linear infinite' }}/> Computing…</> : <><Brain size={16}/> Run Revenue Analysis</>}
            </button>
            {financials && (
              <button onClick={handleExport} style={{ display:'flex',alignItems:'center',gap:7,padding:'14px 18px',borderRadius:10,border:'1px solid #2d4a35',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.2s' }}>
                <Download size={15}/> Export
              </button>
            )}
          </div>
          <ErrorBox error={error}/>
        </div>

        {/* ── Results Section ── */}
        {financials && (
          <div className="roi-animate">
            {/* Warning */}
            {priceResult?.warning && (
              <div style={{ display:'flex',gap:10,alignItems:'center',padding:'11px 16px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:10,marginBottom:16,fontSize:12.5,color:'#fbbf24',fontFamily:'DM Sans,sans-serif' }}>
                <Info size={14}/>{priceResult.warning}
              </div>
            )}

            {/* KPI strip */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12,marginBottom:22 }}>
              {[
                { label:'Revenue (Avg)',   val:fmtRs(financials.revenueAvg),  sub:`Best: ${fmtRs(financials.revenuePeak)}`, c:'#4ade80', bg:'rgba(74,222,128,0.08)', border:'rgba(74,222,128,0.2)' },
                { label:'Total Profit',    val:fmtRs(financials.profitAvg),   sub:financials.profitAvg<0?'⚠️ Loss scenario':'Estimated net', c: financials.profitAvg>=0?'#4ade80':'#f87171', bg:financials.profitAvg>=0?'rgba(74,222,128,0.08)':'rgba(248,113,113,0.08)', border:financials.profitAvg>=0?'rgba(74,222,128,0.2)':'rgba(248,113,113,0.28)' },
                { label:'ROI',             val:`${financials.roiAvg.toFixed(1)}%`, sub:`On ₹${fmtRs(financials.totalCost)} invested`, c:financials.roiAvg>=0?'#2dd4bf':'#f87171', bg:'rgba(45,212,191,0.08)', border:'rgba(45,212,191,0.2)' },
                { label:'Total Yield',     val:`${financials.totalYieldQtl.toFixed(1)} qtl`, sub:`${yieldResult.totalYield.toFixed(0)} kg total`, c:'#fbbf24', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.2)' },
                { label:'Avg Price',       val:`₹${financials.avgPrice.toFixed(0)}/qtl`, sub:`Peak: ₹${financials.peakPrice.toFixed(0)}`, c:'#a78bfa', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.2)' },
                { label:'Break-even',      val:`${financials.breakEvenQtl.toFixed(1)} qtl`, sub:`${financials.breakEvenPct.toFixed(0)}% of your yield`, c:financials.breakEvenPct<80?'#4ade80':'#f87171', bg:'rgba(10,22,14,0.6)', border:'#2d4a35' },
              ].map(({ label, val, sub, c, bg, border }) => (
                <div key={label} style={{ padding:'18px 18px',background:bg,border:`1px solid ${border}`,borderRadius:12 }}>
                  <p style={{ fontSize:9.5,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#64748b',marginBottom:7 }}>{label}</p>
                  <p style={{ fontFamily:'Fraunces,serif',fontSize:24,fontWeight:700,color:c,lineHeight:1,marginBottom:5 }}>{val}</p>
                  <p style={{ fontSize:11,color:'#64748b' }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display:'flex',gap:6,marginBottom:18,flexWrap:'wrap' }}>
              {TABS.map(t => (
                <button key={t.id} className={`roi-tab ${activeTab===t.id?'active':'inactive'}`} onClick={()=>setActiveTab(t.id)} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ── Revenue Overview Tab ── */}
            {activeTab === 'revenue' && (
              <div className="roi-card roi-animate" style={{ padding:24 }}>
                <h3 style={{ fontFamily:'Fraunces,serif',fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:18 }}>
                  📊 Revenue vs Cost — {form.periods}-Day Forecast
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={financials.revenueSeries}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="upperGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                    <XAxis dataKey="day" tick={{ fontSize:9.5,fill:'#64748b',fontFamily:'DM Sans,sans-serif' }} interval={Math.floor(financials.revenueSeries.length/6)}/>
                    <YAxis tick={{ fontSize:9.5,fill:'#64748b',fontFamily:'DM Sans,sans-serif' }} tickFormatter={v=>fmtRs(v)}/>
                    <Tooltip content={<RevenueTooltip/>}/>
                    <Legend wrapperStyle={{ fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#94a3b8' }}/>
                    <Area type="monotone" dataKey="upper"   fill="url(#upperGrad)" stroke="#2dd4bf" strokeWidth={1} strokeDasharray="4 4" name="Best Case" dot={false}/>
                    <Area type="monotone" dataKey="revenue" fill="url(#revGrad)"   stroke="#4ade80" strokeWidth={2.5} name="Revenue (Avg)" dot={false}/>
                    <Area type="monotone" dataKey="lower"   fill="none" stroke="#f87171" strokeWidth={1} strokeDasharray="4 4" name="Worst Case" dot={false}/>
                    <ReferenceLine y={financials.totalCost} stroke="#fbbf24" strokeDasharray="6 3" label={{ value:'Total Cost', fill:'#fbbf24', fontSize:10, position:'right', fontFamily:'DM Sans,sans-serif' }}/>
                  </AreaChart>
                </ResponsiveContainer>
                <ConfMeter confidence={yieldResult.confidence} label="Yield Model Confidence"/>
              </div>
            )}

            {/* ── Cost Breakdown Tab ── */}
            {activeTab === 'breakdown' && (
              <div className="roi-card roi-animate" style={{ padding:24 }}>
                <h3 style={{ fontFamily:'Fraunces,serif',fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:18 }}>🧾 Cost Breakdown</h3>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:20 }}>
                  {Object.entries(costs).map(([key, perHa]) => {
                    const total = perHa * form.area_hectare;
                    const pct   = (total / financials.totalCost) * 100;
                    const barColors = { seeds:'#4ade80',fertilizer:'#fbbf24',labor:'#f87171',irrigation:'#2dd4bf',pesticides:'#a78bfa',misc:'#94a3b8' };
                    const c = barColors[key] || '#4ade80';
                    return (
                      <div key={key} className="roi-stat">
                        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                          <span style={{ fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',color:'#94a3b8' }}>{key}</span>
                          <span style={{ fontSize:11,color:'#64748b' }}>{pct.toFixed(1)}%</span>
                        </div>
                        <p style={{ fontFamily:'Fraunces,serif',fontSize:20,fontWeight:700,color:c,marginBottom:4 }}>₹{total.toLocaleString('en-IN')}</p>
                        <p style={{ fontSize:10.5,color:'#64748b' }}>₹{perHa.toLocaleString('en-IN')}/ha</p>
                        <div style={{ marginTop:8,height:4,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`,height:'100%',borderRadius:99,background:c,transition:'width 1s cubic-bezier(0.22,1,0.36,1)' }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding:'16px 20px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.25)',borderRadius:12 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                    <div>
                      <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'#64748b',marginBottom:4 }}>Total Investment</p>
                      <p style={{ fontFamily:'Fraunces,serif',fontSize:28,fontWeight:700,color:'#fbbf24' }}>{fmtRs(financials.totalCost)}</p>
                      <p style={{ fontSize:12,color:'#64748b',marginTop:3 }}>₹{financials.totalCostHa.toLocaleString('en-IN')}/ha × {form.area_hectare} ha</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'#64748b',marginBottom:4 }}>To Break Even</p>
                      <p style={{ fontFamily:'Fraunces,serif',fontSize:22,fontWeight:700,color:financials.breakEvenPct<80?'#4ade80':'#f87171' }}>{financials.breakEvenQtl.toFixed(1)} qtl</p>
                      <p style={{ fontSize:11,color:'#64748b',marginTop:2 }}>{financials.breakEvenPct.toFixed(0)}% of projected yield</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Daily Forecast Tab ── */}
            {activeTab === 'forecast' && (
              <div className="roi-card roi-animate" style={{ padding:24 }}>
                <h3 style={{ fontFamily:'Fraunces,serif',fontSize:17,fontWeight:700,color:'#e2e8f0',marginBottom:18 }}>📅 Daily Revenue Forecast</h3>
                <div style={{ maxHeight:380,overflowY:'auto' }}>
                  {financials.revenueSeries.map((item, idx) => {
                    const isProfit = item.profit >= 0;
                    return (
                      <div key={idx} style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,padding:'10px 14px',background:idx%2===0?'rgba(10,22,14,0.5)':'transparent',borderRadius:8,marginBottom:2 }}>
                        <span style={{ fontSize:11.5,color:'#94a3b8',alignSelf:'center' }}>{item.day}</span>
                        <span style={{ fontSize:13,fontWeight:700,color:'#4ade80' }}>{fmtRs(item.revenue)}</span>
                        <span style={{ fontSize:13,fontWeight:700,color:isProfit?'#2dd4bf':'#f87171' }}>{isProfit?'+':''}{fmtRs(item.profit)}</span>
                        <span style={{ fontSize:11,color:'#64748b',alignSelf:'center' }}>vs ₹{fmtRs(item.cost)} cost</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}