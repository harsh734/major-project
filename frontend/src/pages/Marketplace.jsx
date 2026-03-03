import React, { useState, useEffect } from 'react';
import {
  Search, Plus, X, Leaf, ShoppingBag, MapPin, Calendar,
  IndianRupee, Package, MessageCircle, Sparkles, CheckCircle,
  Clock, Users, RefreshCw, LogIn, Shield, Trash2
} from 'lucide-react';

// ─── Firebase / Storage ───────────────────────────────────────────────────────
let _db = null;

async function getDb() {
  if (_db) return _db;
  try {
    const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const {
      getFirestore, collection, addDoc, getDocs,
      deleteDoc, doc, query, orderBy, where, serverTimestamp
    } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    _db = {
      fs: getFirestore(getApp()),
      collection, addDoc, getDocs, deleteDoc,
      doc, query, orderBy, where, serverTimestamp
    };
    return _db;
  } catch {
    return null; // fall back to localStorage
  }
}

const LS_KEY = 'krushi_mkt_v2';
const lsLoad = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } };
const lsSave = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

async function dbFetch() {
  const db = await getDb();
  if (db) {
    const q    = db.query(db.collection(db.fs, 'marketplace_listings'), db.orderBy('createdAt', 'desc'));
    const snap = await db.getDocs(q);
    return snap.docs.map(d => ({
      id: d.id, ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }));
  }
  return lsLoad();
}

async function dbAdd(data) {
  const db = await getDb();
  if (db) {
    const ref = await db.addDoc(db.collection(db.fs, 'marketplace_listings'), {
      ...data, createdAt: db.serverTimestamp()
    });
    return { id: ref.id, ...data, createdAt: new Date().toISOString() };
  }
  const items = lsLoad();
  const item  = { id: `ls_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
  lsSave([item, ...items]);
  return item;
}

async function dbDelete(id, uid) {
  const db = await getDb();
  if (db) {
    // Firestore security rules will enforce ownership server-side too
    await db.deleteDoc(db.doc(db.fs, 'marketplace_listings', id));
    return;
  }
  // localStorage: verify uid client-side
  const items = lsLoad();
  const item  = items.find(i => i.id === id);
  if (item && item.ownerUid !== uid) throw new Error('Not your listing');
  lsSave(items.filter(i => i.id !== id));
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CROPS  = ['Wheat','Rice','Maize','Pulses','Sugarcane','Millet','Groundnut','Cotton','Soybean','Tomato','Onion','Potato'];
const STATES = ['Gujarat','Maharashtra','Punjab','UP','Bihar','Rajasthan','MP','Haryana','Karnataka','Andhra Pradesh'];
const UNITS  = ['Quintal','Ton','Kg','Bag'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── AI match score ───────────────────────────────────────────────────────────
function matchScore(listing, need) {
  if (!need) return 100;
  let s = 0;
  if (listing.crop?.toLowerCase() === need.crop?.toLowerCase()) s += 50;
  else if (listing.crop?.toLowerCase().includes(need.crop?.toLowerCase() || '')) s += 20;
  if (listing.state === need.state) s += 30;
  if (parseFloat(need.quantity) && parseFloat(listing.quantity) >= parseFloat(need.quantity)) s += 20;
  return Math.min(s, 100);
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────
function Badge({ children, color = 'green' }) {
  const map = {
    green:  'bg-green-100  text-green-800  border-green-200',
    blue:   'bg-blue-100   text-blue-800   border-blue-200',
    red:    'bg-red-100    text-red-800    border-red-200',
    amber:  'bg-amber-100  text-amber-800  border-amber-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${map[color]}`}>
      {children}
    </span>
  );
}

function MatchBar({ score }) {
  const col = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#9ca3af';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: col }} className="font-semibold">
          {score >= 80 ? '🎯 Great Match' : score >= 50 ? '👍 Good Match' : '🔍 Partial Match'}
        </span>
        <span style={{ color: col }} className="font-bold">{score}%</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div style={{ width: `${score}%`, background: col, transition: 'width 0.8s ease' }} className="h-full rounded-full" />
      </div>
    </div>
  );
}

