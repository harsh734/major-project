import React, { useState, useEffect } from 'react';
import {
  MapPin, Wind, Droplets, Thermometer, Eye,
  CloudRain, Sun, Cloud, CloudSnow, Zap,
  RefreshCw, AlertCircle, ChevronRight, Wheat
} from 'lucide-react';

/* ─── Styles ─────────────────────────────────────────────────────────────────── */
const _style = document.createElement('style');
_style.textContent = `
  .wx-card {
    background: var(--glass-base);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--glass-border);
    border-radius: 1.5rem;
    transition: border-color 0.25s ease;
  }

  .wx-day-pill {
    padding: 12px 10px; border-radius: 12px;
    background: rgba(10,22,14,0.65);
    border: 1px solid var(--glass-border);
    text-align: center; flex: 1;
    transition: all 0.2s ease; cursor: default;
  }
  .wx-day-pill:hover { border-color: var(--glass-border-h); background: rgba(10,22,14,0.9); }
  .wx-day-pill.today {
    background: rgba(74,222,128,0.08);
    border-color: rgba(74,222,128,0.3);
  }

  .wx-crop-tip {
    padding: 11px 14px; border-radius: 11px;
    background: rgba(10,22,14,0.65);
    border: 1px solid var(--glass-border);
    display: flex; align-items: flex-start; gap: 10px;
    transition: border-color 0.2s;
  }
  .wx-crop-tip:hover { border-color: var(--glass-border-h); }

  .wx-stat {
    padding: 12px 14px; border-radius: 11px;
    background: rgba(10,22,14,0.65);
    border: 1px solid var(--glass-border);
    display: flex; align-items: center; gap: 10px;
  }

  @keyframes wx-spin { to { transform: rotate(360deg); } }
  @keyframes wx-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .wx-animate { animation: wx-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both; }

  .wx-temp-big {
    font-family: 'Fraunces', serif;
    font-size: 56px; font-weight: 700; line-height: 1;
    letter-spacing: -0.03em;
  }

  .wx-rain-bar { height: 4px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; margin-top: 5px; }
  .wx-rain-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#60a5fa88,#60a5fa); transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

  .wx-location-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 99px;
    background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.22);
    color: var(--neon-sage); font-family: 'DM Sans',sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
    cursor: pointer; transition: all 0.2s ease;
  }
  .wx-location-btn:hover { background: rgba(74,222,128,0.14); border-color: rgba(74,222,128,0.4); }

  .wx-refresh-btn {
    padding: 7px; border-radius: 9px;
    background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border);
    color: var(--text-muted); cursor: pointer; display: flex;
    align-items: center; transition: all 0.2s;
  }
  .wx-refresh-btn:hover { color: var(--text-secondary); background: rgba(255,255,255,0.08); }
`;
if (!document.getElementById('wx-styles')) { _style.id = 'wx-styles'; document.head.appendChild(_style); }

/* ─── Weather condition helpers ──────────────────────────────────────────────── */
function getConditionMeta(condition = '', isDay = true) {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || c.includes('storm'))
    return { icon:'⛈️', color:'#a78bfa', label:'Thunderstorm', bg:'rgba(167,139,250,0.08)' };
  if (c.includes('snow') || c.includes('sleet') || c.includes('blizzard'))
    return { icon:'❄️', color:'#93c5fd', label:'Snow',          bg:'rgba(147,197,253,0.08)' };
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower'))
    return { icon:'🌧️', color:'#60a5fa', label:'Rainy',         bg:'rgba(96,165,250,0.08)' };
  if (c.includes('fog') || c.includes('mist') || c.includes('haze'))
    return { icon:'🌫️', color:'#94a3b8', label:'Foggy',         bg:'rgba(148,163,184,0.08)' };
  if (c.includes('cloud') || c.includes('overcast'))
    return { icon:'⛅', color:'#94a3b8',  label:'Cloudy',        bg:'rgba(148,163,184,0.08)' };
  if (c.includes('clear') || c.includes('sunny'))
    return isDay
      ? { icon:'☀️', color:'#fbbf24', label:'Sunny',   bg:'rgba(251,191,36,0.08)' }
      : { icon:'🌙', color:'#93c5fd', label:'Clear Night', bg:'rgba(147,197,253,0.08)' };
  return { icon:'🌤️', color:'#4ade80', label:'Partly Cloudy', bg:'rgba(74,222,128,0.08)' };
}

