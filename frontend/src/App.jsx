import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sprout, TrendingUp, Target, LogIn, LogOut, User, AlertCircle, Mic, Volume2,
         Loader, History, Download, MessageSquare, Globe, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

// ─── Language Config ──────────────────────────────────────────────────────────
const LANGS = {
  en: { label: 'English', code: 'en-IN', flag: '🇬🇧' },
  hi: { label: 'हिंदी',   code: 'hi-IN', flag: '🇮🇳' },
  gu: { label: 'ગુજરાતી', code: 'gu-IN', flag: '🌾' },
};

// ─── speak() – TTS with chosen language ──────────────────────────────────────
function speak(text, langCode = 'en-IN') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langCode;
  utter.rate = 0.95;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
}

// ─── useVoiceRecognition ──────────────────────────────────────────────────────
function useVoiceRecognition() {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SpeechRecognitionAPI =
    typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = Boolean(SpeechRecognitionAPI);

  const listen = useCallback((onDone, langCode = 'en-IN') => {
    if (!supported) { alert('Speech recognition not supported. Use Chrome.'); return; }
    if (recRef.current) recRef.current.abort();
    const rec = new SpeechRecognitionAPI();
    rec.lang = langCode;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => { if (onDone) onDone(e.results[0][0].transcript); };
    recRef.current = rec;
    rec.start();
  }, [supported, SpeechRecognitionAPI]);

  const stop = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);
  useEffect(() => () => recRef.current?.abort(), []);
  return { listening, supported, listen, stop };
}

