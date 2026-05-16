// FarmProfiles.jsx
// Persistent farm profile manager — save multiple farm entries with full context
// Uses localStorage for persistence; integrates with Price/Yield/Recommendation pages

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Trash2, Edit3, Check, X, ChevronDown,
  Layers, Droplets, Thermometer, Leaf, ArrowLeft,
  Copy, Star, StarOff, Download, Upload, AlertCircle
} from 'lucide-react';

/* ─── Storage helpers ──────────────────────────────────────────────────────── */
const STORAGE_KEY = 'krushiconnect_farm_profiles';

function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveProfiles(profiles) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); }
  catch (e) { console.error('Storage error:', e); }
}

/* ─── Default profile template ─────────────────────────────────────────────── */
const EMPTY_PROFILE = {
  id: null,
  name: '',
  location: '',
  state: 'Gujarat',
  area_hectare: 1,
  soil_type: 'loamy',
  primary_crop: 'Wheat',
  seed_variety: 'Local',
  fertilizer_used: 'NPK',
  rainfall_mm: 500,
  temperature_c: 25,
  season: 'Kharif',
  notes: '',
  starred: false,
  createdAt: null,
  updatedAt: null,
};

/* ─── Field options ─────────────────────────────────────────────────────────── */
const OPTS = {
  state:          ['Gujarat','Maharashtra','Punjab','UP','Bihar','Rajasthan','MP','Haryana'],
  soil_type:      ['loamy','clay','sandy','black soil','red soil','alluvial'],
  primary_crop:   ['Wheat','Rice','Maize','Pulses','Sugarcane','Millet','Groundnut','Cotton','Soybean'],
  seed_variety:   ['Local','Hybrid','HYV','DroughtResistant'],
  fertilizer_used:['NPK','Organic','Mixed','Low'],
  season:         ['Kharif','Rabi','Zaid'],
};

const SOIL_COLORS = {
  loamy: '#a16207', clay: '#6b7280', sandy: '#d97706',
  'black soil': '#1c1917', 'red soil': '#b91c1c', alluvial: '#065f46',
};

