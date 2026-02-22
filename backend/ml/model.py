import os
import pandas as pd
import numpy as np
import joblib
import random
from prophet import Prophet

# ML libs
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler, StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import (mean_absolute_error, mean_squared_error,
                             classification_report, confusion_matrix,
                             accuracy_score)
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from xgboost import XGBClassifier
from sklearn.utils.class_weight import compute_class_weight
from imblearn.over_sampling import SMOTE
from category_encoders import TargetEncoder
import warnings
warnings.filterwarnings("ignore")

# Reproducibility
seed = 42
random.seed(seed)
np.random.seed(seed)
tf.random.set_seed(seed)

os.makedirs('../models', exist_ok=True)

##########################################
# 1. CROP PRICE PREDICTION (Prophet + LSTM)
##########################################
print("\n=== Training Prophet & LSTM for each crop-market ===")
price_file = '../data/historical_prices_large.csv'
df_price = pd.read_csv(price_file, parse_dates=['date'])

all_metrics = []
best_price_models = []

for (crop, market), grp in df_price.groupby(['crop_name', 'market']):
    grp = grp.sort_values('date')
    ts = grp[['date', 'price_per_qtl']]

    if len(ts) < 50:
        print(f"Skipping {crop}-{market}: too few records")
        continue

    # ----- Prophet -----
    train_len = int(len(ts) * 0.8)
    train_df = ts.iloc[:train_len]
    test_df = ts.iloc[train_len:]

    m = Prophet()
    m.fit(train_df.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    future = m.make_future_dataframe(periods=len(test_df))
    forecast = m.predict(future)
    pred_prophet = forecast['yhat'].iloc[-len(test_df):].values
    y_true = test_df['price_per_qtl'].values

    mae_prophet = mean_absolute_error(y_true, pred_prophet)
    rmse_prophet = mean_squared_error(y_true, pred_prophet)**0.5

    # Save Prophet full model
    m_full = Prophet()
    m_full.fit(ts.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    prophet_file = f'../models/prophet_{crop}_{market}.pkl'
    joblib.dump(m_full, prophet_file)

    # ----- LSTM -----
    series = ts['price_per_qtl'].values.reshape(-1, 1)
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(series)

    seq_len = 30
    X, y = [], []
    for i in range(len(scaled) - seq_len):
        X.append(scaled[i:i + seq_len])
        y.append(scaled[i + seq_len])
    X = np.array(X)
    y = np.array(y)

    if len(X) < 60:
        print(f"Skipping LSTM for {crop}-{market}: too few sequences")
        continue

    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    model = Sequential()
    model.add(LSTM(64, return_sequences=True, input_shape=(seq_len, 1)))
    model.add(Dropout(0.2))
    model.add(LSTM(32))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse')

    es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    model.fit(X_train, y_train,
              validation_split=0.1,
              epochs=50,
              batch_size=16,
              verbose=0,
              callbacks=[es])

    pred_lstm = model.predict(X_test)
    pred_lstm_inv = scaler.inverse_transform(pred_lstm)
    y_test_inv = scaler.inverse_transform(y_test)

    mae_lstm = mean_absolute_error(y_test_inv, pred_lstm_inv)
    rmse_lstm = mean_squared_error(y_test_inv, pred_lstm_inv)**0.5

    lstm_file = f'../models/lstm_price_{crop}_{market}.keras'
    model.save(lstm_file)

    all_metrics.append([crop, market, mae_prophet, rmse_prophet, mae_lstm, rmse_lstm])

    if mae_prophet < mae_lstm:
        best_price_models.append({'crop': crop, 'market': market, 'best_model': 'Prophet'})
    else:
        best_price_models.append({'crop': crop, 'market': market, 'best_model': 'LSTM'})

    print(f"{crop}-{market}: Prophet MAE={mae_prophet:.2f}, LSTM MAE={mae_lstm:.2f}")

metrics_df = pd.DataFrame(all_metrics,
                          columns=['Crop', 'Market', 'Prophet_MAE', 'Prophet_RMSE', 'LSTM_MAE', 'LSTM_RMSE'])
metrics_df.to_csv('../models/price_metrics_summary.csv', index=False)

##########################################
# 2. YIELD ESTIMATION (XGBoost + RF)
##########################################
print("\n=== Training XGBoost & RandomForest for yield estimation ===")
yield_file = '../data/yield_data_large.csv'
df_yield = pd.read_csv(yield_file)

categorical_cols = df_yield.select_dtypes(include='object').columns.tolist()
df_yield = pd.get_dummies(df_yield, columns=categorical_cols, drop_first=True)

numeric_cols = ['rainfall_mm', 'area_hectare']
scaler_yield = StandardScaler()
df_yield[numeric_cols] = scaler_yield.fit_transform(df_yield[numeric_cols])

feature_cols = [c for c in df_yield.columns if c != 'yield_kg']
X = df_yield[feature_cols]
y_cont = df_yield['yield_kg']

bins = [0, 1000, 2000, 10000]
labels = [0, 1, 2]
y_cls = pd.cut(y_cont, bins=bins, labels=labels).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_cls, test_size=0.2, random_state=seed, stratify=y_cls
)

sm = SMOTE(random_state=seed)
X_train_res, y_train_res = sm.fit_resample(X_train, y_train)

classes = np.unique(y_train_res)
weights = compute_class_weight('balanced', classes=classes, y=y_train_res)
class_weights = dict(zip(classes, weights))

xgb_clf = XGBClassifier(
    n_estimators=1200,
    max_depth=8,
    learning_rate=0.03,
    subsample=0.9,
    colsample_bytree=0.9,
    min_child_weight=1,
    random_state=seed,
    eval_metric='mlogloss',
    tree_method='hist'
)
xgb_clf.fit(X_train_res, y_train_res)

rf_clf = RandomForestClassifier(
    n_estimators=1200,
    max_depth=None,
    class_weight=class_weights,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=seed
)
rf_clf.fit(X_train_res, y_train_res)

def evaluate_model(name, model):
    pred = model.predict(X_test)
    acc = accuracy_score(y_test, pred)
    print(f"\n=== {name} ===")
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test, pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test, pred))
    return acc

