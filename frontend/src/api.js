const API_BASE = "http://localhost:5000/api";  // adjust if backend deployed elsewhere

export async function predictPrice(payload) {
    const res = await fetch(`${API_BASE}/predict_price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function estimateYield(payload) {
    const res = await fetch(`${API_BASE}/estimate_yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function recommendCrop(payload) {
    const res = await fetch(`${API_BASE}/recommend_crop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return res.json();
}
