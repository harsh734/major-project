# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.price_predictor import PricePredictor
from services.yield_estimator import YieldEstimator
from services.crop_recommendation import CropRecommender

app = Flask(__name__)
CORS(app)

# Initialize services once at startup
price_predictor  = PricePredictor()
yield_estimator  = YieldEstimator()
crop_recommender = CropRecommender()


# ── Price Prediction ──────────────────────────────────────────────────────────
@app.route('/api/predict_price', methods=['POST'])
def predict_price():
    try:
        payload = request.json or {}
        print(f"[predict_price] request: {payload}")
        res = price_predictor.predict(payload)
        print(f"[predict_price] response: {res}")

        # Return 400 if the service itself reported a user-facing error
        if 'error' in res and 'forecast' not in res:
            return jsonify(res), 400
        return jsonify(res), 200

    except Exception as e:
        print(f"[predict_price] unhandled error: {e}")
        return jsonify({'error': str(e), 'forecast': []}), 500


# ── Yield Estimation ──────────────────────────────────────────────────────────
@app.route('/api/estimate_yield', methods=['POST'])
def estimate_yield():
    try:
        payload = request.json or {}
        print(f"[estimate_yield] request: {payload}")
        res = yield_estimator.predict(payload)
        print(f"[estimate_yield] response: {res}")
        return jsonify(res), 200

    except Exception as e:
        print(f"[estimate_yield] unhandled error: {e}")
        # FIX: Return 500 for genuine server errors, not 200
        return jsonify({
            'error':        str(e),
            'class_index':  1,
            'yield_class':  'Medium (900–2200 kg/ha)',
            'confidence':   0.5,
        }), 500


# ── Crop Recommendation ───────────────────────────────────────────────────────
@app.route('/api/recommend_crop', methods=['POST'])
def recommend_crop():
    try:
        payload = request.json or {}
        print(f"[recommend_crop] request: {payload}")
        res = crop_recommender.predict(payload)
        print(f"[recommend_crop] response: {res}")

        # Normalise key name so frontend always gets 'recommended_crop'
        if 'recommended_crop' not in res:
            res['recommended_crop'] = res.get('prediction') or res.get('crop') or 'Wheat'

        return jsonify(res), 200

    except Exception as e:
        print(f"[recommend_crop] unhandled error: {e}")
        return jsonify({
            'error':            str(e),
            'recommended_crop': 'Wheat',
            'confidence':       0.5,
        }), 500


# ── Health check ──────────────────────────────────────────────────────────────
@app.route('/api/ping')
def ping():
    return jsonify({"status": "ok"}), 200


if __name__ == '__main__':
    print("=" * 50)
    print("Starting Flask Server on port 5000")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)