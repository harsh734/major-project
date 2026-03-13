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
    # FIX: Train once on full data, evaluate on held-out 20% first, then save full model
    train_len = int(len(ts) * 0.8)
    train_df = ts.iloc[:train_len]
    test_df  = ts.iloc[train_len:]

    m_eval = Prophet()
    m_eval.fit(train_df.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    future_eval = m_eval.make_future_dataframe(periods=len(test_df))
    forecast_eval = m_eval.predict(future_eval)
    pred_prophet = forecast_eval['yhat'].iloc[-len(test_df):].values
    y_true = test_df['price_per_qtl'].values

    mae_prophet  = mean_absolute_error(y_true, pred_prophet)
    rmse_prophet = mean_squared_error(y_true, pred_prophet) ** 0.5

    # FIX: Train final model on full data (single fit, no duplicate)
    m_full = Prophet()
    m_full.fit(ts.rename(columns={'date': 'ds', 'price_per_qtl': 'y'}))
    prophet_file = f'../models/prophet_{crop}_{market}.pkl'
    joblib.dump(m_full, prophet_file)

    # ----- LSTM -----
    series = ts['price_per_qtl'].values.reshape(-1, 1)

    # FIX: Save scaler per crop-market so inference uses the same scaling
    scaler_lstm = MinMaxScaler()
    scaled = scaler_lstm.fit_transform(series)
    lstm_scaler_file = f'../models/lstm_scaler_{crop}_{market}.pkl'
    joblib.dump(scaler_lstm, lstm_scaler_file)

    seq_len = 30
    X_seq, y_seq = [], []
    for i in range(len(scaled) - seq_len):
        X_seq.append(scaled[i:i + seq_len])
        y_seq.append(scaled[i + seq_len])
    X_seq = np.array(X_seq)
    y_seq = np.array(y_seq)

    if len(X_seq) < 60:
        print(f"Skipping LSTM for {crop}-{market}: too few sequences")
        continue

    split = int(len(X_seq) * 0.8)
    X_train_lstm, X_test_lstm = X_seq[:split], X_seq[split:]
    y_train_lstm, y_test_lstm = y_seq[:split], y_seq[split:]

    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(seq_len, 1)),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')

    es = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
    model.fit(
        X_train_lstm, y_train_lstm,
        validation_split=0.1,
        epochs=50,
        batch_size=16,
        verbose=0,
        callbacks=[es]
    )

    pred_lstm     = model.predict(X_test_lstm, verbose=0)
    pred_lstm_inv = scaler_lstm.inverse_transform(pred_lstm)
    y_test_inv    = scaler_lstm.inverse_transform(y_test_lstm)

    mae_lstm  = mean_absolute_error(y_test_inv, pred_lstm_inv)
    rmse_lstm = mean_squared_error(y_test_inv, pred_lstm_inv) ** 0.5

    lstm_file = f'../models/lstm_price_{crop}_{market}.keras'
    model.save(lstm_file)

    all_metrics.append([crop, market, mae_prophet, rmse_prophet, mae_lstm, rmse_lstm])

    best_model = 'Prophet' if mae_prophet < mae_lstm else 'LSTM'
    best_price_models.append({'crop': crop, 'market': market, 'best_model': best_model})
    print(f"{crop}-{market}: Prophet MAE={mae_prophet:.2f}, LSTM MAE={mae_lstm:.2f} → Best: {best_model}")

metrics_df = pd.DataFrame(
    all_metrics,
    columns=['Crop', 'Market', 'Prophet_MAE', 'Prophet_RMSE', 'LSTM_MAE', 'LSTM_RMSE']
)
metrics_df.to_csv('../models/price_metrics_summary.csv', index=False)

# Save best model lookup table
best_price_df = pd.DataFrame(best_price_models)
best_price_df.to_csv('../models/best_price_models.csv', index=False)

##########################################
# 2. YIELD ESTIMATION (XGBoost + RF)
##########################################
print("\n=== Training XGBoost & RandomForest for yield estimation ===")
yield_file = '../data/yield_data_large.csv'
df_yield = pd.read_csv(yield_file)

categorical_cols_yield = df_yield.select_dtypes(include='object').columns.tolist()
df_yield = pd.get_dummies(df_yield, columns=categorical_cols_yield, drop_first=True)

numeric_cols_yield = ['rainfall_mm', 'area_hectare']
scaler_yield = StandardScaler()
df_yield[numeric_cols_yield] = scaler_yield.fit_transform(df_yield[numeric_cols_yield])

feature_cols_yield = [c for c in df_yield.columns if c != 'yield_kg']
X_yield = df_yield[feature_cols_yield]
y_cont   = df_yield['yield_kg']

