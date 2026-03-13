import React, { useState, useEffect } from 'react';
import {
  Users, Plus, X, Package, MapPin, Clock, CheckCircle,
  ArrowLeft, Zap, TrendingDown, ShoppingCart, Phone,
  AlertCircle, Loader, ChevronRight, Crown, UserPlus,
  Wheat, FlaskConical, Leaf, Droplets, RefreshCw, Shield
} from 'lucide-react';

/* ─── Inject styles (matches KrushiConnect design system) ────────────────────── */
const _coopStyle = document.createElement('style');
_coopStyle.textContent = `
  .coop-card {
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  }
  .coop-card:hover { border-color: var(--glass-border-h); }

  .coop-progress-track {
    height: 10px;
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
    overflow: hidden;
    position: relative;
  }
  .coop-progress-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 1.2s cubic-bezier(0.22,1,0.36,1);
    position: relative;
  }
  .coop-progress-fill::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 20px; height: 100%;
    background: rgba(255,255,255,0.35);
    border-radius: 99px;
    filter: blur(4px);
  }

  .coop-input {
    background: rgba(10,22,14,0.85);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    padding: 12px 16px;
    width: 100%;
    outline: none;
    transition: all 0.25s ease;
    appearance: none;
  }
  .coop-input:focus { border-color: var(--neon-sage); box-shadow: 0 0 0 3px rgba(74,222,128,0.18); }
  .coop-input option { background: #0d1f10; }

  .coop-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .coop-btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 22px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase; color: var(--bg-deep);
    background: var(--neon-sage); border: none; border-radius: 0.75rem; cursor: pointer;
    box-shadow: 0 0 18px rgba(74,222,128,0.32); transition: all 0.22s ease;
  }
  .coop-btn-primary:hover:not(:disabled) { background: #62ef94; box-shadow: 0 0 28px rgba(74,222,128,0.55); transform: translateY(-1px); }
  .coop-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .coop-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 18px; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary);
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10);
    border-radius: 0.75rem; cursor: pointer; transition: all 0.2s ease;
  }
  .coop-btn-ghost:hover { background: rgba(255,255,255,0.08); color: var(--text-primary); }

  .coop-badge-teal   { display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--teal);background:rgba(45,212,191,0.10);border:1px solid rgba(45,212,191,0.22); }
  .coop-badge-amber  { display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--amber);background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.22); }
  .coop-badge-sage   { display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--neon-sage);background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.22); }
  .coop-badge-purple { display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--purple);background:rgba(167,139,250,0.10);border:1px solid rgba(167,139,250,0.22); }

  .coop-member-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px;
    background: rgba(10,22,14,0.6);
    border: 1px solid var(--glass-border);
    transition: border-color 0.2s;
  }
  .coop-member-row:hover { border-color: var(--glass-border-h); }

  .coop-stat-box {
    padding: 18px 20px;
    background: rgba(10,22,14,0.7);
    border: 1px solid var(--glass-border);
    border-radius: 1rem;
  }

  @keyframes coop-ripple { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(2);opacity:0} }
  .coop-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--neon-sage); position: relative; display: inline-block;
  }
  .coop-live-dot::after {
    content: ''; position: absolute; inset: 0; border-radius: 50%;
    background: var(--neon-sage); animation: coop-ripple 1.4s ease-out infinite;
  }

  .coop-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .coop-modal {
    background: rgba(12,26,16,0.98);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    width: 100%; max-width: 520px;
    max-height: 90vh; overflow-y: auto;
  }

  .coop-tab-active   { background: rgba(74,222,128,0.15); color: var(--neon-sage); border-color: rgba(74,222,128,0.35) !important; }
  .coop-tab-inactive { background: transparent; color: var(--text-secondary); }

  .coop-status-open     { color: var(--neon-sage); }
  .coop-status-filling  { color: var(--amber); }
  .coop-status-ready    { color: var(--teal); }
  .coop-status-closed   { color: var(--text-muted); }

  .coop-shine {
    position: relative; overflow: hidden;
  }
  .coop-shine::before {
    content: ''; position: absolute; top: 0; left: -100%;
    width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    animation: coop-shine 3s ease-in-out infinite;
  }
  @keyframes coop-shine { 0%,100%{left:-100%} 50%{left:150%} }
`;
if (!document.getElementById('coop-styles')) {
  _coopStyle.id = 'coop-styles';
  document.head.appendChild(_coopStyle);
}

