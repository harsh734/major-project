import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

class CropRecommender:
    def __init__(self, model_dir='models', data_path='data/crop_recommendation_balanced.csv'):
        self.model_dir = model_dir
        self.data_path = data_path
        self.model_file = os.path.join(model_dir, "crop_recommender.pkl")
        self.model = None

        # Try to load existing model
        if os.path.exists(self.model_file):
            try:
                self.model = joblib.load(self.model_file)
                print("✅ CropRecommender model loaded")
            except Exception as e:
                print(f"⚠️ Could not load model: {e}")
        
        # Try to train if data exists and model doesn't
        elif os.path.exists(data_path):
            try:
                print("📊 Training CropRecommender model...")
                self._train_model()
                print("✅ CropRecommender model trained")
            except Exception as e:
                print(f"⚠️ Could not train model: {e}")
        
        if self.model is None:
            print("⚠️ CropRecommender using rule-based fallback")

    def _train_model(self):
        """Train the model if data is available"""
        # Load data
        df = pd.read_csv(self.data_path)
        target = "recommended_crop"
        X = df.drop(target, axis=1)
        y = df[target]

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Preprocessing
        categorical_cols = [c for c in X.columns if X[c].dtype == "object"]
        numeric_cols = [c for c in X.columns if c not in categorical_cols]

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), numeric_cols),
                ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
            ]
        )

        # Build pipeline
        self.model = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=200, random_state=42))
        ])

        # Train
        self.model.fit(X_train, y_train)
        
        # Save
        os.makedirs(self.model_dir, exist_ok=True)
        joblib.dump(self.model, self.model_file)

    def predict(self, payload):
        """Recommend crop given input payload"""
        
        # If model is available, use it
        if self.model is not None:
            try:
                input_df = pd.DataFrame([payload])
                pred = self.model.predict(input_df)[0]
                
                # Try to get prediction probability for confidence
                confidence = 0.80
                try:
                    proba = self.model.predict_proba(input_df)
                    confidence = float(proba.max())
                except:
                    pass
                
                return {
                    "recommended_crop": pred,
                    "confidence": round(confidence, 2)
                }
            except Exception as e:
                print(f"❌ Model prediction failed: {e}")
                import traceback
                traceback.print_exc()
                
                # Fall back to rule-based
                print("⚠️ Falling back to rule-based recommendation")
                return self._rule_based_recommendation(payload)
        else:
            # Use rule-based prediction
            return self._rule_based_recommendation(payload)

    def _rule_based_recommendation(self, payload):
        """Rule-based crop recommendation"""
        try:
            # Extract data
            soil_type = payload.get('soil_type', 'loamy')
            rainfall = float(payload.get('rainfall_mm', 500))
            temperature = float(payload.get('temperature_c', 25))
            area = float(payload.get('area_hectare', 1))
            state = payload.get('state', 'Gujarat')
            season = payload.get('season', 'Kharif')
            previous_crop = payload.get('previous_crop', 'Wheat')
            
            print(f"Rule-based recommendation: {season} season, rainfall={rainfall}mm")
            
            # Initialize crop scores
            crop_scores = {
                'Rice': 0,
                'Wheat': 0,
                'Cotton': 0,
                'Maize': 0,
                'Sugarcane': 0,
                'Pulses': 0,
                'Groundnut': 0,
                'Millet': 0,
                'Soybean': 0
            }
            
            # Season-based scoring
            season_crops = {
                'Kharif': {'Rice': 3, 'Cotton': 3, 'Maize': 2, 'Soybean': 2, 'Groundnut': 2},
                'Rabi': {'Wheat': 3, 'Pulses': 3, 'Maize': 2},
                'Zaid': {'Millet': 3, 'Groundnut': 2, 'Maize': 2}
            }
            
            for crop, score in season_crops.get(season, {}).items():
                crop_scores[crop] += score
            
            # Rainfall-based scoring
            if rainfall < 400:
                crop_scores['Millet'] += 3
                crop_scores['Pulses'] += 2
                crop_scores['Groundnut'] += 2
            elif rainfall < 700:
                crop_scores['Wheat'] += 2
                crop_scores['Maize'] += 2
                crop_scores['Cotton'] += 2
            elif rainfall < 1000:
                crop_scores['Rice'] += 3
                crop_scores['Soybean'] += 2
            else:
                crop_scores['Rice'] += 4
                crop_scores['Sugarcane'] += 3
            
            # Temperature-based scoring
            if temperature < 20:
                crop_scores['Wheat'] += 2
                crop_scores['Pulses'] += 2
            elif temperature < 28:
                crop_scores['Maize'] += 2
                crop_scores['Cotton'] += 2
            else:
                crop_scores['Rice'] += 2
                crop_scores['Sugarcane'] += 2
                crop_scores['Millet'] += 2
            
            # Soil type-based scoring
            soil_preferences = {
                'loamy': ['Wheat', 'Maize', 'Soybean', 'Cotton'],
                'clay': ['Rice', 'Wheat', 'Sugarcane'],
                'sandy': ['Groundnut', 'Millet', 'Pulses'],
                'black soil': ['Cotton', 'Soybean', 'Wheat']
            }
            
            for crop in soil_preferences.get(soil_type, []):
                if crop in crop_scores:
                    crop_scores[crop] += 2
            
            # State-based adjustments
            state_crops = {
                'Gujarat': ['Cotton', 'Groundnut', 'Wheat'],
                'Punjab': ['Wheat', 'Rice', 'Maize'],
                'Maharashtra': ['Cotton', 'Soybean', 'Sugarcane'],
                'UP': ['Wheat', 'Rice', 'Sugarcane']
            }
            
            for crop in state_crops.get(state, []):
                if crop in crop_scores:
                    crop_scores[crop] += 1
            
            # Crop rotation benefit
            if previous_crop in crop_scores:
                crop_scores[previous_crop] -= 2
            
            # Find best crop
            recommended_crop = max(crop_scores, key=crop_scores.get)
            max_score = crop_scores[recommended_crop]
            
            # Calculate confidence
            scores_list = sorted(crop_scores.values(), reverse=True)
            if len(scores_list) > 1:
                score_diff = scores_list[0] - scores_list[1]
                confidence = min(0.95, 0.60 + (score_diff * 0.05))
            else:
                confidence = 0.75
            
            print(f"Recommended: {recommended_crop} (confidence: {confidence:.2f})")
            
            return {
                'recommended_crop': recommended_crop,
                'confidence': round(confidence, 2)
            }
            
        except Exception as e:
            print(f"❌ Rule-based recommendation error: {e}")
            import traceback
            traceback.print_exc()
            
            # Final fallback
            fallback_crops = {
                'Kharif': 'Rice',
                'Rabi': 'Wheat',
                'Zaid': 'Millet'
            }
            
            return {
                'recommended_crop': fallback_crops.get(payload.get('season', 'Kharif'), 'Wheat'),
                'confidence': 0.5
            }