// ─── NLP Parser (position-based, multi-language) ─────────────────────────────
function parseVoiceInput(transcript, pageType) {
  const t = transcript.toLowerCase();

  function bestMatch(map) {
    let bestPos = -1, bestLen = 0, bestVal = null;
    for (const [keyword, value] of Object.entries(map)) {
      let pos = -1, searchFrom = 0;
      while (true) {
        const idx = t.indexOf(keyword, searchFrom);
        if (idx === -1) break;
        const before = idx === 0 ? ' ' : t[idx - 1];
        const after  = idx + keyword.length >= t.length ? ' ' : t[idx + keyword.length];
        if (!/[a-z\u0900-\u097f\u0a80-\u0aff]/.test(before) && !/[a-z\u0900-\u097f\u0a80-\u0aff]/.test(after))
          pos = idx;
        searchFrom = idx + 1;
      }
      if (pos === -1) continue;
      if (pos > bestPos || (pos === bestPos && keyword.length > bestLen)) {
        bestPos = pos; bestLen = keyword.length; bestVal = value;
      }
    }
    return bestVal;
  }

  const wordNums = {
    zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
    eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,
    eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,
    seventy:70,eighty:80,ninety:90,hundred:100,thousand:1000,
    // Hindi numbers
    'ek':1,'do':2,'teen':3,'char':4,'paanch':5,'chhe':6,'saat':7,'aath':8,'nau':9,
    'das':10,'sau':100,'hazaar':1000,'bees':20,'tees':30,'chalees':40,'pachas':50,
  };

  function wordsToNum(str) {
    const direct = str.match(/[\d]+\.?[\d]*/);
    if (direct) return parseFloat(direct[0]);
    let total = 0, current = 0;
    str.split(/\s+/).forEach(w => {
      const n = wordNums[w];
      if (n === undefined) return;
      if (n === 100) { current = (current || 1) * 100; }
      else if (n === 1000) { total += (current || 1) * 1000; current = 0; }
      else { current += n; }
    });
    return total + current || null;
  }

  function extractNumber(patterns) {
    for (const pat of patterns) {
      const m = t.match(pat);
      if (m) { const n = wordsToNum(m[1] || m[0]); if (n && n > 0) return n; }
    }
    return null;
  }

  // ── Crop map: English + Hindi + Gujarati ─────────────────────────────────
  const cropMap = {
    'wheat':'Wheat','gehun':'Wheat','gehu':'Wheat','gandum':'Wheat',
    'rice':'Rice','paddy':'Rice','chawal':'Rice','dhan':'Rice','dhaanu':'Rice',
    'maize':'Maize','corn':'Maize','makka':'Maize','makki':'Maize','makkai':'Maize',
    'pulses':'Pulses','dal':'Pulses','lentil':'Pulses','lentils':'Pulses',
    'chana':'Pulses','moong':'Pulses','urad':'Pulses','toor':'Pulses',
    'sugarcane':'Sugarcane','sugar cane':'Sugarcane','ganna':'Sugarcane','sherdee':'Sugarcane',
    'millet':'Millet','bajra':'Millet','jowar':'Millet','sorghum':'Millet','jwari':'Millet',
    'groundnut':'Groundnut','peanut':'Groundnut','moongfali':'Groundnut','singdana':'Groundnut',
    'cotton':'Cotton','kapas':'Cotton','kapasiya':'Cotton',
    'soybean':'Soybean','soya':'Soybean',
  };

  // ── State map ────────────────────────────────────────────────────────────
  const stateMap = {
    'gujarat':'Gujarat','gujarati':'Gujarat','gujrat':'Gujarat',
    'maharashtra':'Maharashtra',
    'punjab':'Punjab',
    'uttar pradesh':'UP',' up ':'UP',
    'bihar':'Bihar',
  };

  // ── Soil map ────────────────────────────────────────────────────────────
  const soilMap = {
    'black cotton soil':'black soil','black soil':'black soil','kali mitti':'black soil',
    'regur':'black soil','kali':'black soil',
    'loamy':'loamy','loam':'loamy','domat':'loamy','domad':'loamy',
    'clayey':'clay','clay':'clay','chikni mitti':'clay',
    'sandy':'sandy','sand':'sandy','retalee':'sandy','ret':'sandy',
  };

  // ── Area ─────────────────────────────────────────────────────────────────
  let area_hectare = null;
  const aAcre  = t.match(/(\d+\.?\d*)\s*(acre|acres|ekad|ekad)/);
  const aHa    = t.match(/(\d+\.?\d*)\s*(hectare|hectares|ha\b|hektar)/);
  const aBigha = t.match(/(\d+\.?\d*)\s*(bigha|bighas|vigha)/);
  if (aAcre)       area_hectare = parseFloat(aAcre[1]) * 0.4047;
  else if (aHa)    area_hectare = parseFloat(aHa[1]);
  else if (aBigha) area_hectare = parseFloat(aBigha[1]) * 0.2529;
  if (area_hectare) area_hectare = Math.round(area_hectare * 100) / 100;

  // ── Rainfall ─────────────────────────────────────────────────────────────
  const rainfall = extractNumber([
    /(\d+\.?\d*)\s*(mm|millimeter|millimetre)/,
    /rainfall\D{0,10}?(\d+)/,
    /rain\D{0,10}?(\d+)/,
    /varsha\D{0,10}?(\d+)/,
  ]);

  const crop  = bestMatch(cropMap);
  const soil  = bestMatch(soilMap);
  const state = bestMatch(stateMap);

  // ── Price page ────────────────────────────────────────────────────────────
  if (pageType === 'price') {
    const marketMap = {
      'delhi':'Delhi','new delhi':'Delhi','dilli':'Delhi',
      'mumbai':'Mumbai','bombay':'Mumbai',
      'rajkot':'Rajkot',
      'ahmedabad':'Ahmedabad','amdavad':'Ahmedabad',
    };
    const market = bestMatch(marketMap);
    const periodsMatch = t.match(/(\d+)\s*(day|days|din)/);
    const periods = periodsMatch ? parseInt(periodsMatch[1]) : null;
    const model_type = t.includes('lstm') ? 'lstm' : 'prophet';
    return {
      ...(crop    && { crop_name: crop }),
      ...(market  && { market }),
      ...(periods && { periods }),
      model_type,
    };
  }

  // ── Yield page ────────────────────────────────────────────────────────────
  if (pageType === 'yield') {
    const seedMap = {
      'high yielding variety':'HYV','high yield variety':'HYV','hyv':'HYV',
      'hybrid':'Hybrid','sankar':'Hybrid',
      'drought resistant':'DroughtResistant','drought resistance':'DroughtResistant',
      'drought':'DroughtResistant','sukhad':'DroughtResistant',
      'local variety':'Local','local':'Local','desi':'Local','deshu':'Local',
    };
    const fertMap = {
      'npk':'NPK','n p k':'NPK',
      'organic':'Organic','jeevamrut':'Organic','compost':'Organic','jaivik':'Organic',
      'mixed fertilizer':'Mixed','mixed':'Mixed',
      'low fertilizer':'Low','less fertilizer':'Low','low':'Low','thodu':'Low',
    };
    return {
      ...(crop         && { crop_name: crop }),
      ...(soil         && { soil_type: soil }),
      ...(rainfall     && { rainfall_mm: rainfall }),
      ...(area_hectare && { area_hectare }),
      ...(bestMatch(seedMap) && { seed_variety: bestMatch(seedMap) }),
      ...(bestMatch(fertMap) && { fertilizer_used: bestMatch(fertMap) }),
      ...(state        && { state }),
    };
  }

  // ── Recommendation page ───────────────────────────────────────────────────
  if (pageType === 'recommendation') {
    const seasonMap = {
      'kharif':'Kharif','khareef':'Kharif','monsoon season':'Kharif','monsoon':'Kharif',
      'rainy season':'Kharif','barsaat':'Kharif','varsha':'Kharif','choma':'Kharif',
      'rabi':'Rabi','winter season':'Rabi','winter':'Rabi','sardi':'Rabi','shiyaada':'Rabi',
      'zaid':'Zaid','summer season':'Zaid','summer':'Zaid','garmi':'Zaid','ugno':'Zaid',
    };
    const season = bestMatch(seasonMap);
    const tempMatch = t.match(/(\d+\.?\d*)\s*(degree|celsius|°c|centigrade|digri)/);
    const temperature_c = tempMatch ? parseFloat(tempMatch[1]) : null;
    const prevPhrases = {};
    for (const [kw, val] of Object.entries(cropMap)) {
      ['after ','last ','previous ','grew ','had ','pehle ','pahele '].forEach(p => {
        prevPhrases[p + kw] = val;
      });
    }
    const prevCrop = bestMatch(prevPhrases);
    return {
      ...(soil          && { soil_type: soil }),
      ...(rainfall      && { rainfall_mm: rainfall }),
      ...(temperature_c && { temperature_c }),
      ...(area_hectare  && { area_hectare }),
      ...(state         && { state }),
      ...(season        && { season }),
      ...(prevCrop      && { previous_crop: prevCrop }),
    };
  }

  return {};
}

