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

    def predict(self, payload):
        crop = payload.get('crop_name')
        market = payload.get('market')
        model_type = payload.get('model_type','prophet')  # 'prophet' or 'lstm'
        periods = int(payload.get('periods',30))

        if model_type.lower()=='prophet':
            model_file=os.path.join(self.model_dir,f'prophet_{crop}_{market}.pkl')
            if not os.path.exists(model_file):
                # Fallback: build a simple linear extrapolation forecast from historical data
                try:
                    series = self.df[(self.df.crop_name==crop)&(self.df.market==market)].sort_values('date')[["date","price_per_qtl"]]
                    if series.empty:
                        return {"error":f"No Prophet model for {crop}-{market} and no historical data available"}

                    # Use last N records to fit a linear trend on ordinal dates
                    N = min(120, len(series))
                    s = series.tail(N).copy()
                    s['ds_ord'] = s['date'].map(pd.Timestamp.toordinal)
                    coeffs = np.polyfit(s['ds_ord'], s['price_per_qtl'], 1)
                    slope, intercept = float(coeffs[0]), float(coeffs[1])
                    last_date = s['date'].max()

                    out = []
                    for i in range(1, periods+1):
                        future_date = last_date + timedelta(days=i)
                        yhat = float(intercept + slope * future_date.toordinal())
                        out.append({"ds": future_date.strftime('%Y-%m-%d'), "yhat": round(yhat, 2)})

                    return {"model": "prophet_fallback_linear", "forecast": out}
                except Exception as e:
                    return {"error": f"No Prophet model for {crop}-{market}", "detail": str(e)}
            m=joblib.load(model_file)
            future=m.make_future_dataframe(periods=periods)
            forecast=m.predict(future)
            out=forecast[['ds','yhat']].tail(periods).to_dict(orient='records')
            return {"model":"prophet","forecast":out}

        elif model_type.lower()=='lstm':
            lstm_file=os.path.join(self.model_dir,f'lstm_price_{crop}_{market}.keras')
            if not os.path.exists(lstm_file):
                return {"error":f"No LSTM model for {crop}-{market}"}
            # load last seq_len rows
            series=self.df[(self.df.crop_name==crop)&(self.df.market==market)].sort_values('date')['price_per_qtl'].values.reshape(-1,1)
            seq_len=30
            scaler=MinMaxScaler()
            scaled=scaler.fit_transform(series)
            last_seq=scaled[-seq_len:]
            X_input=last_seq.reshape(1,seq_len,1)
            lstm_model=load_model(lstm_file)
            preds=[]
            current_seq=last_seq.copy()
            # iterative multi-step forecasting
            for _ in range(periods):
                p=lstm_model.predict(current_seq.reshape(1,seq_len,1),verbose=0)
                inv=scaler.inverse_transform(p)
                preds.append(float(inv[0][0]))
                new_scaled=scaler.transform(inv)
                current_seq=np.vstack([current_seq[1:],new_scaled])
            return {"model":"lstm","forecast":[{"step":i+1,"predicted_price":p} for i,p in enumerate(preds)]}
        else:
            return {"error":"model_type must be prophet or lstm"}
