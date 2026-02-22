import React, { useState, useEffect } from 'react';
import { Sprout, TrendingUp, Target, LogIn, LogOut, User, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpvcnbGOqMv13OfOsaXIt48uf9akPlejo",
  authDomain: "krushiconnect12.firebaseapp.com",
  projectId: "krushiconnect12",
  storageBucket: "krushiconnect12.firebasestorage.app",
  messagingSenderId: "701793260800",
  appId: "1:701793260800:web:2d4ebcac9ed2745ad04fe5",
  measurementId: "G-KRXX3E1DGS"
};

let auth = null;
let googleProvider = null;
let firebaseInitialized = false;

const initializeFirebase = async () => {
  if (firebaseInitialized) return;
  try {
    const firebase = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const firebaseAuth = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const app = firebase.initializeApp(firebaseConfig);
    auth = firebaseAuth.getAuth(app);
    googleProvider = new firebaseAuth.GoogleAuthProvider();
    firebaseInitialized = true;
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
};

const API_BASE = 'http://localhost:5000/api';

const predictPrice = async (data) => {
  const response = await fetch(`${API_BASE}/predict_price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
};

const estimateYield = async (data) => {
  const response = await fetch(`${API_BASE}/estimate_yield`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
};

const recommendCrop = async (data) => {
  const response = await fetch(`${API_BASE}/recommend_crop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return await response.json();
};

function ChartDisplay({ data, title }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((item, idx) => ({
    day: item.ds || item.date || `Day ${idx + 1}`,
    price: parseFloat(item.yhat || item.predicted_price || item.price || 0)
  }));

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-lg border-2 border-blue-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} interval={Math.floor(chartData.length / 10)} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Price (₹/qtl)', angle: -90, position: 'insideLeft' }} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} formatter={(value) => [`₹${value.toFixed(2)}/qtl`, 'Price']} />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Predicted Price" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function LandingPage({ onNavigate, user, onLogin, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-green-700">🌾 KrushiConnect</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="flex items-center gap-2 text-gray-700 font-medium">
                  <User size={20} />
                  <span className="hidden sm:inline">{user.displayName || user.email}</span>
                </span>
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md">
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button onClick={onLogin} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md">
                <LogIn size={18} />
                <span className="hidden sm:inline">Login with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">Smart Agricultural Predictions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Leverage AI and machine learning to make informed decisions about crop prices, yield estimation, and crop recommendations</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex justify-center mb-4">
              <TrendingUp size={48} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Price Prediction</h3>
            <p className="text-gray-600 mb-6 text-center">Forecast crop prices using Prophet and LSTM models for different markets</p>
            <button onClick={() => onNavigate('price')} className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-md">
              Predict Prices
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Target size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Yield Estimation</h3>
            <p className="text-gray-600 mb-6 text-center">Estimate crop yield based on soil, rainfall, and area using XGBoost</p>
            <button onClick={() => onNavigate('yield')} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors shadow-md">
              Estimate Yield
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex justify-center mb-4">
              <Sprout size={48} className="text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Crop Recommendation</h3>
            <p className="text-gray-600 mb-6 text-center">Get AI-powered recommendations for the best crop for your land</p>
            <button onClick={() => onNavigate('recommendation')} className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold transition-colors shadow-md">
              Get Recommendations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricePredictionPage({ onBack }) {
  const [form, setForm] = useState({ crop_name: 'Wheat', market: 'Delhi', model_type: 'prophet', periods: 30 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const crops = ['Wheat', 'Rice', 'Groundnut', 'Millet'];
  const markets = ['Delhi', 'Mumbai', 'Rajkot', 'Ahmedabad'];

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictPrice(form);
      if (data && (data.forecast || data.predictions || data.results)) {
        setResult({ forecast: data.forecast || data.predictions || data.results });
      } else if (Array.isArray(data)) {
        setResult({ forecast: data });
      } else {
        setError(`API returned data in unexpected format. Response keys: ${Object.keys(data).join(', ')}`);
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the Flask server is running on port 5000.');
      console.error('Prediction error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-6 px-5 py-2 text-blue-700 hover:text-blue-900 font-bold transition-colors bg-white rounded-lg shadow-md">← Back to Home</button>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={32} />
            Crop Price Prediction
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Crop Name</label>
                <select value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                  {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Market</label>
                <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                  {markets.map(market => <option key={market} value={market}>{market}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Model Type</label>
                <select value={form.model_type} onChange={(e) => setForm({ ...form, model_type: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none">
                  <option value="prophet">Prophet (Best Performance)</option>
                  <option value="lstm">LSTM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Forecast Days</label>
                <input type="number" value={form.periods} onChange={(e) => setForm({ ...form, periods: parseInt(e.target.value) || 30 })} min="1" max="90" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md">
              {loading ? 'Predicting...' : 'Predict Price'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {result && result.forecast && (
            <>
              <ChartDisplay data={result.forecast} title="📊 Price Forecast Chart" />
              <div className="mt-6 p-6 bg-green-50 rounded-lg border-2 border-green-300">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Detailed Forecast Data</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {result.forecast.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-gray-700 font-semibold">{item.ds || item.date || `Day ${idx + 1}`}</span>
                      <span className="font-bold text-green-700">₹{(item.yhat || item.predicted_price || item.price || 0).toFixed(2)}/qtl</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-4 font-medium">Showing first 10 predictions • Total: {result.forecast.length} days</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function YieldEstimationPage({ onBack }) {
  const [form, setForm] = useState({
    crop_name: 'Wheat',
    soil_type: 'loamy',
    rainfall_mm: 500,
    area_hectare: 1,
    seed_variety: 'Local',
    fertilizer_used: 'NPK',
    state: 'Gujarat',
    model_type: 'xgb'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await estimateYield(form);
      console.log('API Response:', data); // Debug log

      let yieldValue = null;
      let yieldPerHectare = null;
      let confidence = null;

      // Try to extract yield value from different possible response formats
      if (typeof data === 'number') {
        yieldValue = data;
      } else if (data && typeof data === 'object') {
        yieldValue = data.predicted_yield ?? data.yield ?? data.prediction ?? data.estimated_yield;
        yieldPerHectare = data.yield_per_hectare ?? data.yield_per_ha;
        confidence = data.confidence ?? data.probability;
      }

      if (yieldValue !== null && yieldValue !== undefined && !isNaN(yieldValue)) {
        setResult({
          yield: parseFloat(yieldValue),
          yieldPerHectare: yieldPerHectare ? parseFloat(yieldPerHectare) : null,
          confidence,
          totalYield: parseFloat(yieldValue) * form.area_hectare
        });
      } else {
        setError(`Could not extract yield value from response. Received: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the Flask server is running on port 5000.');
      console.error('Estimation error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-6 px-5 py-2 text-green-700 hover:text-green-900 font-bold transition-colors bg-white rounded-lg shadow-md">
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Target className="text-green-600" size={32} />
            Yield Estimation (XGBoost Model)
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Crop</label>
                <select value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Maize">Maize</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Millet">Millet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Soil Type</label>
                <select value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                  <option value="loamy">Loamy</option>
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="black soil">Black Soil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rainfall (mm)</label>
                <input type="number" value={form.rainfall_mm} onChange={(e) => setForm({ ...form, rainfall_mm: parseFloat(e.target.value) || 0 })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Area (hectare)</label>
                <input type="number" step="0.1" value={form.area_hectare} onChange={(e) => setForm({ ...form, area_hectare: parseFloat(e.target.value) || 0 })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Seed Variety</label>
                <select value={form.seed_variety} onChange={(e) => setForm({ ...form, seed_variety: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                  <option value="Local">Local</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="HYV">HYV</option>
                  <option value="DroughtResistant">Drought Resistant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fertilizer</label>
                <select value={form.fertilizer_used} onChange={(e) => setForm({ ...form, fertilizer_used: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                  <option value="NPK">NPK</option>
                  <option value="Organic">Organic</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 outline-none">
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="UP">UP</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Bihar">Bihar</option>
                </select>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md">
              {loading ? 'Estimating...' : 'Estimate Yield (XGBoost)'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700 font-medium">Error parsing response</p>
              </div>
              <pre className="text-xs text-red-600 overflow-auto mt-2 p-2 bg-white rounded">{error}</pre>
            </div>
          )}

          {result && result.yield !== undefined && result.yield !== null && (
            <div className="mt-8 p-6 bg-green-50 rounded-lg border-2 border-green-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Yield Estimation Results</h3>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="space-y-6">
                  {/* Main Yield Display */}
                  <div className="text-center border-b pb-6">
                    <Target size={56} className="text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-semibold text-lg mb-2">Estimated Total Yield</p>
                    <p className="text-5xl font-bold text-green-700 mb-2">
                      {result.totalYield.toFixed(2)} <span className="text-3xl">kg</span>
                    </p>
                    <p className="text-2xl text-gray-500">
                      ({(result.totalYield / 100).toFixed(2)} quintals)
                    </p>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium mb-1">Yield per Hectare</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {result.yieldPerHectare ? result.yieldPerHectare.toFixed(2) : result.yield.toFixed(2)} kg/ha
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ({result.yieldPerHectare ? (result.yieldPerHectare / 100).toFixed(2) : (result.yield / 100).toFixed(2)} qtl/ha)
                      </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 font-medium mb-1">Cultivation Area</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {form.area_hectare} hectare{form.area_hectare !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        ({(form.area_hectare * 2.471).toFixed(2)} acres)
                      </p>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  {result.confidence && (
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600 font-medium mb-1">Prediction Confidence</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">Input Parameters:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="font-medium">Crop:</span> {form.crop_name}</div>
                      <div><span className="font-medium">Soil:</span> {form.soil_type}</div>
                      <div><span className="font-medium">Rainfall:</span> {form.rainfall_mm} mm</div>
                      <div><span className="font-medium">Seed:</span> {form.seed_variety}</div>
                      <div><span className="font-medium">Fertilizer:</span> {form.fertilizer_used}</div>
                      <div><span className="font-medium">State:</span> {form.state}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CropRecommendationPage({ onBack }) {
  const [form, setForm] = useState({ soil_type: 'loamy', rainfall_mm: 500, temperature_c: 25, area_hectare: 1, state: 'Gujarat', season: 'Kharif', previous_crop: 'Wheat' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await recommendCrop(form);
      let recommendedCrop = null;
      let confidence = null;
      if (typeof data === 'string') {
        recommendedCrop = data;
      } else if (data && typeof data === 'object') {
        recommendedCrop = data.recommended_crop || data.prediction || data.crop || data.recommended || data.result;
        confidence = data.confidence || data.probability;
        if (!recommendedCrop) {
          setError(`Could not find crop in response. Keys: ${Object.keys(data).join(', ')}`);
        }
      }
      if (recommendedCrop) {
        setResult({ recommended_crop: recommendedCrop, confidence });
      } else {
        setError(`Response structure: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setError('Failed to connect to API. Make sure the Flask server is running on port 5000.');
      console.error('Recommendation error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="mb-6 px-5 py-2 text-yellow-700 hover:text-yellow-900 font-bold transition-colors bg-white rounded-lg shadow-md">← Back to Home</button>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <Sprout className="text-yellow-600" size={32} />
            Crop Recommendation
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Soil Type</label>
                <select value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none">
                  <option value="loamy">Loamy</option>
                  <option value="clay">Clay</option>
                  <option value="sandy">Sandy</option>
                  <option value="black soil">Black Soil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Rainfall (mm)</label>
                <input type="number" value={form.rainfall_mm} onChange={(e) => setForm({ ...form, rainfall_mm: parseFloat(e.target.value) || 0 })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Temperature (°C)</label>
                <input type="number" value={form.temperature_c} onChange={(e) => setForm({ ...form, temperature_c: parseFloat(e.target.value) || 0 })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Area (hectare)</label>
                <input type="number" step="0.1" value={form.area_hectare} onChange={(e) => setForm({ ...form, area_hectare: parseFloat(e.target.value) || 0 })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none">
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Punjab">Punjab</option>
                  <option value="UP">UP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Season</label>
                <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none">
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Previous Crop</label>
                <select value={form.previous_crop} onChange={(e) => setForm({ ...form, previous_crop: e.target.value })} className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-yellow-500 outline-none">
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Groundnut">Groundnut</option>
                </select>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md">
              {loading ? 'Getting Recommendation...' : 'Get Recommendation'}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-700 font-medium">Error parsing response</p>
              </div>
              <pre className="text-xs text-red-600 overflow-auto mt-2 p-2 bg-white rounded">{error}</pre>
            </div>
          )}

          {result && result.recommended_crop && (
            <div className="mt-8 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4">🌱 Recommendation Results</h3>
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center">
                  <Sprout size={48} className="text-yellow-600 mx-auto mb-3" />
                  <p className="text-gray-700 font-semibold text-lg mb-2">Recommended Crop:</p>
                  <p className="text-4xl font-bold text-yellow-700 mb-3">{result.recommended_crop}</p>
                  {result.confidence && <p className="text-base text-gray-600 font-medium">Confidence: {(result.confidence * 100).toFixed(1)}%</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      await initializeFirebase();
      if (auth) {
        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          setUser(u);
          setAuthInitialized(true);
        });
        return () => unsubscribe();
      } else {
        setAuthInitialized(true);
      }
    };
    setupAuth();
  }, []);

  const handleLogin = async () => {
    try {
      if (!auth || !googleProvider) {
        alert('Firebase authentication is not initialized. Please refresh the page.');
        return;
      }
      const { signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error('Login error:', err);
      alert(`Login failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      if (!auth) {
        alert('Firebase authentication is not initialized.');
        return;
      }
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      alert(`Logout failed: ${err.message}`);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'price':
        return <PricePredictionPage onBack={() => setCurrentPage('landing')} />;
      case 'yield':
        return <YieldEstimationPage onBack={() => setCurrentPage('landing')} />;
      case 'recommendation':
        return <CropRecommendationPage onBack={() => setCurrentPage('landing')} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} user={user} onLogin={handleLogin} onLogout={handleLogout} />;
    }
  };

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <div className="font-sans antialiased">{renderPage()}</div>;
}