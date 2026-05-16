import React, { useState, useEffect } from 'react';
import {
  Search, Plus, X, Leaf, ShoppingBag, MapPin, Calendar,
  IndianRupee, Package, MessageCircle, Sparkles, CheckCircle,
  Clock, Users, RefreshCw, LogIn, Shield, Trash2, ArrowLeft,
  Crown, Filter
} from 'lucide-react';

/* ─── Styles (matches KrushiConnect design system) ───────────────────────────── */
const _style = document.createElement('style');
_style.textContent = `
  .mkt-card {
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
    position: relative; overflow: hidden;
  }
  .mkt-card:hover { border-color: var(--glass-border-h); transform: translateY(-3px); box-shadow: 0 18px 50px rgba(0,0,0,0.4); }

  .mkt-input {
    background: rgba(10,22,14,0.85);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; padding: 11px 14px;
    width: 100%; outline: none;
    transition: all 0.25s ease; appearance: none;
  }
  .mkt-input:focus { border-color: var(--neon-sage); box-shadow: 0 0 0 3px rgba(74,222,128,0.15); }
  .mkt-input option { background: #0d1f10; }
  .mkt-input::placeholder { color: var(--text-muted); }

  .mkt-label {
    display: block; font-size: 10px; font-weight: 700;
    letter-spacing: 0.10em; text-transform: uppercase;
    color: var(--text-secondary); margin-bottom: 7px;
  }

  .mkt-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 12px 22px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.11em; text-transform: uppercase; color: var(--bg-deep);
    background: var(--neon-sage); border: none; border-radius: 0.75rem; cursor: pointer;
    box-shadow: 0 0 18px rgba(74,222,128,0.30); transition: all 0.22s ease;
  }
  .mkt-btn:hover:not(:disabled) { background: #62ef94; box-shadow: 0 0 28px rgba(74,222,128,0.5); transform: translateY(-1px); }
  .mkt-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .mkt-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 16px; font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary);
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
    border-radius: 0.75rem; cursor: pointer; transition: all 0.2s ease;
  }
  .mkt-btn-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

  .mkt-tab {
    padding: 8px 16px; border-radius: 9px; border: 1px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.18s;
  }
  .mkt-tab-active   { background: rgba(74,222,128,0.14); color: var(--neon-sage); border-color: rgba(74,222,128,0.3); }
  .mkt-tab-inactive { background: rgba(255,255,255,0.03); color: var(--text-muted); }
  .mkt-tab-inactive:hover { color: var(--text-secondary); background: rgba(255,255,255,0.06); }

  .mkt-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 99px;
    font-size: 9.5px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase;
  }
  .mkt-badge-sell   { color: #4ade80; background: rgba(74,222,128,0.12);  border: 1px solid rgba(74,222,128,0.25); }
  .mkt-badge-buy    { color: #60a5fa; background: rgba(96,165,250,0.12);  border: 1px solid rgba(96,165,250,0.25); }
  .mkt-badge-org    { color: #10b981; background: rgba(16,185,129,0.12);  border: 1px solid rgba(16,185,129,0.25); }
  .mkt-badge-cert   { color: #2dd4bf; background: rgba(45,212,191,0.12);  border: 1px solid rgba(45,212,191,0.25); }
  .mkt-badge-urg    { color: #f87171; background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.25); }
  .mkt-badge-mine   { color: #fbbf24; background: rgba(251,191,36,0.12);  border: 1px solid rgba(251,191,36,0.25); }

  .mkt-progress { height: 5px; background: rgba(255,255,255,0.06); border-radius:99px; overflow:hidden; }
  .mkt-progress-fill { height:100%; border-radius:99px; transition: width 0.9s cubic-bezier(0.22,1,0.36,1); }

  .mkt-stat {
    padding: 16px 18px; border-radius: 1.25rem;
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    display: flex; align-items: center; gap: 13px;
  }

  .mkt-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.72); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .mkt-modal {
    background: rgba(10,24,14,0.98);
    border: 1px solid var(--glass-border);
    border-radius: 1.75rem;
    width: 100%; max-width: 520px;
    max-height: 92vh; overflow-y: auto;
  }
  .mkt-modal::-webkit-scrollbar { width: 4px; }
  .mkt-modal::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 4px; }

  .mkt-toggle {
    width: 40px; height: 22px; border-radius: 99px; position: relative;
    cursor: pointer; transition: background 0.2s; flex-shrink: 0;
  }
  .mkt-toggle-thumb {
    position: absolute; top: 3px; width: 16px; height: 16px;
    background: white; border-radius: 50%; transition: transform 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  .mkt-match-bar { height: 5px; background: rgba(255,255,255,0.06); border-radius:99px; overflow:hidden; margin-top:8px; }
  .mkt-match-fill { height:100%; border-radius:99px; transition: width 0.8s ease; }

  @keyframes mkt-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .mkt-s1 { animation: mkt-fadeUp 0.4s 0.00s cubic-bezier(0.22,1,0.36,1) both; }
  .mkt-s2 { animation: mkt-fadeUp 0.4s 0.07s cubic-bezier(0.22,1,0.36,1) both; }
  .mkt-s3 { animation: mkt-fadeUp 0.4s 0.14s cubic-bezier(0.22,1,0.36,1) both; }
  .mkt-s4 { animation: mkt-fadeUp 0.4s 0.21s cubic-bezier(0.22,1,0.36,1) both; }

  .mkt-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
    z-index: 400; padding: 13px 22px;
    background: rgba(10,24,14,0.97); border: 1px solid rgba(74,222,128,0.3);
    border-radius: 12px; color: var(--neon-sage);
    font-family: 'DM Sans',sans-serif; font-size: 13px; font-weight: 700;
    display: flex; align-items: center; gap: 9px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: mkt-fadeUp 0.3s both;
    white-space: nowrap;
  }

  .mkt-err { font-size: 11px; color: var(--red-alert); margin-top: 5px; }

  .mkt-search-wrap { position: relative; }
  .mkt-search-wrap svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted); }
  .mkt-search-wrap .mkt-input { padding-left: 36px; }

  .chev-bg {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px;
  }
`;
if (!document.getElementById('mkt-styles')) { _style.id = 'mkt-styles'; document.head.appendChild(_style); }