acc_xgb = evaluate_model("XGBoost Classifier", xgb_clf)
acc_rf = evaluate_model("RandomForest Classifier", rf_clf)

best_yield_model = 'XGBoost' if acc_xgb > acc_rf else 'RandomForest'
print(f"\nBest yield model based on classification accuracy: {best_yield_model}")

joblib.dump(xgb_clf, '../models/yield_xgb.pkl')
joblib.dump(rf_clf, '../models/yield_rf.pkl')
joblib.dump(scaler_yield, '../models/yield_scaler.pkl')

##########################################
# 3. CROP RECOMMENDATION (Improved + Dynamic)
##########################################
print("\n=== Training Dynamic Crop Recommendation ===")
recommend_file = '../data/crop_recommendation_balanced.csv'
df_rec = pd.read_csv(recommend_file)

target_col = 'recommended_crop'
X_rec = df_rec.drop(columns=[target_col])
y_rec = df_rec[target_col]

categorical_cols = X_rec.select_dtypes(include='object').columns.tolist()
numeric_cols = X_rec.select_dtypes(include=np.number).columns.tolist()

# Train/test split BEFORE target encoding
X_train_rec, X_test_rec, y_train_rec, y_test_rec = train_test_split(
    X_rec, y_rec, test_size=0.2, random_state=seed, stratify=y_rec
)

# Target Encoding for categorical columns
if categorical_cols:
    te = TargetEncoder(cols=categorical_cols)
    X_train_rec[categorical_cols] = te.fit_transform(X_train_rec[categorical_cols], y_train_rec)
    X_test_rec[categorical_cols] = te.transform(X_test_rec[categorical_cols])
    joblib.dump(te, '../models/crop_rec_targetencoder.pkl')

# Scale numeric columns
scaler_rec = StandardScaler()
X_train_rec[numeric_cols] = scaler_rec.fit_transform(X_train_rec[numeric_cols])
X_test_rec[numeric_cols] = scaler_rec.transform(X_test_rec[numeric_cols])
joblib.dump(scaler_rec, '../models/crop_rec_scaler.pkl')

# Encode target
le_rec = LabelEncoder()
y_train_rec_enc = le_rec.fit_transform(y_train_rec)
y_test_rec_enc = le_rec.transform(y_test_rec)
joblib.dump(le_rec, '../models/crop_rec_labelencoder.pkl')

# SMOTE
sm = SMOTE(random_state=seed)
X_train_rec_res, y_train_rec_res = sm.fit_resample(X_train_rec, y_train_rec_enc)

# Class weights
classes_rec = np.unique(y_train_rec_res)
weights_rec = compute_class_weight('balanced', classes=classes_rec, y=y_train_rec_res)
class_weights_rec = dict(zip(classes_rec, weights_rec))

# XGBoost
xgb_rec = XGBClassifier(
    n_estimators=800,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.9,
    colsample_bytree=0.8,
    random_state=seed,
    eval_metric='mlogloss',
    tree_method='hist'
)
xgb_rec.fit(X_train_rec_res, y_train_rec_res)

# RandomForest
rf_rec = RandomForestClassifier(
    n_estimators=800,
    max_depth=None,
    class_weight=class_weights_rec,
    random_state=seed
)
rf_rec.fit(X_train_rec_res, y_train_rec_res)

# Ensemble
ensemble_rec = VotingClassifier(
    estimators=[('xgb', xgb_rec), ('rf', rf_rec)],
    voting='soft', n_jobs=-1
)
ensemble_rec.fit(X_train_rec_res, y_train_rec_res)

# Evaluation
def evaluate_model_rec(name, model):
    pred = model.predict(X_test_rec)
    acc = accuracy_score(y_test_rec_enc, pred)
    print(f"\n=== {name} ===")
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test_rec_enc, pred, target_names=le_rec.classes_))
    print("Confusion Matrix:\n", confusion_matrix(y_test_rec_enc, pred))
    return acc

acc_xgb_rec = evaluate_model_rec("XGBoost Crop Recommendation", xgb_rec)
acc_rf_rec = evaluate_model_rec("RandomForest Crop Recommendation", rf_rec)
acc_ensemble_rec = evaluate_model_rec("Ensemble Voting Crop Recommendation", ensemble_rec)

best_rec_model = 'Ensemble' if acc_ensemble_rec > max(acc_xgb_rec, acc_rf_rec) else \
                 'XGBoost' if acc_xgb_rec > acc_rf_rec else 'RandomForest'
print(f"\nBest crop recommendation model: {best_rec_model}")

# Save models
joblib.dump(xgb_rec, '../models/crop_rec_xgb.pkl')
joblib.dump(rf_rec, '../models/crop_rec_rf.pkl')
joblib.dump(ensemble_rec, '../models/crop_rec_ensemble.pkl')

print("\nAll models trained and saved in ../models/")
