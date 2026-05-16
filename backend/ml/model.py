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
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
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

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)

# Build paths relative to the script's location
data_dir   = os.path.join(backend_dir, 'data')
models_dir = os.path.join(backend_dir, 'models')
os.makedirs(models_dir, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# HELPER — pretty section banner
# ─────────────────────────────────────────────────────────────
def banner(title):
    line = "=" * 60
    print(f"\n{line}")
    print(f"  {title}")
    print(line)

##########################################
# 1. CROP PRICE PREDICTION (Prophet + LSTM)
##########################################
banner("1. CROP PRICE PREDICTION  (Prophet + LSTM)")

price_file = os.path.join(data_dir, 'historical_prices_large.csv')
df_price   = pd.read_csv(price_file, parse_dates=['date'])

all_metrics       = []
best_price_models = []

for (crop, market), grp in df_price.groupby(['crop_name', 'market']):
    grp = grp.sort_values('date')
    ts  = grp[['date', 'price_per_qtl']]

    if len(ts) < 50:
        print(f"  Skipping {crop}-{market}: too few records")
        continue

    prophet_exists = os.path.exists(os.path.join(models_dir, f'prophet_{crop}_{market}.pkl'))
    lstm_exists    = os.path.exists(os.path.join(models_dir, f'lstm_price_{crop}_{market}.keras'))
    if prophet_exists and lstm_exists:
        print(f"  ⏭️  Skipping {crop}-{market}: models already exist")
        continue

    # ----- Prophet -----
    train_len = int(len(ts) * 0.8)
    train_df  = ts.iloc[:train_len]
    test_df   = ts.iloc[train_len:]

    m_eval = Prophet()
    m_eval.fit(train_df.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    future_eval   = m_eval.make_future_dataframe(periods=len(test_df))
    forecast_eval = m_eval.predict(future_eval)
    pred_prophet  = forecast_eval['yhat'].iloc[-len(test_df):].values
    y_true        = test_df['price_per_qtl'].values

    mae_prophet  = mean_absolute_error(y_true, pred_prophet)
    rmse_prophet = mean_squared_error(y_true, pred_prophet) ** 0.5

    m_full = Prophet()
    m_full.fit(ts.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    joblib.dump(m_full, os.path.join(models_dir, f'prophet_{crop}_{market}.pkl'))

    # ----- LSTM -----
    series      = ts['price_per_qtl'].values.reshape(-1, 1)
    scaler_lstm = MinMaxScaler()
    scaled      = scaler_lstm.fit_transform(series)
    joblib.dump(scaler_lstm, os.path.join(models_dir, f'lstm_scaler_{crop}_{market}.pkl'))

    seq_len = 30
    X_seq, y_seq = [], []
    for i in range(len(scaled) - seq_len):
        X_seq.append(scaled[i:i + seq_len])
        y_seq.append(scaled[i + seq_len])
    X_seq = np.array(X_seq)
    y_seq = np.array(y_seq)

    if len(X_seq) < 60:
        print(f"  Skipping LSTM for {crop}-{market}: too few sequences")
        continue

    split = int(len(X_seq) * 0.8)
    X_train_lstm, X_test_lstm = X_seq[:split], X_seq[split:]
    y_train_lstm, y_test_lstm = y_seq[:split], y_seq[split:]

    lstm_model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(seq_len, 1)),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(1)
    ])
    lstm_model.compile(optimizer='adam', loss='mse')
    es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    lstm_model.fit(X_train_lstm, y_train_lstm,
                   validation_split=0.1, epochs=50, batch_size=16,
                   verbose=0, callbacks=[es])

    pred_lstm_inv = scaler_lstm.inverse_transform(lstm_model.predict(X_test_lstm, verbose=0))
    y_test_inv    = scaler_lstm.inverse_transform(y_test_lstm)

    mae_lstm  = mean_absolute_error(y_test_inv, pred_lstm_inv)
    rmse_lstm = mean_squared_error(y_test_inv, pred_lstm_inv) ** 0.5

    lstm_model.save(os.path.join(models_dir, f'lstm_price_{crop}_{market}.keras'))

    all_metrics.append([crop, market, mae_prophet, rmse_prophet, mae_lstm, rmse_lstm])
    best_model = 'Prophet' if mae_prophet < mae_lstm else 'LSTM'
    best_price_models.append({'crop': crop, 'market': market, 'best_model': best_model})
    print(f"  {crop}-{market}: Prophet MAE={mae_prophet:.2f}  LSTM MAE={mae_lstm:.2f}  → Best: {best_model}")