# FIX: include_lowest=True so boundary values (e.g. 0, 1000) land in the correct bin
bins   = [0, 1000, 2000, 10000]
labels = [0, 1, 2]
y_cls = pd.cut(y_cont, bins=bins, labels=labels, include_lowest=True).astype(int)

# FIX: Save feature column list so inference can reconstruct the same feature space
joblib.dump(feature_cols_yield, '../models/yield_feature_columns.pkl')
print(f"✅ Saved {len(feature_cols_yield)} yield feature columns")

X_train_y, X_test_y, y_train_y, y_test_y = train_test_split(
    X_yield, y_cls, test_size=0.2, random_state=seed, stratify=y_cls
)

sm = SMOTE(random_state=seed)
X_train_res_y, y_train_res_y = sm.fit_resample(X_train_y, y_train_y)

classes_y  = np.unique(y_train_res_y)
weights_y  = compute_class_weight('balanced', classes=classes_y, y=y_train_res_y)
class_weights_y = dict(zip(classes_y, weights_y))

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
xgb_clf.fit(X_train_res_y, y_train_res_y)

rf_clf = RandomForestClassifier(
    n_estimators=1200,
    max_depth=None,
    class_weight=class_weights_y,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=seed,
    n_jobs=-1
)
rf_clf.fit(X_train_res_y, y_train_res_y)

def evaluate_yield_model(name, model):
    pred = model.predict(X_test_y)
    acc  = accuracy_score(y_test_y, pred)
    print(f"\n=== {name} ===")
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test_y, pred))
    print("Confusion Matrix:\n", confusion_matrix(y_test_y, pred))
    return acc

acc_xgb_y = evaluate_yield_model("XGBoost Yield Classifier", xgb_clf)
acc_rf_y  = evaluate_yield_model("RandomForest Yield Classifier", rf_clf)

# FIX: Cross-validation for more reliable model selection
print("\n--- 5-Fold Cross-Validation (on resampled train set) ---")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
cv_xgb = cross_val_score(xgb_clf, X_train_res_y, y_train_res_y, cv=cv, scoring='accuracy', n_jobs=-1)
cv_rf  = cross_val_score(rf_clf,  X_train_res_y, y_train_res_y, cv=cv, scoring='accuracy', n_jobs=-1)
print(f"XGBoost CV Accuracy: {cv_xgb.mean():.4f} ± {cv_xgb.std():.4f}")
print(f"RF      CV Accuracy: {cv_rf.mean():.4f}  ± {cv_rf.std():.4f}")

best_yield_model = 'XGBoost' if acc_xgb_y >= acc_rf_y else 'RandomForest'
print(f"\nBest yield model: {best_yield_model}")

# FIX: Consistent filenames matching yield_estimator.py
joblib.dump(xgb_clf,     '../models/yield_xgb_classifier.pkl')
joblib.dump(rf_clf,      '../models/yield_rf_classifier.pkl')
joblib.dump(scaler_yield,'../models/yield_scaler.pkl')
print("✅ Saved yield_xgb_classifier.pkl, yield_rf_classifier.pkl, yield_scaler.pkl")

##########################################
# 3. CROP RECOMMENDATION (Ensemble)
##########################################
print("\n=== Training Dynamic Crop Recommendation ===")
recommend_file = '../data/crop_recommendation_balanced.csv'
df_rec = pd.read_csv(recommend_file)

target_col = 'recommended_crop'
X_rec = df_rec.drop(columns=[target_col])
y_rec = df_rec[target_col]

categorical_cols_rec = X_rec.select_dtypes(include='object').columns.tolist()
numeric_cols_rec     = X_rec.select_dtypes(include=np.number).columns.tolist()

# FIX: Split BEFORE any encoding/scaling to prevent data leakage
X_train_rec, X_test_rec, y_train_rec, y_test_rec = train_test_split(
    X_rec, y_rec, test_size=0.2, random_state=seed, stratify=y_rec
)

# Target Encoding (fit only on train)
if categorical_cols_rec:
    te = TargetEncoder(cols=categorical_cols_rec)
    X_train_rec = X_train_rec.copy()
    X_test_rec  = X_test_rec.copy()
    X_train_rec[categorical_cols_rec] = te.fit_transform(X_train_rec[categorical_cols_rec], y_train_rec)
    X_test_rec[categorical_cols_rec]  = te.transform(X_test_rec[categorical_cols_rec])
    joblib.dump(te, '../models/crop_rec_targetencoder.pkl')

