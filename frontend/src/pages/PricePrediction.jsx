import React, { useState } from 'react';
import axios from 'axios';
import ChartDisplay from '../components/ChartDisplay';

const PricePrediction = () => {
    const [crop, setCrop] = useState('Wheat');
    const [market, setMarket] = useState('Ahmedabad');
    const [modelType, setModelType] = useState('prophet');
    const [periods, setPeriods] = useState(30);
    const [forecast, setForecast] = useState([]);

    const handleSubmit = async () => {
        try {
            const payload = {
                crop_name: crop,
                market: market,
                model_type: modelType,
                periods: periods
            };
            const res = await axios.post(`${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/predict_price`, payload);
            // Prophet returns {forecast:[{ds:'2025-...','yhat':123}]}
            if (res.data.forecast) {
                if (modelType === 'prophet') {
                    setForecast(res.data.forecast.map(f => ({ date: f.ds, price: f.yhat })));
                } else {
                    setForecast(res.data.forecast.map(f => ({ date: `Step ${f.step}`, price: f.predicted_price })));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crop Price Prediction</h1>
            <div className="flex flex-wrap gap-4 mb-4">
                <input value={crop} onChange={e => setCrop(e.target.value)} placeholder="Crop" className="border p-2 rounded" />
                <input value={market} onChange={e => setMarket(e.target.value)} placeholder="Market" className="border p-2 rounded" />
                <select value={modelType} onChange={e => setModelType(e.target.value)} className="border p-2 rounded">
                    <option value="prophet">Prophet</option>
                    <option value="lstm">LSTM</option>
                </select>
                <input type="number" value={periods} onChange={e => setPeriods(e.target.value)} className="border p-2 rounded w-24" />
                <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Predict</button>
            </div>
            {forecast.length > 0 && (
                <ChartDisplay data={forecast} xKey="date" yKey="price" title="Predicted Prices" />
            )}
        </div>
    );
};

export default PricePrediction;
