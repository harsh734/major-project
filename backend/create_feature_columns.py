"""
Script to create the missing yield_feature_columns.pkl file
Run this once to generate the feature columns file
"""

import os
import joblib

# Define all possible feature columns based on your training data
# This should match what was used during model training

feature_columns = [
    # Numeric features
    'rainfall_mm',
    'area_hectare',
    
    # Soil type (one-hot encoded)
    'soil_type_loamy',
    'soil_type_clay',
    'soil_type_sandy',
    'soil_type_black soil',
    
    # Seed variety (one-hot encoded)
    'seed_variety_Local',
    'seed_variety_Hybrid',
    'seed_variety_HYV',
    'seed_variety_DroughtResistant',
    
    # Fertilizer (one-hot encoded)
    'fertilizer_used_NPK',
    'fertilizer_used_Organic',
    'fertilizer_used_Mixed',
    'fertilizer_used_Low',
    
    # Crop name (one-hot encoded)
    'crop_name_Wheat',
    'crop_name_Rice',
    'crop_name_Maize',
    'crop_name_Pulses',
    'crop_name_Sugarcane',
    'crop_name_Millet',
    
    # State (one-hot encoded)
    'state_Gujarat',
    'state_Maharashtra',
    'state_UP',
    'state_Punjab',
    'state_Bihar',
]

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

# Save feature columns
output_path = 'models/yield_feature_columns.pkl'
joblib.dump(feature_columns, output_path)

print(f"✅ Feature columns file created at: {output_path}")
print(f"📊 Total features: {len(feature_columns)}")
print("\nFeature columns:")
for i, col in enumerate(feature_columns, 1):
    print(f"  {i}. {col}")

print("\n🎉 Done! You can now restart your Flask server.")