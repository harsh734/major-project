import React, { useState } from "react";
import { recommendCrop } from "../api";

export default function CropRecommendation() {
    const [form, setForm] = useState({
        soil_type: "",
        rainfall_mm: "",
        temperature_c: "",
        area_hectare: "",
        state: "",
        season: "",
        previous_crop: ""
    });

    const [result, setResult] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await recommendCrop(form);
        setResult(res);
    };

    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-semibold">🌱 Crop Recommendation</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input className="input" name="soil_type" placeholder="Soil Type" onChange={handleChange} />
                <input className="input" name="rainfall_mm" placeholder="Rainfall (mm)" onChange={handleChange} />
                <input className="input" name="temperature_c" placeholder="Temperature (°C)" onChange={handleChange} />
                <input className="input" name="area_hectare" placeholder="Area (hectare)" onChange={handleChange} />
                <input className="input" name="state" placeholder="State" onChange={handleChange} />
                <input className="input" name="season" placeholder="Season" onChange={handleChange} />
                <input className="input" name="previous_crop" placeholder="Previous Crop" onChange={handleChange} />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md">
                    Recommend
                </button>
            </form>

            {result && result.recommended_crop && (
                <div className="mt-4 p-4 bg-green-100 rounded-md">
                    <h3 className="text-lg font-bold">✅ Recommended Crop:</h3>
                    <p className="text-green-700">{result.recommended_crop}</p>
                </div>
            )}
        </div>
    );
}