# Scale numeric columns
scaler_rec = StandardScaler()
X_train_rec[numeric_cols_rec] = scaler_rec.fit_transform(X_train_rec[numeric_cols_rec])
X_test_rec[numeric_cols_rec]  = scaler_rec.transform(X_test_rec[numeric_cols_rec])
joblib.dump(scaler_rec, '../models/crop_rec_scaler.pkl')

# Save feature columns and numeric/categorical column lists for inference
joblib.dump(list(X_train_rec.columns), '../models/crop_rec_feature_columns.pkl')
joblib.dump(numeric_cols_rec,          '../models/crop_rec_numeric_cols.pkl')
joblib.dump(categorical_cols_rec,      '../models/crop_rec_categorical_cols.pkl')

# Encode target
le_rec = LabelEncoder()
y_train_rec_enc = le_rec.fit_transform(y_train_rec)
y_test_rec_enc  = le_rec.transform(y_test_rec)
joblib.dump(le_rec, '../models/crop_rec_labelencoder.pkl')

# SMOTE
sm_rec = SMOTE(random_state=seed)
X_train_rec_res, y_train_rec_res = sm_rec.fit_resample(X_train_rec, y_train_rec_enc)

# Class weights
classes_rec    = np.unique(y_train_rec_res)
weights_rec    = compute_class_weight('balanced', classes=classes_rec, y=y_train_rec_res)
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
    random_state=seed,
    n_jobs=-1
)
rf_rec.fit(X_train_rec_res, y_train_rec_res)

# Ensemble
ensemble_rec = VotingClassifier(
    estimators=[('xgb', xgb_rec), ('rf', rf_rec)],
    voting='soft',
    n_jobs=-1
)
ensemble_rec.fit(X_train_rec_res, y_train_rec_res)

def evaluate_model_rec(name, model):
    pred = model.predict(X_test_rec)
    acc  = accuracy_score(y_test_rec_enc, pred)
    print(f"\n=== {name} ===")
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test_rec_enc, pred, target_names=le_rec.classes_))
    print("Confusion Matrix:\n", confusion_matrix(y_test_rec_enc, pred))
    return acc

acc_xgb_rec      = evaluate_model_rec("XGBoost Crop Recommendation", xgb_rec)
acc_rf_rec       = evaluate_model_rec("RandomForest Crop Recommendation", rf_rec)
acc_ensemble_rec = evaluate_model_rec("Ensemble Voting Crop Recommendation", ensemble_rec)

# Cross-validation on recommendation ensemble
print("\n--- 5-Fold CV on Crop Recommendation Ensemble ---")
cv_ens = cross_val_score(ensemble_rec, X_train_rec_res, y_train_rec_res, cv=5, scoring='accuracy', n_jobs=-1)
print(f"Ensemble CV Accuracy: {cv_ens.mean():.4f} ± {cv_ens.std():.4f}")

best_rec_model = (
    'Ensemble' if acc_ensemble_rec >= max(acc_xgb_rec, acc_rf_rec)
    else 'XGBoost' if acc_xgb_rec >= acc_rf_rec
    else 'RandomForest'
)
print(f"\nBest crop recommendation model: {best_rec_model}")
joblib.dump({'best_model': best_rec_model}, '../models/crop_rec_best_model.pkl')

# Save all three models
joblib.dump(xgb_rec,      '../models/crop_rec_xgb.pkl')
joblib.dump(rf_rec,       '../models/crop_rec_rf.pkl')
joblib.dump(ensemble_rec, '../models/crop_rec_ensemble.pkl')

print("\n✅ All models trained and saved in ../models/")
print("   Files saved:")
print("   - prophet_<crop>_<market>.pkl          (one per crop-market)")
print("   - lstm_price_<crop>_<market>.keras      (one per crop-market)")
print("   - lstm_scaler_<crop>_<market>.pkl       (one per crop-market)")  # NEW
print("   - price_metrics_summary.csv")
print("   - best_price_models.csv")
print("   - yield_xgb_classifier.pkl")            # RENAMED
print("   - yield_rf_classifier.pkl")             # RENAMED
print("   - yield_scaler.pkl")
print("   - yield_feature_columns.pkl")           # NEW
print("   - crop_rec_ensemble.pkl")
print("   - crop_rec_xgb.pkl")
print("   - crop_rec_rf.pkl")
print("   - crop_rec_targetencoder.pkl")
print("   - crop_rec_scaler.pkl")
print("   - crop_rec_labelencoder.pkl")
print("   - crop_rec_feature_columns.pkl")        # NEW
print("   - crop_rec_numeric_cols.pkl")           # NEW
print("   - crop_rec_categorical_cols.pkl")       # NEW
print("   - crop_rec_best_model.pkl")             # NEW