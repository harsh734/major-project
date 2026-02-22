# backend/services/price_predictor.py
import os
import joblib
import pandas as pd
import numpy as np
from prophet import Prophet
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

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
                return {"error":f"No Prophet model for {crop}-{market}"}
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