// ─── ConfidenceMeter ──────────────────────────────────────────────────────────
function ConfidenceMeter({ confidence }) {
  if (!confidence) return null;
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm font-semibold mb-1">
        <span style={{ color }}>Confidence</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          style={{ width: `${pct}%`, background: color, transition: 'width 1s ease' }}
          className="h-full rounded-full"
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">
        {pct >= 80 ? '✅ High confidence' : pct >= 60 ? '⚠️ Moderate confidence' : '❌ Low confidence — consider verifying'}
      </p>
    </div>
  );
}

// ─── VoiceHistory ─────────────────────────────────────────────────────────────
function VoiceHistory({ history, onReplay, onClear }) {
  const [open, setOpen] = useState(false);
  if (!history.length) return null;
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
      >
        <History size={15} />
        Voice History ({history.length})
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {history.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">{item.time}</p>
                  <p className="text-sm text-gray-700 truncate">"{item.transcript}"</p>
                </div>
                <button
                  onClick={() => onReplay(item)}
                  className="ml-2 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex-shrink-0"
                >
                  🔊 Replay
                </button>
              </div>
            ))}
          </div>
          <button onClick={onClear} className="w-full py-2 text-xs text-red-400 hover:text-red-600 bg-gray-50">
            Clear History
          </button>
        </div>
      )}
    </div>
  );
}

// ─── VoiceAssistantButton ─────────────────────────────────────────────────────
function VoiceAssistantButton({ pageType, onFormFilled, onSubmit, color = '#16a34a', hint, lang = 'en' }) {
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
      setLastTranscript(spoken);
      setPhase('parsing');
      const time = new Date().toLocaleTimeString();

      try {
        const parsed = parseVoiceInput(spoken, pageType);
        if (onFormFilled) onFormFilled(parsed);
        await new Promise(r => setTimeout(r, 400));
        setPhase('speaking');
        const result = await onSubmit(parsed);
        if (result?.spokenText) {
          speak(result.spokenText, langCode);
          setHistory(h => [{ transcript: spoken, result: result.spokenText, time }, ...h.slice(0, 9)]);
        }
      } catch (e) {
        setErrorMsg('Could not process. Please try again.');
        speak('Sorry, could not process that. Please try again.', langCode);
      } finally {
        setTimeout(() => setPhase('idle'), 3000);
      }
    }, langCode);
  };

  const replayItem = (item) => speak(item.result, langCode);

  const phaseConfig = {
    idle:      { label: 'Ask by Voice',   bg: color,     pulse: false },
    listening: { label: 'Listening…',     bg: '#dc2626', pulse: true  },
    parsing:   { label: 'Understanding…', bg: '#d97706', pulse: true  },
    speaking:  { label: 'Speaking Result',bg: '#7c3aed', pulse: false },
  };
  const cfg = phaseConfig[phase] || phaseConfig.idle;

  if (!supported) return <p className="text-xs text-gray-400 text-center">🎤 Voice requires Chrome</p>;

  return (
    <div className="my-4">
      <VoiceHistory history={history} onReplay={replayItem} onClear={() => setHistory([])} />

      {hint && phase === 'idle' && (
        <p className="text-xs text-gray-400 text-center mb-2 italic">e.g. "{hint}"</p>
      )}

      <button
        onClick={handleClick}
        style={{ background: cfg.bg, animation: cfg.pulse ? 'voicePulse 1.2s ease-in-out infinite' : 'none' }}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300 hover:opacity-90 active:scale-95"
      >
        {phase === 'idle'      && <Mic size={22} />}
        {phase === 'listening' && <Mic size={22} className="animate-bounce" />}
        {phase === 'parsing'   && <Loader size={22} className="animate-spin" />}
        {phase === 'speaking'  && <Volume2 size={22} />}
        {cfg.label}
      </button>

      {lastTranscript && (
        <div className="mt-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          <span className="font-semibold text-gray-400 text-xs uppercase">You said: </span>
          "{lastTranscript}"
        </div>
      )}
      {errorMsg && <p className="mt-1 text-xs text-red-500 text-center">{errorMsg}</p>}
      {phase === 'parsing'  && <p className="mt-1 text-xs text-amber-600 text-center animate-pulse">🤖 Parsing your request…</p>}
      {phase === 'speaking' && <p className="mt-1 text-xs text-purple-600 text-center">🔊 Speaking the result…</p>}

      <style>{`@keyframes voicePulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 14px rgba(220,38,38,0)}}`}</style>
    </div>
  );
}

