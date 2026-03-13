# backend/services/price_predictor.py
import os
import joblib
import pandas as pd
import numpy as np
from prophet import Prophet
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler
from datetime import timedelta


class PricePredictor:
    def __init__(self, model_dir='models', data_path='data/historical_prices_large.csv'):
        self.model_dir = model_dir
        self.data_path = data_path
        self.df = pd.read_csv(data_path, parse_dates=['date'])
        print("✅ PricePredictor initialized")

    def predict(self, payload):
        # ── Input validation ──────────────────────────────────────────────────
        crop   = payload.get('crop_name', '').strip()
        market = payload.get('market', '').strip()

        if not crop or not market:
            return {"error": "Both 'crop_name' and 'market' are required fields."}

        model_type = payload.get('model_type', 'prophet').strip().lower()

        # FIX: Cap periods to prevent runaway slow inference
        try:
            periods = max(1, min(int(payload.get('periods', 30)), 365))
        except (ValueError, TypeError):
            return {"error": "'periods' must be an integer between 1 and 365."}

        if model_type == 'prophet':
            return self._predict_prophet(crop, market, periods)
        elif model_type == 'lstm':
            return self._predict_lstm(crop, market, periods)
        else:
            return {"error": "model_type must be 'prophet' or 'lstm'"}

    # ── Prophet ───────────────────────────────────────────────────────────────
    def _predict_prophet(self, crop, market, periods):
        model_file = os.path.join(self.model_dir, f'prophet_{crop}_{market}.pkl')

        if not os.path.exists(model_file):
            # Graceful fallback: linear trend extrapolation
            return self._linear_fallback(crop, market, periods)

        try:
            m = joblib.load(model_file)
            future   = m.make_future_dataframe(periods=periods)
            forecast = m.predict(future)
            out = (
                forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
                .tail(periods)
                .rename(columns={'ds': 'date', 'yhat': 'predicted_price',
                                 'yhat_lower': 'lower_bound', 'yhat_upper': 'upper_bound'})
            )
            out['date'] = out['date'].dt.strftime('%Y-%m-%d')
            return {"model": "prophet", "crop": crop, "market": market,
                    "forecast": out.to_dict(orient='records')}
        except Exception as e:
            print(f"❌ Prophet prediction error for {crop}-{market}: {e}")
            return self._linear_fallback(crop, market, periods)

    # ── LSTM ──────────────────────────────────────────────────────────────────
    def _predict_lstm(self, crop, market, periods):
        lstm_file   = os.path.join(self.model_dir, f'lstm_price_{crop}_{market}.keras')
        # FIX: Load the saved scaler instead of refitting at inference time
        scaler_file = os.path.join(self.model_dir, f'lstm_scaler_{crop}_{market}.pkl')

        if not os.path.exists(lstm_file):
            return {"error": f"No LSTM model found for crop='{crop}', market='{market}'."}

        if not os.path.exists(scaler_file):
            print(f"⚠️ LSTM scaler not found for {crop}-{market}, refitting on historical data (less accurate)")
            series = self._get_series(crop, market)
            if series is None:
                return {"error": f"No historical data for crop='{crop}', market='{market}'."}
            scaler = MinMaxScaler()
            scaler.fit(series)
        else:
            scaler = joblib.load(scaler_file)
            series = self._get_series(crop, market)
            if series is None:
                return {"error": f"No historical data for crop='{crop}', market='{market}'."}

        try:
            seq_len = 30
            scaled  = scaler.transform(series)

            if len(scaled) < seq_len:
                return {"error": f"Not enough historical data to run LSTM (need ≥{seq_len} records)."}

            lstm_model  = load_model(lstm_file)
            current_seq = scaled[-seq_len:].copy()
            preds       = []

            for _ in range(periods):
                p         = lstm_model.predict(current_seq.reshape(1, seq_len, 1), verbose=0)
                inv_price = float(scaler.inverse_transform(p)[0][0])
                preds.append(round(inv_price, 2))
                # Roll window forward
                current_seq = np.vstack([current_seq[1:], p])

            last_date  = self.df[
                (self.df['crop_name'] == crop) & (self.df['market'] == market)
            ]['date'].max()

            forecast = [
                {
                    "date": (last_date + timedelta(days=i + 1)).strftime('%Y-%m-%d'),
                    "predicted_price": price
                }
                for i, price in enumerate(preds)
            ]
            return {"model": "lstm", "crop": crop, "market": market, "forecast": forecast}

        except Exception as e:
            print(f"❌ LSTM prediction error for {crop}-{market}: {e}")
            return {"error": f"LSTM inference failed: {str(e)}"}

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _get_series(self, crop, market):
        """Return price series as (N,1) numpy array or None if empty."""
        mask   = (self.df['crop_name'] == crop) & (self.df['market'] == market)
        series = self.df[mask].sort_values('date')['price_per_qtl'].values.reshape(-1, 1)
        return series if len(series) > 0 else None

    def _linear_fallback(self, crop, market, periods):
        """Linear trend extrapolation when no model file exists."""
        series = self._get_series(crop, market)
        if series is None or len(series) == 0:
            return {"error": f"No model or historical data found for crop='{crop}', market='{market}'."}

        try:
            df_s = self.df[
                (self.df['crop_name'] == crop) & (self.df['market'] == market)
            ].sort_values('date').tail(120).copy()

            df_s['ds_ord'] = df_s['date'].map(pd.Timestamp.toordinal)
            coeffs          = np.polyfit(df_s['ds_ord'], df_s['price_per_qtl'], 1)
            slope, intercept = float(coeffs[0]), float(coeffs[1])
            last_date        = df_s['date'].max()

            forecast = [
                {
                    "date": (last_date + timedelta(days=i)).strftime('%Y-%m-%d'),
                    "predicted_price": round(intercept + slope * (last_date + timedelta(days=i)).toordinal(), 2)
                }
                for i in range(1, periods + 1)
            ]
            return {"model": "linear_fallback", "crop": crop, "market": market, "forecast": forecast}
        except Exception as e:
            return {"error": f"Linear fallback failed: {str(e)}"}