metrics_df = pd.DataFrame(
    all_metrics,
    columns=['Crop', 'Market', 'Prophet_MAE', 'Prophet_RMSE', 'LSTM_MAE', 'LSTM_RMSE']
)
metrics_df.to_csv(os.path.join(models_dir, 'price_metrics_summary.csv'), index=False)
pd.DataFrame(best_price_models).to_csv(os.path.join(models_dir, 'best_price_models.csv'), index=False)

# ── Price metrics summary (reads saved CSV so skipped models are included) ──
print("\n  📊 PRICE PREDICTION — METRICS SUMMARY")
saved_metrics = pd.read_csv(os.path.join(models_dir, 'price_metrics_summary.csv'))
if not saved_metrics.empty:
    print(f"  {'Crop':<12} {'Market':<14} {'P_MAE':>8} {'P_RMSE':>8} {'L_MAE':>8} {'L_RMSE':>8} {'Best':>8}")
    print("  " + "-" * 68)
    for _, row in saved_metrics.iterrows():
        best = 'Prophet' if row['Prophet_MAE'] < row['LSTM_MAE'] else 'LSTM'
        print(f"  {row['Crop']:<12} {row['Market']:<14} "
              f"{row['Prophet_MAE']:>8.2f} {row['Prophet_RMSE']:>8.2f} "
              f"{row['LSTM_MAE']:>8.2f} {row['LSTM_RMSE']:>8.2f} {best:>8}")
    print(f"\n  Avg Prophet MAE : {saved_metrics['Prophet_MAE'].mean():.2f}")
    print(f"  Avg LSTM MAE    : {saved_metrics['LSTM_MAE'].mean():.2f}")
    print(f"  Avg Prophet RMSE: {saved_metrics['Prophet_RMSE'].mean():.2f}")
    print(f"  Avg LSTM RMSE   : {saved_metrics['LSTM_RMSE'].mean():.2f}")
else:
    print("  (All price models were pre-trained — no new metrics to show)")

##########################################
# 2. YIELD ESTIMATION (XGBoost + RF)
##########################################
banner("2. YIELD ESTIMATION  (XGBoost + RandomForest)")

yield_file = os.path.join(data_dir, 'yield_data_large.csv')
df_yield   = pd.read_csv(yield_file)

categorical_cols_yield = df_yield.select_dtypes(include='object').columns.tolist()
df_yield = pd.get_dummies(df_yield, columns=categorical_cols_yield, drop_first=True)

numeric_cols_yield = ['rainfall_mm', 'area_hectare']
scaler_yield = StandardScaler()
df_yield[numeric_cols_yield] = scaler_yield.fit_transform(df_yield[numeric_cols_yield])

feature_cols_yield = [c for c in df_yield.columns if c != 'yield_kg']
X_yield = df_yield[feature_cols_yield]
y_cont  = df_yield['yield_kg']

bins   = [0, 1000, 2000, 10000]
labels = [0, 1, 2]
y_cls  = pd.cut(y_cont, bins=bins, labels=labels, include_lowest=True).astype(int)

joblib.dump(feature_cols_yield, os.path.join(models_dir, 'yield_feature_columns.pkl'))
print(f"  Saved {len(feature_cols_yield)} yield feature columns")

X_train_y, X_test_y, y_train_y, y_test_y = train_test_split(
    X_yield, y_cls, test_size=0.2, random_state=seed, stratify=y_cls
)

sm = SMOTE(random_state=seed)
X_train_res_y, y_train_res_y = sm.fit_resample(X_train_y, y_train_y)

classes_y       = np.unique(y_train_res_y)
weights_y       = compute_class_weight('balanced', classes=classes_y, y=y_train_res_y)
class_weights_y = dict(zip(classes_y, weights_y))

xgb_clf = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.03,
    subsample=0.9, colsample_bytree=0.9, min_child_weight=1,
    random_state=seed, eval_metric='mlogloss', tree_method='hist', verbosity=0
)
xgb_clf.fit(X_train_res_y, y_train_res_y)

rf_clf = RandomForestClassifier(
    n_estimators=300, max_depth=15, class_weight=class_weights_y,
    min_samples_split=5, min_samples_leaf=2, random_state=seed, n_jobs=1
)
rf_clf.fit(X_train_res_y, y_train_res_y)

xgb_pred_y = xgb_clf.predict(X_test_y)
rf_pred_y  = rf_clf.predict(X_test_y)
acc_xgb_y  = accuracy_score(y_test_y, xgb_pred_y)
acc_rf_y   = accuracy_score(y_test_y, rf_pred_y)

yield_labels = ['Low (<1000 kg)', 'Mid (1000-2000 kg)', 'High (>2000 kg)']