// ─── ChatPanel – floating chat Q&A on each page ───────────────────────────────
function ChatPanel({ pageType, currentForm }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! Ask me anything about your inputs or results.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const FAQ = {
    price: {
      'what is prophet': 'Prophet is a forecasting model by Meta, great for time-series data with seasonal patterns.',
      'what is lstm': 'LSTM (Long Short-Term Memory) is a neural network model good at learning patterns from sequences.',
      'how accurate': 'Accuracy depends on historical data quality. Prophet generally performs better for seasonal crops.',
      'what is quintal': 'A quintal is 100 kg. Prices are shown in ₹ per quintal.',
    },
    yield: {
      'what is hyv': 'HYV = High Yielding Variety. These seeds are bred for maximum output.',
      'what is xgboost': 'XGBoost is a powerful machine learning algorithm using gradient boosting trees.',
      'convert acres': `Your current area is ${currentForm?.area_hectare || '?'} hectares. 1 hectare = 2.47 acres.`,
      'best fertilizer': 'NPK (Nitrogen-Phosphorus-Potassium) is the most commonly recommended balanced fertilizer.',
    },
    recommendation: {
      'what is kharif': 'Kharif crops are sown in June-July with monsoon rains. Examples: Rice, Cotton, Maize.',
      'what is rabi': 'Rabi crops are grown in winter (Oct-Nov). Examples: Wheat, Mustard, Pulses.',
      'what is zaid': 'Zaid crops grow between Rabi and Kharif (March-June). Examples: Watermelon, Cucumber.',
      'best soil': 'Loamy soil is generally best for most crops — it has good drainage and nutrients.',
    },
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setInput('');

    const q = userMsg.toLowerCase();
    const faqBank = FAQ[pageType] || {};
    let answer = null;

    for (const [key, val] of Object.entries(faqBank)) {
      if (q.includes(key)) { answer = val; break; }
    }

    if (!answer) {
      // Generic smart responses
      if (q.includes('area') || q.includes('hectare') || q.includes('acre'))
        answer = `Your area is set to ${currentForm?.area_hectare || '?'} hectares (${((currentForm?.area_hectare || 0) * 2.47).toFixed(1)} acres).`;
      else if (q.includes('state') || q.includes('location'))
        answer = `You are set to ${currentForm?.state || '?'}.`;
      else if (q.includes('crop'))
        answer = `Current crop: ${currentForm?.crop_name || currentForm?.previous_crop || 'not set'}.`;
      else
        answer = "I can answer questions about your inputs, models, and farming terms. Try asking about 'Prophet', 'HYV', 'Kharif', or your current settings!";
    }

    setTimeout(() => setMessages(m => [...m, { role: 'bot', text: answer }]), 400);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-600 text-white shadow-xl flex items-center justify-center hover:bg-green-700 transition-colors"
        title="Ask a question"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: 400 }}>
          <div className="bg-green-600 text-white px-4 py-3 font-bold text-sm flex items-center gap-2">
            <MessageSquare size={16} /> KrushiConnect Assistant
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  m.role === 'user' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-gray-200 p-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything…"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-green-400"
            />
            <button onClick={handleSend} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportToPDF(title, data, pageType) {
  const content = [];
  content.push(`KrushiConnect – ${title}`);
  content.push(`Generated: ${new Date().toLocaleString()}`);
  content.push('─'.repeat(50));

  if (pageType === 'yield' && data.result) {
    content.push(`Crop: ${data.form.crop_name}`);
    content.push(`State: ${data.form.state}`);
    content.push(`Area: ${data.form.area_hectare} hectares`);
    content.push(`Rainfall: ${data.form.rainfall_mm} mm`);
    content.push(`Soil: ${data.form.soil_type}`);
    content.push('─'.repeat(50));
    content.push(`Estimated Total Yield: ${data.result.totalYield.toFixed(2)} kg`);
    content.push(`Yield per Hectare: ${(data.result.yieldPerHectare || data.result.yield).toFixed(2)} kg/ha`);
    if (data.result.confidence) content.push(`Confidence: ${(data.result.confidence * 100).toFixed(1)}%`);
  }

  if (pageType === 'recommendation' && data.result) {
    content.push(`State: ${data.form.state}`);
    content.push(`Season: ${data.form.season}`);
    content.push(`Soil: ${data.form.soil_type}`);
    content.push('─'.repeat(50));
    content.push(`Recommended Crop: ${data.result.recommended_crop}`);
    if (data.result.confidence) content.push(`Confidence: ${(data.result.confidence * 100).toFixed(1)}%`);
  }

  if (pageType === 'price' && data.result) {
    content.push(`Crop: ${data.form.crop_name}`);
    content.push(`Market: ${data.form.market}`);
    content.push('─'.repeat(50));
    content.push('Forecast (first 15 days):');
    data.result.forecast.slice(0, 15).forEach((item, i) => {
      const price = (item.yhat || item.price || 0).toFixed(2);
      const date  = item.ds || item.date || `Day ${i + 1}`;
      content.push(`  ${date}: ₹${price}/qtl`);
    });
  }

  const blob = new Blob([content.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KrushiConnect_${pageType}_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Language Switcher ────────────────────────────────────────────────────────
function LangSwitcher({ lang, setLang }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Globe size={14} className="text-gray-500 ml-1" />
      {Object.entries(LANGS).map(([key, val]) => (
        <button
          key={key}
          onClick={() => setLang(key)}
          className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
            lang === key ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {val.flag} {val.label}
        </button>
      ))}
    </div>
  );
}

// ─── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCpvcnbGOqMv13OfOsaXIt48uf9akPlejo",
  authDomain: "krushiconnect12.firebaseapp.com",
  projectId: "krushiconnect12",
  storageBucket: "krushiconnect12.firebasestorage.app",
  messagingSenderId: "701793260800",
  appId: "1:701793260800:web:2d4ebcac9ed2745ad04fe5",
  measurementId: "G-KRXX3E1DGS"
};
let auth = null, googleProvider = null, firebaseInitialized = false;
const initializeFirebase = async () => {
  if (firebaseInitialized) return;
  try {
    const firebase     = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const firebaseAuth = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const app = firebase.initializeApp(firebaseConfig);
    auth = firebaseAuth.getAuth(app);
    googleProvider = new firebaseAuth.GoogleAuthProvider();
    firebaseInitialized = true;
  } catch (err) { console.error('Firebase init error:', err); }
};

// ─── API Helpers ──────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';
const predictPrice  = async (d) => (await fetch(`${API_BASE}/predict_price`,  { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) })).json();
const estimateYield = async (d) => (await fetch(`${API_BASE}/estimate_yield`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) })).json();
const recommendCrop = async (d) => (await fetch(`${API_BASE}/recommend_crop`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d) })).json();

