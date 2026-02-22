# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.price_predictor import PricePredictor
from services.yield_estimator import YieldEstimator
from services.crop_recommendation import CropRecommender

app = Flask(__name__)
CORS(app)

# Initialize services
price_predictor = PricePredictor()
yield_estimator = YieldEstimator()
crop_recommender = CropRecommender()

@app.route('/api/predict_price', methods=['POST'])
def predict_price():
    try:
        payload = request.json
        print(f"Price prediction request: {payload}")
        res = price_predictor.predict(payload)
        print(f"Price prediction response: {res}")
        return jsonify(res), 200
    except Exception as e:
        print(f"Error in predict_price: {e}")
        return jsonify({'error': str(e), 'forecast': []}), 500

@app.route('/api/estimate_yield', methods=['POST'])
def estimate_yield():
    try:
        payload = request.json
        print(f"Yield estimation request: {payload}")
        res = yield_estimator.predict(payload)
        print(f"Yield estimation response: {res}")
        
        # Ensure response has class_index
        if 'class_index' not in res and 'prediction' in res:
            res['class_index'] = res['prediction']
        
        return jsonify(res), 200
    except Exception as e:
        print(f"Error in estimate_yield: {e}")
        # Return fallback response
        return jsonify({
            'class_index': 1,  # Medium yield as fallback
            'confidence': 0.5,
            'error': str(e)
        }), 200

@app.route('/api/recommend_crop', methods=['POST'])
def recommend_crop():
    try:
        payload = request.json
        print(f"Crop recommendation request: {payload}")
        res = crop_recommender.predict(payload)
        print(f"Crop recommendation response: {res}")
        
        # Ensure response has recommended_crop
        if 'recommended_crop' not in res:
            if 'prediction' in res:
                res['recommended_crop'] = res['prediction']
            elif 'crop' in res:
                res['recommended_crop'] = res['crop']
        
        return jsonify(res), 200
    except Exception as e:
        print(f"Error in recommend_crop: {e}")
        return jsonify({
            'recommended_crop': 'Wheat',  # Fallback
            'confidence': 0.5,
            'error': str(e)
        }), 200

@app.route('/api/ping')
def ping():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    print("="*50)
    print("Starting Flask Server on port 5000")
    print("="*50)
    app.run(debug=True, host='0.0.0.0', port=5000)