import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List
from app.core.config import settings
from app.ml.model_trainer import train_academic_models, FEATURE_COLUMNS

# Global cache for ML models
_REG_MODEL = None
_CLF_MODEL = None
_META_INFO = None

def get_or_load_models():
    global _REG_MODEL, _CLF_MODEL, _META_INFO
    reg_path = os.path.join(settings.ML_MODELS_DIR, "score_regressor.pkl")
    clf_path = os.path.join(settings.ML_MODELS_DIR, "risk_classifier.pkl")
    meta_path = os.path.join(settings.ML_MODELS_DIR, "model_meta.pkl")
    
    if not (os.path.exists(reg_path) and os.path.exists(clf_path) and os.path.exists(meta_path)):
        _META_INFO = train_academic_models()
        _REG_MODEL = joblib.load(reg_path)
        _CLF_MODEL = joblib.load(clf_path)
    else:
        if _REG_MODEL is None:
            _REG_MODEL = joblib.load(reg_path)
        if _CLF_MODEL is None:
            _CLF_MODEL = joblib.load(clf_path)
        if _META_INFO is None:
            _META_INFO = joblib.load(meta_path)
            
    return _REG_MODEL, _CLF_MODEL, _META_INFO

def score_to_grade(score: float) -> str:
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B+"
    elif score >= 60:
        return "B"
    elif score >= 50:
        return "C"
    elif score >= 40:
        return "D"
    else:
        return "F"

def predict_student_performance(features_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Runs ML inference on student performance metrics with Explainable AI factor breakdown.
    """
    reg_model, clf_model, meta = get_or_load_models()
    
    # Prepare input DataFrame
    input_data = {col: [features_dict.get(col, 0.0)] for col in FEATURE_COLUMNS}
    X = pd.DataFrame(input_data)
    
    # 1. Regression Score Prediction
    pred_score = float(reg_model.predict(X)[0])
    pred_score = round(max(0.0, min(100.0, pred_score)), 1)
    expected_grade = score_to_grade(pred_score)
    
    # Regression confidence estimation based on tree variance
    tree_preds = [tree.predict(X.values)[0] for tree in reg_model.estimators_]
    std_dev = float(np.std(tree_preds))
    # Confidence score between 0.70 and 0.95
    confidence = round(max(0.70, min(0.95, 1.0 - (std_dev / 40.0))), 2)
    
    # 2. Risk Classification Prediction
    risk_level = str(clf_model.predict(X)[0])
    risk_probs = clf_model.predict_proba(X)[0]
    classes = clf_model.classes_
    risk_prob_dict = {str(cls): round(float(prob), 3) for cls, prob in zip(classes, risk_probs)}
    
    # 3. Explainable AI Factors Breakdown
    positive_factors = []
    negative_factors = []
    
    attendance = features_dict.get("attendance_pct", 0.0)
    assignments = features_dict.get("assignment_completion_rate", 0.0)
    midterm = features_dict.get("midterm_score", 0.0)
    quiz = features_dict.get("quiz_average", 0.0)
    failed = features_dict.get("number_of_failed_subjects", 0)
    trend = features_dict.get("performance_trend", 0.0)
    
    if attendance >= 85:
        positive_factors.append(f"Strong attendance record ({attendance:.1f}%) supports high concept retention")
    elif attendance < 75:
        negative_factors.append(f"Attendance shortage ({attendance:.1f}%) is below the mandatory 75% institutional requirement")
        
    if assignments >= 85:
        positive_factors.append(f"High assignment submission rate ({assignments:.1f}%)")
    elif assignments < 65:
        negative_factors.append(f"Low assignment completion rate ({assignments:.1f}%) dragging continuous assessment")
        
    if midterm >= 75:
        positive_factors.append(f"Solid midterm examination performance ({midterm:.1f}%)")
    elif midterm < 50:
        negative_factors.append(f"Underperformed in midterm examination ({midterm:.1f}%)")
        
    if quiz >= 75:
        positive_factors.append(f"Consistent quiz and continuous evaluation score ({quiz:.1f}%)")
    elif quiz < 55:
        negative_factors.append(f"Low average in unit quizzes ({quiz:.1f}%)")
        
    if trend > 5:
        positive_factors.append(f"Upward academic momentum (+{trend:.1f}% improvement in recent tests)")
    elif trend < -5:
        negative_factors.append(f"Declining academic trajectory ({trend:.1f}% drop over recent assessments)")
        
    if failed > 0:
        negative_factors.append(f"Has {failed} backlog subject(s) requiring academic clearing")
        
    # Default fallbacks if balanced
    if not positive_factors:
        positive_factors.append("Consistent baseline performance across evaluated units")
    if not negative_factors:
        negative_factors.append("No critical risk flags detected in current evaluation period")
        
    explanation = (
        f"Student is projected to achieve {pred_score}% ({expected_grade}) with {int(confidence*100)}% model confidence. "
        f"Assigned risk level is {risk_level} based on continuous evaluation metrics."
    )
    
    return {
        "predicted_final_score": pred_score,
        "expected_grade": expected_grade,
        "confidence": confidence,
        "risk_level": risk_level,
        "risk_probabilities": risk_prob_dict,
        "positive_factors": positive_factors,
        "negative_factors": negative_factors,
        "feature_contributions": meta.get("feature_importances", {}),
        "explanation_summary": explanation,
        "model_version": meta.get("version", "RF-v1.2.0")
    }