// ─── Chart ────────────────────────────────────────────────────────────────────
function ChartDisplay({ data, title }) {
  if (!data?.length) return null;
  const chartData = data.map((item, idx) => ({
    day: item.ds || item.date || `Day ${idx + 1}`,
    price: parseFloat(item.yhat || item.predicted_price || item.price || 0)
  }));
  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={Math.floor(chartData.length / 8)} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: '₹/qtl', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v) => [`₹${v.toFixed(2)}/qtl`, 'Price']} />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Predicted Price" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onNavigate, user, onLogin, onLogout, lang, setLang }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-3xl font-bold text-green-700">🌾 KrushiConnect</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <LangSwitcher lang={lang} setLang={setLang} />
            {user ? (
              <>
                <span className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                  <User size={18} />{user.displayName || user.email}
                </span>
                <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm shadow">
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <button onClick={onLogin} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm shadow">
                <LogIn size={16} /> Login with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-14">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">Smart Agricultural Predictions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            AI-powered decisions for crop prices, yield estimation, and crop recommendations
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['🎤 Hindi & Gujarati Voice', '📜 Voice History', '📊 Confidence Meter', '💬 Chat Q&A', '📥 PDF Export'].map(f => (
              <span key={f} className="px-4 py-2 bg-green-100 border border-green-300 rounded-full text-green-800 font-medium text-sm">{f}</span>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { page: 'price', icon: <TrendingUp size={48} className="text-blue-600" />, title: 'Price Prediction', desc: 'Forecast crop prices using Prophet & LSTM for different markets', btn: 'bg-blue-600 hover:bg-blue-700', label: 'Predict Prices' },
            { page: 'yield', icon: <Target size={48} className="text-green-600" />, title: 'Yield Estimation', desc: 'Estimate crop yield based on soil, rainfall and area using XGBoost', btn: 'bg-green-600 hover:bg-green-700', label: 'Estimate Yield' },
            { page: 'recommendation', icon: <Sprout size={48} className="text-yellow-600" />, title: 'Crop Recommendation', desc: 'Get AI-powered crop suggestions for your land conditions', btn: 'bg-yellow-600 hover:bg-yellow-700', label: 'Get Recommendations' },
          ].map(({ page, icon, title, desc, btn, label }) => (
            <div key={page} className="bg-white rounded-xl shadow-xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1">
              <div className="flex justify-center mb-4">{icon}</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">{title}</h3>
              <p className="text-gray-500 mb-6 text-center text-sm">{desc}</p>
              <button onClick={() => onNavigate(page)} className={`w-full py-3 ${btn} text-white rounded-lg font-bold transition-colors shadow`}>
                {label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Price Prediction Page ────────────────────────────────────────────────────
function PricePredictionPage({ onBack, lang }) {
  const [form, setForm] = useState({ crop_name: 'Wheat', market: 'Delhi', model_type: 'prophet', periods: 30 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError]   = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await predictPrice(formData || form);
      if (data?.forecast || data?.predictions || data?.results) {
        const forecast = data.forecast || data.predictions || data.results;
        setResult({ forecast });
        const first = forecast[0], last = forecast[forecast.length - 1];
        const firstP = (first?.yhat || first?.price || 0).toFixed(0);
        const lastP  = (last?.yhat  || last?.price  || 0).toFixed(0);
        const spokenText = `Price forecast for ${formData.crop_name} in ${formData.market}: starting at rupees ${firstP} per quintal, reaching rupees ${lastP} after ${forecast.length} days.`;
        speak(spokenText, LANGS[lang]?.code);
        setLoading(false);
        return { spokenText };
      } else {
        setError(`Unexpected API response. Keys: ${Object.keys(data).join(', ')}`);
      }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-4 px-5 py-2 text-blue-700 font-bold bg-white rounded-lg shadow hover:shadow-md">← Back</button>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={32} /> Crop Price Prediction
          </h2>

          <VoiceAssistantButton
            pageType="price" color="#2563eb" lang={lang}
            hint="What will be rice price in Mumbai for next 45 days?"
            onFormFilled={(p) => setForm(prev => ({ ...prev, ...p }))}
            onSubmit={async (p) => { const m = { ...form, ...p }; setForm(m); return await runSubmit(m); }}
          />

          <div className="border-t pt-6 grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Crop Name</label>
              <select value={form.crop_name} onChange={e => setForm({...form, crop_name: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                {['Wheat','Rice','Groundnut','Millet'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Market</label>
              <select value={form.market} onChange={e => setForm({...form, market: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                {['Delhi','Mumbai','Rajkot','Ahmedabad'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Model Type</label>
              <select value={form.model_type} onChange={e => setForm({...form, model_type: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                <option value="prophet">Prophet (Best Performance)</option>
                <option value="lstm">LSTM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Forecast Days</label>
              <input type="number" value={form.periods} onChange={e => setForm({...form, periods: parseInt(e.target.value)||30})} min="1" max="90" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => runSubmit(form)} disabled={loading} className="flex-1 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg disabled:bg-gray-400 transition-colors shadow">
              {loading ? 'Predicting…' : 'Predict Price'}
            </button>
            {result?.forecast && (
              <button
                onClick={() => exportToPDF('Price Prediction', { form, result }, 'price')}
                className="px-4 py-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 flex items-center gap-2 transition-colors"
                title="Export to file"
              >
                <Download size={18} /> Export
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {result?.forecast && (
            <>
              <ChartDisplay data={result.forecast} title="📊 Price Forecast Chart" />
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-gray-800 mb-3">📋 Forecast Data (first 10 days)</h3>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {result.forecast.slice(0,10).map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 bg-white rounded shadow-sm text-sm">
                      <span className="font-semibold text-gray-700">{item.ds || item.date || `Day ${idx+1}`}</span>
                      <span className="font-bold text-green-700">₹{(item.yhat||item.price||0).toFixed(2)}/qtl</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <ChatPanel pageType="price" currentForm={form} />
    </div>
  );
}

// ─── Yield Estimation Page ────────────────────────────────────────────────────
function YieldEstimationPage({ onBack, lang }) {
  const [form, setForm] = useState({
    crop_name:'Wheat', soil_type:'loamy', rainfall_mm:500, area_hectare:1,
    seed_variety:'Local', fertilizer_used:'NPK', state:'Gujarat', model_type:'xgb'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await estimateYield(formData || form);
      const yieldValue = data.predicted_yield ?? data.yield ?? data.prediction ?? data.estimated_yield;
      const yieldPerHa = data.yield_per_hectare ?? data.yield_per_ha;
      const confidence = data.confidence ?? data.probability;

      if (yieldValue != null && !isNaN(yieldValue)) {
        const area = formData?.area_hectare || form.area_hectare;
        const r = { yield: parseFloat(yieldValue), yieldPerHectare: yieldPerHa ? parseFloat(yieldPerHa) : null, confidence, totalYield: parseFloat(yieldValue) * area };
        setResult(r);
        const confPct = confidence ? ` with ${(confidence*100).toFixed(0)}% confidence` : '';
        const spokenText = `Yield estimation for ${formData.crop_name} in ${formData.state}: your ${area} hectare field is estimated to produce ${r.totalYield.toFixed(0)} kilograms, that is ${(r.totalYield/100).toFixed(1)} quintals${confPct}.`;
        speak(spokenText, LANGS[lang]?.code);
        setLoading(false);
        return { spokenText };
      } else {
        setError(`Could not extract yield. Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-4 px-5 py-2 text-green-700 font-bold bg-white rounded-lg shadow hover:shadow-md">← Back</button>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Target className="text-green-600" size={32} /> Yield Estimation
          </h2>

          <VoiceAssistantButton
            pageType="yield" color="#16a34a" lang={lang}
            hint="What is my rice yield with loamy soil in Punjab, 200 acres?"
            onFormFilled={(p) => setForm(prev => ({ ...prev, ...p }))}
            onSubmit={async (p) => { const m = { ...form, ...p }; setForm(m); return await runSubmit(m); }}
          />

          <div className="border-t pt-6 grid md:grid-cols-2 gap-5">
            {[
              { label:'Crop', key:'crop_name', type:'select', opts:['Wheat','Rice','Maize','Pulses','Sugarcane','Millet'] },
              { label:'Soil Type', key:'soil_type', type:'select', opts:['loamy','clay','sandy','black soil'] },
              { label:'Rainfall (mm)', key:'rainfall_mm', type:'number' },
              { label:'Area (hectare)', key:'area_hectare', type:'number', step:0.1 },
              { label:'Seed Variety', key:'seed_variety', type:'select', opts:['Local','Hybrid','HYV','DroughtResistant'] },
              { label:'Fertilizer', key:'fertilizer_used', type:'select', opts:['NPK','Organic','Mixed','Low'] },
              { label:'State', key:'state', type:'select', opts:['Gujarat','Maharashtra','UP','Punjab','Bihar'] },
            ].map(({ label, key, type, opts, step }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                {type === 'select'
                  ? <select value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                      {opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  : <input type="number" step={step||1} value={form[key]} onChange={e => setForm({...form, [key]: parseFloat(e.target.value)||0})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none" />
                }
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => runSubmit(form)} disabled={loading} className="flex-1 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg disabled:bg-gray-400 transition-colors shadow">
              {loading ? 'Estimating…' : 'Estimate Yield'}
            </button>
            {result && (
              <button onClick={() => exportToPDF('Yield Estimation', { form, result }, 'yield')} className="px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 flex items-center gap-2">
                <Download size={18} /> Export
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex gap-2 mb-2"><AlertCircle className="text-red-600" size={20}/><p className="text-red-700 font-medium">Error</p></div>
              <pre className="text-xs text-red-600 overflow-auto p-2 bg-white rounded">{error}</pre>
            </div>
          )}

          {result?.yield != null && (
            <div className="mt-6 p-6 bg-green-50 rounded-xl border-2 border-green-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Yield Results</h3>
              <div className="bg-white rounded-xl p-6 space-y-5">
                <div className="text-center border-b pb-5">
                  <Target size={48} className="text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold mb-1">Estimated Total Yield</p>
                  <p className="text-5xl font-bold text-green-700">{result.totalYield.toFixed(0)} <span className="text-3xl">kg</span></p>
                  <p className="text-xl text-gray-500 mt-1">({(result.totalYield/100).toFixed(2)} quintals)</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">Yield per Hectare</p>
                    <p className="text-2xl font-bold text-blue-700">{(result.yieldPerHectare||result.yield).toFixed(0)} kg/ha</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 font-medium mb-1">Area</p>
                    <p className="text-2xl font-bold text-yellow-700">{form.area_hectare} ha</p>
                    <p className="text-sm text-gray-500">({(form.area_hectare * 2.471).toFixed(1)} acres)</p>
                  </div>
                </div>
                <ConfidenceMeter confidence={result.confidence} />
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatPanel pageType="yield" currentForm={form} />
    </div>
  );
}

// ─── Crop Recommendation Page ─────────────────────────────────────────────────
function CropRecommendationPage({ onBack, lang }) {
  const [form, setForm] = useState({ soil_type:'loamy', rainfall_mm:500, temperature_c:25, area_hectare:1, state:'Gujarat', season:'Kharif', previous_crop:'Wheat' });
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState(null);

  const runSubmit = async (formData) => {
    setLoading(true); setError(null); setResult(null);
    try {
      const data = await recommendCrop(formData || form);
      const rec  = data.recommended_crop || data.prediction || data.crop || data.recommended;
      const conf = data.confidence || data.probability;
      if (rec) {
        setResult({ recommended_crop: rec, confidence: conf });
        const confPct = conf ? ` with ${(conf*100).toFixed(0)}% confidence` : '';
        const spokenText = `Based on conditions in ${formData.state} during ${formData.season} season, the recommended crop is ${rec}${confPct}.`;
        speak(spokenText, LANGS[lang]?.code);
        setLoading(false);
        return { spokenText };
      } else {
        setError(`Could not find crop. Keys: ${Object.keys(data).join(', ')}`);
      }
    } catch { setError('Failed to connect. Make sure Flask server is on port 5000.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-4 px-5 py-2 text-yellow-700 font-bold bg-white rounded-lg shadow hover:shadow-md">← Back</button>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Sprout className="text-yellow-600" size={32} /> Crop Recommendation
          </h2>

          <VoiceAssistantButton
            pageType="recommendation" color="#ca8a04" lang={lang}
            hint="Which crop for sandy soil in Gujarat, Kharif season, 500 acres?"
            onFormFilled={(p) => setForm(prev => ({ ...prev, ...p }))}
            onSubmit={async (p) => { const m = { ...form, ...p }; setForm(m); return await runSubmit(m); }}
          />

          <div className="border-t pt-6 grid md:grid-cols-2 gap-5">
            {[
              { label:'Soil Type', key:'soil_type', type:'select', opts:['loamy','clay','sandy','black soil'] },
              { label:'Rainfall (mm)', key:'rainfall_mm', type:'number' },
              { label:'Temperature (°C)', key:'temperature_c', type:'number' },
              { label:'Area (hectare)', key:'area_hectare', type:'number', step:0.1 },
              { label:'State', key:'state', type:'select', opts:['Gujarat','Maharashtra','Punjab','UP'] },
              { label:'Season', key:'season', type:'select', opts:['Kharif','Rabi','Zaid'] },
              { label:'Previous Crop', key:'previous_crop', type:'select', opts:['Wheat','Rice','Cotton','Pulses','Groundnut'] },
            ].map(({ label, key, type, opts, step }) => (
              <div key={key}>
                <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                {type === 'select'
                  ? <select value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none">
                      {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                    </select>
                  : <input type="number" step={step||1} value={form[key]} onChange={e => setForm({...form, [key]: parseFloat(e.target.value)||0})} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none" />
                }
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <button onClick={() => runSubmit(form)} disabled={loading} className="flex-1 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-lg disabled:bg-gray-400 transition-colors shadow">
              {loading ? 'Getting Recommendation…' : 'Get Recommendation'}
            </button>
            {result && (
              <button onClick={() => exportToPDF('Crop Recommendation', { form, result }, 'recommendation')} className="px-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 flex items-center gap-2">
                <Download size={18} /> Export
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex gap-2 mb-2"><AlertCircle className="text-red-600" size={20}/><p className="text-red-700 font-medium">Error</p></div>
              <pre className="text-xs text-red-600 overflow-auto p-2 bg-white rounded">{error}</pre>
            </div>
          )}

          {result?.recommended_crop && (
            <div className="mt-6 p-6 bg-yellow-50 rounded-xl border-2 border-yellow-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🌱 Recommendation</h3>
              <div className="bg-white rounded-xl p-8">
                <div className="text-center">
                  <Sprout size={48} className="text-yellow-600 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold mb-2">Recommended Crop</p>
                  <p className="text-5xl font-bold text-yellow-700 mb-4">{result.recommended_crop}</p>
                  <ConfidenceMeter confidence={result.confidence} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ChatPanel pageType="recommendation" currentForm={form} />
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser]               = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [lang, setLang]               = useState('en'); // 'en' | 'hi' | 'gu'

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
      if (!auth || !googleProvider) { alert('Firebase not initialized.'); return; }
      const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      setUser((await signInWithPopup(auth, googleProvider)).user);
    } catch (e) { alert(`Login failed: ${e.message}`); }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(auth); setUser(null);
    } catch (e) { alert(`Logout failed: ${e.message}`); }
  };

  if (!authInitialized) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="text-center">
        <div className="animate-spin h-16 w-16 border-b-4 border-green-600 rounded-full mx-auto mb-4" />
        <p className="text-xl text-gray-600">Initializing…</p>
      </div>
    </div>
  );

  const pageProps = { lang };
  switch (currentPage) {
    case 'price':          return <PricePredictionPage  onBack={() => setCurrentPage('landing')} {...pageProps} />;
    case 'yield':          return <YieldEstimationPage  onBack={() => setCurrentPage('landing')} {...pageProps} />;
    case 'recommendation': return <CropRecommendationPage onBack={() => setCurrentPage('landing')} {...pageProps} />;
    default: return <LandingPage onNavigate={setCurrentPage} user={user} onLogin={handleLogin} onLogout={handleLogout} lang={lang} setLang={setLang} />;
  }
}
