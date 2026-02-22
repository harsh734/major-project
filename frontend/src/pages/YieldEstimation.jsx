import React, { useState } from 'react';
import axios from 'axios';

const YieldEstimation = () => {
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
    const [prediction, setPrediction] = useState(null);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            const res = await axios.post('http://localhost:5000/api/estimate_yield', form);
            setPrediction(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Yield Estimation</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <input name="crop_name" value={form.crop_name} onChange={handleChange} placeholder="Crop" className="border p-2 rounded" />
                <input name="soil_type" value={form.soil_type} onChange={handleChange} placeholder="Soil Type" className="border p-2 rounded" />
                <input type="number" name="rainfall_mm" value={form.rainfall_mm} onChange={handleChange} placeholder="Rainfall mm" className="border p-2 rounded" />
                <input type="number" name="area_hectare" value={form.area_hectare} onChange={handleChange} placeholder="Area hectare" className="border p-2 rounded" />
                <input name="seed_variety" value={form.seed_variety} onChange={handleChange} placeholder="Seed Variety" className="border p-2 rounded" />
                <input name="fertilizer_used" value={form.fertilizer_used} onChange={handleChange} placeholder="Fertilizer Used" className="border p-2 rounded" />
                <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="border p-2 rounded" />
                <select name="model_type" value={form.model_type} onChange={handleChange} className="border p-2 rounded">
                    <option value="xgb">XGBoost</option>
                    <option value="rf">RandomForest</option>
                </select>
            </div>
            <button onClick={handleSubmit} className="bg-green-500 text-white px-4 py-2 rounded">Estimate Yield</button>
            {prediction && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p className="font-bold">Predicted Class: {prediction.predicted_class}</p>
                    <p>Class Index: {prediction.class_index}</p>
                </div>
            )}
        </div>
    );
};

export default YieldEstimation;
