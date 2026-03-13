import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
from xgboost import XGBClassifier

# imblearn and SMOTE are only needed during training (model.py), not at inference time

try:
    from category_encoders import TargetEncoder
    HAS_TARGET_ENCODER = True
except ImportError:
    HAS_TARGET_ENCODER = False
    print("⚠️ category_encoders not installed — falling back to label encoding for categoricals")


class CropRecommender:
    """
    Loads the pre-trained ensemble (XGB + RF VotingClassifier) produced by model.py.
    Falls back to training its own model if the ensemble is missing.
    Falls back to rule-based logic if no data is available at all.
    """

    def __init__(self, model_dir='models', data_path='data/crop_recommendation_balanced.csv'):
        self.model_dir   = model_dir
        self.data_path   = data_path

        # Artefact paths produced by model.py
        self.ensemble_file   = os.path.join(model_dir, 'crop_rec_ensemble.pkl')
        self.encoder_file    = os.path.join(model_dir, 'crop_rec_targetencoder.pkl')
        self.scaler_file     = os.path.join(model_dir, 'crop_rec_scaler.pkl')
        self.le_file         = os.path.join(model_dir, 'crop_rec_labelencoder.pkl')
        self.feature_file    = os.path.join(model_dir, 'crop_rec_feature_columns.pkl')
        self.num_cols_file   = os.path.join(model_dir, 'crop_rec_numeric_cols.pkl')
        self.cat_cols_file   = os.path.join(model_dir, 'crop_rec_categorical_cols.pkl')

        self.model          = None
        self.target_encoder = None
        self.scaler         = None
        self.label_encoder  = None
        self.feature_cols   = None
        self.numeric_cols   = None
        self.categorical_cols = None

        self._try_load_trained_artefacts()

        if self.model is None:
            print("⚠️ CropRecommender: no pre-trained model found, attempting to train...")
            if os.path.exists(data_path):
                try:
                    self._train_model()
                    print("✅ CropRecommender trained from data")
                except Exception as e:
                    print(f"⚠️ Training failed: {e}")
            else:
                print("⚠️ No data file found — using rule-based fallback only")

    # ── Load pre-trained artefacts from model.py ──────────────────────────────
    def _try_load_trained_artefacts(self):
        """Load ensemble + preprocessing objects saved by model.py."""
        required = [self.ensemble_file, self.scaler_file, self.le_file, self.feature_file]
        if not all(os.path.exists(f) for f in required):
            print("⚠️ Pre-trained ensemble artefacts incomplete or missing")
            return

        try:
            self.model         = joblib.load(self.ensemble_file)
            self.scaler        = joblib.load(self.scaler_file)
            self.label_encoder = joblib.load(self.le_file)
            self.feature_cols  = joblib.load(self.feature_file)

            if os.path.exists(self.encoder_file):
                self.target_encoder = joblib.load(self.encoder_file)
            if os.path.exists(self.num_cols_file):
                self.numeric_cols = joblib.load(self.num_cols_file)
            if os.path.exists(self.cat_cols_file):
                self.categorical_cols = joblib.load(self.cat_cols_file)

            print("✅ CropRecommender ensemble + preprocessing loaded")
        except Exception as e:
            print(f"⚠️ Could not load pre-trained artefacts: {e}")
            self.model = None

    # ── Fallback: train a fresh model from CSV ────────────────────────────────
    def _train_model(self):
        df     = pd.read_csv(self.data_path)
        target = 'recommended_crop'
        X      = df.drop(target, axis=1)
        y      = df[target]

        self.categorical_cols = X.select_dtypes(include='object').columns.tolist()
        self.numeric_cols     = X.select_dtypes(include=np.number).columns.tolist()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        X_train = X_train.copy()
        X_test  = X_test.copy()

        # Target encoding
        if self.categorical_cols and HAS_TARGET_ENCODER:
            self.target_encoder = TargetEncoder(cols=self.categorical_cols)
            X_train[self.categorical_cols] = self.target_encoder.fit_transform(
                X_train[self.categorical_cols], y_train
            )
            X_test[self.categorical_cols] = self.target_encoder.transform(X_test[self.categorical_cols])
        elif self.categorical_cols:
            # Simple label encoding if category_encoders unavailable
            from sklearn.preprocessing import OrdinalEncoder
            oe = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
            X_train[self.categorical_cols] = oe.fit_transform(X_train[self.categorical_cols])
            X_test[self.categorical_cols]  = oe.transform(X_test[self.categorical_cols])
            self.target_encoder = oe

        # Scale
        self.scaler = StandardScaler()
        X_train[self.numeric_cols] = self.scaler.fit_transform(X_train[self.numeric_cols])
        X_test[self.numeric_cols]  = self.scaler.transform(X_test[self.numeric_cols])

        # Encode labels
        self.label_encoder = LabelEncoder()
        y_train_enc = self.label_encoder.fit_transform(y_train)
        y_test_enc  = self.label_encoder.transform(y_test)

        # SMOTE — lazy import so the service starts even without imblearn installed
        try:
            from imblearn.over_sampling import SMOTE
            sm = SMOTE(random_state=42)
            X_res, y_res = sm.fit_resample(X_train, y_train_enc)
        except ImportError:
            print("⚠️ imblearn not installed — skipping SMOTE, training on original data")
            X_res, y_res = X_train.values, y_train_enc

        # Class weights
        classes = np.unique(y_res)
        cw      = compute_class_weight('balanced', classes=classes, y=y_res)

        xgb = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.05,
                            random_state=42, eval_metric='mlogloss', tree_method='hist')
        rf  = RandomForestClassifier(n_estimators=300, class_weight=dict(zip(classes, cw)),
                                     random_state=42, n_jobs=-1)

        self.model = VotingClassifier(estimators=[('xgb', xgb), ('rf', rf)], voting='soft', n_jobs=-1)
        self.model.fit(X_res, y_res)

        self.feature_cols = list(X_train.columns)

        # Persist
        os.makedirs(self.model_dir, exist_ok=True)
        joblib.dump(self.model,          self.ensemble_file)
        joblib.dump(self.scaler,         self.scaler_file)
        joblib.dump(self.label_encoder,  self.le_file)
        joblib.dump(self.feature_cols,   self.feature_file)
        if self.target_encoder:
            joblib.dump(self.target_encoder, self.encoder_file)

    # ── Inference ─────────────────────────────────────────────────────────────
    def predict(self, payload):
        if self.model is not None:
            try:
                return self._model_predict(payload)
            except Exception as e:
                print(f"❌ Model prediction failed: {e}")
                import traceback; traceback.print_exc()
                print("⚠️ Falling back to rule-based recommendation")

        return self._rule_based_recommendation(payload)

    def _model_predict(self, payload):
        input_df = pd.DataFrame([payload])

        # Apply target encoding to categorical columns
        if self.categorical_cols and self.target_encoder is not None:
            present_cats = [c for c in self.categorical_cols if c in input_df.columns]
            if present_cats:
                input_df[present_cats] = self.target_encoder.transform(input_df[present_cats])

        # Apply scaler to numeric columns
        if self.numeric_cols and self.scaler is not None:
            present_nums = [c for c in self.numeric_cols if c in input_df.columns]
            if present_nums:
                input_df[present_nums] = self.scaler.transform(input_df[present_nums])

        # Align to training feature columns
        if self.feature_cols:
            unknown = [c for c in input_df.columns if c not in self.feature_cols]
            if unknown:
                print(f"⚠️ Unknown input columns dropped: {unknown}")
            for col in self.feature_cols:
                if col not in input_df.columns:
                    input_df[col] = 0
            input_df = input_df[self.feature_cols]

        pred_enc = self.model.predict(input_df)[0]

        # Decode label
        if self.label_encoder is not None:
            pred_crop = self.label_encoder.inverse_transform([pred_enc])[0]
        else:
            pred_crop = str(pred_enc)

        # Confidence
        confidence = None
        if hasattr(self.model, 'predict_proba'):
            try:
                proba      = self.model.predict_proba(input_df)[0]
                confidence = round(float(proba.max()), 3)
            except Exception:
                pass  # Leave as None rather than a fake number

        result = {'recommended_crop': pred_crop}
        if confidence is not None:
            result['confidence'] = confidence
        return result

    # ── Rule-based fallback ───────────────────────────────────────────────────
    def _rule_based_recommendation(self, payload):
        try:
            soil_type      = payload.get('soil_type', 'loamy')
            rainfall       = float(payload.get('rainfall_mm', 500))
            temperature    = float(payload.get('temperature_c', 25))
            state          = payload.get('state', 'Gujarat')
            season         = payload.get('season', 'Kharif')
            previous_crop  = payload.get('previous_crop', 'Wheat')

            crop_scores = {
                'Rice': 0, 'Wheat': 0, 'Cotton': 0, 'Maize': 0,
                'Sugarcane': 0, 'Pulses': 0, 'Groundnut': 0,
                'Millet': 0, 'Soybean': 0,
            }

            season_crops = {
                'Kharif': {'Rice': 3, 'Cotton': 3, 'Maize': 2, 'Soybean': 2, 'Groundnut': 2},
                'Rabi':   {'Wheat': 3, 'Pulses': 3, 'Maize': 2},
                'Zaid':   {'Millet': 3, 'Groundnut': 2, 'Maize': 2},
            }
            for crop, score in season_crops.get(season, {}).items():
                crop_scores[crop] += score

            if   rainfall < 400:  crop_scores['Millet'] += 3; crop_scores['Pulses'] += 2; crop_scores['Groundnut'] += 2
            elif rainfall < 700:  crop_scores['Wheat']  += 2; crop_scores['Maize']  += 2; crop_scores['Cotton']    += 2
            elif rainfall < 1000: crop_scores['Rice']   += 3; crop_scores['Soybean'] += 2
            else:                 crop_scores['Rice']   += 4; crop_scores['Sugarcane'] += 3

            if   temperature < 20: crop_scores['Wheat']  += 2; crop_scores['Pulses'] += 2
            elif temperature < 28: crop_scores['Maize']  += 2; crop_scores['Cotton'] += 2
            else:                  crop_scores['Rice']   += 2; crop_scores['Sugarcane'] += 2; crop_scores['Millet'] += 2

            soil_pref = {
                'loamy':      ['Wheat', 'Maize', 'Soybean', 'Cotton'],
                'clay':       ['Rice', 'Wheat', 'Sugarcane'],
                'sandy':      ['Groundnut', 'Millet', 'Pulses'],
                'black soil': ['Cotton', 'Soybean', 'Wheat'],
            }
            for crop in soil_pref.get(soil_type, []):
                crop_scores[crop] += 2

            state_crops = {
                'Gujarat':     ['Cotton', 'Groundnut', 'Wheat'],
                'Punjab':      ['Wheat', 'Rice', 'Maize'],
                'Maharashtra': ['Cotton', 'Soybean', 'Sugarcane'],
                'UP':          ['Wheat', 'Rice', 'Sugarcane'],
            }
            for crop in state_crops.get(state, []):
                crop_scores[crop] += 1

            # Penalise previous crop (rotation benefit)
            if previous_crop in crop_scores:
                crop_scores[previous_crop] -= 2

            recommended = max(crop_scores, key=crop_scores.get)
            scores_sorted = sorted(crop_scores.values(), reverse=True)
            gap        = scores_sorted[0] - scores_sorted[1] if len(scores_sorted) > 1 else 5
            confidence = round(min(0.95, 0.60 + gap * 0.05), 3)

            return {'recommended_crop': recommended, 'confidence': confidence}

        except Exception as e:
            print(f"❌ Rule-based recommendation error: {e}")
            fallback = {'Kharif': 'Rice', 'Rabi': 'Wheat', 'Zaid': 'Millet'}
            return {
                'recommended_crop': fallback.get(payload.get('season', 'Kharif'), 'Wheat'),
                'confidence': 0.5,
            }