print(f"\n  {'Model':<32} {'Accuracy':>10}")
print("  " + "-" * 44)
print(f"  {'XGBoost':<32} {acc_xgb_y:>10.4f}")
print(f"  {'RandomForest':<32} {acc_rf_y:>10.4f}")

print("\n  --- XGBoost Detailed Report ---")
print(classification_report(y_test_y, xgb_pred_y, target_names=yield_labels))
print("  Confusion Matrix (XGBoost):\n", confusion_matrix(y_test_y, xgb_pred_y))

print("\n  --- RandomForest Detailed Report ---")
print(classification_report(y_test_y, rf_pred_y, target_names=yield_labels))
print("  Confusion Matrix (RandomForest):\n", confusion_matrix(y_test_y, rf_pred_y))

print("\n  --- 3-Fold Cross-Validation ---")
try:
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
    cv_xgb = cross_val_score(xgb_clf, X_train_res_y, y_train_res_y, cv=cv, scoring='accuracy', n_jobs=1)
    cv_rf  = cross_val_score(rf_clf,  X_train_res_y, y_train_res_y, cv=cv, scoring='accuracy', n_jobs=1)
    print(f"  XGBoost CV : {cv_xgb.mean():.4f} ± {cv_xgb.std():.4f}")
    print(f"  RF      CV : {cv_rf.mean():.4f}  ± {cv_rf.std():.4f}")
except (MemoryError, Exception) as e:
    print(f"  ⚠️ CV skipped ({type(e).__name__})")

best_yield_model = 'XGBoost' if acc_xgb_y >= acc_rf_y else 'RandomForest'
print(f"\n  ✅ Best yield model: {best_yield_model}")

joblib.dump(xgb_clf,      os.path.join(models_dir, 'yield_xgb_classifier.pkl'))
joblib.dump(rf_clf,       os.path.join(models_dir, 'yield_rf_classifier.pkl'))
joblib.dump(scaler_yield, os.path.join(models_dir, 'yield_scaler.pkl'))
print("  Saved: yield_xgb_classifier.pkl, yield_rf_classifier.pkl, yield_scaler.pkl")

##########################################
# 3. CROP RECOMMENDATION (Ensemble)
##########################################
banner("3. CROP RECOMMENDATION  (XGBoost + RF Ensemble)")

recommend_file = os.path.join(data_dir, 'crop_recommendation_balanced.csv')
df_rec = pd.read_csv(recommend_file)

print(f"  Dataset shape : {df_rec.shape}")
print(f"  Columns       : {df_rec.columns.tolist()}")
print(f"  Class distribution:\n{df_rec['recommended_crop'].value_counts().to_string()}")

target_col       = 'recommended_crop'
X_rec            = df_rec.drop(columns=[target_col])
y_rec            = df_rec[target_col]
feature_cols_rec = X_rec.columns.tolist()
print(f"\n  Features ({len(feature_cols_rec)}): {feature_cols_rec}")

X_train_rec, X_test_rec, y_train_rec, y_test_rec = train_test_split(
    X_rec, y_rec, test_size=0.2, random_state=seed, stratify=y_rec
)

scaler_rec    = StandardScaler()
X_train_rec_s = scaler_rec.fit_transform(X_train_rec)
X_test_rec_s  = scaler_rec.transform(X_test_rec)

le_rec          = LabelEncoder()
y_train_rec_enc = le_rec.fit_transform(y_train_rec)
y_test_rec_enc  = le_rec.transform(y_test_rec)

print(f"\n  Label mapping: {dict(zip(le_rec.classes_, range(len(le_rec.classes_))))}")

joblib.dump(scaler_rec,       os.path.join(models_dir, 'crop_rec_scaler.pkl'))
joblib.dump(le_rec,           os.path.join(models_dir, 'crop_rec_labelencoder.pkl'))
joblib.dump(feature_cols_rec, os.path.join(models_dir, 'crop_rec_feature_columns.pkl'))

# XGBoost
xgb_rec = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.9, colsample_bytree=0.8,
    random_state=seed, eval_metric='mlogloss', tree_method='hist', verbosity=0
)
xgb_rec.fit(X_train_rec_s, y_train_rec_enc)

# RandomForest
rf_rec = RandomForestClassifier(
    n_estimators=300, max_depth=15, random_state=seed, n_jobs=1
)
rf_rec.fit(X_train_rec_s, y_train_rec_enc)

# Ensemble
ensemble_rec = VotingClassifier(
    estimators=[('xgb', xgb_rec), ('rf', rf_rec)],
    voting='soft', n_jobs=1
)
ensemble_rec.fit(X_train_rec_s, y_train_rec_enc)

xgb_pred_rec = xgb_rec.predict(X_test_rec_s)
rf_pred_rec  = rf_rec.predict(X_test_rec_s)
ens_pred_rec = ensemble_rec.predict(X_test_rec_s)