/* ─── Firebase / Storage helpers ─────────────────────────────────────────────── */
let _db = null;
async function getDb() {
  if (_db) return _db;
  try {
    const { getApp }     = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, addDoc, getDocs, updateDoc,
            doc, query, orderBy, arrayUnion, serverTimestamp, getDoc }
      = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    _db = { fs: getFirestore(getApp()), collection, addDoc, getDocs, updateDoc,
            doc, query, orderBy, arrayUnion, serverTimestamp, getDoc };
    return _db;
  } catch { return null; }
}

const LS_COOP = 'krushi_coop_v1';
const lsLoad  = () => { try { return JSON.parse(localStorage.getItem(LS_COOP) || '[]'); } catch { return []; } };
const lsSave  = (d) => localStorage.setItem(LS_COOP, JSON.stringify(d));

async function fetchGroups() {
  const db = await getDb();
  if (db) {
    const q    = db.query(db.collection(db.fs, 'coop_groups'), db.orderBy('createdAt', 'desc'));
    const snap = await db.getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString() }));
  }
  return lsLoad();
}

async function createGroup(data) {
  const db = await getDb();
  if (db) {
    const ref = await db.addDoc(db.collection(db.fs, 'coop_groups'), { ...data, createdAt: db.serverTimestamp() });
    return { id: ref.id, ...data, createdAt: new Date().toISOString() };
  }
  const items = lsLoad();
  const item  = { id: `coop_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
  lsSave([item, ...items]);
  return item;
}

async function joinGroup(groupId, memberData) {
  // Strip internal newTotal field before storing
  const { newTotal, ...memberRecord } = memberData;
  const db = await getDb();
  if (db) {
    const { increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    await db.updateDoc(db.doc(db.fs, 'coop_groups', groupId), {
      members:    db.arrayUnion(memberRecord),
      currentQty: increment(memberRecord.qty),
    });
    return;
  }
  // localStorage fallback
  const items = lsLoad();
  const idx   = items.findIndex(i => i.id === groupId);
  if (idx === -1) throw new Error('Group not found');
  items[idx].members    = [...(items[idx].members || []), memberRecord];
  items[idx].currentQty = (items[idx].currentQty || 0) + memberRecord.qty;
  if (items[idx].currentQty >= items[idx].targetQty) items[idx].status = 'ready';
  lsSave(items);
}

/* ─── Constants ──────────────────────────────────────────────────────────────── */
const INPUTS = [
  { label: 'Urea',           icon: <FlaskConical size={16}/>, color: '#4ade80', unit: 'Bags (50 kg)' },
  { label: 'DAP',            icon: <FlaskConical size={16}/>, color: '#2dd4bf', unit: 'Bags (50 kg)' },
  { label: 'NPK Mix',        icon: <FlaskConical size={16}/>, color: '#a78bfa', unit: 'Bags (50 kg)' },
  { label: 'Seeds – Wheat',  icon: <Wheat size={16}/>,        color: '#fbbf24', unit: 'Bags (30 kg)' },
  { label: 'Seeds – Rice',   icon: <Wheat size={16}/>,        color: '#fb923c', unit: 'Bags (25 kg)' },
  { label: 'Seeds – Maize',  icon: <Wheat size={16}/>,        color: '#f472b6', unit: 'Bags (20 kg)' },
  { label: 'Pesticide',      icon: <Droplets size={16}/>,     color: '#f87171', unit: 'Litres' },
  { label: 'Organic Manure', icon: <Leaf size={16}/>,         color: '#86efac', unit: 'Bags (40 kg)' },
];
const STATES = ['Gujarat','Maharashtra','Punjab','UP','Bihar','Rajasthan','MP','Haryana','Karnataka','Andhra Pradesh'];
const SAVINGS_EST = { 'Urea':15, 'DAP':18, 'NPK Mix':20, 'Seeds – Wheat':12, 'Seeds – Rice':14, 'Seeds – Maize':13, 'Pesticide':22, 'Organic Manure':10 };

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function getStatusInfo(group) {
  const pct = Math.min(100, Math.round((group.currentQty / group.targetQty) * 100));
  if (group.status === 'ready' || pct >= 100)
    return { label: 'Target Reached!', color: '#2dd4bf', cls: 'coop-status-ready', pct: 100, glow: 'rgba(45,212,191,0.3)' };
  if (pct >= 60)
    return { label: 'Filling Fast',    color: '#fbbf24', cls: 'coop-status-filling', pct, glow: 'rgba(251,191,36,0.25)' };
  return { label: 'Open',             color: '#4ade80', cls: 'coop-status-open',    pct, glow: 'rgba(74,222,128,0.2)' };
}

function daysLeft(deadline) {
  const diff = new Date(deadline) - Date.now();
  const d    = Math.ceil(diff / 86400000);
  return d > 0 ? d : 0;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

/* ─── Create Group Modal ─────────────────────────────────────────────────────── */
function CreateGroupModal({ user, onClose, onCreated }) {
  const [form, setForm] = useState({
    inputType:   'Urea',
    targetQty:   500,
    pricePerUnit:1200,
    state:       'Gujarat',
    deadline:    '',
    description: '',
    phone:       '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputInfo = INPUTS.find(i => i.label === form.inputType) || INPUTS[0];
  const savingsPct = SAVINGS_EST[form.inputType] || 15;
  const totalValue = form.targetQty * form.pricePerUnit;
  const savings    = Math.round(totalValue * savingsPct / 100);

  const validate = () => {
    if (!form.phone.match(/^\d{10}$/)) return 'Enter a valid 10-digit WhatsApp number.';
    if (!form.targetQty || form.targetQty < 10) return 'Minimum target is 10 units.';
    if (!form.pricePerUnit || form.pricePerUnit < 1) return 'Enter expected retail price per unit.';
    if (!form.deadline) return 'Set a deadline for the group buy.';
    if (new Date(form.deadline) <= new Date()) return 'Deadline must be in the future.';
    return null;
  };

  const handleCreate = async () => {
    const e = validate(); if (e) { setErr(e); return; }
    setLoading(true); setErr('');
    try {
      const group = await createGroup({
        inputType:    form.inputType,
        targetQty:    parseInt(form.targetQty),
        currentQty:   0,
        pricePerUnit: parseFloat(form.pricePerUnit),
        state:        form.state,
        deadline:     form.deadline,
        description:  form.description,
        status:       'open',
        members:      [],
        creatorUid:   user.uid,
        creatorName:  user.displayName || 'Farmer',
        creatorPhone: form.phone,
        creatorPhoto: user.photoURL || null,
      });
      onCreated(group);
      onClose();
    } catch { setErr('Could not create group. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="coop-modal-overlay">
      <div className="coop-modal">
        {/* Header */}
        <div style={{ padding:'28px 28px 20px', borderBottom:'1px solid var(--glass-border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <h2 className="df" style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>Start a Group Buy</h2>
            <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Pool with farmers in your state for wholesale pricing</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--glass-border)', borderRadius:10, padding:'8px', cursor:'pointer', color:'var(--text-secondary)', display:'flex' }}><X size={16}/></button>
        </div>

        <div style={{ padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* Input type */}
          <div>
            <label className="coop-label">Input / Product</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {INPUTS.map(inp => (
                <button key={inp.label} onClick={() => set('inputType', inp.label)}
                  style={{ padding:'10px 6px', borderRadius:10, border:`1px solid ${form.inputType===inp.label ? inp.color+'60' : 'var(--glass-border)'}`, background: form.inputType===inp.label ? `${inp.color}15` : 'rgba(10,22,14,0.6)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, transition:'all 0.18s' }}>
                  <span style={{ color: inp.color }}>{inp.icon}</span>
                  <span style={{ fontSize:10, fontWeight:700, color: form.inputType===inp.label ? inp.color : 'var(--text-secondary)', textAlign:'center', lineHeight:1.3 }}>{inp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row: qty + price */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="coop-label">Target Quantity ({inputInfo.unit})</label>
              <input type="number" className="coop-input" value={form.targetQty} onChange={e=>set('targetQty', e.target.value)} min="10" placeholder="500"/>
            </div>
            <div>
              <label className="coop-label">Retail Price / Unit (₹)</label>
              <input type="number" className="coop-input" value={form.pricePerUnit} onChange={e=>set('pricePerUnit', e.target.value)} placeholder="1200"/>
            </div>
          </div>

          {/* Savings preview */}
          <div style={{ padding:'14px 18px', background:`rgba(74,222,128,0.06)`, border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:3 }}>Estimated Group Savings</p>
              <p className="df" style={{ fontSize:22, fontWeight:700, color:'var(--neon-sage)' }}>₹{savings.toLocaleString('en-IN')}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:11, color:'var(--text-secondary)' }}>~{savingsPct}% off retail</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Total order: ₹{totalValue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Row: state + deadline */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="coop-label">State</label>
              <select className="coop-input" value={form.state} onChange={e=>set('state', e.target.value)}
                style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 }}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="coop-label">Deadline</label>
              <input type="date" className="coop-input" value={form.deadline} onChange={e=>set('deadline', e.target.value)}
                min={new Date().toISOString().split('T')[0]}/>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="coop-label">Your WhatsApp Number</label>
            <input type="tel" className="coop-input" value={form.phone} onChange={e=>set('phone', e.target.value)} placeholder="9876543210" maxLength={10}/>
          </div>

          {/* Notes */}
          <div>
            <label className="coop-label">Notes (optional)</label>
            <textarea className="coop-input" rows={2} value={form.description} onChange={e=>set('description', e.target.value)}
              placeholder="Preferred brand, quality requirements, delivery location…" style={{ resize:'none', lineHeight:1.6 }}/>
          </div>

          {err && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:10 }}>
              <AlertCircle size={15} style={{ color:'var(--red-alert)', flexShrink:0 }}/>
              <span style={{ fontSize:12.5, color:'var(--red-alert)' }}>{err}</span>
            </div>
          )}

          <button onClick={handleCreate} disabled={loading} className="coop-btn-primary" style={{ width:'100%', padding:'15px' }}>
            {loading ? <><Loader size={16} style={{ animation:'m-spin 0.85s linear infinite' }}/> Creating…</> : <><Zap size={16}/> Launch Group Buy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Join Modal ──────────────────────────────────────────────────────────────── */
function JoinModal({ group, user, onClose, onJoined }) {
  const [qty,   setQty]   = useState(10);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');

  const inputInfo = INPUTS.find(i => i.label === group.inputType) || INPUTS[0];
  const remaining = group.targetQty - group.currentQty;
  const myContrib = Math.min(qty, remaining);
  const myCost    = myContrib * group.pricePerUnit;
  const savPct    = SAVINGS_EST[group.inputType] || 15;
  const mySaving  = Math.round(myCost * savPct / 100);
  const alreadyJoined = group.members?.some(m => m.uid === user?.uid);

  const handleJoin = async () => {
    if (!phone.match(/^\d{10}$/)) { setErr('Enter a valid 10-digit WhatsApp number.'); return; }
    if (qty < 1) { setErr('Quantity must be at least 1.'); return; }
    setLoading(true); setErr('');
    try {
      const member = {
        uid:      user.uid,
        name:     user.displayName || 'Farmer',
        photo:    user.photoURL || null,
        phone,
        qty:      myContrib,
        joinedAt: new Date().toISOString(),
        newTotal: group.currentQty + myContrib,  // used locally only, stripped in joinGroup
      };
      await joinGroup(group.id, member);
      onJoined(group.id, member, group.currentQty + myContrib);
      onClose();
    } catch(e) { setErr('Could not join. Please try again.'); console.error(e); }
    setLoading(false);
  };

  return (
    <div className="coop-modal-overlay">
      <div className="coop-modal" style={{ maxWidth:440 }}>
        <div style={{ padding:'24px 24px 18px', borderBottom:'1px solid var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <h2 className="df" style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>Join Group Buy</h2>
            <p style={{ fontSize:12.5, color:'var(--text-secondary)' }}>{group.inputType} · {group.state}</p>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid var(--glass-border)', borderRadius:10, padding:'7px', cursor:'pointer', color:'var(--text-secondary)', display:'flex' }}><X size={15}/></button>
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {alreadyJoined && (
            <div style={{ padding:'12px 16px', background:'rgba(45,212,191,0.08)', border:'1px solid rgba(45,212,191,0.25)', borderRadius:10, fontSize:12.5, color:'var(--teal)', display:'flex', gap:8, alignItems:'center' }}>
              <CheckCircle size={14}/> You've already joined this group buy.
            </div>
          )}

          {/* Group summary */}
          <div style={{ padding:'14px 16px', background:'rgba(10,22,14,0.7)', border:'1px solid var(--glass-border)', borderRadius:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Progress</span>
              <span style={{ fontSize:12, color:'var(--neon-sage)', fontWeight:700 }}>{group.currentQty} / {group.targetQty} {inputInfo.unit}</span>
            </div>
            <div className="coop-progress-track">
              <div className="coop-progress-fill" style={{ width:`${Math.min(100,(group.currentQty/group.targetQty)*100)}%`, background:'linear-gradient(90deg,#4ade8088,#4ade80)' }}/>
            </div>
            <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>{remaining} units still needed • {daysLeft(group.deadline)} days left</p>
          </div>

          {/* Qty selector */}
          <div>
            <label className="coop-label">How many {inputInfo.unit} do you need?</label>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 10))}
                style={{ width:38, height:38, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', color:'var(--text-primary)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <input type="number" className="coop-input" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value)||1))} style={{ textAlign:'center', fontWeight:700, fontSize:16 }} min={1} max={remaining}/>
              <button onClick={() => setQty(q => Math.min(remaining, q + 10))}
                style={{ width:38, height:38, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid var(--glass-border)', color:'var(--text-primary)', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={{ padding:'14px 16px', background:'rgba(74,222,128,0.05)', border:'1px solid rgba(74,222,128,0.18)', borderRadius:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{myContrib} × ₹{group.pricePerUnit.toLocaleString('en-IN')} retail</span>
              <span style={{ fontSize:12, color:'var(--text-muted)', textDecoration:'line-through' }}>₹{myCost.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'var(--neon-sage)' }}>Your estimated savings</span>
              <span style={{ fontSize:15, fontWeight:700, color:'var(--neon-sage)' }}>~₹{mySaving.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="coop-label">Your WhatsApp Number</label>
            <input type="tel" className="coop-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10}/>
          </div>

          {err && (
            <div style={{ display:'flex', gap:9, padding:'11px 14px', background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:9 }}>
              <AlertCircle size={14} style={{ color:'var(--red-alert)', flexShrink:0, marginTop:1 }}/>
              <span style={{ fontSize:12, color:'var(--red-alert)' }}>{err}</span>
            </div>
          )}

          <button onClick={handleJoin} disabled={loading || alreadyJoined} className="coop-btn-primary" style={{ width:'100%', padding:'14px' }}>
            {loading ? <><Loader size={15} style={{ animation:'m-spin 0.85s linear infinite' }}/> Joining…</> : <><UserPlus size={15}/> Join Group Buy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Group Card ─────────────────────────────────────────────────────────────── */
function GroupCard({ group, currentUser, onJoin, onWhatsApp }) {
  const st        = getStatusInfo(group);
  const inputInfo = INPUTS.find(i => i.label === group.inputType) || INPUTS[0];
  const isCreator = group.creatorUid === currentUser?.uid;
  const hasJoined = group.members?.some(m => m.uid === currentUser?.uid);
  const days      = daysLeft(group.deadline);

  const handleWhatsApp = () => {
    const allMembers = [
      { name: group.creatorName, phone: group.creatorPhone },
      ...(group.members || []).map(m => ({ name: m.name, phone: m.phone })),
    ];
    const msg = encodeURIComponent(
      `🌾 KrushiConnect Group Buy — ${group.inputType}\n\n` +
      `State: ${group.state}\n` +
      `Target: ${group.targetQty} ${inputInfo.unit}\n` +
      `Filled: ${group.currentQty} / ${group.targetQty} (${st.pct}%)\n` +
      `Price / unit: ₹${group.pricePerUnit}\n\n` +
      `Members (${(group.members?.length || 0) + 1}):\n` +
      allMembers.map(m => `  • ${m.name}: +91${m.phone}`).join('\n') + '\n\n' +
      `Please contact supplier now!`
    );
    window.open(`https://wa.me/91${group.creatorPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="coop-card coop-shine" style={{ padding:24, position:'relative', overflow:'hidden' }}>
      {/* Glow accent */}
      <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:st.glow, filter:'blur(40px)', pointerEvents:'none' }}/>

      {/* Top row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:`${inputInfo.color}18`, border:`1px solid ${inputInfo.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:inputInfo.color }}>
            {inputInfo.icon}
          </div>
          <div>
            <h3 className="df" style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', marginBottom:2 }}>{group.inputType}</h3>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <MapPin size={11} style={{ color:'var(--text-muted)' }}/>
              <span style={{ fontSize:11.5, color:'var(--text-secondary)' }}>{group.state}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          {st.pct >= 100
            ? <span className="coop-badge-teal"><CheckCircle size={9}/> Target Reached</span>
            : st.pct >= 60
            ? <span className="coop-badge-amber"><Zap size={9}/> Filling Fast</span>
            : <span className="coop-badge-sage"><span className="coop-live-dot" style={{ width:6, height:6 }}/> Open</span>
          }
          {isCreator && <span className="coop-badge-purple"><Crown size={9}/> Organizer</span>}
          {hasJoined && !isCreator && <span className="coop-badge-teal"><CheckCircle size={9}/> Joined</span>}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-secondary)' }}>Group Progress</span>
          <span style={{ fontSize:14, fontWeight:700, color:st.color }}>{group.currentQty} / {group.targetQty}</span>
        </div>
        <div className="coop-progress-track">
          <div className="coop-progress-fill" style={{ width:`${st.pct}%`, background:`linear-gradient(90deg,${st.color}70,${st.color})` }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
          <span style={{ fontSize:10.5, color:'var(--text-muted)' }}>{inputInfo.unit}</span>
          <span style={{ fontSize:10.5, color:st.color, fontWeight:600 }}>{st.pct}% filled</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[
          { label:'₹ / Unit',    value:`₹${group.pricePerUnit.toLocaleString('en-IN')}`, color:'var(--neon-sage)' },
          { label:'Members',     value:(group.members?.length||0)+1,                     color:'var(--teal)' },
          { label:'Days Left',   value:days > 0 ? days : 'Ended',                        color: days>0 ? 'var(--amber)' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="coop-stat-box" style={{ textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:700, color:s.color, fontFamily:'Fraunces,serif' }}>{s.value}</p>
            <p style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:2 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Members avatars */}
      {group.members?.length > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ display:'flex' }}>
            {[{ name:group.creatorName, photo:group.creatorPhoto }, ...(group.members||[])].slice(0,5).map((m,i) => (
              <div key={i} title={m.name} style={{ width:26, height:26, borderRadius:'50%', border:'2px solid var(--glass-base)', marginLeft: i>0 ? -8 : 0, background: m.photo ? 'transparent' : 'rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--neon-sage)', fontWeight:700, overflow:'hidden', zIndex:5-i }}>
                {m.photo ? <img src={m.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : m.name?.[0]?.toUpperCase()}
              </div>
            ))}
            {(group.members?.length||0) > 4 && (
              <div style={{ width:26, height:26, borderRadius:'50%', border:'2px solid var(--glass-base)', marginLeft:-8, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'var(--text-secondary)', fontWeight:700 }}>
                +{(group.members?.length||0) - 4}
              </div>
            )}
          </div>
          <span style={{ fontSize:11.5, color:'var(--text-secondary)' }}>
            {group.creatorName} + {group.members?.length} joined
          </span>
        </div>
      )}

      {/* Description */}
      {group.description && (
        <p style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', marginBottom:14, lineHeight:1.6 }}>"{group.description}"</p>
      )}

      {/* Action footer */}
      <div style={{ display:'flex', gap:10, borderTop:'1px solid var(--glass-border)', paddingTop:14 }}>
        {st.pct >= 100 ? (
          <button onClick={handleWhatsApp}
            style={{ flex:1, padding:'11px', borderRadius:10, background:'linear-gradient(135deg,rgba(45,212,191,0.2),rgba(45,212,191,0.12))', border:'1px solid rgba(45,212,191,0.35)', color:'var(--teal)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            <Phone size={14}/> Contact Supplier Group
          </button>
        ) : (
          <>
            {!hasJoined && !isCreator && currentUser && days > 0 && (
              <button onClick={() => onJoin(group)} className="coop-btn-primary" style={{ flex:1, padding:'11px 0' }}>
                <UserPlus size={14}/> Join & Save ~{SAVINGS_EST[group.inputType]}%
              </button>
            )}
            {(hasJoined || isCreator) && days > 0 && (
              <button onClick={handleWhatsApp}
                style={{ flex:1, padding:'11px', borderRadius:10, background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.2)', color:'var(--neon-sage)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                <Phone size={14}/> WhatsApp Group
              </button>
            )}
            {!currentUser && (
              <div style={{ flex:1, padding:'11px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--glass-border)', color:'var(--text-muted)', fontFamily:'DM Sans,sans-serif', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <Shield size={13}/> Login to Join
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Stats Banner ───────────────────────────────────────────────────────────── */
function StatsBanner({ groups, user }) {
  const total    = groups.length;
  const open     = groups.filter(g => g.status !== 'closed' && getStatusInfo(g).pct < 100).length;
  const ready    = groups.filter(g => getStatusInfo(g).pct >= 100).length;
  const myGroups = groups.filter(g => g.creatorUid === user?.uid || g.members?.some(m => m.uid === user?.uid)).length;
  const totalSaved = groups.filter(g => getStatusInfo(g).pct >= 100).reduce((acc, g) => {
    const pct = SAVINGS_EST[g.inputType] || 15;
    return acc + Math.round(g.currentQty * g.pricePerUnit * pct / 100);
  }, 0);

  const stats = [
    { label:'Active Groups',   value:open,                                      color:'#4ade80', icon:<Users size={18}/> },
    { label:'Targets Reached', value:ready,                                     color:'#2dd4bf', icon:<CheckCircle size={18}/> },
    { label:'My Groups',       value:myGroups,                                  color:'#a78bfa', icon:<Crown size={18}/> },
    { label:'Total Savings',   value:`₹${(totalSaved/1000).toFixed(0)}K`,      color:'#fbbf24', icon:<TrendingDown size={18}/> },
  ];

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:28 }}>
      {stats.map(s => (
        <div key={s.label} className="coop-card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color, flexShrink:0 }}>
            {s.icon}
          </div>
          <div>
            <p style={{ fontSize:20, fontWeight:700, color:s.color, fontFamily:'Fraunces,serif', lineHeight:1 }}>{s.value}</p>
            <p style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginTop:3 }}>{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function CoopGroupBuying({ onBack, user, onLogin }) {
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [joinTarget,  setJoinTarget]  = useState(null);
  const [filterState, setFilterState] = useState('All');
  const [filterInput, setFilterInput] = useState('All');
  const [filterTab,   setFilterTab]   = useState('open');  // open | ready | mine
  const [toast,       setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = async () => {
    setLoading(true);
    try { setGroups(await fetchGroups()); } catch { setGroups([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleCreated = (group) => {
    setGroups(g => [group, ...g]);
    showToast('✅ Group buy created! Share with farmers in your state.');
  };

  const handleJoined = (groupId, member, newTotal) => {
    setGroups(gs => {
      const updated = gs.map(g => g.id === groupId
        ? { ...g, members:[...(g.members||[]), member], currentQty:newTotal, status: newTotal>=g.targetQty ? 'ready' : g.status }
        : g
      );
      const joinedGroup = gs.find(g => g.id === groupId);
      const savPct = SAVINGS_EST[joinedGroup?.inputType] || 15;
      const saving = Math.round(member.qty * (joinedGroup?.pricePerUnit || 0) * savPct / 100);
      showToast(`🎉 Joined! You save ~₹${saving.toLocaleString('en-IN')} with bulk pricing.`);
      return updated;
    });
  };

  const displayed = groups
    .filter(g => filterState === 'All' || g.state === filterState)
    .filter(g => filterInput === 'All' || g.inputType === filterInput)
    .filter(g => {
      if (filterTab === 'open')  return getStatusInfo(g).pct < 100 && daysLeft(g.deadline) > 0;
      if (filterTab === 'ready') return getStatusInfo(g).pct >= 100;
      if (filterTab === 'mine')  return g.creatorUid === user?.uid || g.members?.some(m => m.uid === user?.uid);
      return true;
    });

  const CHEV = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`;

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1 }}>
      {/* Ambient glows */}
      <div style={{ position:'fixed', top:-80, right:-80, width:500, height:500, borderRadius:'50%', background:'rgba(45,212,191,0.07)', filter:'blur(120px)', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:-80, left:-80, width:400, height:400, borderRadius:'50%', background:'rgba(74,222,128,0.07)', filter:'blur(100px)', pointerEvents:'none', zIndex:0 }}/>

      {/* Nav */}
      <nav className="glass-nav">
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 28px', height:62, display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} className="btn-back"><ArrowLeft size={15}/> Home</button>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>🤝</span>
            <span className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)' }}>Farmer Co-op Group Buying</span>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span className="coop-live-dot"/>
            <span style={{ fontSize:11, color:'var(--text-secondary)', fontWeight:600 }}>Live</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 28px 100px', position:'relative', zIndex:1 }}>

        {/* Hero section */}
        <div className="s1" style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16, marginBottom:12 }}>
            <div>
              <div className="coop-badge-teal" style={{ marginBottom:12, display:'inline-flex' }}>
                <TrendingDown size={11}/> Up to 22% off retail with group buying
              </div>
              <h1 className="df" style={{ fontSize:'clamp(26px,4vw,42px)', fontWeight:700, color:'var(--text-primary)', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:8 }}>
                Pool together.<br/>
                <span style={{ color:'var(--teal)', fontStyle:'italic' }}>Pay wholesale.</span>
              </h1>
              <p style={{ fontSize:14, color:'var(--text-secondary)', maxWidth:480, lineHeight:1.7 }}>
                Farmers in the same state organise bulk orders for seeds, fertilizers and pesticides — once the group hits the minimum quantity, everyone contacts the supplier together.
              </p>
            </div>
            {user ? (
              <button onClick={() => setShowCreate(true)} className="coop-btn-primary" style={{ padding:'14px 24px', whiteSpace:'nowrap' }}>
                <Plus size={16}/> Start a Group Buy
              </button>
            ) : (
              <button onClick={onLogin} className="coop-btn-primary" style={{ padding:'14px 24px' }}>
                <Shield size={16}/> Login to Organise
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <StatsBanner groups={groups} user={user}/>

        {/* Filters */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:24, alignItems:'center' }}>
          {/* Tab filter */}
          <div style={{ display:'flex', background:'rgba(10,22,14,0.7)', border:'1px solid var(--glass-border)', borderRadius:11, padding:4, gap:2 }}>
            {[{ k:'open', l:'🟢 Open' }, { k:'ready', l:'✅ Ready' }, { k:'mine', l:'👤 Mine' }].map(({ k, l }) => (
              <button key={k} onClick={() => setFilterTab(k)}
                style={{ padding:'7px 14px', borderRadius:8, border:`1px solid transparent`, fontFamily:'DM Sans,sans-serif', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.18s', letterSpacing:'0.06em', textTransform:'uppercase' }}
                className={filterTab === k ? 'coop-tab-active' : 'coop-tab-inactive'}>
                {l}
              </button>
            ))}
          </div>

          {/* State */}
          <select value={filterState} onChange={e => setFilterState(e.target.value)}
            className="coop-input"
            style={{ width:'auto', minWidth:130, backgroundImage:CHEV, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 }}>
            <option value="All">All States</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Input type */}
          <select value={filterInput} onChange={e => setFilterInput(e.target.value)}
            className="coop-input"
            style={{ width:'auto', minWidth:145, backgroundImage:CHEV, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 }}>
            <option value="All">All Products</option>
            {INPUTS.map(i => <option key={i.label}>{i.label}</option>)}
          </select>

          <button onClick={load} title="Refresh"
            style={{ padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.2s' }}>
            <RefreshCw size={14}/>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="a-fi" style={{ marginBottom:16, padding:'13px 18px', background:'rgba(74,222,128,0.08)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:11, fontSize:13, color:'var(--neon-sage)', fontWeight:600, display:'flex', gap:10, alignItems:'center' }}>
            <CheckCircle size={15}/>{toast}
          </div>
        )}

        {/* Guest prompt */}
        {!user && (
          <div className="coop-card" style={{ padding:28, textAlign:'center', marginBottom:24, borderStyle:'dashed' }}>
            <Shield size={28} style={{ color:'var(--teal)', marginBottom:10 }}/>
            <h3 className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>Login to Join or Create Groups</h3>
            <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>Browse is open to everyone — login with Google to participate.</p>
            <button onClick={onLogin} className="coop-btn-primary" style={{ padding:'12px 28px' }}>
              <Shield size={15}/> Sign in with Google
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid var(--glass-border)', borderTop:'3px solid var(--teal)', animation:'m-spin 0.9s linear infinite', margin:'0 auto 16px' }}/>
            <p style={{ fontSize:14, color:'var(--text-secondary)' }}>Loading group buys…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:56, marginBottom:16 }}>🤝</div>
            <h3 className="df" style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>No groups yet</h3>
            <p style={{ fontSize:13.5, color:'var(--text-secondary)', marginBottom:20 }}>
              {filterTab === 'mine' ? "You haven't joined or created any groups." : "Be the first to start a group buy in your area!"}
            </p>
            {user
              ? <button onClick={() => setShowCreate(true)} className="coop-btn-primary" style={{ padding:'13px 26px' }}><Plus size={15}/> Start First Group Buy</button>
              : <button onClick={onLogin} className="coop-btn-primary" style={{ padding:'13px 26px' }}><Shield size={15}/> Login to Start</button>
            }
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:18 }}>
            {displayed.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                currentUser={user}
                onJoin={setJoinTarget}
              />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="coop-card" style={{ marginTop:40, padding:32 }}>
          <h3 className="df" style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:20 }}>How Group Buying Works</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
            {[
              { step:'01', title:'Organiser Creates',  desc:'One farmer sets the product, target quantity, state, and deadline.', color:'#4ade80' },
              { step:'02', title:'Farmers Join',       desc:'Others in the same state add their required quantity to the pool.',   color:'#2dd4bf' },
              { step:'03', title:'Target Hit',         desc:'Once filled, the card turns teal and the WhatsApp button activates.', color:'#a78bfa' },
              { step:'04', title:'Contact Supplier',   desc:'All members are sent a WhatsApp message to negotiate bulk price.',    color:'#fbbf24' },
            ].map(s => (
              <div key={s.step} style={{ padding:'18px 20px', background:'rgba(10,22,14,0.6)', border:'1px solid var(--glass-border)', borderRadius:14 }}>
                <div style={{ fontSize:11, fontWeight:800, color:s.color, letterSpacing:'0.15em', marginBottom:8 }}>STEP {s.step}</div>
                <h4 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>{s.title}</h4>
                <p style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreate && user && (
        <CreateGroupModal user={user} onClose={() => setShowCreate(false)} onCreated={handleCreated}/>
      )}
      {joinTarget && user && (
        <JoinModal group={joinTarget} user={user} onClose={() => setJoinTarget(null)} onJoined={handleJoined}/>
      )}
    </div>
  );
}