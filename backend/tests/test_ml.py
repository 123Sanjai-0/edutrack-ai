import pytest
from app.ml.dataset_generator import generate_academic_dataset
from app.ml.model_trainer import train_academic_models
from app.ml.predictor import predict_student_performance

def test_dataset_generator():
    df = generate_academic_dataset(num_samples=100)
    assert len(df) == 100
    assert "attendance_pct" in df.columns
    assert "final_score" in df.columns
    assert "risk_level" in df.columns
    assert set(df["risk_level"].unique()).issubset({"LOW", "MEDIUM", "HIGH", "CRITICAL"})

def test_model_training_and_metrics():
    meta = train_academic_models(include_synthetic=True, test_size=0.2, random_state=42)
    assert "version" in meta
    assert "regression_metrics" in meta
    assert "classification_metrics" in meta
    assert meta["regression_metrics"]["r2_score"] > 0.60
    assert meta["classification_metrics"]["accuracy"] > 0.70
    assert len(meta["feature_importances"]) > 0

def test_predictor_inference_and_explainability():
    features = {
        "attendance_pct": 92.0,
        "assignment_completion_rate": 95.0,
        "quiz_average": 88.0,
        "internal_assessment_score": 85.0,
        "midterm_score": 90.0,
        "previous_semester_gpa": 8.8,
        "number_of_failed_subjects": 0,
        "performance_trend": 4.0
    }
    result = predict_student_performance(features)
    assert result["predicted_final_score"] >= 75.0
    assert result["expected_grade"] in ["A+", "A", "B+"]
    assert result["confidence"] >= 0.70
    assert len(result["positive_factors"]) > 0
    assert "feature_contributions" in result