const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`;

/* ─── Inline CSS injected once ─────────────────────────────────────────────── */
const _s = document.createElement('style');
_s.textContent = `
  .fp-card {
    background: rgba(18,38,24,0.65);
    backdrop-filter: blur(14px);
    border: 1px solid #2d4a35;
    border-radius: 1.25rem;
    transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
    position: relative; overflow: hidden;
  }
  .fp-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.4); border-color: #3d6447; }
  .fp-card.starred { border-color: rgba(251,191,36,0.5); box-shadow: 0 0 0 1px rgba(251,191,36,0.15); }
  .fp-input {
    background: rgba(10,22,14,0.85); border: 1px solid #2d4a35;
    border-radius: 0.65rem; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
    font-size: 13px; padding: 10px 14px; width: 100%; outline: none; transition: all 0.22s;
  }
  .fp-input:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .fp-select {
    background: rgba(10,22,14,0.85); border: 1px solid #2d4a35;
    border-radius: 0.65rem; color: #e2e8f0; font-family: 'DM Sans', sans-serif;
    font-size: 13px; padding: 10px 14px; width: 100%; outline: none; transition: all 0.22s;
    appearance: none; background-image: ${CHEVRON}; background-repeat: no-repeat;
    background-position: right 12px center; padding-right: 32px; cursor: pointer;
  }
  .fp-select:focus { border-color: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .fp-select option { background: #0d1f10; }
  .fp-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
  .fp-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .fp-btn-icon { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 9px; border: 1px solid #2d4a35; background: rgba(255,255,255,0.04); cursor: pointer; transition: all 0.2s; color: #64748b; }
  .fp-btn-icon:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; border-color: #3d6447; }
  .fp-btn-icon.danger:hover { background: rgba(248,113,113,0.12); color: #f87171; border-color: rgba(248,113,113,0.35); }
  .fp-btn-icon.star-active { color: #fbbf24; background: rgba(251,191,36,0.10); border-color: rgba(251,191,36,0.3); }
  .fp-btn-icon.edit-active { color: #4ade80; background: rgba(74,222,128,0.10); border-color: rgba(74,222,128,0.3); }
  .fp-empty { text-align: center; padding: 64px 24px; }
  @keyframes fp-fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  .fp-animate { animation: fp-fadeUp 0.42s cubic-bezier(0.22,1,0.36,1) both; }
  .fp-soil-dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; }
  .fp-use-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px;
    border-radius: 8px; border: 1px solid rgba(74,222,128,0.3); background: rgba(74,222,128,0.08);
    color: #4ade80; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s;
  }
  .fp-use-btn:hover { background: rgba(74,222,128,0.16); border-color: rgba(74,222,128,0.5); }
  .fp-use-btn.amber { border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.08); color: #fbbf24; }
  .fp-use-btn.amber:hover { background: rgba(251,191,36,0.16); border-color: rgba(251,191,36,0.5); }
  .fp-use-btn.teal { border-color: rgba(45,212,191,0.3); background: rgba(45,212,191,0.08); color: #2dd4bf; }
  .fp-use-btn.teal:hover { background: rgba(45,212,191,0.16); border-color: rgba(45,212,191,0.5); }
`;
if (!document.getElementById('fp-styles')) { _s.id = 'fp-styles'; document.head.appendChild(_s); }

/* ─── ProfileCard ──────────────────────────────────────────────────────────── */
function ProfileCard({ profile, onEdit, onDelete, onToggleStar, onUse, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const soilColor = SOIL_COLORS[profile.soil_type] || '#4ade80';

  return (
    <div className={`fp-card fp-animate${profile.starred ? ' starred' : ''}`} style={{ padding: 20 }}>
      {/* Starred ribbon */}
      {profile.starred && (
        <div style={{ position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 38px 38px 0',borderColor:`transparent rgba(251,191,36,0.35) transparent transparent` }}/>
      )}

      {/* Header row */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14 }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
            <h3 style={{ fontFamily:'Fraunces,serif',fontSize:18,fontWeight:700,color:'#e2e8f0',letterSpacing:'-0.01em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
              {profile.name || 'Unnamed Farm'}
            </h3>
            {profile.starred && <Star size={13} style={{ color:'#fbbf24',flexShrink:0 }} fill="#fbbf24"/>}
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
            <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:'#64748b' }}>
              <MapPin size={11}/>{profile.location || profile.state}
            </span>
            <span style={{ fontSize:10,color:'#2d4a35' }}>·</span>
            <span style={{ fontSize:12,color:'#94a3b8' }}>{profile.area_hectare} ha ({(profile.area_hectare*2.471).toFixed(1)} ac)</span>
          </div>
        </div>
        {/* Action buttons */}
        <div style={{ display:'flex',gap:6,marginLeft:10 }}>
          <button className={`fp-btn-icon${profile.starred?' star-active':''}`} onClick={()=>onToggleStar(profile.id)} title={profile.starred?'Unstar':'Star'}>
            {profile.starred ? <Star size={14} fill="#fbbf24"/> : <StarOff size={14}/>}
          </button>
          <button className="fp-btn-icon" onClick={()=>onDuplicate(profile)} title="Duplicate"><Copy size={14}/></button>
          <button className={`fp-btn-icon edit-active`} onClick={()=>onEdit(profile)} title="Edit"><Edit3 size={14}/></button>
          <button className="fp-btn-icon danger" onClick={()=>onDelete(profile.id)} title="Delete"><Trash2 size={14}/></button>
        </div>
      </div>

      {/* Quick badges */}
      <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:14 }}>
        <span className="fp-badge" style={{ background:`${soilColor}18`,color:soilColor,border:`1px solid ${soilColor}30` }}>
          <span className="fp-soil-dot" style={{ background:soilColor }}/>
          {profile.soil_type}
        </span>
        <span className="fp-badge" style={{ background:'rgba(74,222,128,0.10)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.22)' }}>
          🌱 {profile.primary_crop}
        </span>
        <span className="fp-badge" style={{ background:'rgba(45,212,191,0.10)',color:'#2dd4bf',border:'1px solid rgba(45,212,191,0.22)' }}>
          🌤 {profile.season}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14 }}>
        {[
          { icon:<Droplets size={12}/>, label:'Rain', val:`${profile.rainfall_mm}mm`, c:'#2dd4bf' },
          { icon:<Thermometer size={12}/>, label:'Temp', val:`${profile.temperature_c}°C`, c:'#fbbf24' },
          { icon:<Leaf size={12}/>, label:'Seed', val:profile.seed_variety, c:'#4ade80' },
        ].map(({icon,label,val,c})=>(
          <div key={label} style={{ padding:'10px 12px',background:'rgba(10,22,14,0.6)',border:'1px solid #2d4a35',borderRadius:9,textAlign:'center' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:4,color:c,marginBottom:4 }}>{icon}<span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase' }}>{label}</span></div>
            <p style={{ fontSize:13,fontWeight:700,color:'#e2e8f0' }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Expandable detail */}
      {profile.notes && (
        <button onClick={()=>setExpanded(e=>!e)} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11,color:'#64748b',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:600,marginBottom:expanded?8:0,padding:0 }}>
          <ChevronDown size={12} style={{ transform:expanded?'rotate(180deg)':'none',transition:'0.2s' }}/> Notes
        </button>
      )}
      {expanded && profile.notes && (
        <p style={{ fontSize:12.5,color:'#94a3b8',lineHeight:1.6,padding:'10px 14px',background:'rgba(10,22,14,0.5)',borderRadius:9,border:'1px solid #2d4a35' }}>{profile.notes}</p>
      )}

      {/* Use buttons */}
      <div style={{ display:'flex',gap:7,flexWrap:'wrap',marginTop:14,paddingTop:14,borderTop:'1px solid rgba(45,74,53,0.5)' }}>
        <button className="fp-use-btn" onClick={()=>onUse(profile,'price')}>📈 Price Forecast</button>
        <button className="fp-use-btn amber" onClick={()=>onUse(profile,'yield')}>🌿 Yield Estimate</button>
        <button className="fp-use-btn teal" onClick={()=>onUse(profile,'revenue')}>💰 ROI Calc</button>
      </div>

      {/* Footer meta */}
      <p style={{ fontSize:10,color:'#374151',marginTop:10,textAlign:'right' }}>
        {profile.updatedAt ? `Updated ${new Date(profile.updatedAt).toLocaleDateString()}` : profile.createdAt ? `Created ${new Date(profile.createdAt).toLocaleDateString()}` : ''}
      </p>
    </div>
  );
}

/* ─── ProfileForm (create / edit) ─────────────────────────────────────────── */
function ProfileForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_PROFILE, ...initial });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Farm name is required';
    if (form.area_hectare <= 0) e.area_hectare = 'Area must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  const Field = ({ label, fkey, type='text', opts, step=1, unit='' }) => (
    <div>
      <label className="fp-label">{label}</label>
      {opts ? (
        <select className="fp-select" value={form[fkey]} onChange={e=>set(fkey,e.target.value)}>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <div style={{ position:'relative' }}>
          <input type={type} step={step} value={form[fkey]} onChange={e=>set(fkey,type==='number'?parseFloat(e.target.value)||0:e.target.value)} className="fp-input" style={errors[fkey]?{borderColor:'#f87171'}:{}} placeholder={type==='text'?label:''}/>
          {unit && <span style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#64748b',pointerEvents:'none' }}>{unit}</span>}
        </div>
      )}
      {errors[fkey] && <p style={{ fontSize:10.5,color:'#f87171',marginTop:4 }}>{errors[fkey]}</p>}
    </div>
  );

  return (
    <div className="fp-card fp-animate" style={{ padding:28 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22 }}>
        <h3 style={{ fontFamily:'Fraunces,serif',fontSize:19,fontWeight:700,color:'#e2e8f0' }}>
          {initial?.id ? '✏️ Edit Farm Profile' : '➕ New Farm Profile'}
        </h3>
        <button className="fp-btn-icon danger" onClick={onCancel}><X size={15}/></button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14 }}>
        <Field label="Farm Name *" fkey="name"/>
        <Field label="Location / Village" fkey="location"/>
        <Field label="State" fkey="state" opts={OPTS.state}/>
        <Field label="Area" fkey="area_hectare" type="number" step={0.1} unit="ha"/>
        <Field label="Soil Type" fkey="soil_type" opts={OPTS.soil_type}/>
        <Field label="Primary Crop" fkey="primary_crop" opts={OPTS.primary_crop}/>
        <Field label="Seed Variety" fkey="seed_variety" opts={OPTS.seed_variety}/>
        <Field label="Fertilizer" fkey="fertilizer_used" opts={OPTS.fertilizer_used}/>
        <Field label="Avg Rainfall" fkey="rainfall_mm" type="number" unit="mm"/>
        <Field label="Avg Temperature" fkey="temperature_c" type="number" step={0.5} unit="°C"/>
        <Field label="Season" fkey="season" opts={OPTS.season}/>
      </div>

      {/* Notes full-width */}
      <div style={{ marginTop:14 }}>
        <label className="fp-label">Notes / Remarks</label>
        <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} className="fp-input" rows={2} style={{ resize:'vertical',fontFamily:'DM Sans,sans-serif' }} placeholder="Irrigation type, past issues, etc."/>
      </div>

      <div style={{ display:'flex',gap:12,marginTop:20 }}>
        <button onClick={handleSave} style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px 20px',borderRadius:10,border:'none',background:'#4ade80',color:'#08120a',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 18px rgba(74,222,128,0.3)' }}>
          <Check size={15}/>{initial?.id ? 'Save Changes' : 'Create Profile'}
        </button>
        <button onClick={onCancel} style={{ padding:'13px 18px',borderRadius:10,border:'1px solid #2d4a35',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:600,cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─── FarmProfiles (main export) ───────────────────────────────────────────── */
export default function FarmProfiles({ onBack, onNavigateWithProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [editingProfile, setEditingProfile] = useState(null); // null | profile object
  const [showForm, setShowForm] = useState(false);
  const [filterStar, setFilterStar] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Load on mount
  useEffect(() => { setProfiles(loadProfiles()); }, []);

  const persist = useCallback((updated) => { setProfiles(updated); saveProfiles(updated); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  /* CRUD */
  const handleSave = (formData) => {
    const now = Date.now();
    if (formData.id) {
      // Update
      persist(profiles.map(p => p.id === formData.id ? { ...formData, updatedAt: now } : p));
      showToast('✅ Farm profile updated!');
    } else {
      // Create
      const newProfile = { ...formData, id: `fp_${now}`, createdAt: now, updatedAt: now };
      persist([newProfile, ...profiles]);
      showToast('🌾 Farm profile created!');
    }
    setShowForm(false); setEditingProfile(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this farm profile?')) return;
    persist(profiles.filter(p => p.id !== id));
    showToast('🗑️ Profile deleted.');
  };

  const handleToggleStar = (id) => {
    persist(profiles.map(p => p.id === id ? { ...p, starred: !p.starred, updatedAt: Date.now() } : p));
  };

  const handleDuplicate = (profile) => {
    const now = Date.now();
    const copy = { ...profile, id: `fp_${now}`, name: `${profile.name} (Copy)`, starred: false, createdAt: now, updatedAt: now };
    persist([copy, ...profiles]);
    showToast('📋 Profile duplicated!');
  };

  const handleEdit = (profile) => { setEditingProfile(profile); setShowForm(true); };
  const handleNew  = ()         => { setEditingProfile(null);   setShowForm(true); };
  const handleCancel = ()       => { setShowForm(false); setEditingProfile(null); };

  const handleUse = (profile, page) => {
    if (onNavigateWithProfile) onNavigateWithProfile(page, profile);
  };

  /* Export all profiles as JSON */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `KrushiConnect_Farms_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Profiles exported!');
  };

  /* Import profiles from JSON */
  const handleImport = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        persist([...imported, ...profiles]);
        showToast(`✅ Imported ${imported.length} profiles!`);
      } catch { showToast('❌ Invalid file format.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  /* Filtered list */
  const filtered = profiles
    .filter(p => !filterStar || p.starred)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.location||'').toLowerCase().includes(search.toLowerCase()) || (p.primary_crop||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || (b.updatedAt||0) - (a.updatedAt||0));

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1, background:'var(--bg-deep,#08120a)' }}>
      {/* Ambient */}
      <div style={{ position:'fixed',top:-80,right:-80,width:440,height:440,borderRadius:'50%',background:'rgba(74,222,128,0.07)',filter:'blur(100px)',pointerEvents:'none',zIndex:0 }}/>
      <div style={{ position:'fixed',bottom:-80,left:-80,width:360,height:360,borderRadius:'50%',background:'rgba(45,212,191,0.06)',filter:'blur(90px)',pointerEvents:'none',zIndex:0 }}/>

      {/* Nav */}
      <nav style={{ background:'rgba(8,18,10,0.84)',backdropFilter:'blur(18px)',borderBottom:'1px solid #2d4a35',position:'sticky',top:0,zIndex:100 }}>
        <div style={{ maxWidth:1100,margin:'0 auto',padding:'0 24px',height:62,display:'flex',alignItems:'center',gap:14 }}>
          <button onClick={onBack} style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'1px solid #2d4a35',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontFamily:'DM Sans,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s' }}>
            <ArrowLeft size={14}/> Home
          </button>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <span style={{ fontSize:20 }}>🏡</span>
            <span style={{ fontFamily:'Fraunces,serif',fontSize:19,fontWeight:700,color:'#e2e8f0' }}>Farm Profiles</span>
          </div>
          <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:12,color:'#64748b' }}>{profiles.length} profile{profiles.length!==1?'s':''}</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100,margin:'0 auto',padding:'32px 24px 100px',position:'relative',zIndex:1 }}>

        {/* Toolbar */}
        <div style={{ display:'flex',flexWrap:'wrap',gap:10,marginBottom:24,alignItems:'center' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search farms…" className="fp-input" style={{ flex:'1 1 200px',maxWidth:300 }}/>
          <button onClick={()=>setFilterStar(f=>!f)} style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:9,border:`1px solid ${filterStar?'rgba(251,191,36,0.4)':'#2d4a35'}`,background:filterStar?'rgba(251,191,36,0.10)':'rgba(255,255,255,0.04)',color:filterStar?'#fbbf24':'#94a3b8',fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s' }}>
            <Star size={13} fill={filterStar?'#fbbf24':'none'}/> Starred
          </button>
          <button onClick={handleExport} className="fp-btn-icon" title="Export JSON" style={{ width:'auto',padding:'0 14px',gap:6,fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',fontFamily:'DM Sans,sans-serif' }}>
            <Download size={13}/> Export
          </button>
          <label className="fp-btn-icon" title="Import JSON" style={{ width:'auto',padding:'0 14px',gap:6,fontSize:11,fontWeight:700,letterSpacing:'0.07em',textTransform:'uppercase',fontFamily:'DM Sans,sans-serif',cursor:'pointer' }}>
            <Upload size={13}/> Import
            <input type="file" accept=".json" style={{ display:'none' }} onChange={handleImport}/>
          </label>
          <button onClick={handleNew} style={{ display:'flex',alignItems:'center',gap:7,padding:'10px 20px',borderRadius:9,border:'none',background:'#4ade80',color:'#08120a',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 16px rgba(74,222,128,0.3)',transition:'all 0.22s' }}>
            <Plus size={15}/> New Farm
          </button>
        </div>

        {/* Form (create / edit) */}
        {showForm && (
          <div style={{ marginBottom:24 }}>
            <ProfileForm initial={editingProfile} onSave={handleSave} onCancel={handleCancel}/>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="fp-empty fp-card" style={{ padding:64 }}>
            {profiles.length === 0 ? (
              <>
                <div style={{ fontSize:52,marginBottom:16 }}>🌾</div>
                <h3 style={{ fontFamily:'Fraunces,serif',fontSize:22,fontWeight:700,color:'#e2e8f0',marginBottom:10 }}>No Farm Profiles Yet</h3>
                <p style={{ fontSize:14,color:'#64748b',lineHeight:1.7,maxWidth:360,margin:'0 auto 24px' }}>
                  Create your first farm profile to save field context and use it instantly across Price Forecast, Yield Estimation, and ROI Calculator.
                </p>
                <button onClick={handleNew} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',borderRadius:10,border:'none',background:'#4ade80',color:'#08120a',fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',cursor:'pointer',boxShadow:'0 0 18px rgba(74,222,128,0.3)' }}>
                  <Plus size={15}/> Create First Profile
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:40,marginBottom:12 }}>🔍</div>
                <p style={{ fontSize:15,color:'#64748b' }}>No profiles match your search.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:18 }}>
            {filtered.map(p => (
              <ProfileCard key={p.id} profile={p} onEdit={handleEdit} onDelete={handleDelete} onToggleStar={handleToggleStar} onDuplicate={handleDuplicate} onUse={handleUse}/>
            ))}
          </div>
        )}

        {/* Stats bar */}
        {profiles.length > 0 && (
          <div style={{ marginTop:32,display:'flex',gap:14,flexWrap:'wrap' }}>
            {[
              { label:'Total Farms',    val:profiles.length,                               c:'#4ade80' },
              { label:'Total Area',     val:`${profiles.reduce((s,p)=>s+p.area_hectare,0).toFixed(1)} ha`, c:'#fbbf24' },
              { label:'Starred',        val:profiles.filter(p=>p.starred).length,          c:'#fbbf24' },
              { label:'Crops Tracked',  val:[...new Set(profiles.map(p=>p.primary_crop))].length, c:'#2dd4bf' },
            ].map(({label,val,c})=>(
              <div key={label} style={{ flex:'1 1 120px',padding:'16px 18px',background:'rgba(18,38,24,0.65)',border:'1px solid #2d4a35',borderRadius:12,textAlign:'center' }}>
                <p style={{ fontSize:9,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'#64748b',marginBottom:6 }}>{label}</p>
                <p style={{ fontFamily:'Fraunces,serif',fontSize:26,fontWeight:700,color:c }}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',padding:'12px 22px',background:'rgba(8,18,10,0.96)',border:'1px solid #2d4a35',borderRadius:10,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#e2e8f0',fontWeight:600,zIndex:500,animation:'fp-fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) both',whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  );
}

/* ─── useFarmProfiles hook (for other pages) ──────────────────────────────── */
export function useFarmProfiles() {
  const [profiles, setProfiles] = useState([]);
  useEffect(() => { setProfiles(loadProfiles()); }, []);
  const refresh = () => setProfiles(loadProfiles());
  return { profiles, refresh };
}