/* ─── Farming advice based on weather ───────────────────────────────────────── */
function getFarmingTips(condition = '', tempC, rainPct) {
  const c = condition.toLowerCase();
  const tips = [];

  if (rainPct > 60)
    tips.push({ icon:'💧', color:'#60a5fa', tip:'High rain likely — avoid pesticide spraying today. Wait 24h after rain.' });
  else if (rainPct > 30)
    tips.push({ icon:'🌦️', color:'#60a5fa', tip:'Moderate rain chance — hold off on irrigation to conserve water.' });
  else if (rainPct < 10 && tempC > 32)
    tips.push({ icon:'🚿', color:'#fbbf24', tip:'Hot & dry — irrigate crops in the early morning or evening.' });

  if (c.includes('thunder') || c.includes('storm'))
    tips.push({ icon:'⚡', color:'#a78bfa', tip:'Storm alert — secure equipment and avoid field work today.' });

  if (tempC > 38)
    tips.push({ icon:'🌡️', color:'#f87171', tip:'Extreme heat — risk of heat stress for vegetables and pulses.' });
  else if (tempC < 10)
    tips.push({ icon:'🥶', color:'#93c5fd', tip:'Cold spell — protect sensitive crops from frost damage tonight.' });

  if (c.includes('fog') || c.includes('mist'))
    tips.push({ icon:'🌫️', color:'#94a3b8', tip:'Foggy conditions — fungal disease risk higher. Monitor crops closely.' });

  if (tips.length === 0)
    tips.push({ icon:'✅', color:'#4ade80', tip:'Good farming weather — suitable for field work and spraying.' });

  return tips.slice(0, 2);
}

function cToF(c) { return Math.round(c * 9/5 + 32); }
function fToC(f) { return Math.round((f - 32) * 5/9); }