// ─── "Login to post" banner ───────────────────────────────────────────────────
function LoginPrompt({ onLogin }) {
  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-dashed border-green-300 rounded-2xl p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Shield size={28} className="text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Login to Post a Listing</h3>
      <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">
        Sign in with Google to post your produce or requirements. Browsing is open to everyone.
      </p>
      <button
        onClick={onLogin}
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-colors"
      >
        <LogIn size={18} /> Sign in with Google
      </button>
    </div>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing, matchNeed, currentUid, onDelete, onWhatsApp }) {
  const isOwner = listing.ownerUid === currentUid;
  const daysAgo = Math.floor((Date.now() - new Date(listing.createdAt)) / 86400000);
  const score   = matchScore(listing, matchNeed);

  return (
    <div
      className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden"
      style={{ borderTop: `4px solid ${listing.type === 'sell' ? '#16a34a' : '#2563eb'}` }}
    >
      {/* Type label */}
      <div
        className="absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-xl"
        style={{ background: listing.type === 'sell' ? '#16a34a' : '#2563eb' }}
      >
        {listing.type === 'sell' ? '🌾 SELLING' : '🛒 BUYING'}
      </div>

      {/* "My listing" badge */}
      {isOwner && (
        <div className="absolute top-7 right-0 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
          ✏️ Mine
        </div>
      )}

      <div className="p-5">
        {/* Header row: avatar + name */}
        <div className="flex items-center gap-3 mb-3 pr-20">
          {listing.ownerPhoto ? (
            <img src={listing.ownerPhoto} alt="" className="w-10 h-10 rounded-full border-2 border-gray-100 flex-shrink-0" />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: listing.type === 'sell' ? '#dcfce7' : '#dbeafe' }}
            >
              {listing.type === 'sell' ? '🌾' : '🛒'}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-base truncate">{listing.crop}</h3>
            <p className="text-xs text-gray-500 truncate">{listing.ownerName || listing.name}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Package size={13} className="text-gray-400" />
            <span className="font-semibold">{listing.quantity} {listing.unit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <IndianRupee size={13} className="text-gray-400" />
            <span className="font-semibold">₹{listing.price}/{listing.unit}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400" />
            <span>{listing.state}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <span>{listing.harvestMonth}</span>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-xs text-gray-400 italic mb-3 line-clamp-2">"{listing.description}"</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.organic   && <Badge color="green"><Leaf size={10} /> Organic</Badge>}
          {listing.certified && <Badge color="blue"><CheckCircle size={10} /> Certified</Badge>}
          {listing.urgent    && <Badge color="red"><Clock size={10} /> Urgent</Badge>}
        </div>

        {/* Match bar */}
        {matchNeed && <MatchBar score={score} />}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
          <div className="flex gap-2">
            {/* Owner can delete */}
            {isOwner && (
              <button
                onClick={() => onDelete(listing.id)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
            <button
              onClick={() => onWhatsApp(listing)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              <MessageCircle size={13} /> WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Form (auto-filled from user) ───────────────────────────────────────
function PostForm({ user, onClose, onSubmit, posting }) {
  const [type, setType] = useState('sell');
  const [form, setForm] = useState({
    // Pre-fill from Google account
    name:         user?.displayName || '',
    phone:        user?.phoneNumber?.replace('+91','') || '',
    crop:         'Wheat',
    quantity:     '',
    unit:         'Quintal',
    price:        '',
    state:        'Gujarat',
    harvestMonth: 'Jan',
    description:  '',
    organic:      false,
    certified:    false,
    urgent:       false,
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                      e.name     = 'Name required';
    if (!form.phone.match(/^\d{10}$/))          e.phone    = '10-digit number required';
    if (!form.quantity || isNaN(form.quantity)) e.quantity = 'Valid quantity required';
    if (!form.price    || isNaN(form.price))    e.price    = 'Valid price required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...form,
      type,
      quantity: parseFloat(form.quantity),
      price:    parseFloat(form.price),
      // Store owner identity from Firebase Auth — tamper-proof
      ownerUid:   user.uid,
      ownerName:  user.displayName || form.name,
      ownerEmail: user.email,
      ownerPhoto: user.photoURL || null,
    });
  };

  const inputCls = (err) =>
    `w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-colors ${err ? 'border-red-400' : 'border-gray-200 focus:border-green-400'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-3xl z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Post a Listing</h2>
              {/* Show who is posting */}
              <div className="flex items-center gap-2 mt-1">
                {user.photoURL && <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />}
                <span className="text-xs text-gray-500">Posting as <strong>{user.displayName || user.email}</strong></span>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200">
              <X size={18} />
            </button>
          </div>

          {/* Sell / Buy toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[{ v:'sell', icon:'🌾', label:'I want to Sell' }, { v:'buy', icon:'🛒', label:'I want to Buy' }].map(({ v, icon, label }) => (
              <button
                key={v}
                onClick={() => setType(v)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  type === v
                    ? (v === 'sell' ? 'bg-green-600 text-white shadow' : 'bg-blue-600 text-white shadow')
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Your Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ramesh Patel" className={inputCls(errors.name)} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">WhatsApp No. *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" maxLength={10} className={inputCls(errors.phone)} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Crop + State */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Crop *</label>
              <select value={form.crop} onChange={e => set('crop', e.target.value)} className={inputCls()}>
                {CROPS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">State *</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} className={inputCls()}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Qty + Unit + Price */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Quantity *</label>
              <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="100" className={inputCls(errors.quantity)} />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inputCls()}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">₹ / Unit *</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="2500" className={inputCls(errors.price)} />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
          </div>

          {/* Available from */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Available / Needed From</label>
            <select value={form.harvestMonth} onChange={e => set('harvestMonth', e.target.value)} className={inputCls()}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Quality, packaging, delivery details…"
              rows={2} className="w-full px-3 py-2.5 border-2 border-gray-200 focus:border-green-400 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          {/* Toggle tags */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Tags</label>
            <div className="flex gap-4 flex-wrap">
              {[{ k:'organic', label:'🌿 Organic', on:'bg-green-500' }, { k:'certified', label:'✅ Certified', on:'bg-blue-500' }, { k:'urgent', label:'⚡ Urgent', on:'bg-red-500' }].map(({ k, label, on }) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => set(k, !form[k])} className={`w-10 h-5 rounded-full relative transition-colors ${form[k] ? on : 'bg-gray-200'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form[k] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit} disabled={posting}
            className="w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg transition-all active:scale-95 disabled:opacity-60"
            style={{ background: type === 'sell' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}
          >
            {posting ? '⏳ Posting…' : `📢 Post ${type === 'sell' ? 'Sell' : 'Buy'} Listing`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Match Finder bar ──────────────────────────────────────────────────────
function MatchFinder({ onSearch }) {
  const [need, setNeed]   = useState({ crop:'', state:'', quantity:'' });
  const [active, setActive] = useState(false);
  const apply = () => { onSearch(need.crop || need.state || need.quantity ? need : null); setActive(!!(need.crop || need.state)); };
  const clear = () => { setNeed({ crop:'', state:'', quantity:'' }); onSearch(null); setActive(false); };
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-amber-500" />
        <span className="text-sm font-bold text-gray-700">AI Match Finder</span>
        {active && <Badge color="amber">Active</Badge>}
      </div>
      <div className="flex flex-wrap gap-3">
        <select value={need.crop} onChange={e => setNeed(n=>({...n,crop:e.target.value}))} className="flex-1 min-w-32 px-3 py-2.5 border-2 border-gray-200 focus:border-amber-400 rounded-xl text-sm outline-none">
          <option value="">Any Crop</option>
          {CROPS.map(c=><option key={c}>{c}</option>)}
        </select>
        <select value={need.state} onChange={e => setNeed(n=>({...n,state:e.target.value}))} className="flex-1 min-w-32 px-3 py-2.5 border-2 border-gray-200 focus:border-amber-400 rounded-xl text-sm outline-none">
          <option value="">Any State</option>
          {STATES.map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="number" value={need.quantity} onChange={e=>setNeed(n=>({...n,quantity:e.target.value}))} placeholder="Min qty" className="w-24 px-3 py-2.5 border-2 border-gray-200 focus:border-amber-400 rounded-xl text-sm outline-none" />
        <button onClick={apply} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow transition-colors">
          <Sparkles size={14} /> Match
        </button>
        {active && <button onClick={clear} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"><X size={14}/></button>}
      </div>
      {active && <p className="text-xs text-amber-600 font-semibold mt-2">✨ Listings sorted by match score</p>}
    </div>
  );
}

// ─── Main Marketplace ─────────────────────────────────────────────────────────
export default function Marketplace({ onBack, user, onLogin }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [posting, setPosting]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [matchNeed, setMatchNeed] = useState(null);
  const [tab, setTab]           = useState('all');
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState('');

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

  // Filter + AI-sort
  const displayed = listings
    .filter(l => {
      if (tab !== 'all' && l.type !== tab) return false;
      if (search) {
        const s = search.toLowerCase();
        return l.crop?.toLowerCase().includes(s) || l.state?.toLowerCase().includes(s) || l.ownerName?.toLowerCase().includes(s) || l.name?.toLowerCase().includes(s);
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
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#fefce8 50%,#eff6ff 100%)' }}>
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <button onClick={onBack} className="mb-2 text-sm text-gray-400 hover:text-gray-600 font-semibold">← Back to Home</button>
            <h1 className="text-4xl font-black text-gray-900">🤝 Marketplace</h1>
            <p className="text-gray-500 mt-1 text-sm">Farmers & buyers connect directly — no middlemen.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged-in user chip */}
            {user ? (
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
                {user.photoURL && <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />}
                <div className="text-xs">
                  <p className="font-bold text-gray-800 leading-tight">{user.displayName || 'You'}</p>
                  <p className="text-gray-400">{stats.mine} listing{stats.mine !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ) : (
              <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:shadow-md shadow-sm transition-all">
                <LogIn size={15} /> Sign in to Post
              </button>
            )}

            {user && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg,#16a34a,#2563eb)' }}
              >
                <Plus size={18} /> Post Listing
              </button>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total',   value: stats.total, color:'#6b7280', icon:<Users size={18}/> },
            { label:'Selling', value: stats.sell,  color:'#16a34a', icon:<Leaf size={18}/> },
            { label:'Buying',  value: stats.buy,   color:'#2563eb', icon:<ShoppingBag size={18}/> },
            { label:'My Listings', value: stats.mine, color:'#d97706', icon:<Package size={18}/> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '18', color }}>
                {icon}
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color }}>{value}</p>
                <p className="text-xs text-gray-400 font-semibold">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI Matcher ── */}
        <MatchFinder onSearch={setMatchNeed} />

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            {[{k:'all',l:'All'},{k:'sell',l:'🌾 Selling'},{k:'buy',l:'🛒 Buying'}].map(({k,l})=>(
              <button key={k} onClick={()=>setTab(k)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===k?'bg-gray-900 text-white shadow':'text-gray-500 hover:text-gray-700'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="flex-1 relative min-w-44">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search crop, state, name…"
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-green-400 shadow-sm" />
          </div>
          <button onClick={load} title="Refresh" className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 shadow-sm">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div className="mb-4 px-5 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold text-sm flex items-center gap-2">
            <CheckCircle size={16} />{toast}
          </div>
        )}

        {/* ── Guest login prompt (if not logged in) ── */}
        {!user && (
          <div className="mb-6">
            <LoginPrompt onLogin={onLogin} />
          </div>
        )}

        {/* ── Listings grid ── */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Loading listings…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌾</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No listings yet</h3>
            <p className="text-gray-400 mb-5">Be the first to post!</p>
            {user
              ? <button onClick={()=>setShowForm(true)} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">+ Post Listing</button>
              : <button onClick={onLogin} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 mx-auto"><LogIn size={16}/> Sign in to Post</button>
            }
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayed.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                matchNeed={matchNeed}
                currentUid={user?.uid}
                onDelete={handleDelete}
                onWhatsApp={handleWhatsApp}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Post Form modal ── */}
      {showForm && user && (
        <PostForm
          user={user}
          onClose={() => setShowForm(false)}
          onSubmit={handlePost}
          posting={posting}
        />
      )}
    </div>
  );
}
