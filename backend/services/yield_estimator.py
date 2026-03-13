import os
import joblib
import numpy as np
import pandas as pd


class YieldEstimator:
    def __init__(self, model_dir='models'):
        self.model_dir   = model_dir
        # FIX: Filenames now match what model.py saves
        self.xgb_path    = os.path.join(model_dir, 'yield_xgb_classifier.pkl')
        self.rf_path     = os.path.join(model_dir, 'yield_rf_classifier.pkl')
        self.scaler_path = os.path.join(model_dir, 'yield_scaler.pkl')
        self.cols_file   = os.path.join(model_dir, 'yield_feature_columns.pkl')

        self.scaler = None
        if os.path.exists(self.scaler_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                print("✅ Yield scaler loaded")
            except Exception as e:
                print(f"⚠️ Could not load yield scaler: {e}")

        self.has_models = os.path.exists(self.xgb_path) and os.path.exists(self.rf_path)
        status = "models available" if self.has_models else "using rule-based fallback"
        print(f"✅ YieldEstimator initialized ({status})")

    # ── Public API ────────────────────────────────────────────────────────────
    def predict(self, payload):
        """Predict yield class and kg/hectare estimate."""
        if not os.path.exists(self.cols_file):
            print("⚠️ Feature columns file missing — using rule-based prediction")
            return self._rule_based_prediction(payload)

        try:
            model_type = payload.get('model_type', 'xgb').lower()

            rainfall      = float(payload.get('rainfall_mm', 400))
            area          = float(payload.get('area_hectare', 1.0))
            soil_type     = payload.get('soil_type', 'loamy')
            seed_variety  = payload.get('seed_variety', 'Local')
            fertilizer    = payload.get('fertilizer_used', 'NPK')
            crop_name     = payload.get('crop_name', 'Wheat')
            state         = payload.get('state', 'Gujarat')

            # Build one-hot feature row
            base_features = {
                'rainfall_mm':                rainfall,
                'area_hectare':               area,
                f'soil_type_{soil_type}':     1,
                f'seed_variety_{seed_variety}':1,
                f'fertilizer_used_{fertilizer}': 1,
                f'crop_name_{crop_name}':     1,
                f'state_{state}':             1,
            }

            feature_cols = joblib.load(self.cols_file)
            x_row = pd.DataFrame([base_features])

            # Warn about unseen categories (silent zero-fill is brittle)
            unknown_cols = [k for k in base_features if k not in feature_cols and k not in ('rainfall_mm', 'area_hectare')]
            if unknown_cols:
                print(f"⚠️ Unknown feature values (will be treated as 0): {unknown_cols}")

            for col in feature_cols:
                if col not in x_row.columns:
                    x_row[col] = 0
            x_row = x_row[feature_cols]

            # Scale numeric columns
            if self.scaler is not None:
                numeric_cols = [c for c in ['rainfall_mm', 'area_hectare'] if c in x_row.columns]
                if numeric_cols:
                    x_row[numeric_cols] = self.scaler.transform(x_row[numeric_cols])

            # Load model
            model_path = self.xgb_path if model_type == 'xgb' else self.rf_path
            model      = joblib.load(model_path)

            pred_class = int(model.predict(x_row)[0])
            confidence = 0.85
            if hasattr(model, 'predict_proba'):
                proba      = model.predict_proba(x_row)[0]
                confidence = float(proba[pred_class])

            return self._class_to_yield(pred_class, payload, confidence)

        except Exception as e:
            print(f"❌ Model prediction failed: {e}")
            import traceback
            traceback.print_exc()
            print("⚠️ Falling back to rule-based prediction")
            return self._rule_based_prediction(payload)

    # ── Yield class → kg/ha conversion ───────────────────────────────────────
    def _class_to_yield(self, class_index, payload, confidence):
        """Convert predicted class to a deterministic kg/hectare estimate."""

        base_yields = {0: 750, 1: 1500, 2: 2750}
        base_yield  = base_yields.get(class_index, 1500)

        rainfall     = float(payload.get('rainfall_mm', 500))
        crop_name    = payload.get('crop_name', 'Wheat')
        soil_type    = payload.get('soil_type', 'loamy')
        seed_variety = payload.get('seed_variety', 'Local')
        fertilizer   = payload.get('fertilizer_used', 'NPK')
        state        = payload.get('state', 'Gujarat')

        multiplier = 1.0

        # 1. Rainfall adjustment
        optimal_rainfall = {
            'Rice':      (800,  1200),
            'Wheat':     (400,   700),
            'Maize':     (500,   800),
            'Sugarcane': (1000, 1500),
            'Millet':    (300,   600),
            'Pulses':    (400,   700),
        }

        # FIX: Define opt_min/opt_max safely — no more NameError
        rainfall_optimal = None
        if crop_name in optimal_rainfall:
            opt_min, opt_max = optimal_rainfall[crop_name]
            rainfall_optimal = bool(opt_min <= rainfall <= opt_max)
            if opt_min <= rainfall <= opt_max:
                multiplier *= 1.15
            elif rainfall < opt_min * 0.7:
                multiplier *= 0.75
            elif rainfall > opt_max * 1.5:
                multiplier *= 0.80
            elif rainfall < opt_min:
                multiplier *= 0.90
            else:
                multiplier *= 0.95

        # 2. Soil type
        soil_quality = {'loamy': 1.10, 'black soil': 1.10, 'clay': 1.0, 'sandy': 0.90}
        multiplier  *= soil_quality.get(soil_type, 1.0)

        # 3. Seed variety
        seed_quality = {'HYV': 1.15, 'Hybrid': 1.12, 'DroughtResistant': 1.05, 'Local': 0.95}
        multiplier  *= seed_quality.get(seed_variety, 1.0)

        # 4. Fertilizer
        fertilizer_quality = {'NPK': 1.12, 'Mixed': 1.10, 'Organic': 1.05, 'Low': 0.88}
        multiplier         *= fertilizer_quality.get(fertilizer, 1.0)

        # 5. State factor
        state_factors = {'Punjab': 1.08, 'UP': 1.05, 'Gujarat': 1.03, 'Maharashtra': 1.0, 'Bihar': 0.95}
        multiplier   *= state_factors.get(state, 1.0)

        # 6. Crop base adjustment
        crop_base = {
            'Rice': 1.0, 'Wheat': 1.05, 'Maize': 1.10,
            'Sugarcane': 1.20, 'Millet': 0.90, 'Pulses': 0.85
        }
        multiplier *= crop_base.get(crop_name, 1.0)

        predicted_yield = base_yield * multiplier

        # FIX: Removed np.random noise — predictions are now deterministic per input
        # Clamp to class range
        min_yield = {0: 400,  1: 900,  2: 1800}.get(class_index, 500)
        max_yield = {0: 1100, 1: 2200, 2: 4000}.get(class_index, 3000)
        predicted_yield = round(max(min_yield, min(predicted_yield, max_yield)), 2)

        classes_map = {
            0: 'Low (400–1100 kg/ha)',
            1: 'Medium (900–2200 kg/ha)',
            2: 'High (1800–4000 kg/ha)',
        }

        return {
            'predicted_yield':  predicted_yield,
            'yield_per_hectare': predicted_yield,
            'class_index':       class_index,
            'yield_class':       classes_map.get(class_index, 'Unknown'),
            'confidence':        round(confidence, 3),
            'adjustments_applied': {
                'total_multiplier': round(multiplier, 3),
                'rainfall_optimal': rainfall_optimal,
            },
        }

    # ── Rule-based fallback ───────────────────────────────────────────────────
    def _rule_based_prediction(self, payload):
        """Deterministic rule-based yield prediction when models are unavailable."""
        try:
            crop_name    = payload.get('crop_name', 'Wheat')
            rainfall     = float(payload.get('rainfall_mm', 500))
            area         = float(payload.get('area_hectare', 1))
            soil_type    = payload.get('soil_type', 'loamy')
            seed_variety = payload.get('seed_variety', 'Local')
            fertilizer   = payload.get('fertilizer_used', 'NPK')

            score = 0

            # Rainfall
            if   rainfall < 300: score += 0
            elif rainfall < 600: score += 1
            elif rainfall < 900: score += 2
            else:                score += 1  # excess rain hurts

            # Area
            if   area < 0.5: score += 0
            elif area < 2:   score += 1
            else:            score += 2

            # Soil
            score += {'loamy': 2, 'black soil': 2, 'clay': 1, 'sandy': 0}.get(soil_type, 1)

            # Seed variety
            score += {'HYV': 2, 'Hybrid': 2, 'DroughtResistant': 1, 'Local': 0}.get(seed_variety, 0)

            # Fertilizer
            score += {'NPK': 2, 'Mixed': 2, 'Organic': 1, 'Low': 0}.get(fertilizer, 1)

            # Crop-specific bonus
            bonuses = {
                'Rice':      rainfall > 800,
                'Wheat':     400 < rainfall < 700,
                'Millet':    rainfall < 500,
                'Sugarcane': rainfall > 1000,
            }
            if bonuses.get(crop_name, False):
                score += 1

            if   score <= 3: yield_class, confidence = 0, 0.70
            elif score <= 7: yield_class, confidence = 1, 0.75
            else:            yield_class, confidence = 2, 0.80

            return self._class_to_yield(yield_class, payload, confidence)

        except Exception as e:
            print(f"❌ Rule-based prediction error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'predicted_yield':   1500.0,
                'yield_per_hectare': 1500.0,
                'class_index':       1,
                'yield_class':       'Medium (900–2200 kg/ha)',
                'confidence':        0.5,
            }