/* ─── Main WeatherWidget ─────────────────────────────────────────────────────── */
export default function WeatherWidget({ onNavigate }) {
  const [weather,   setWeather]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [locName,   setLocName]   = useState('');
  const [unit,      setUnit]      = useState('C'); // C or F
  const [lastFetch, setLastFetch] = useState(null);

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true); setError('');
    try {
      // Open-Meteo — free, no API key needed
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code,is_day` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code` +
        `&timezone=auto&forecast_days=5`;

      const res  = await fetch(url);
      const data = await res.json();

      const wmoToCondition = (code) => {
        if ([0].includes(code))              return 'Clear sky';
        if ([1,2,3].includes(code))          return 'Partly cloudy';
        if ([45,48].includes(code))          return 'Fog';
        if ([51,53,55,61,63,65].includes(code)) return 'Rain';
        if ([71,73,75,77].includes(code))    return 'Snow';
        if ([80,81,82].includes(code))       return 'Rain showers';
        if ([95,96,99].includes(code))       return 'Thunderstorm';
        return 'Cloudy';
      };

      const cur = data.current;
      const daily = data.daily;

      setWeather({
        temp:      Math.round(cur.temperature_2m),
        humidity:  cur.relative_humidity_2m,
        wind:      Math.round(cur.wind_speed_10m),
        rainPct:   cur.precipitation_probability,
        condition: wmoToCondition(cur.weather_code),
        isDay:     cur.is_day === 1,
        forecast:  daily.time.map((date, i) => ({
          date,
          day:     new Date(date).toLocaleDateString('en-IN', { weekday:'short' }),
          high:    Math.round(daily.temperature_2m_max[i]),
          low:     Math.round(daily.temperature_2m_min[i]),
          rainPct: daily.precipitation_probability_max[i],
          condition: wmoToCondition(daily.weather_code[i]),
        })).slice(0, 5),
      });
      setLocName(name);
      setLastFetch(new Date());
    } catch (e) {
      setError('Could not load weather. Check your connection.');
    }
    setLoading(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported by your browser.'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        // Reverse geocode with Open-Meteo's timezone name as fallback
        let name = 'Your Location';
        try {
          const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const geoData = await geo.json();
          name = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Your Location';
        } catch {}
        fetchWeather(lat, lon, name);
      },
      () => {
        // Fallback to a default Indian location (Delhi)
        setError('Location access denied. Showing weather for Delhi.');
        fetchWeather(28.6139, 77.2090, 'New Delhi');
      }
    );
  };

  // Auto-fetch on mount with geolocation
  useEffect(() => { getLocation(); }, []);

  const displayTemp = (tempC) => unit === 'C' ? `${tempC}°C` : `${cToF(tempC)}°F`;

  if (loading && !weather) {
    return (
      <div style={{ marginTop:40 }}>
        <SectionHeader/>
        <div className="wx-card" style={{ padding:32, textAlign:'center' }}>
          <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid var(--glass-border)', borderTop:'3px solid var(--neon-sage)', animation:'wx-spin 0.9s linear infinite', margin:'0 auto 12px' }}/>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>Detecting your location…</p>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div style={{ marginTop:40 }}>
        <SectionHeader/>
        <div className="wx-card" style={{ padding:24, display:'flex', gap:12, alignItems:'flex-start' }}>
          <AlertCircle size={18} style={{ color:'var(--red-alert)', flexShrink:0, marginTop:2 }}/>
          <div>
            <p style={{ fontSize:13, color:'var(--red-alert)', fontWeight:700, marginBottom:6 }}>{error}</p>
            <button onClick={getLocation} className="wx-location-btn">
              <MapPin size={12}/> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const meta     = getConditionMeta(weather.condition, weather.isDay);
  const farmTips = getFarmingTips(weather.condition, weather.temp, weather.rainPct);
  const tempDisplay = unit === 'C' ? `${weather.temp}°` : `${cToF(weather.temp)}°`;

  return (
    <div style={{ marginTop:44 }} className="wx-animate">
      <SectionHeader locName={locName} onRefresh={getLocation} loading={loading}
        unit={unit} onUnitToggle={() => setUnit(u => u==='C'?'F':'C')} lastFetch={lastFetch}/>

      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>

        {/* ── Left: Current conditions ── */}
        <div className="wx-card" style={{ padding:'26px 28px', background:`linear-gradient(135deg, var(--glass-base), ${meta.bg})` }}>
          {/* Top row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Current Weather</p>
              <div style={{ display:'flex', alignItems:'flex-end', gap:12 }}>
                <div className="wx-temp-big" style={{ color: meta.color }}>{tempDisplay}</div>
                <div style={{ marginBottom:8 }}>
                  <span style={{ fontSize:14, color: meta.color, fontWeight:700 }}>{unit}</span>
                  <span style={{ color:'var(--text-muted)', margin:'0 4px' }}>·</span>
                  <button onClick={() => setUnit(u => u==='C'?'F':'C')}
                    style={{ fontSize:12, color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif', fontWeight:600 }}>
                    switch to °{unit==='C'?'F':'C'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize:15, color:'var(--text-primary)', fontWeight:600, marginTop:4 }}>{meta.label}</p>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
                <MapPin size={11} style={{ color:'var(--text-muted)' }}/>
                <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{locName || 'Detecting…'}</span>
              </div>
            </div>
            <div style={{ fontSize:56, lineHeight:1, filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{meta.icon}</div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
            {[
              { icon:<Droplets size={13}/>,    label:'Humidity',   value:`${weather.humidity}%`,      color:'#60a5fa' },
              { icon:<Wind size={13}/>,         label:'Wind',       value:`${weather.wind} km/h`,      color:'#94a3b8' },
              { icon:<CloudRain size={13}/>,    label:'Rain Chance',value:`${weather.rainPct}%`,       color:'#60a5fa' },
            ].map(s => (
              <div key={s.label} className="wx-stat">
                <span style={{ color:s.color }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{s.value}</p>
                  <p style={{ fontSize:9.5, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 5-day forecast */}
          <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>5-Day Forecast</p>
          <div style={{ display:'flex', gap:7 }}>
            {weather.forecast.map((d, i) => {
              const dm = getConditionMeta(d.condition, true);
              return (
                <div key={d.date} className={`wx-day-pill ${i===0?'today':''}`}>
                  <p style={{ fontSize:10, fontWeight:700, color: i===0?'var(--neon-sage)':'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>
                    {i===0 ? 'Today' : d.day}
                  </p>
                  <div style={{ fontSize:18, marginBottom:6 }}>{dm.icon}</div>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)' }}>{displayTemp(d.high)}</p>
                  <p style={{ fontSize:10.5, color:'var(--text-muted)' }}>{displayTemp(d.low)}</p>
                  {d.rainPct > 0 && (
                    <div style={{ marginTop:5 }}>
                      <p style={{ fontSize:9, color:'#60a5fa', fontWeight:700 }}>{d.rainPct}%</p>
                      <div className="wx-rain-bar"><div className="wx-rain-fill" style={{ width:`${d.rainPct}%` }}/></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Farming tips ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Farming advice header */}
          <div className="wx-card" style={{ padding:'20px 22px', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Wheat size={16} style={{ color:'var(--neon-sage)' }}/>
              </div>
              <div>
                <p className="df" style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>Farming Advice</p>
                <p style={{ fontSize:11, color:'var(--text-muted)' }}>Based on today's weather</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {farmTips.map((tip, i) => (
                <div key={i} className="wx-crop-tip">
                  <span style={{ fontSize:18, flexShrink:0, lineHeight:1.3 }}>{tip.icon}</span>
                  <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.6 }}>{tip.tip}</p>
                </div>
              ))}
            </div>

            {/* Sowing suitability */}
            <div style={{ marginTop:14, padding:'12px 14px', borderRadius:11, background: weather.rainPct < 20 && weather.temp < 36 ? 'rgba(74,222,128,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${weather.rainPct < 20 && weather.temp < 36 ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}` }}>
              <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.09em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:5 }}>Sowing Suitability</p>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: weather.rainPct < 20 && weather.temp < 36 ? '#4ade80' : '#fbbf24', flexShrink:0 }}/>
                <p style={{ fontSize:12.5, fontWeight:700, color: weather.rainPct < 20 && weather.temp < 36 ? 'var(--neon-sage)' : 'var(--amber)' }}>
                  {weather.rainPct < 20 && weather.temp < 36
                    ? 'Good conditions for field work today'
                    : weather.rainPct > 50
                    ? 'Heavy rain expected — delay sowing'
                    : 'Moderate conditions — use judgment'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick links to AI tools */}
          <div className="wx-card" style={{ padding:'16px 18px' }}>
            <p style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:11 }}>Weather-Aware AI Tools</p>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {[
                { label:'Predict crop prices', page:'price',          emoji:'📈', color:'#4ade80' },
                { label:'Estimate yield',       page:'yield',          emoji:'🌿', color:'#fbbf24' },
                { label:'Get crop advice',      page:'recommendation', emoji:'🌱', color:'#10b981' },
              ].map(l => (
                <button key={l.page} onClick={() => onNavigate?.(l.page)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, background:'rgba(10,22,14,0.6)', border:'1px solid var(--glass-border)', cursor:'pointer', transition:'all 0.18s', textAlign:'left', width:'100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--glass-border-h)'; e.currentTarget.style.background='rgba(10,22,14,0.9)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--glass-border)'; e.currentTarget.style.background='rgba(10,22,14,0.6)'; }}>
                  <span style={{ fontSize:16 }}>{l.emoji}</span>
                  <span style={{ fontSize:12.5, color:'var(--text-secondary)', fontWeight:600, flex:1 }}>{l.label}</span>
                  <ChevronRight size={13} style={{ color:'var(--text-muted)' }}/>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────────── */
function SectionHeader({ locName, onRefresh, loading, unit, onUnitToggle, lastFetch }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
      <div>
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'4px 12px', borderRadius:99, background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.22)', marginBottom:8 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#60a5fa', display:'inline-block' }}/>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.10em', textTransform:'uppercase', color:'#60a5fa' }}>Live Weather</span>
        </div>
        <h2 className="df" style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>
          {locName ? `${locName} Weather` : 'Local Weather'}
        </h2>
        {lastFetch && (
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
            Updated {lastFetch.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
          </p>
        )}
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button onClick={onRefresh} className="wx-refresh-btn" disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'wx-spin 0.9s linear infinite' : 'none' }}/>
        </button>
      </div>
    </div>
  );
}