/* ─── Firebase / Storage ─────────────────────────────────────────────────────── */
let _db = null;
async function getDb() {
  if (_db) return _db;
  try {
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp }
      = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    _db = { fs: getFirestore(getApp()), collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp };
    return _db;
  } catch { return null; }
}
const LS_KEY = 'krushi_mkt_v2';
const lsLoad = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } };
const lsSave = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

async function dbFetch() {
  const db = await getDb();
  if (db) {
    const snap = await db.getDocs(db.query(db.collection(db.fs, 'marketplace_listings'), db.orderBy('createdAt','desc')));
    return snap.docs.map(d => ({ id:d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString() }));
  }
  return lsLoad();
}
async function dbAdd(data) {
  const db = await getDb();
  if (db) {
    const ref = await db.addDoc(db.collection(db.fs, 'marketplace_listings'), { ...data, createdAt: db.serverTimestamp() });
    return { id: ref.id, ...data, createdAt: new Date().toISOString() };
  }
  const items = lsLoad();
  const item  = { id: `ls_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
  lsSave([item, ...items]); return item;
}
async function dbDelete(id, uid) {
  const db = await getDb();
  if (db) { await db.deleteDoc(db.doc(db.fs, 'marketplace_listings', id)); return; }
  const items = lsLoad();
  const item  = items.find(i => i.id === id);
  if (item && item.ownerUid !== uid) throw new Error('Not your listing');
  lsSave(items.filter(i => i.id !== id));
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const CROPS  = ['Wheat','Rice','Maize','Pulses','Sugarcane','Millet','Groundnut','Cotton','Soybean','Tomato','Onion','Potato'];
const STATES = ['Gujarat','Maharashtra','Punjab','UP','Bihar','Rajasthan','MP','Haryana','Karnataka','Andhra Pradesh'];
const UNITS  = ['Quintal','Ton','Kg','Bag'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CROP_EMOJI = { Wheat:'🌾',Rice:'🍚',Maize:'🌽',Pulses:'🫘',Sugarcane:'🎋',Millet:'🌾',Groundnut:'🥜',Cotton:'🌸',Soybean:'🫘',Tomato:'🍅',Onion:'🧅',Potato:'🥔' };

function matchScore(listing, need) {
  if (!need) return 100;
  let s = 0;
  if (listing.crop?.toLowerCase() === need.crop?.toLowerCase()) s += 50;
  else if (listing.crop?.toLowerCase().includes(need.crop?.toLowerCase() || '')) s += 20;
  if (listing.state === need.state) s += 30;
  if (parseFloat(need.quantity) && parseFloat(listing.quantity) >= parseFloat(need.quantity)) s += 20;
  return Math.min(s, 100);
}
function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

/* ─── Listing Card ───────────────────────────────────────────────────────────── */
function ListingCard({ listing, matchNeed, currentUid, onDelete, onWhatsApp }) {
  const isOwner = listing.ownerUid === currentUid;
  const score   = matchScore(listing, matchNeed);
  const isSell  = listing.type === 'sell';
  const accentColor = isSell ? '#4ade80' : '#60a5fa';

  return (
    <div className="mkt-card" style={{ borderTop: `3px solid ${accentColor}` }}>
      {/* Subtle glow */}
      <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`${accentColor}12`, filter:'blur(30px)', pointerEvents:'none' }}/>

      <div style={{ padding:'20px 22px', position:'relative' }}>
        {/* Top row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            {listing.ownerPhoto
              ? <img src={listing.ownerPhoto} alt="" style={{ width:38, height:38, borderRadius:'50%', border:`2px solid ${accentColor}40`, flexShrink:0 }}/>
              : <div style={{ width:38, height:38, borderRadius:'50%', background:`${accentColor}15`, border:`1px solid ${accentColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                  {CROP_EMOJI[listing.crop] || '🌾'}
                </div>
            }
            <div style={{ minWidth:0 }}>
              <h3 className="df" style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{listing.crop}</h3>
              <p style={{ fontSize:11.5, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{listing.ownerName || listing.name}</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, alignItems:'flex-end' }}>
            <span className={`mkt-badge ${isSell ? 'mkt-badge-sell' : 'mkt-badge-buy'}`}>
              {isSell ? '🌾 Selling' : '🛒 Buying'}
            </span>
            {isOwner && <span className="mkt-badge mkt-badge-mine"><Crown size={9}/> Mine</span>}
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
          {[
            { icon:<Package size={12}/>,     val:`${listing.quantity} ${listing.unit}` },
            { icon:<IndianRupee size={12}/>,  val:`₹${listing.price}/${listing.unit}` },
            { icon:<MapPin size={12}/>,       val:listing.state },
            { icon:<Calendar size={12}/>,     val:listing.harvestMonth },
          ].map((row,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 10px', background:'rgba(10,22,14,0.6)', borderRadius:9, border:'1px solid var(--glass-border)' }}>
              <span style={{ color:'var(--text-muted)', flexShrink:0 }}>{row.icon}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Price highlight */}
        <div style={{ padding:'10px 14px', background:`${accentColor}08`, border:`1px solid ${accentColor}20`, borderRadius:11, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)' }}>Price / {listing.unit}</span>
          <span className="df" style={{ fontSize:20, fontWeight:700, color:accentColor }}>₹{parseFloat(listing.price).toLocaleString('en-IN')}</span>
        </div>

        {/* Description */}
        {listing.description && (
          <p style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', marginBottom:10, lineHeight:1.55 }}>"{listing.description}"</p>
        )}

        {/* Tags */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
          {listing.organic   && <span className="mkt-badge mkt-badge-org"><Leaf size={9}/> Organic</span>}
          {listing.certified && <span className="mkt-badge mkt-badge-cert"><CheckCircle size={9}/> Certified</span>}
          {listing.urgent    && <span className="mkt-badge mkt-badge-urg"><Clock size={9}/> Urgent</span>}
        </div>

        {/* AI Match bar */}
        {matchNeed && (
          <div style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, color: score>=80?'#4ade80':score>=50?'#fbbf24':'var(--text-muted)', fontWeight:700 }}>
                {score>=80?'🎯 Great Match':score>=50?'👍 Good Match':'🔍 Partial Match'}
              </span>
              <span style={{ fontSize:10, fontWeight:700, color: score>=80?'#4ade80':score>=50?'#fbbf24':'var(--text-muted)' }}>{score}%</span>
            </div>
            <div className="mkt-match-bar">
              <div className="mkt-match-fill" style={{ width:`${score}%`, background: score>=80?'#4ade80':score>=50?'#fbbf24':'#64748b' }}/>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:12, borderTop:'1px solid var(--glass-border)' }}>
          <span style={{ fontSize:10.5, color:'var(--text-muted)', fontWeight:500 }}>{timeAgo(listing.createdAt)}</span>
          <div style={{ display:'flex', gap:8 }}>
            {isOwner && (
              <button onClick={() => onDelete(listing.id)}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 11px', borderRadius:9, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', color:'var(--red-alert)', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.18s' }}>
                <Trash2 size={12}/> Delete
              </button>
            )}
            <button onClick={() => onWhatsApp(listing)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.28)', color:'var(--neon-sage)', fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.18s', letterSpacing:'0.05em' }}>
              <MessageCircle size={12}/> WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Match Finder ────────────────────────────────────────────────────────── */
function MatchFinder({ onSearch }) {
  const [need,   setNeed]   = useState({ crop:'', state:'', quantity:'' });
  const [active, setActive] = useState(false);
  const apply = () => { onSearch(need.crop||need.state||need.quantity ? need : null); setActive(!!(need.crop||need.state)); };
  const clear  = () => { setNeed({ crop:'', state:'', quantity:'' }); onSearch(null); setActive(false); };

  return (
    <div className="mkt-card" style={{ padding:'18px 22px', marginBottom:20, borderColor: active ? 'rgba(251,191,36,0.4)' : 'var(--glass-border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:13 }}>
        <Sparkles size={14} style={{ color:'var(--amber)' }}/>
        <span className="df" style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>AI Match Finder</span>
        {active && <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:9.5, fontWeight:800, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--amber)', background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.25)' }}>● Active</span>}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        <select value={need.crop} onChange={e=>setNeed(n=>({...n,crop:e.target.value}))} className="mkt-input chev-bg" style={{ flex:1, minWidth:130 }}>
          <option value="">Any Crop</option>
          {CROPS.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={need.state} onChange={e=>setNeed(n=>({...n,state:e.target.value}))} className="mkt-input chev-bg" style={{ flex:1, minWidth:130 }}>
          <option value="">Any State</option>
          {STATES.map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="number" value={need.quantity} onChange={e=>setNeed(n=>({...n,quantity:e.target.value}))} placeholder="Min qty" className="mkt-input" style={{ width:100 }}/>
        <button onClick={apply} className="mkt-btn" style={{ padding:'11px 18px', background:'var(--amber)', boxShadow:'0 0 16px rgba(251,191,36,0.28)', color:'#08120a' }}>
          <Sparkles size={13}/> Match
        </button>
        {active && (
          <button onClick={clear} className="mkt-btn-ghost">
            <X size={13}/> Clear
          </button>
        )}
      </div>
      {active && <p style={{ fontSize:11, color:'var(--amber)', fontWeight:600, marginTop:8 }}>✨ Listings sorted by AI match score</p>}
    </div>
  );
}

/* ─── Post Form Modal ────────────────────────────────────────────────────────── */
function PostForm({ user, onClose, onSubmit, posting }) {
  const [type, setType] = useState('sell');
  const [form, setForm] = useState({
    name: user?.displayName || '', phone: '', crop:'Wheat', quantity:'',
    unit:'Quintal', price:'', state:'Gujarat', harvestMonth:'Jan',
    description:'', organic:false, certified:false, urgent:false,
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name     = 'Name required';
    if (!form.phone.match(/^\d{10}$/)) e.phone    = '10-digit number required';
    if (!form.quantity||isNaN(form.quantity)) e.quantity = 'Valid quantity required';
    if (!form.price||isNaN(form.price))       e.price    = 'Valid price required';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ ...form, type, quantity:parseFloat(form.quantity), price:parseFloat(form.price),
      ownerUid:user.uid, ownerName:user.displayName||form.name, ownerEmail:user.email, ownerPhoto:user.photoURL||null });
  };

  const isSell = type === 'sell';
  const accentColor = isSell ? '#4ade80' : '#60a5fa';

  return (
    <div className="mkt-modal-overlay">
      <div className="mkt-modal">
        {/* Accent top bar */}
        <div style={{ height:3, background:`linear-gradient(90deg,${accentColor},${accentColor}44)`, borderRadius:'1.75rem 1.75rem 0 0' }}/>

        {/* Header */}
        <div style={{ padding:'22px 26px 18px', borderBottom:'1px solid var(--glass-border)', position:'sticky', top:0, background:'rgba(10,24,14,0.98)', zIndex:10, borderRadius:'1.75rem 1.75rem 0 0' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <h2 className="df" style={{ fontSize:21, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Post a Listing</h2>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                {user.photoURL && <img src={user.photoURL} alt="" style={{ width:18, height:18, borderRadius:'50%' }}/>}
                <span style={{ fontSize:11.5, color:'var(--text-secondary)' }}>Posting as <strong style={{ color:'var(--text-primary)' }}>{user.displayName||user.email}</strong></span>
              </div>
            </div>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid var(--glass-border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)' }}>
              <X size={15}/>
            </button>
          </div>
          {/* Sell / Buy toggle */}
          <div style={{ display:'flex', gap:6, background:'rgba(10,22,14,0.8)', border:'1px solid var(--glass-border)', borderRadius:11, padding:4 }}>
            {[{v:'sell',emoji:'🌾',label:'I want to Sell',c:'#4ade80'},{v:'buy',emoji:'🛒',label:'I want to Buy',c:'#60a5fa'}].map(({v,emoji,label,c})=>(
              <button key={v} onClick={()=>setType(v)}
                style={{ flex:1, padding:'10px', borderRadius:8, border:`1px solid ${type===v?`${c}40`:'transparent'}`, background:type===v?`${c}15`:'transparent', color:type===v?c:'var(--text-muted)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'20px 26px 26px', display:'flex', flexDirection:'column', gap:16 }}>
          {/* Name + Phone */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="mkt-label">Your Name *</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ramesh Patel" className="mkt-input" style={errors.name?{borderColor:'var(--red-alert)'}:{}}/>
              {errors.name && <p className="mkt-err">{errors.name}</p>}
            </div>
            <div>
              <label className="mkt-label">WhatsApp No. *</label>
              <input value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="9876543210" maxLength={10} className="mkt-input" style={errors.phone?{borderColor:'var(--red-alert)'}:{}}/>
              {errors.phone && <p className="mkt-err">{errors.phone}</p>}
            </div>
          </div>

          {/* Crop + State */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="mkt-label">Crop *</label>
              <select value={form.crop} onChange={e=>set('crop',e.target.value)} className="mkt-input chev-bg">{CROPS.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div>
              <label className="mkt-label">State *</label>
              <select value={form.state} onChange={e=>set('state',e.target.value)} className="mkt-input chev-bg">{STATES.map(s=><option key={s}>{s}</option>)}</select>
            </div>
          </div>

          {/* Qty + Unit + Price */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label className="mkt-label">Quantity *</label>
              <input type="number" value={form.quantity} onChange={e=>set('quantity',e.target.value)} placeholder="100" className="mkt-input" style={errors.quantity?{borderColor:'var(--red-alert)'}:{}}/>
              {errors.quantity && <p className="mkt-err">{errors.quantity}</p>}
            </div>
            <div>
              <label className="mkt-label">Unit</label>
              <select value={form.unit} onChange={e=>set('unit',e.target.value)} className="mkt-input chev-bg">{UNITS.map(u=><option key={u}>{u}</option>)}</select>
            </div>
            <div>
              <label className="mkt-label">₹ / Unit *</label>
              <input type="number" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="2500" className="mkt-input" style={errors.price?{borderColor:'var(--red-alert)'}:{}}/>
              {errors.price && <p className="mkt-err">{errors.price}</p>}
            </div>
          </div>

          {/* Available from */}
          <div>
            <label className="mkt-label">Available / Needed From</label>
            <select value={form.harvestMonth} onChange={e=>set('harvestMonth',e.target.value)} className="mkt-input chev-bg">{MONTHS.map(m=><option key={m}>{m}</option>)}</select>
          </div>

          {/* Notes */}
          <div>
            <label className="mkt-label">Notes (optional)</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Quality, packaging, delivery details…" rows={2} className="mkt-input" style={{ resize:'none', lineHeight:1.6 }}/>
          </div>

          {/* Tags toggles */}
          <div>
            <label className="mkt-label">Tags</label>
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {[{k:'organic',label:'🌿 Organic',c:'#10b981'},{k:'certified',label:'✅ Certified',c:'#2dd4bf'},{k:'urgent',label:'⚡ Urgent',c:'#f87171'}].map(({k,label,c})=>(
                <div key={k} onClick={()=>set(k,!form[k])} style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', userSelect:'none' }}>
                  <div className="mkt-toggle" style={{ background:form[k]?c:'rgba(255,255,255,0.1)' }}>
                    <div className="mkt-toggle-thumb" style={{ transform: form[k]?'translateX(18px)':'translateX(3px)' }}/>
                  </div>
                  <span style={{ fontSize:13, color: form[k]?c:'var(--text-secondary)', fontWeight:600, fontFamily:'DM Sans,sans-serif' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={posting} className="mkt-btn"
            style={{ width:'100%', padding:'14px', background:accentColor, boxShadow:`0 0 20px ${accentColor}40`, fontSize:13 }}>
            {posting ? '⏳ Posting…' : `📢 Post ${isSell?'Sell':'Buy'} Listing`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Login Prompt ───────────────────────────────────────────────────────────── */
function LoginPrompt({ onLogin }) {
  return (
    <div className="mkt-card" style={{ padding:32, textAlign:'center', borderStyle:'dashed', marginBottom:20 }}>
      <div style={{ width:52, height:52, borderRadius:15, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
        <Shield size={24} style={{ color:'var(--neon-sage)' }}/>
      </div>
      <h3 className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Login to Post a Listing</h3>
      <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:18, maxWidth:300, margin:'0 auto 18px' }}>Sign in with Google to post your produce. Browsing is open to everyone.</p>
      <button onClick={onLogin} className="mkt-btn" style={{ padding:'12px 28px' }}>
        <LogIn size={14}/> Sign in with Google
      </button>
    </div>
  );
}

/* ─── Main Marketplace ───────────────────────────────────────────────────────── */
export default function Marketplace({ onBack, user, onLogin }) {
  const [listings,  setListings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [posting,   setPosting]   = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [matchNeed, setMatchNeed] = useState(null);
  const [tab,       setTab]       = useState('all');
  const [search,    setSearch]    = useState('');
  const [toast,     setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try { setListings(await dbFetch()); } catch { setListings(lsLoad()); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handlePost = async (data) => {
    setPosting(true);
    try {
      const item = await dbAdd(data);
      setListings(l => [item, ...l]);
      setShowForm(false);
      showToast('✅ Listing posted successfully!');
    } catch { alert('Could not post. Please try again.'); }
    setPosting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await dbDelete(id, user?.uid);
      setListings(l => l.filter(x => x.id !== id));
      showToast('🗑️ Listing removed.');
    } catch (e) { alert(e.message || 'Could not delete.'); }
  };

  const handleWhatsApp = (listing) => {
    const msg = encodeURIComponent(
      `Hi! I saw your listing on KrushiConnect 🌾\n\n` +
      `Crop: ${listing.crop}  |  Qty: ${listing.quantity} ${listing.unit}\n` +
      `Price: ₹${listing.price}/${listing.unit}  |  State: ${listing.state}\n\n` +
      `I am interested. Please get in touch!`
    );
    window.open(`https://wa.me/91${listing.phone}?text=${msg}`, '_blank');
  };

  const displayed = listings
    .filter(l => {
      if (tab !== 'all' && l.type !== tab) return false;
      if (search) {
        const s = search.toLowerCase();
        return l.crop?.toLowerCase().includes(s) || l.state?.toLowerCase().includes(s) || l.ownerName?.toLowerCase().includes(s);
      }
      return true;
    })
    .map(l => ({ ...l, _score: matchNeed ? matchScore(l, matchNeed) : 100 }))
    .sort((a, b) => b._score - a._score);

  const stats = {
    total: listings.length,
    sell:  listings.filter(l => l.type === 'sell').length,
    buy:   listings.filter(l => l.type === 'buy').length,
    mine:  listings.filter(l => l.ownerUid === user?.uid).length,
  };

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      {/* Ambient glows */}
      <div style={{ position:'fixed', top:-60, right:-60, width:460, height:460, borderRadius:'50%', background:'rgba(74,222,128,0.07)', filter:'blur(110px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-60, left:-60, width:380, height:380, borderRadius:'50%', background:'rgba(45,212,191,0.07)', filter:'blur(100px)', pointerEvents:'none', zIndex:0 }}/>

      {/* Nav */}
      <nav className="glass-nav">
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px', height:62, display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={onBack} className="btn-back"><ArrowLeft size={15}/> Home</button>
          <span style={{ fontSize:20 }}>🤝</span>
          <span className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Marketplace</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
            {user ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', borderRadius:9 }}>
                {user.photoURL && <img src={user.photoURL} alt="" style={{ width:24, height:24, borderRadius:'50%' }}/>}
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', lineHeight:1.2 }}>{user.displayName||'You'}</p>
                  <p style={{ fontSize:10, color:'var(--text-muted)' }}>{stats.mine} listing{stats.mine!==1?'s':''}</p>
                </div>
              </div>
            ) : (
              <button onClick={onLogin} className="mkt-btn-ghost">
                <LogIn size={13}/> Sign in to Post
              </button>
            )}
            {user && (
              <button onClick={() => setShowForm(true)} className="mkt-btn" style={{ padding:'10px 18px' }}>
                <Plus size={15}/> Post Listing
              </button>
            )}
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 28px 100px', position:'relative', zIndex:1 }}>

        {/* Hero */}
        <div className="mkt-s1" style={{ marginBottom:26 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 12px', borderRadius:99, background:'rgba(45,212,191,0.1)', border:'1px solid rgba(45,212,191,0.22)', marginBottom:10 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--teal)', display:'inline-block' }}/>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--teal)' }}>Farmers & Buyers — No Middlemen</span>
          </div>
          <h1 className="df" style={{ fontSize:'clamp(24px,4vw,38px)', fontWeight:700, color:'var(--text-primary)', lineHeight:1.15, letterSpacing:'-0.02em' }}>
            Direct <span style={{ color:'var(--neon-sage)', fontStyle:'italic' }}>Farm-to-Buyer</span> Trade
          </h1>
        </div>

        {/* Stats */}
        <div className="mkt-s2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12, marginBottom:24 }}>
          {[
            { label:'Total Listings', value:stats.total, color:'#4ade80',  icon:<Users size={17}/> },
            { label:'Selling',        value:stats.sell,  color:'#4ade80',  icon:<Leaf size={17}/> },
            { label:'Buying',         value:stats.buy,   color:'#60a5fa',  icon:<ShoppingBag size={17}/> },
            { label:'My Listings',    value:stats.mine,  color:'#fbbf24',  icon:<Package size={17}/> },
          ].map(s => (
            <div key={s.label} className="mkt-stat">
              <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, border:`1px solid ${s.color}28`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>{s.icon}</div>
              <div>
                <p className="df" style={{ fontSize:22, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</p>
                <p style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:3 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Match Finder */}
        <div className="mkt-s3">
          <MatchFinder onSearch={setMatchNeed}/>
        </div>

        {/* Filters */}
        <div className="mkt-s3" style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', gap:5, background:'rgba(10,22,14,0.7)', border:'1px solid var(--glass-border)', borderRadius:11, padding:4 }}>
            {[{k:'all',l:'All'},{k:'sell',l:'🌾 Selling'},{k:'buy',l:'🛒 Buying'}].map(({k,l})=>(
              <button key={k} className={`mkt-tab ${tab===k?'mkt-tab-active':'mkt-tab-inactive'}`} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
          <div className="mkt-search-wrap" style={{ flex:1, minWidth:180 }}>
            <Search size={13}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search crop, state, name…" className="mkt-input"/>
          </div>
          <button onClick={load} style={{ padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.2s' }}>
            <RefreshCw size={14}/>
          </button>
        </div>

        {/* Guest prompt */}
        {!user && <LoginPrompt onLogin={onLogin}/>}

        {/* Listings */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid var(--glass-border)', borderTop:'3px solid var(--neon-sage)', animation:'m-spin 0.9s linear infinite', margin:'0 auto 16px' }}/>
            <p style={{ fontSize:14, color:'var(--text-secondary)' }}>Loading listings…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>🌾</div>
            <h3 className="df" style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>No listings yet</h3>
            <p style={{ fontSize:13.5, color:'var(--text-secondary)', marginBottom:20 }}>Be the first to post!</p>
            {user
              ? <button onClick={()=>setShowForm(true)} className="mkt-btn" style={{ padding:'12px 26px' }}><Plus size={15}/> Post Listing</button>
              : <button onClick={onLogin} className="mkt-btn" style={{ padding:'12px 26px' }}><LogIn size={14}/> Sign in to Post</button>
            }
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {displayed.map(listing => (
              <ListingCard key={listing.id} listing={listing} matchNeed={matchNeed}
                currentUid={user?.uid} onDelete={handleDelete} onWhatsApp={handleWhatsApp}/>
            ))}
          </div>
        )}
      </div>

      {/* Post Form Modal */}
      {showForm && user && (
        <PostForm user={user} onClose={()=>setShowForm(false)} onSubmit={handlePost} posting={posting}/>
      )}

      {/* Toast */}
      {toast && (
        <div className="mkt-toast">
          <CheckCircle size={15}/> {toast}
        </div>
      )}
    </div>
  );
}