acc_xgb_rec = accuracy_score(y_test_rec_enc, xgb_pred_rec)
acc_rf_rec  = accuracy_score(y_test_rec_enc, rf_pred_rec)
acc_ens_rec = accuracy_score(y_test_rec_enc, ens_pred_rec)

print(f"\n  {'Model':<38} {'Accuracy':>10}")
print("  " + "-" * 50)
print(f"  {'XGBoost':<38} {acc_xgb_rec:>10.4f}")
print(f"  {'RandomForest':<38} {acc_rf_rec:>10.4f}")
print(f"  {'Ensemble (Voting)':<38} {acc_ens_rec:>10.4f}")

print("\n  --- XGBoost Detailed Report ---")
print(classification_report(y_test_rec_enc, xgb_pred_rec, target_names=le_rec.classes_))
print("  Confusion Matrix (XGBoost):\n", confusion_matrix(y_test_rec_enc, xgb_pred_rec))

print("\n  --- RandomForest Detailed Report ---")
print(classification_report(y_test_rec_enc, rf_pred_rec, target_names=le_rec.classes_))
print("  Confusion Matrix (RandomForest):\n", confusion_matrix(y_test_rec_enc, rf_pred_rec))

print("\n  --- Ensemble Detailed Report ---")
print(classification_report(y_test_rec_enc, ens_pred_rec, target_names=le_rec.classes_))
print("  Confusion Matrix (Ensemble):\n", confusion_matrix(y_test_rec_enc, ens_pred_rec))

print("\n  --- XGBoost Feature Importances ---")
fi = pd.Series(xgb_rec.feature_importances_, index=feature_cols_rec).sort_values(ascending=False)
for feat, score in fi.items():
    bar = '█' * int(score * 100)
    print(f"  {feat:<20} {score:.4f}  {bar}")

print("\n  --- 3-Fold CV on Ensemble ---")
try:
    cv_ens = cross_val_score(ensemble_rec, X_train_rec_s, y_train_rec_enc,
                             cv=3, scoring='accuracy', n_jobs=1)
    print(f"  Ensemble CV Accuracy: {cv_ens.mean():.4f} ± {cv_ens.std():.4f}")
except (MemoryError, Exception) as e:
    print(f"  ⚠️ CV skipped ({type(e).__name__})")

best_rec_model = (
    'Ensemble' if acc_ens_rec >= max(acc_xgb_rec, acc_rf_rec)
    else 'XGBoost' if acc_xgb_rec >= acc_rf_rec
    else 'RandomForest'
)
print(f"\n  ✅ Best crop recommendation model: {best_rec_model}")

joblib.dump(xgb_rec,      os.path.join(models_dir, 'crop_rec_xgb.pkl'))
joblib.dump(rf_rec,       os.path.join(models_dir, 'crop_rec_rf.pkl'))
joblib.dump(ensemble_rec, os.path.join(models_dir, 'crop_rec_ensemble.pkl'))
joblib.dump({'best_model': best_rec_model}, os.path.join(models_dir, 'crop_rec_best_model.pkl'))

##########################################
# FINAL SUMMARY — all 3 models at a glance
##########################################
banner("FINAL METRICS SUMMARY")

print(f"\n  {'Model':<45} {'Metric':<10} {'Value':>8}")
print("  " + "-" * 65)

if not saved_metrics.empty:
    print(f"  {'Price Prediction — Prophet (crop-market avg)':<45} {'MAE':>10} {saved_metrics['Prophet_MAE'].mean():>8.2f}")
    print(f"  {'Price Prediction — LSTM    (crop-market avg)':<45} {'MAE':>10} {saved_metrics['LSTM_MAE'].mean():>8.2f}")
else:
    print(f"  {'Price Prediction':<45} {'MAE':>10} {'see CSV':>8}")

print(f"  {'Yield Estimation — XGBoost':<45} {'Accuracy':>10} {acc_xgb_y:>8.4f}")
print(f"  {'Yield Estimation — RandomForest':<45} {'Accuracy':>10} {acc_rf_y:>8.4f}")
print(f"  {'Crop Recommendation — XGBoost':<45} {'Accuracy':>10} {acc_xgb_rec:>8.4f}")
print(f"  {'Crop Recommendation — RandomForest':<45} {'Accuracy':>10} {acc_rf_rec:>8.4f}")
print(f"  {'Crop Recommendation — Ensemble ★ BEST':<45} {'Accuracy':>10} {acc_ens_rec:>8.4f}")

print("\n  ✅ All models trained and saved successfully!")
print("  " + "=" * 60)