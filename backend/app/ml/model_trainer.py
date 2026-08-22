import os
import joblib
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import r2_score, root_mean_squared_error, accuracy_score, f1_score
from app.core.config import settings
from app.ml.dataset_generator import generate_academic_dataset

FEATURE_COLUMNS = [
    "attendance_pct",
    "assignment_completion_rate",
    "quiz_average",
    "internal_assessment_score",
    "midterm_score",
    "previous_semester_gpa",
    "number_of_failed_subjects",
    "performance_trend"
]

def train_academic_models(include_synthetic: bool = True, test_size: float = 0.2, random_state: int = 42) -> dict:
    """
    Trains regression and classification models, computes feature importances and metrics,
    and serializes the models to disk.
    """
    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    
    # 1. Obtain dataset
    df = generate_academic_dataset(num_samples=2000, random_state=random_state)
    
    X = df[FEATURE_COLUMNS]
    y_reg = df["final_score"]
    y_clf = df["risk_level"]
    
    # 2. Train/Test Split
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X, y_reg, test_size=test_size, random_state=random_state)
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X, y_clf, test_size=test_size, random_state=random_state)
    
    # 3. Train Regression Model (Random Forest)
    reg_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=random_state)
    reg_model.fit(X_train_r, y_train_r)
    
    y_pred_r = reg_model.predict(X_test_r)
    r2 = float(r2_score(y_test_r, y_pred_r))
    rmse = float(root_mean_squared_error(y_test_r, y_pred_r))
    
    # 4. Train Classification Model (Random Forest Classifier)
    clf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=random_state)
    clf_model.fit(X_train_c, y_train_c)
    
    y_pred_c = clf_model.predict(X_test_c)
    acc = float(accuracy_score(y_test_c, y_pred_c))
    f1 = float(f1_score(y_test_c, y_pred_c, average="macro"))
    
    # 5. Extract Feature Importances
    importances = reg_model.feature_importances_
    feat_imp_dict = {feat: round(float(imp), 4) for feat, imp in zip(FEATURE_COLUMNS, importances)}
    
    # 6. Save Model Artifacts
    reg_path = os.path.join(settings.ML_MODELS_DIR, "score_regressor.pkl")
    clf_path = os.path.join(settings.ML_MODELS_DIR, "risk_classifier.pkl")
    meta_path = os.path.join(settings.ML_MODELS_DIR, "model_meta.pkl")
    
    joblib.dump(reg_model, reg_path)
    joblib.dump(clf_model, clf_path)
    
    meta_info = {
        "version": "RF-v1.2.0",
        "trained_at": datetime.now(timezone.utc),
        "features": FEATURE_COLUMNS,
        "feature_importances": feat_imp_dict,
        "regression_metrics": {
            "model_name": "RandomForestRegressor",
            "r2_score": round(r2, 4),
            "rmse": round(rmse, 2),
            "dataset_size": len(df)
        },
        "classification_metrics": {
            "model_name": "RandomForestClassifier",
            "accuracy": round(acc, 4),
            "f1_macro": round(f1, 4),
            "dataset_size": len(df)
        }
    }
    joblib.dump(meta_info, meta_path)
    
    return meta_info
