import os
import joblib
import numpy as np
import pandas as pd

class YieldEstimator:
    def __init__(self, model_dir='models'):
        self.model_dir = model_dir
        self.xgb_path = os.path.join(model_dir, 'yield_xgb_classifier.pkl')
        self.rf_path = os.path.join(model_dir, 'yield_rf_classifier.pkl')
        self.scaler_path = os.path.join(model_dir, 'yield_scaler.pkl')
        self.cols_file = os.path.join(self.model_dir, 'yield_feature_columns.pkl')
        
        # Try to load scaler
        self.scaler = None
        if os.path.exists(self.scaler_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                print("✅ Yield scaler loaded")
            except Exception as e:
                print(f"⚠️ Could not load scaler: {e}")
        
        # Check if models exist
        self.has_models = os.path.exists(self.xgb_path) and os.path.exists(self.rf_path)
        if self.has_models:
            print("✅ YieldEstimator initialized (models available)")
        else:
            print("⚠️ YieldEstimator initialized (using rule-based fallback)")

    def predict(self, payload):
        """Predict yield in kg/hectare"""
        
        # If feature columns file is missing, use rule-based prediction
        if not os.path.exists(self.cols_file):
            print("⚠️ Feature columns file missing, using rule-based prediction")
            return self._rule_based_prediction(payload)
        
        try:
            # Get model type
            model_type = payload.get('model_type', 'xgb')
            
            # Extract features
            rainfall = float(payload.get('rainfall_mm', 400))
            area = float(payload.get('area_hectare', 1.0))
            soil_type = payload.get('soil_type', 'loamy')
            seed_variety = payload.get('seed_variety', 'Local')
            fertilizer_used = payload.get('fertilizer_used', 'NPK')
            crop_name = payload.get('crop_name', 'Wheat')
            state = payload.get('state', 'Gujarat')

            # Build base features with one-hot encoding
            base_features = {
                'rainfall_mm': rainfall,
                'area_hectare': area,
                f'soil_type_{soil_type}': 1,
                f'seed_variety_{seed_variety}': 1,
                f'fertilizer_used_{fertilizer_used}': 1,
                f'crop_name_{crop_name}': 1,
                f'state_{state}': 1
            }

            # Load feature columns
            feature_cols = joblib.load(self.cols_file)
            
            # Create dataframe
            x_row = pd.DataFrame([base_features])
            
            # Add missing columns with 0
            for col in feature_cols:
                if col not in x_row.columns:
                    x_row[col] = 0
            
            # Ensure correct column order
            x_row = x_row[feature_cols]

            # Scale numeric features if scaler is available
            if self.scaler is not None:
                numeric_cols = ['rainfall_mm', 'area_hectare']
                # Only scale if columns exist
                existing_numeric = [c for c in numeric_cols if c in x_row.columns]
                if existing_numeric:
                    x_row[existing_numeric] = self.scaler.transform(x_row[existing_numeric])

            # Load and use model
            if model_type.lower() == 'xgb':
                model = joblib.load(self.xgb_path)
            else:
                model = joblib.load(self.rf_path)
            
            # Get class prediction
            pred_class = int(model.predict(x_row)[0])
            
            # Get probability/confidence if available
            confidence = 0.85
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(x_row)[0]
                confidence = float(proba[pred_class])
            
            # Convert class to actual yield value
            yield_result = self._class_to_yield(
                pred_class, 
                payload, 
                confidence
            )
            
            return yield_result
            
        except Exception as e:
            print(f"❌ Model prediction failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Fall back to rule-based prediction
            print("⚠️ Falling back to rule-based prediction")
            return self._rule_based_prediction(payload)

    def _class_to_yield(self, class_index, payload, confidence):
        """
        Convert predicted class to actual yield value in kg/hectare
        with adjustments based on input parameters
        """
        # Base yield ranges for each class (kg/hectare)
        base_yields = {
            0: 750,   # Low: 500-1000 kg/ha
            1: 1500,  # Medium: 1000-2000 kg/ha
            2: 2750   # High: 2000-3500 kg/ha
        }
        
        # Get base yield for the predicted class
        base_yield = base_yields.get(class_index, 1500)
        
        # Extract input parameters
        rainfall = float(payload.get('rainfall_mm', 500))
        crop_name = payload.get('crop_name', 'Wheat')
        soil_type = payload.get('soil_type', 'loamy')
        seed_variety = payload.get('seed_variety', 'Local')
        fertilizer = payload.get('fertilizer_used', 'NPK')
        state = payload.get('state', 'Gujarat')
        
        # Initialize multiplier
        multiplier = 1.0
        
        # 1. Rainfall adjustment (±15%)
        optimal_rainfall = {
            'Rice': (800, 1200),
            'Wheat': (400, 700),
            'Maize': (500, 800),
            'Sugarcane': (1000, 1500),
            'Millet': (300, 600),
            'Pulses': (400, 700)
        }
        
        if crop_name in optimal_rainfall:
            opt_min, opt_max = optimal_rainfall[crop_name]
            if opt_min <= rainfall <= opt_max:
                multiplier *= 1.15  # Optimal conditions
            elif rainfall < opt_min * 0.7:
                multiplier *= 0.75  # Too dry
            elif rainfall > opt_max * 1.5:
                multiplier *= 0.80  # Too wet
            elif rainfall < opt_min:
                multiplier *= 0.90  # Slightly dry
            else:
                multiplier *= 0.95  # Slightly wet
        
        # 2. Soil type adjustment (±10%)
        soil_quality = {
            'loamy': 1.10,
            'black soil': 1.10,
            'clay': 1.0,
            'sandy': 0.90
        }
        multiplier *= soil_quality.get(soil_type, 1.0)
        
        # 3. Seed variety adjustment (±15%)
        seed_quality = {
            'HYV': 1.15,
            'Hybrid': 1.12,
            'DroughtResistant': 1.05,
            'Local': 0.95
        }
        multiplier *= seed_quality.get(seed_variety, 1.0)
        
        # 4. Fertilizer adjustment (±12%)
        fertilizer_quality = {
            'NPK': 1.12,
            'Mixed': 1.10,
            'Organic': 1.05,
            'Low': 0.88
        }
        multiplier *= fertilizer_quality.get(fertilizer, 1.0)
        
        # 5. State-specific adjustment (±8%)
        state_factors = {
            'Punjab': 1.08,      # High productivity state
            'UP': 1.05,
            'Gujarat': 1.03,
            'Maharashtra': 1.0,
            'Bihar': 0.95
        }
        multiplier *= state_factors.get(state, 1.0)
        
        # 6. Crop-specific base adjustment
        crop_base_adjustment = {
            'Rice': 1.0,
            'Wheat': 1.05,
            'Maize': 1.10,
            'Sugarcane': 1.20,
            'Millet': 0.90,
            'Pulses': 0.85
        }
        multiplier *= crop_base_adjustment.get(crop_name, 1.0)
        
        # Calculate final yield
        predicted_yield = base_yield * multiplier
        
        # Add slight randomness based on confidence (lower confidence = more variation)
        if confidence < 1.0:
            variation_range = (1 - confidence) * 150  # Max ±150 kg variation
            variation = np.random.uniform(-variation_range, variation_range)
            predicted_yield += variation
        
        # Ensure yield is within reasonable bounds
        min_yield = {0: 400, 1: 900, 2: 1800}.get(class_index, 500)
        max_yield = {0: 1100, 1: 2200, 2: 4000}.get(class_index, 3000)
        predicted_yield = max(min_yield, min(predicted_yield, max_yield))
        
        # Round to 2 decimal places
        predicted_yield = round(predicted_yield, 2)
        
        # Prepare response
        classes_map = {
            0: 'Low (400-1100 kg/ha)',
            1: 'Medium (900-2200 kg/ha)',
            2: 'High (1800-4000 kg/ha)'
        }
        
        return {
            'predicted_yield': predicted_yield,
            'yield_per_hectare': predicted_yield,
            'class_index': class_index,
            'yield_class': classes_map.get(class_index, 'Unknown'),
            'confidence': round(confidence, 3),
            'adjustments_applied': {
                'total_multiplier': round(multiplier, 3),
                'rainfall_optimal': opt_min <= rainfall <= opt_max if crop_name in optimal_rainfall else None
            }
        }

    def _rule_based_prediction(self, payload):
        """Rule-based yield prediction when models are unavailable"""
        try:
            # Extract data
            crop_name = payload.get('crop_name', 'Wheat')
            rainfall = float(payload.get('rainfall_mm', 500))
            area = float(payload.get('area_hectare', 1))
            soil_type = payload.get('soil_type', 'loamy')
            seed_variety = payload.get('seed_variety', 'Local')
            fertilizer = payload.get('fertilizer_used', 'NPK')
            state = payload.get('state', 'Gujarat')
            
            print(f"Rule-based prediction for {crop_name}: rainfall={rainfall}, area={area}")
            
            # Calculate score
            score = 0
            
            # Rainfall scoring
            if rainfall < 300:
                score += 0
            elif rainfall < 600:
                score += 1
            elif rainfall < 900:
                score += 2
            else:
                score += 1  # Too much rain can be bad
            
            # Area scoring
            if area < 0.5:
                score += 0
            elif area < 2:
                score += 1
            else:
                score += 2
            
            # Soil type scoring
            soil_scores = {'loamy': 2, 'black soil': 2, 'clay': 1, 'sandy': 0}
            score += soil_scores.get(soil_type, 1)
            
            # Seed variety scoring
            seed_scores = {'HYV': 2, 'Hybrid': 2, 'DroughtResistant': 1, 'Local': 0}
            score += seed_scores.get(seed_variety, 0)
            
            # Fertilizer scoring
            fert_scores = {'NPK': 2, 'Mixed': 2, 'Organic': 1, 'Low': 0}
            score += fert_scores.get(fertilizer, 1)
            
            # Crop-specific adjustments
            if crop_name == 'Rice' and rainfall > 800:
                score += 1
            elif crop_name == 'Wheat' and 400 < rainfall < 700:
                score += 1
            elif crop_name == 'Millet' and rainfall < 500:
                score += 1
            elif crop_name == 'Sugarcane' and rainfall > 1000:
                score += 1
            
            # Determine yield class
            if score <= 3:
                yield_class = 0  # Low
                confidence = 0.70
            elif score <= 7:
                yield_class = 1  # Medium
                confidence = 0.75
            else:
                yield_class = 2  # High
                confidence = 0.80
            
            # Convert to actual yield using the same method
            return self._class_to_yield(yield_class, payload, confidence)
            
        except Exception as e:
            print(f"❌ Rule-based prediction error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                'predicted_yield': 1500.0,
                'yield_per_hectare': 1500.0,
                'class_index': 1,
                'yield_class': 'Medium (900-2200 kg/ha)',
                'confidence': 0.5
            }