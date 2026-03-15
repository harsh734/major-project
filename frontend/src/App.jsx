import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sprout, TrendingUp, Target, LogIn, LogOut, User, AlertCircle, Mic, Volume2,
         Loader, History, Download, MessageSquare, Globe, X, ChevronDown, ChevronUp, Users,
         ArrowLeft, Send, Brain, Newspaper } from 'lucide-react';
import Marketplace from "./pages/Marketplace";
import CoopGroupBuying from "./pages/CoopGroupBuying";
import GovtNewsHub, { GovtNewsWidget } from "./pages/GovtNewsHub";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

/* ─── Inject fonts + global design system ───────────────────────────────────── */
const _style = document.createElement('style');
_style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-deep:       #08120a;
    --glass-base:    rgba(18, 38, 24, 0.65);
    --glass-hover:   rgba(24, 52, 32, 0.75);
    --glass-border:  #2d4a35;
    --glass-border-h:#3d6447;
    --text-primary:  #e2e8f0;
    --text-secondary:#94a3b8;
    --text-muted:    #64748b;
    --neon-sage:     #4ade80;
    --amber:         #fbbf24;
    --emerald:       #10b981;
    --teal:          #2dd4bf;
    --red-alert:     #f87171;
    --purple:        #a78bfa;
  }

  body {
    background-color: var(--bg-deep);
    background-image:
      radial-gradient(circle at 0% 0%, rgba(16,185,129,0.10) 0%, transparent 45%),
      radial-gradient(circle at 100% 100%, rgba(13,148,136,0.10) 0%, transparent 45%);
    color: var(--text-primary);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  body::after {
    content: '';
    position: fixed; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9999;
  }

  .amb-tr { position:fixed;top:-80px;right:-80px;width:540px;height:540px;border-radius:50%;background:rgba(16,185,129,0.09);filter:blur(120px);pointer-events:none;z-index:0; }
  .amb-bl { position:fixed;bottom:-80px;left:-80px;width:440px;height:440px;border-radius:50%;background:rgba(13,148,136,0.09);filter:blur(100px);pointer-events:none;z-index:0; }

  .gc {
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  }
  .gc-lift:hover { transform:translateY(-4px); box-shadow:0 18px 50px rgba(0,0,0,0.45); border-color:var(--glass-border-h); }

  .glass-nav {
    background: rgba(8,18,10,0.84);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--glass-border);
    position: sticky; top: 0; z-index: 100;
  }

  .gci {
    background: rgba(10,22,14,0.85); border:1px solid var(--glass-border);
    border-radius: 0.75rem; color:var(--text-primary);
    font-family:'DM Sans',sans-serif; font-size:13.5px; padding:12px 16px;
    width:100%; outline:none; transition:all 0.25s ease; appearance:none;
  }
  .gci:focus { border-color:var(--neon-sage); box-shadow:0 0 0 3px rgba(74,222,128,0.18); }
  .gci option { background:#0d1f10; }

  .gl { display:block; font-size:10px; font-weight:700; letter-spacing:0.10em; text-transform:uppercase; color:var(--text-secondary); margin-bottom:8px; }

  .btn-neon {
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    padding:14px 24px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:0.12em; text-transform:uppercase; color:var(--bg-deep);
    background:var(--neon-sage); border:none; border-radius:0.75rem; cursor:pointer;
    box-shadow:0 0 18px rgba(74,222,128,0.32); transition:all 0.22s ease;
  }
  .btn-neon:hover:not(:disabled) { background:#62ef94; box-shadow:0 0 28px rgba(74,222,128,0.55); transform:translateY(-1px); }
  .btn-neon:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

  .btn-ghost-g {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    padding:12px 18px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:700;
    letter-spacing:0.08em; text-transform:uppercase; color:var(--text-secondary);
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.10);
    border-radius:0.75rem; cursor:pointer; transition:all 0.2s ease;
  }
  .btn-ghost-g:hover { background:rgba(255,255,255,0.08); color:var(--text-primary); border-color:rgba(255,255,255,0.18); }

  .btn-back {
    display:inline-flex; align-items:center; gap:7px; padding:10px 16px;
    font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600;
    color:var(--text-secondary); background:rgba(255,255,255,0.04);
    border:1px solid var(--glass-border); border-radius:0.75rem; cursor:pointer; transition:all 0.2s ease;
  }
  .btn-back:hover { color:var(--neon-sage); border-color:rgba(74,222,128,0.3); background:rgba(74,222,128,0.05); }

  .badge-sage { display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:var(--neon-sage);background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.22); }
  .badge-amber { display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:var(--amber);background:rgba(251,191,36,0.10);border:1px solid rgba(251,191,36,0.22); }
  .badge-teal { display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:0.10em;text-transform:uppercase;color:var(--teal);background:rgba(45,212,191,0.10);border:1px solid rgba(45,212,191,0.22); }

  .df { font-family:'Fraunces',serif; }
  .gd { width:100%;height:1px;background:var(--glass-border);margin:22px 0; }
  .gs::-webkit-scrollbar{width:4px}.gs::-webkit-scrollbar-track{background:transparent}.gs::-webkit-scrollbar-thumb{background:var(--glass-border);border-radius:4px}

  @keyframes m-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes m-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes m-scaleIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes m-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes m-pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes m-spin    { to{transform:rotate(360deg)} }
  @keyframes m-vPulseR { 0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,0.4)} 50%{box-shadow:0 0 0 16px rgba(248,113,113,0)} }

  .a-fu { animation:m-fadeUp  0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .a-fi { animation:m-fadeIn  0.35s ease both; }
  .a-si { animation:m-scaleIn 0.38s cubic-bezier(0.22,1,0.36,1) both; }
  .a-fl { animation:m-float   4s ease-in-out infinite; }
  .a-pl { animation:m-pulse   1.5s ease-in-out infinite; }
  .a-sp { animation:m-spin    0.85s linear infinite; }
  .vpr  { animation:m-vPulseR 1.2s ease-in-out infinite !important; }

  .s1{animation:m-fadeUp 0.5s 0.05s cubic-bezier(0.22,1,0.36,1) both}
  .s2{animation:m-fadeUp 0.5s 0.13s cubic-bezier(0.22,1,0.36,1) both}
  .s3{animation:m-fadeUp 0.5s 0.21s cubic-bezier(0.22,1,0.36,1) both}
  .s4{animation:m-fadeUp 0.5s 0.29s cubic-bezier(0.22,1,0.36,1) both}

  .cb-bot  { background:rgba(30,60,38,0.7);border:1px solid var(--glass-border);color:var(--text-primary);border-radius:16px 16px 16px 4px; }
  .cb-user { background:var(--neon-sage);color:#08120a;border-radius:16px 16px 4px 16px; }

  .result-sage  { background:linear-gradient(135deg,rgba(74,222,128,0.05),rgba(16,185,129,0.08));border:1px solid rgba(74,222,128,0.25);border-radius:1.5rem; }
  .result-amber { background:linear-gradient(135deg,rgba(251,191,36,0.05),rgba(217,119,6,0.08));border:1px solid rgba(251,191,36,0.25);border-radius:1.5rem; }

  .conf-track { height:6px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden; }
  .conf-fill  { height:100%;border-radius:99px;transition:width 1.1s cubic-bezier(0.22,1,0.36,1); }

  .err-box { background:rgba(248,113,113,0.10);border:1px solid rgba(248,113,113,0.28);border-radius:0.75rem;padding:14px 18px;margin-top:16px;display:flex;gap:12px;align-items:flex-start; }
`;
document.head.appendChild(_style);

/* ─── Language Config ────────────────────────────────────────────────────────── */
const LANGS = {
  en: { label: 'English', code: 'en-IN', flag: '🇬🇧' },
  hi: { label: 'हिंदी',   code: 'hi-IN', flag: '🇮🇳' },
  gu: { label: 'ગુજ.',    code: 'gu-IN', flag: '🌾' },
};

function speak(text, langCode = 'en-IN') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langCode; u.rate = 0.95; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

/* ─── useVoiceRecognition ───────────────────────────────────────────────────── */
function useVoiceRecognition() {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SRA = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(SRA);
  const listen = useCallback((onDone, langCode = 'en-IN') => {
    if (!supported) { alert('Speech recognition not supported. Use Chrome.'); return; }
    if (recRef.current) recRef.current.abort();
    const rec = new SRA();
    rec.lang = langCode; rec.continuous = false; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = e => { if (onDone) onDone(e.results[0][0].transcript); };
    recRef.current = rec; rec.start();
  }, [supported, SRA]);
  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);
  useEffect(() => () => recRef.current?.abort(), []);
  return { listening, supported, listen, stop };
}

/* ─── NLP Parser ────────────────────────────────────────────────────────────── */
function parseVoiceInput(transcript, pageType) {
  const t = transcript.toLowerCase();
  function bestMatch(map) {
    let bP=-1,bL=0,bV=null;
    for(const[kw,val]of Object.entries(map)){let pos=-1,sf=0;while(true){const idx=t.indexOf(kw,sf);if(idx===-1)break;const before=idx===0?' ':t[idx-1];const after=idx+kw.length>=t.length?' ':t[idx+kw.length];if(!/[a-z\u0900-\u097f\u0a80-\u0aff]/.test(before)&&!/[a-z\u0900-\u097f\u0a80-\u0aff]/.test(after))pos=idx;sf=idx+1;}if(pos===-1)continue;if(pos>bP||(pos===bP&&kw.length>bL)){bP=pos;bL=kw.length;bV=val;}}return bV;
  }
  const wN={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90,hundred:100,thousand:1000,ek:1,do:2,teen:3,char:4,paanch:5,chhe:6,saat:7,aath:8,nau:9,das:10,sau:100,hazaar:1000,bees:20,tees:30,chalees:40,pachas:50};
  function wtn(str){const d=str.match(/[\d]+\.?[\d]*/);if(d)return parseFloat(d[0]);let tot=0,cur=0;str.split(/\s+/).forEach(w=>{const n=wN[w];if(n===undefined)return;if(n===100){cur=(cur||1)*100;}else if(n===1000){tot+=(cur||1)*1000;cur=0;}else{cur+=n;}});return tot+cur||null;}
  function en(pats){for(const p of pats){const m=t.match(p);if(m){const n=wtn(m[1]||m[0]);if(n&&n>0)return n;}}return null;}
  const cropMap={'wheat':'Wheat','gehun':'Wheat','gehu':'Wheat','gandum':'Wheat','rice':'Rice','paddy':'Rice','chawal':'Rice','dhan':'Rice','dhaanu':'Rice','maize':'Maize','corn':'Maize','makka':'Maize','makki':'Maize','makkai':'Maize','pulses':'Pulses','dal':'Pulses','lentil':'Pulses','lentils':'Pulses','chana':'Pulses','moong':'Pulses','urad':'Pulses','toor':'Pulses','sugarcane':'Sugarcane','sugar cane':'Sugarcane','ganna':'Sugarcane','sherdee':'Sugarcane','millet':'Millet','bajra':'Millet','jowar':'Millet','sorghum':'Millet','jwari':'Millet','groundnut':'Groundnut','peanut':'Groundnut','moongfali':'Groundnut','singdana':'Groundnut','cotton':'Cotton','kapas':'Cotton','kapasiya':'Cotton','soybean':'Soybean','soya':'Soybean'};
  const stateMap={'gujarat':'Gujarat','gujarati':'Gujarat','gujrat':'Gujarat','maharashtra':'Maharashtra','punjab':'Punjab','uttar pradesh':'UP',' up ':'UP','bihar':'Bihar'};
  const soilMap={'black cotton soil':'black soil','black soil':'black soil','kali mitti':'black soil','regur':'black soil','kali':'black soil','loamy':'loamy','loam':'loamy','domat':'loamy','domad':'loamy','clayey':'clay','clay':'clay','chikni mitti':'clay','sandy':'sandy','sand':'sandy','retalee':'sandy','ret':'sandy'};
  let area_hectare=null;
  const aA=t.match(/(\d+\.?\d*)\s*(acre|acres|ekad)/),aH=t.match(/(\d+\.?\d*)\s*(hectare|hectares|ha\b|hektar)/),aB=t.match(/(\d+\.?\d*)\s*(bigha|bighas|vigha)/);
  if(aA)area_hectare=parseFloat(aA[1])*0.4047;else if(aH)area_hectare=parseFloat(aH[1]);else if(aB)area_hectare=parseFloat(aB[1])*0.2529;
  if(area_hectare)area_hectare=Math.round(area_hectare*100)/100;
  const rainfall=en([/(\d+\.?\d*)\s*(mm|millimeter|millimetre)/,/rainfall\D{0,10}?(\d+)/,/rain\D{0,10}?(\d+)/,/varsha\D{0,10}?(\d+)/]);
  const crop=bestMatch(cropMap),soil=bestMatch(soilMap),state=bestMatch(stateMap);
  if(pageType==='price'){const mM={'delhi':'Delhi','new delhi':'Delhi','dilli':'Delhi','mumbai':'Mumbai','bombay':'Mumbai','rajkot':'Rajkot','ahmedabad':'Ahmedabad','amdavad':'Ahmedabad'};const market=bestMatch(mM);const pm=t.match(/(\d+)\s*(day|days|din)/);const periods=pm?parseInt(pm[1]):null;return{...(crop&&{crop_name:crop}),...(market&&{market}),...(periods&&{periods}),model_type:t.includes('lstm')?'lstm':'prophet'};}
  if(pageType==='yield'){const sM={'high yielding variety':'HYV','high yield variety':'HYV','hyv':'HYV','hybrid':'Hybrid','sankar':'Hybrid','drought resistant':'DroughtResistant','drought resistance':'DroughtResistant','drought':'DroughtResistant','sukhad':'DroughtResistant','local variety':'Local','local':'Local','desi':'Local','deshu':'Local'};const fM={'npk':'NPK','n p k':'NPK','organic':'Organic','jeevamrut':'Organic','compost':'Organic','jaivik':'Organic','mixed fertilizer':'Mixed','mixed':'Mixed','low fertilizer':'Low','less fertilizer':'Low','low':'Low','thodu':'Low'};return{...(crop&&{crop_name:crop}),...(soil&&{soil_type:soil}),...(rainfall&&{rainfall_mm:rainfall}),...(area_hectare&&{area_hectare}),...(bestMatch(sM)&&{seed_variety:bestMatch(sM)}),...(bestMatch(fM)&&{fertilizer_used:bestMatch(fM)}),...(state&&{state})};}
  if(pageType==='recommendation'){const seM={'kharif':'Kharif','khareef':'Kharif','monsoon season':'Kharif','monsoon':'Kharif','rainy season':'Kharif','barsaat':'Kharif','varsha':'Kharif','choma':'Kharif','rabi':'Rabi','winter season':'Rabi','winter':'Rabi','sardi':'Rabi','shiyaada':'Rabi','zaid':'Zaid','summer season':'Zaid','summer':'Zaid','garmi':'Zaid','ugno':'Zaid'};const season=bestMatch(seM);const tm=t.match(/(\d+\.?\d*)\s*(degree|celsius|°c|centigrade|digri)/);const temperature_c=tm?parseFloat(tm[1]):null;const pp={};for(const[kw,val]of Object.entries(cropMap)){['after ','last ','previous ','grew ','had ','pehle ','pahele '].forEach(p=>{pp[p+kw]=val;});}const prevCrop=bestMatch(pp);return{...(soil&&{soil_type:soil}),...(rainfall&&{rainfall_mm:rainfall}),...(temperature_c&&{temperature_c}),...(area_hectare&&{area_hectare}),...(state&&{state}),...(season&&{season}),...(prevCrop&&{previous_crop:prevCrop})};}
  return {};
}

/* ─── ConfidenceMeter ───────────────────────────────────────────────────────── */
function ConfidenceMeter({ confidence }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  const color = pct>=80 ? '#4ade80' : pct>=60 ? '#fbbf24' : '#f87171';
  const label = pct>=80 ? '✦ High confidence' : pct>=60 ? '◈ Moderate — verify recommended' : '◇ Low — cross-check locally';
  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
        <span style={{ fontSize:10,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'var(--text-secondary)' }}>Confidence Score</span>
        <span style={{ fontSize:16,fontWeight:700,color }}>{pct}%</span>
      </div>
      <div className="conf-track"><div className="conf-fill" style={{ width:`${pct}%`,background:`linear-gradient(90deg,${color}88,${color})` }}/></div>
      <p style={{ fontSize:11,color,marginTop:6,fontWeight:500 }}>{label}</p>
    </div>
  );
}

/* ─── VoiceHistory ──────────────────────────────────────────────────────────── */
function VoiceHistory({ history, onReplay, onClear }) {
  const [open, setOpen] = useState(false);
  if (!history.length) return null;
  return (
    <div style={{ marginBottom:14 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'flex',alignItems:'center',gap:7,fontSize:12,color:'var(--text-secondary)',background:'none',border:'none',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:600,padding:0 }}>
        <History size={13}/> Voice History ({history.length}) {open?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
      </button>
      {open && (
        <div className="a-fi" style={{ marginTop:10,border:'1px solid var(--glass-border)',borderRadius:12,overflow:'hidden',background:'rgba(10,22,14,0.7)' }}>
          <div className="gs" style={{ maxHeight:160,overflowY:'auto' }}>
            {history.map((item,i)=>(
              <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',borderBottom:'1px solid rgba(45,74,53,0.5)' }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <p style={{ fontSize:10,color:'var(--text-muted)',marginBottom:2 }}>{item.time}</p>
                  <p style={{ fontSize:12.5,color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>"{item.transcript}"</p>
                </div>
                <button onClick={()=>onReplay(item)} style={{ marginLeft:10,fontSize:11,padding:'4px 10px',background:'rgba(74,222,128,0.10)',border:'1px solid rgba(74,222,128,0.25)',borderRadius:7,color:'var(--neon-sage)',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:700,flexShrink:0 }}>▶ Replay</button>
              </div>
            ))}
          </div>
          <button onClick={onClear} style={{ width:'100%',padding:'9px',fontSize:11,color:'var(--red-alert)',background:'none',border:'none',borderTop:'1px solid rgba(45,74,53,0.5)',cursor:'pointer',fontFamily:'DM Sans,sans-serif',fontWeight:600 }}>Clear History</button>
        </div>
      )}
    </div>
  );
}

/* ─── VoiceAssistantButton ──────────────────────────────────────────────────── */
function VoiceAssistantButton({ pageType, onFormFilled, onSubmit, color = '#4ade80', hint, lang = 'en' }) {
  const { listening, supported, listen, stop } = useVoiceRecognition();
  const [phase, setPhase] = useState('idle');
  const [lastTranscript, setLastTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [history, setHistory] = useState([]);
  const langCode = LANGS[lang]?.code || 'en-IN';

  const handleClick = () => {
    if (!supported) return;
    if (listening) { stop(); setPhase('idle'); return; }
    setPhase('listening'); setErrorMsg(''); setLastTranscript('');
    listen(async (spoken) => {
      setLastTranscript(spoken); setPhase('parsing');
      const time = new Date().toLocaleTimeString();
      try {
        const parsed = parseVoiceInput(spoken, pageType);
        if (onFormFilled) onFormFilled(parsed);
        await new Promise(r => setTimeout(r, 400));
        setPhase('speaking');
        const result = await onSubmit(parsed);
        if (result?.spokenText) {
          speak(result.spokenText, langCode);
          setHistory(h => [{ transcript:spoken, result:result.spokenText, time }, ...h.slice(0,9)]);
        }
      } catch {
        setErrorMsg('Could not process. Please try again.');
        speak('Sorry, could not process that.', langCode);
      } finally { setTimeout(() => setPhase('idle'), 3000); }
    }, langCode);
  };

  const phases = {
    idle:      { label:'Ask by Voice',    bg:'rgba(74,222,128,0.10)',  border:'rgba(74,222,128,0.28)',  tc:'var(--neon-sage)',  extraClass:'' },
    listening: { label:'Listening…',      bg:'rgba(248,113,113,0.10)', border:'rgba(248,113,113,0.40)', tc:'#f87171',           extraClass:'vpr' },
    parsing:   { label:'Understanding…',  bg:'rgba(251,191,36,0.10)',  border:'rgba(251,191,36,0.38)',  tc:'var(--amber)',      extraClass:'' },
    speaking:  { label:'Speaking…',       bg:'rgba(167,139,250,0.10)', border:'rgba(167,139,250,0.38)', tc:'var(--purple)',     extraClass:'' },
  };
  const cfg = phases[phase] || phases.idle;
  if (!supported) return <p style={{ fontSize:11,color:'var(--text-muted)',textAlign:'center' }}>🎤 Voice input requires Chrome</p>;

  return (
    <div style={{ margin:'14px 0' }}>
      <VoiceHistory history={history} onReplay={item=>speak(item.result,langCode)} onClear={()=>setHistory([])}/>
      {hint && phase==='idle' && <p style={{ fontSize:11,color:'var(--text-muted)',textAlign:'center',marginBottom:10,fontStyle:'italic' }}>Try: "{hint}"</p>}
      <button onClick={handleClick} className={cfg.extraClass} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'14px 24px',borderRadius:12,border:`1px solid ${cfg.border}`,background:cfg.bg,color:cfg.tc,fontFamily:'DM Sans,sans-serif',fontWeight:700,fontSize:13,letterSpacing:'0.06em',cursor:'pointer',transition:'all 0.25s ease' }}>
        {phase==='idle'      && <Mic size={18}/>}
        {phase==='listening' && <Mic size={18} className="a-pl"/>}
        {phase==='parsing'   && <Loader size={18} className="a-sp"/>}
        {phase==='speaking'  && <Volume2 size={18}/>}
        {cfg.label}
      </button>
      {lastTranscript && <div className="a-fi" style={{ marginTop:10,padding:'9px 14px',background:'rgba(10,22,14,0.8)',border:'1px solid var(--glass-border)',borderRadius:10,fontSize:12.5,color:'var(--text-secondary)' }}><span style={{ fontSize:9.5,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--text-muted)' }}>You said: </span>"{lastTranscript}"</div>}
      {errorMsg && <p style={{ marginTop:6,fontSize:11,color:'var(--red-alert)',textAlign:'center' }}>{errorMsg}</p>}
      {phase==='parsing'  && <p className="a-pl" style={{ marginTop:6,fontSize:11,color:'var(--amber)',textAlign:'center' }}>🤖 Parsing your request…</p>}
      {phase==='speaking' && <p style={{ marginTop:6,fontSize:11,color:'var(--purple)',textAlign:'center' }}>🔊 Speaking the result…</p>}
    </div>
  );
}

/* ─── ChatPanel ─────────────────────────────────────────────────────────────── */
function ChatPanel({ pageType, currentForm }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role:'bot', text:'Hi! Ask me anything about your inputs or results.' }]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const FAQ = {
    price: { 'what is prophet':'Prophet is a forecasting model by Meta for time-series data with seasonal patterns.','what is lstm':'LSTM (Long Short-Term Memory) is a neural network model good at sequential patterns.','how accurate':'Accuracy depends on data quality. Prophet generally excels for seasonal crops.','what is quintal':'A quintal = 100 kg. Prices shown in ₹ per quintal.' },
    yield: { 'what is hyv':'HYV = High Yielding Variety — seeds bred for maximum output.','what is xgboost':'XGBoost uses gradient boosting trees — powerful for tabular data.','convert acres':`Your area is ${currentForm?.area_hectare||'?'} ha. 1 ha = 2.47 acres.`,'best fertilizer':'NPK (Nitrogen-Phosphorus-Potassium) is the most balanced fertilizer.' },
    recommendation: { 'what is kharif':'Kharif crops sown June-July with monsoon. E.g. Rice, Cotton, Maize.','what is rabi':'Rabi crops grow in winter (Oct-Nov). E.g. Wheat, Mustard, Pulses.','what is zaid':'Zaid grows Mar-June. E.g. Watermelon, Cucumber.','best soil':'Loamy soil is generally best — good drainage and nutrients.' },
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m=>[...m,{role:'user',text:userMsg}]); setInput('');
    const q=userMsg.toLowerCase(); const faqBank=FAQ[pageType]||{};
    let answer=null;
    for(const[key,val]of Object.entries(faqBank)){if(q.includes(key)){answer=val;break;}}
    if(!answer){
      if(q.includes('area')||q.includes('hectare'))answer=`Your area: ${currentForm?.area_hectare||'?'} ha (${((currentForm?.area_hectare||0)*2.47).toFixed(1)} acres).`;
      else if(q.includes('state')||q.includes('location'))answer=`Location: ${currentForm?.state||'?'}.`;
      else if(q.includes('crop'))answer=`Current crop: ${currentForm?.crop_name||currentForm?.previous_crop||'not set'}.`;
      else answer="Ask about 'Prophet', 'HYV', 'Kharif', or your current form settings!";
    }
    setTimeout(()=>setMessages(m=>[...m,{role:'bot',text:answer}]),380);
  };

  return (
    <>
      <button onClick={()=>setOpen(o=>!o)} title="Ask a question" style={{ position:'fixed',bottom:28,right:28,zIndex:200,width:58,height:58,borderRadius:'50%',background:'var(--neon-sage)',color:'#08120a',boxShadow:'0 0 28px rgba(74,222,128,0.45)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',border:'none',transition:'all 0.22s ease' }}>
        {open?<X size={22}/>:<MessageSquare size={22}/>}
      </button>
      {open && (
        <div className="a-si gc" style={{ position:'fixed',bottom:100,right:28,zIndex:200,width:318,height:420,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          <div style={{ background:'rgba(74,222,128,0.10)',borderBottom:'1px solid var(--glass-border)',padding:'13px 18px',display:'flex',alignItems:'center',gap:8 }}>
            <MessageSquare size={15} style={{ color:'var(--neon-sage)' }}/><span className="df" style={{ fontWeight:700,fontSize:14,color:'var(--text-primary)' }}>KrushiConnect AI</span>
          </div>
          <div className="gs" style={{ flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:8 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div className={m.role==='user'?'cb-user':'cb-bot'} style={{ maxWidth:'83%',padding:'9px 14px',fontSize:12.5,lineHeight:1.55 }}>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>
          <div style={{ borderTop:'1px solid var(--glass-border)',padding:'10px 12px',display:'flex',gap:8 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Ask anything…" style={{ flex:1,padding:'9px 13px',fontSize:12.5,fontFamily:'DM Sans,sans-serif',background:'rgba(10,22,14,0.8)',border:'1px solid var(--glass-border)',borderRadius:9,outline:'none',color:'var(--text-primary)' }}/>
            <button onClick={handleSend} style={{ padding:'9px 13px',background:'var(--neon-sage)',border:'none',borderRadius:9,cursor:'pointer',display:'flex',alignItems:'center',color:'#08120a',fontWeight:700,fontSize:15 }}><Send size={15}/></button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── PDF Export ─────────────────────────────────────────────────────────────── */
function exportToPDF(title, data, pageType) {
  const c=[`KrushiConnect – ${title}`,`Generated: ${new Date().toLocaleString()}`,'─'.repeat(50)];
  if(pageType==='yield'&&data.result){c.push(`Crop: ${data.form.crop_name}`,`State: ${data.form.state}`,`Area: ${data.form.area_hectare} ha`,`Rainfall: ${data.form.rainfall_mm} mm`,`Soil: ${data.form.soil_type}`,'─'.repeat(50),`Total Yield: ${data.result.totalYield.toFixed(2)} kg`,`Per Hectare: ${(data.result.yieldPerHectare||data.result.yield).toFixed(2)} kg/ha`);if(data.result.confidence)c.push(`Confidence: ${(data.result.confidence*100).toFixed(1)}%`);}
  if(pageType==='recommendation'&&data.result){c.push(`State: ${data.form.state}`,`Season: ${data.form.season}`,`Soil: ${data.form.soil_type}`,'─'.repeat(50),`Recommended Crop: ${data.result.recommended_crop}`);if(data.result.confidence)c.push(`Confidence: ${(data.result.confidence*100).toFixed(1)}%`);}
  if(pageType==='price'&&data.result){c.push(`Crop: ${data.form.crop_name}`,`Market: ${data.form.market}`,'─'.repeat(50));data.result.forecast.slice(0,15).forEach((item,i)=>c.push(`  ${item.ds||item.date||`Day ${i+1}`}: ₹${(item.yhat||item.predicted_price||item.price||0).toFixed(2)}/qtl`));}
  const blob=new Blob([c.join('\n')],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`KrushiConnect_${pageType}_${Date.now()}.txt`;a.click();URL.revokeObjectURL(url);
}

/* ─── Language Switcher ──────────────────────────────────────────────────────── */
function LangSwitcher({ lang, setLang }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:3,background:'rgba(255,255,255,0.04)',border:'1px solid var(--glass-border)',borderRadius:10,padding:'4px 5px' }}>
      <Globe size={12} style={{ color:'var(--text-secondary)',marginLeft:5,marginRight:2 }}/>
      {Object.entries(LANGS).map(([key,val])=>(
        <button key={key} onClick={()=>setLang(key)} style={{ padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:11.5,fontWeight:700,fontFamily:'DM Sans,sans-serif',background:lang===key?'rgba(74,222,128,0.18)':'transparent',color:lang===key?'var(--neon-sage)':'var(--text-secondary)',transition:'all 0.18s ease' }}>
          {val.flag} {val.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Firebase ───────────────────────────────────────────────────────────────── */
const firebaseConfig={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID,measurementId:import.meta.env.VITE_FIREBASE_MEASUREMENT_ID};
let auth=null,googleProvider=null,firebaseInitialized=false;
const initializeFirebase=async()=>{if(firebaseInitialized)return;try{const fb=await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');const fa=await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');const app=fb.initializeApp(firebaseConfig);auth=fa.getAuth(app);googleProvider=new fa.GoogleAuthProvider();firebaseInitialized=true;}catch(err){console.error('Firebase:',err);}};

/* ─── API ────────────────────────────────────────────────────────────────────── */
const API_BASE=import.meta.env.VITE_API_BASE||'http://localhost:5000/api';
const predictPrice  = async d=>(await fetch(`${API_BASE}/predict_price`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json();
const estimateYield = async d=>(await fetch(`${API_BASE}/estimate_yield`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json();
const recommendCrop = async d=>(await fetch(`${API_BASE}/recommend_crop`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})).json();

/* ─── ChartDisplay ───────────────────────────────────────────────────────────── */
function ChartDisplay({ data, title }) {
  if (!data?.length) return null;
  const chartData=data.map((item,idx)=>({day:item.ds||item.date||`Day ${idx+1}`,price:parseFloat(item.yhat||item.predicted_price||item.price||0)}));
  return (
    <div className="a-fu gc" style={{ marginTop:24,padding:24 }}>
      <h3 className="df" style={{ fontSize:17,fontWeight:600,color:'var(--text-primary)',marginBottom:18 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
          <XAxis dataKey="day" tick={{fontSize:10,fill:'var(--text-secondary)',fontFamily:'DM Sans,sans-serif'}} interval={Math.floor(chartData.length/7)}/>
          <YAxis tick={{fontSize:10,fill:'var(--text-secondary)',fontFamily:'DM Sans,sans-serif'}} label={{value:'₹/qtl',angle:-90,position:'insideLeft',fontSize:10,fill:'var(--text-secondary)'}}/>
          <Tooltip contentStyle={{background:'rgba(8,18,10,0.96)',border:'1px solid var(--glass-border)',borderRadius:10,fontFamily:'DM Sans,sans-serif',fontSize:12}} formatter={v=>[`₹${v.toFixed(2)}/qtl`,'Price']}/>
          <Legend wrapperStyle={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'var(--text-secondary)'}}/>
          <Line type="monotone" dataKey="price" stroke="#4ade80" strokeWidth={2.5} dot={false} name="Predicted Price"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Shared helpers ─────────────────────────────────────────────────────────── */
function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div className="err-box a-fi">
      <AlertCircle size={17} style={{color:'var(--red-alert)',flexShrink:0,marginTop:1}}/>
      <div><p style={{fontSize:13,color:'var(--red-alert)',fontWeight:700,marginBottom:4}}>Error</p><pre style={{fontSize:11.5,color:'#fca5a5',overflowX:'auto',whiteSpace:'pre-wrap'}}>{error}</pre></div>
    </div>
  );
}

const CHEV = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`;

function FieldGrid({ fields, form, setForm }) {
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:14}}>
      {fields.map(({label,key,type,opts,step})=>(
        <div key={key}>
          <label className="gl">{label}</label>
          {type==='select'
            ? <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="gci" style={{backgroundImage:CHEV,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}>
                {opts.map(o=><option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
              </select>
            : <input type="number" step={step||1} value={form[key]} onChange={e=>setForm({...form,[key]:parseFloat(e.target.value)||0})} className="gci"/>
          }
        </div>
      ))}
    </div>
  );
}

/* ─── Inner Page Shell ───────────────────────────────────────────────────────── */
function InnerShell({ onBack, accentColor='#4ade80', emoji, title, subtitle, children, pageType, currentForm }) {
  return (
    <div style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <div className="amb-tr" style={{background:`radial-gradient(${accentColor}15, transparent)`}}/>
      <div className="amb-bl"/>
      <nav className="glass-nav">
        <div style={{maxWidth:1000,margin:'0 auto',padding:'0 28px',height:62,display:'flex',alignItems:'center',gap:16}}>
          <button onClick={onBack} className="btn-back"><ArrowLeft size={15}/> Home</button>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20}}>{emoji}</span>
            <span className="df" style={{fontSize:18,fontWeight:700,color:'var(--text-primary)'}}>{title}</span>
          </div>
        </div>
      </nav>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'36px 28px 120px'}}>
        <div className="gc s2" style={{padding:'36px 40px'}}>
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
              <div style={{width:46,height:46,borderRadius:14,background:`${accentColor}18`,border:`1px solid ${accentColor}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{emoji}</div>
              <div>
                <h2 className="df" style={{fontSize:24,fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.015em'}}>{title}</h2>
                <p style={{fontSize:13,color:'var(--text-secondary)',marginTop:2}}>{subtitle}</p>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>
      <ChatPanel pageType={pageType} currentForm={currentForm}/>
    </div>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────────────────── */
function LandingPage({ onNavigate, user, onLogin, onLogout, lang, setLang }) {
  const cards = [
    { page:'price',          icon:<TrendingUp size={26}/>, label:'Price Predictor',       desc:'LSTM-powered market forecasting for major crops.', borderColor:'#4ade80', iconColor:'#4ade80', btnLabel:'Open Forecast' },
    { page:'yield',          icon:<Target size={26}/>,     label:'Yield Estimation',      desc:'Satellite-grade yield analysis using XGBoost AI.', borderColor:'#fbbf24', iconColor:'#fbbf24', btnLabel:'Calculate Yield' },
    { page:'recommendation', icon:<Sprout size={26}/>,     label:'Crop Recommendations',  desc:'Soil-specific recommendations for maximum profit.', borderColor:'#10b981', iconColor:'#10b981', btnLabel:'Get Advice' },
    { page:'marketplace',    icon:<Users size={26}/>,      label:'Marketplace',           desc:'Direct B2B connection for farmers and buyers.', borderColor:'#2dd4bf', iconColor:'#2dd4bf', btnLabel:'Visit Market' },
    { page:'coop',           icon:<Users size={26}/>,      label:'Group Buying',          desc:'Pool with farmers in your state for wholesale input prices.', borderColor:'#a78bfa', iconColor:'#a78bfa', btnLabel:'Join a Group' },
    { page:'govtnews',       icon:<Newspaper size={26}/>,  label:'Govt & MSP News',       desc:'Official MSP prices, schemes & agri market news.', borderColor:'#2dd4bf', iconColor:'#2dd4bf', btnLabel:'View Updates' },
  ];

  return (
    <div style={{minHeight:'100vh',position:'relative',zIndex:1}}>
      <div className="amb-tr"/><div className="amb-bl"/>

      {/* Nav */}
      <nav className="glass-nav">
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 28px',height:68,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,background:'var(--neon-sage)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(74,222,128,0.35)',fontSize:20}}>🌾</div>
            <span className="df" style={{fontSize:22,fontWeight:700,color:'var(--text-primary)',letterSpacing:'-0.01em'}}>KrushiConnect</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <LangSwitcher lang={lang} setLang={setLang}/>
            {user ? (
              <>
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 14px',background:'rgba(255,255,255,0.04)',border:'1px solid var(--glass-border)',borderRadius:9,fontSize:13,color:'var(--text-primary)',fontWeight:500}}>
                  <User size={14} style={{color:'var(--neon-sage)'}}/> {user.displayName||user.email}
                </div>
                <button onClick={onLogout} className="btn-ghost-g" style={{color:'var(--red-alert)',borderColor:'rgba(248,113,113,0.25)'}}><LogOut size={14}/> Logout</button>
              </>
            ) : (
              <button onClick={onLogin} className="btn-neon" style={{padding:'11px 22px'}}><LogIn size={15}/> Login with Google</button>
            )}
          </div>
        </div>
      </nav>

      <main style={{maxWidth:1200,margin:'0 auto',padding:'56px 28px 80px'}}>
        {/* Hero */}
        <section style={{marginBottom:52}}>
          <div className="s1 badge-sage" style={{marginBottom:22,display:'inline-flex'}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'var(--neon-sage)',display:'inline-block'}} className="a-pl"/>
            Pro Intelligence Dashboard
          </div>
          <h1 className="s2 df" style={{fontSize:'clamp(36px,5.5vw,62px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-0.02em',color:'var(--text-primary)',marginBottom:18}}>
            Harvesting <span style={{color:'var(--neon-sage)',fontStyle:'italic'}}>Intelligence</span><br/>from the Data Fields.
          </h1>
          <p className="s3" style={{fontSize:17,color:'var(--text-secondary)',maxWidth:560,marginBottom:36,lineHeight:1.7}}>
            Sophisticated AI insights for sustainable agriculture. Predict prices, estimate yields, and optimize your land with night-vision precision.
          </p>
          <div className="s3" style={{display:'flex',flexWrap:'wrap',gap:10,marginBottom:44}}>
            {['🎤 Hindi & Gujarati Voice','📜 Voice History','📊 Confidence Score','💬 Chat Q&A','📥 Export Reports'].map(f=>(
              <span key={f} className="badge-sage">{f}</span>
            ))}
          </div>

          {/* Tool cards */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(255px,1fr))',gap:18}}>
            {cards.map(({page,icon,label,desc,borderColor,iconColor,btnLabel},i)=>(
              <div key={page} className={`gc gc-lift s${Math.min(i+1,4)}`} style={{padding:26,cursor:'pointer',borderLeft:`4px solid ${borderColor}`}} onClick={()=>onNavigate(page)}>
                <div style={{color:iconColor,marginBottom:14,display:'flex',alignItems:'center'}}>{icon}</div>
                <h3 className="df" style={{fontSize:19,fontWeight:700,color:'var(--text-primary)',marginBottom:9,letterSpacing:'-0.01em'}}>{label}</h3>
                <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:20}}>{desc}</p>
                <button
                  style={{width:'100%',padding:'10px 16px',borderRadius:9,border:'1px solid rgba(255,255,255,0.10)',background:'rgba(255,255,255,0.05)',color:'var(--text-secondary)',fontFamily:'DM Sans,sans-serif',fontSize:11,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',cursor:'pointer',transition:'all 0.2s ease'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.10)';e.currentTarget.style.color='var(--text-primary)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color='var(--text-secondary)';}}
                >
                  {btnLabel} →
                </button>
              </div>
            ))}
          </div>

          {/* Govt & MSP Widget */}
          <GovtNewsWidget onNavigate={onNavigate}/>

        </section>
      </main>
    </div>
  );
}

/* ─── Price Prediction Page ──────────────────────────────────────────────────── */
function PricePredictionPage({ onBack, lang }) {
  const [form, setForm] = useState({ crop_name:'Wheat', market:'Delhi', model_type:'prophet', periods:30 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await predictPrice(formData || form);
      if (data?.forecast || data?.predictions || data?.results) {
        const forecast = data.forecast||data.predictions||data.results;
        setResult({forecast});
        if (data.warning || data.model === 'lstm_fallback_prophet') {
          setError(data.warning || '⚠️ LSTM model not trained yet. Showing Prophet forecast instead.');
        }
        const first=forecast[0],last=forecast[forecast.length-1];
        const firstP=(first?.yhat||first?.predicted_price||first?.price||0).toFixed(0),lastP=(last?.yhat||last?.predicted_price||last?.price||0).toFixed(0);
        const spokenText=`Price forecast for ${formData.crop_name} in ${formData.market}: starting at rupees ${firstP} per quintal, reaching rupees ${lastP} after ${forecast.length} days.`;
        speak(spokenText,LANGS[lang]?.code); setLoading(false); return {spokenText};
      } else if (data?.error) {
        if ((data.error.includes('No LSTM') || data.error.includes('LSTM')) && (formData||form).model_type === 'lstm') {
          setError('⚠️ LSTM model not trained yet — run model.py first. Retrying with Prophet...');
          setTimeout(async () => {
            try {
              const fb = await predictPrice({ ...(formData||form), model_type: 'prophet' });
              if (fb?.forecast) { setError('⚠️ LSTM unavailable — showing Prophet forecast instead.'); setResult({ forecast: fb.forecast }); }
            } catch(e) { /* ignore */ }
            setLoading(false);
          }, 1000);
        } else { setError(data.error); setLoading(false); }
        return;
      } else { setError(`Unexpected API response. Keys: ${Object.keys(data).join(', ')}`); }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  return (
    <InnerShell onBack={onBack} accentColor="#4ade80" emoji="📈" title="Price Prediction" subtitle="Prophet & LSTM time-series forecasting" pageType="price" currentForm={form}>
      <VoiceAssistantButton pageType="price" color="#4ade80" lang={lang}
        hint="What will be rice price in Mumbai for next 45 days?"
        onFormFilled={p=>setForm(prev=>({...prev,...p}))}
        onSubmit={async p=>{const m={...form,...p};setForm(m);return await runSubmit(m);}}/>
      <div className="gd"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:14,marginBottom:22}}>
        <div><label className="gl">Crop Name</label><select value={form.crop_name} onChange={e=>setForm({...form,crop_name:e.target.value})} className="gci" style={{backgroundImage:CHEV,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}>{['Wheat','Rice','Groundnut','Millet'].map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className="gl">Market</label><select value={form.market} onChange={e=>setForm({...form,market:e.target.value})} className="gci" style={{backgroundImage:CHEV,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}>{['Delhi','Mumbai','Rajkot','Ahmedabad'].map(m=><option key={m}>{m}</option>)}</select></div>
        <div><label className="gl">Model Type</label><select value={form.model_type} onChange={e=>setForm({...form,model_type:e.target.value})} className="gci" style={{backgroundImage:CHEV,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:32}}><option value="prophet">Prophet (Best Performance)</option><option value="lstm">LSTM Neural Network</option></select></div>
        <div><label className="gl">Forecast Days</label><input type="number" value={form.periods} onChange={e=>setForm({...form,periods:parseInt(e.target.value)||30})} min="1" max="90" className="gci"/></div>
      </div>
      <div style={{display:'flex',gap:12}}>
        <button onClick={()=>runSubmit(form)} disabled={loading} className="btn-neon" style={{flex:1,padding:'15px 24px',fontSize:12}}>
          {loading?<><Loader size={16} className="a-sp"/> Predicting…</>:<><Brain size={16}/> Run AI Forecast</>}
        </button>
        {result?.forecast && <button onClick={()=>exportToPDF('Price Prediction',{form,result},'price')} className="btn-ghost-g" style={{padding:'15px 18px'}}><Download size={16}/> Export</button>}
      </div>
      <ErrorBox error={error}/>
      {result?.forecast && (
        <>
          <ChartDisplay data={result.forecast} title="📊 Price Forecast Chart"/>
          <div className="a-fu gc" style={{marginTop:20,padding:22}}>
            <h3 className="df" style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',marginBottom:14,letterSpacing:'0.01em'}}>FORECAST — FIRST 10 DAYS</h3>
            <div className="gs" style={{display:'flex',flexDirection:'column',gap:6,maxHeight:260,overflowY:'auto'}}>
              {result.forecast.slice(0,10).map((item,idx)=>(
                <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'rgba(10,22,14,0.7)',borderRadius:9,border:'1px solid var(--glass-border)'}}>
                  <span style={{fontSize:12.5,color:'var(--text-secondary)',fontWeight:500}}>{item.ds||item.date||`Day ${idx+1}`}</span>
                  <span style={{fontSize:14.5,fontWeight:700,color:'var(--neon-sage)'}}>₹{(item.yhat||item.predicted_price||item.price||0).toFixed(2)}<span style={{fontSize:10,opacity:0.6}}>/qtl</span></span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </InnerShell>
  );
}

/* ─── Yield Estimation Page ──────────────────────────────────────────────────── */
function YieldEstimationPage({ onBack, lang }) {
  const [form, setForm] = useState({crop_name:'Wheat',soil_type:'loamy',rainfall_mm:500,area_hectare:1,seed_variety:'Local',fertilizer_used:'NPK',state:'Gujarat',model_type:'xgb'});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await estimateYield(formData||form);
      const yieldValue=data.predicted_yield??data.yield??data.prediction??data.estimated_yield;
      const yieldPerHa=data.yield_per_hectare??data.yield_per_ha;
      const confidence=data.confidence??data.probability;
      if(yieldValue!=null&&!isNaN(yieldValue)){
        const area=formData?.area_hectare||form.area_hectare;
        const r={yield:parseFloat(yieldValue),yieldPerHectare:yieldPerHa?parseFloat(yieldPerHa):null,confidence,totalYield:parseFloat(yieldValue)*area};
        setResult(r);
        const confPct=confidence?` with ${(confidence*100).toFixed(0)}% confidence`:'';
        const spokenText=`Yield estimation for ${formData.crop_name} in ${formData.state}: your ${area} hectare field is estimated to produce ${r.totalYield.toFixed(0)} kilograms, that is ${(r.totalYield/100).toFixed(1)} quintals${confPct}.`;
        speak(spokenText,LANGS[lang]?.code); setLoading(false); return {spokenText};
      } else { setError(`Could not extract yield. Response: ${JSON.stringify(data,null,2)}`); }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  const fields=[{label:'Crop',key:'crop_name',type:'select',opts:['Wheat','Rice','Maize','Pulses','Sugarcane','Millet']},{label:'Soil Type',key:'soil_type',type:'select',opts:['loamy','clay','sandy','black soil']},{label:'Rainfall (mm)',key:'rainfall_mm',type:'number'},{label:'Area (hectare)',key:'area_hectare',type:'number',step:0.1},{label:'Seed Variety',key:'seed_variety',type:'select',opts:['Local','Hybrid','HYV','DroughtResistant']},{label:'Fertilizer',key:'fertilizer_used',type:'select',opts:['NPK','Organic','Mixed','Low']},{label:'State',key:'state',type:'select',opts:['Gujarat','Maharashtra','UP','Punjab','Bihar']}];

  return (
    <InnerShell onBack={onBack} accentColor="#fbbf24" emoji="🌿" title="Yield Estimation" subtitle="XGBoost ML harvest prediction" pageType="yield" currentForm={form}>
      <VoiceAssistantButton pageType="yield" color="#fbbf24" lang={lang}
        hint="What is my rice yield with loamy soil in Punjab, 200 acres?"
        onFormFilled={p=>setForm(prev=>({...prev,...p}))}
        onSubmit={async p=>{const m={...form,...p};setForm(m);return await runSubmit(m);}}/>
      <div className="gd"/>
      <FieldGrid fields={fields} form={form} setForm={setForm}/>
      <div style={{display:'flex',gap:12,marginTop:22}}>
        <button onClick={()=>runSubmit(form)} disabled={loading} className="btn-neon" style={{flex:1,padding:'15px 24px',fontSize:12,background:'var(--amber)',boxShadow:'0 0 18px rgba(251,191,36,0.32)',color:'#08120a'}}>
          {loading?<><Loader size={16} className="a-sp"/> Estimating…</>:<><Brain size={16}/> Run Yield Estimation</>}
        </button>
        {result && <button onClick={()=>exportToPDF('Yield Estimation',{form,result},'yield')} className="btn-ghost-g" style={{padding:'15px 18px'}}><Download size={16}/> Export</button>}
      </div>
      <ErrorBox error={error}/>
      {result?.yield!=null && (
        <div className="a-fu result-amber" style={{marginTop:24,padding:28}}>
          <h3 className="df" style={{fontSize:17,fontWeight:700,color:'var(--text-primary)',marginBottom:24}}>📊 Yield Results</h3>
          <div style={{textAlign:'center',paddingBottom:24,borderBottom:'1px solid rgba(251,191,36,0.2)',marginBottom:22}}>
            <Target size={40} style={{color:'var(--amber)',marginBottom:10}} className="a-fl"/>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:8}}>Estimated Total Yield</p>
            <p className="df" style={{fontSize:58,fontWeight:700,color:'var(--text-primary)',lineHeight:1}}>
              {result.totalYield.toFixed(0)}<span style={{fontSize:24,color:'var(--amber)',marginLeft:4}}>kg</span>
            </p>
            <p style={{fontSize:15,color:'var(--text-secondary)',marginTop:6}}>({(result.totalYield/100).toFixed(2)} quintals)</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:4}}>
            <div style={{padding:'16px 18px',background:'rgba(10,22,14,0.6)',border:'1px solid var(--glass-border)',borderRadius:12}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:6}}>Yield / Hectare</p>
              <p className="df" style={{fontSize:24,fontWeight:700,color:'var(--neon-sage)'}}>{(result.yieldPerHectare||result.yield).toFixed(0)} <span style={{fontSize:12,color:'var(--text-secondary)',fontWeight:400}}>kg/ha</span></p>
            </div>
            <div style={{padding:'16px 18px',background:'rgba(10,22,14,0.6)',border:'1px solid var(--glass-border)',borderRadius:12}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:6}}>Area</p>
              <p className="df" style={{fontSize:24,fontWeight:700,color:'var(--amber)'}}>{form.area_hectare} <span style={{fontSize:12,color:'var(--text-secondary)',fontWeight:400}}>ha</span></p>
              <p style={{fontSize:11,color:'var(--text-secondary)',marginTop:3}}>{(form.area_hectare*2.471).toFixed(1)} acres</p>
            </div>
          </div>
          <ConfidenceMeter confidence={result.confidence}/>
        </div>
      )}
    </InnerShell>
  );
}

/* ─── Crop Recommendation Page ───────────────────────────────────────────────── */
function CropRecommendationPage({ onBack, lang }) {
  const [form, setForm] = useState({soil_type:'loamy',rainfall_mm:500,temperature_c:25,area_hectare:1,state:'Gujarat',season:'Kharif',previous_crop:'Wheat'});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await recommendCrop(formData||form);
      const rec=data.recommended_crop||data.prediction||data.crop||data.recommended;
      const conf=data.confidence||data.probability;
      if(rec){
        setResult({recommended_crop:rec,confidence:conf});
        const confPct=conf?` with ${(conf*100).toFixed(0)}% confidence`:'';
        const spokenText=`Based on conditions in ${formData.state} during ${formData.season} season, the recommended crop is ${rec}${confPct}.`;
        speak(spokenText,LANGS[lang]?.code); setLoading(false); return {spokenText};
      } else { setError(`Could not find crop. Keys: ${Object.keys(data).join(', ')}`); }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  const fields=[{label:'Soil Type',key:'soil_type',type:'select',opts:['loamy','clay','sandy','black soil']},{label:'Rainfall (mm)',key:'rainfall_mm',type:'number'},{label:'Temperature (°C)',key:'temperature_c',type:'number'},{label:'Area (hectare)',key:'area_hectare',type:'number',step:0.1},{label:'State',key:'state',type:'select',opts:['Gujarat','Maharashtra','Punjab','UP']},{label:'Season',key:'season',type:'select',opts:['Kharif','Rabi','Zaid']},{label:'Previous Crop',key:'previous_crop',type:'select',opts:['Wheat','Rice','Cotton','Pulses','Groundnut']}];

  return (
    <InnerShell onBack={onBack} accentColor="#10b981" emoji="🌱" title="Crop Recommendation" subtitle="AI-powered soil & season analysis" pageType="recommendation" currentForm={form}>
      <VoiceAssistantButton pageType="recommendation" color="#10b981" lang={lang}
        hint="Which crop for sandy soil in Gujarat, Kharif season, 500 acres?"
        onFormFilled={p=>setForm(prev=>({...prev,...p}))}
        onSubmit={async p=>{const m={...form,...p};setForm(m);return await runSubmit(m);}}/>
      <div className="gd"/>
      <FieldGrid fields={fields} form={form} setForm={setForm}/>
      <div style={{display:'flex',gap:12,marginTop:22}}>
        <button onClick={()=>runSubmit(form)} disabled={loading} className="btn-neon" style={{flex:1,padding:'15px 24px',fontSize:12,background:'var(--emerald)',boxShadow:'0 0 18px rgba(16,185,129,0.32)',color:'#08120a'}}>
          {loading?<><Loader size={16} className="a-sp"/> Analyzing…</>:<><Brain size={16}/> Get Crop Recommendation</>}
        </button>
        {result && <button onClick={()=>exportToPDF('Crop Recommendation',{form,result},'recommendation')} className="btn-ghost-g" style={{padding:'15px 18px'}}><Download size={16}/> Export</button>}
      </div>
      <ErrorBox error={error}/>
      {result?.recommended_crop && (
        <div className="a-fu result-sage" style={{marginTop:24,padding:32,textAlign:'center'}}>
          <h3 className="df" style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:24,textAlign:'left'}}>🌱 AI Recommendation</h3>
          <Sprout size={48} style={{color:'var(--neon-sage)',marginBottom:14}} className="a-fl"/>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.10em',textTransform:'uppercase',color:'var(--text-secondary)',marginBottom:10}}>Recommended Crop</p>
          <p className="df" style={{fontSize:52,fontWeight:700,color:'var(--neon-sage)',lineHeight:1,marginBottom:4}}>{result.recommended_crop}</p>
          <div style={{display:'flex',justifyContent:'center',gap:10,flexWrap:'wrap',marginTop:16}}>
            <span className="badge-sage">🌤 {form.season}</span>
            <span className="badge-amber">📍 {form.state}</span>
            <span className="badge-teal">🌱 {form.soil_type}</span>
          </div>
          <div style={{textAlign:'left',marginTop:4}}><ConfidenceMeter confidence={result.confidence}/></div>
        </div>
      )}
    </InnerShell>
  );
}

/* ─── App Root ───────────────────────────────────────────────────────────────── */
export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser]               = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [lang, setLang]               = useState('en');

  useEffect(() => {
    const setup = async () => {
      await initializeFirebase();
      if (auth) {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthInitialized(true); });
        return () => unsub();
      } else setAuthInitialized(true);
    };
    setup();
  }, []);

  const handleLogin = async () => {
    try {
      if (!auth || !googleProvider) {
        await initializeFirebase();
        if (!auth || !googleProvider) { alert('Firebase not initialized. Please refresh the page.'); return; }
      }
      const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      setUser((await signInWithPopup(auth,googleProvider)).user);
    } catch(e) { alert(`Login failed: ${e.message}`); }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(auth); setUser(null);
    } catch(e) { alert(`Logout failed: ${e.message}`); }
  };

  if (!authInitialized) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-deep)',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,borderRadius:'50%',border:'3px solid var(--glass-border)',borderTop:'3px solid var(--neon-sage)',animation:'m-spin 0.9s linear infinite'}}/>
      <p style={{fontFamily:'DM Sans,sans-serif',fontSize:14,color:'var(--text-secondary)',letterSpacing:'0.05em'}}>Initializing KrushiConnect…</p>
    </div>
  );

  const pageProps = { lang };
  switch (currentPage) {
    case 'price':          return <PricePredictionPage    onBack={()=>setCurrentPage('landing')} {...pageProps}/>;
    case 'yield':          return <YieldEstimationPage    onBack={()=>setCurrentPage('landing')} {...pageProps}/>;
    case 'recommendation': return <CropRecommendationPage onBack={()=>setCurrentPage('landing')} {...pageProps}/>;
    case 'marketplace':    return <Marketplace onBack={()=>setCurrentPage('landing')} user={user} onLogin={handleLogin}/>;
    case 'coop':           return <CoopGroupBuying onBack={()=>setCurrentPage('landing')} user={user} onLogin={handleLogin}/>;
    case 'govtnews':       return <GovtNewsHub onBack={()=>setCurrentPage('landing')}/>;
    default: return <LandingPage onNavigate={setCurrentPage} user={user} onLogin={handleLogin} onLogout={handleLogout} lang={lang} setLang={setLang}/>;
  }
}


