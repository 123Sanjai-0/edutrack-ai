from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class MLTrainRequest(BaseModel):
    include_synthetic: bool = True
    test_size: float = 0.2
    random_state: int = 42

class ModelMetric(BaseModel):
    model_name: str
    r2_score: Optional[float] = None
    rmse: Optional[float] = None
    accuracy: Optional[float] = None
    f1_macro: Optional[float] = None
    dataset_size: int

class MLTrainResponse(BaseModel):
    message: str
    trained_at: datetime
    regression_metrics: ModelMetric
    classification_metrics: ModelMetric
    feature_importances: Dict[str, float]
    model_version: str

class MLPredictRequest(BaseModel):
    student_id: Optional[int] = None
    attendance_pct: float
    internal_assessment_score: float
    assignment_completion_rate: float
    quiz_average: float
    midterm_score: float
    previous_semester_gpa: float
    number_of_failed_subjects: int = 0
    performance_trend: float = 0.0  # slope/delta in recent tests

class MLPredictResponse(BaseModel):
    predicted_final_score: float
    expected_grade: str
    confidence: float
    risk_level: str
    risk_probabilities: Dict[str, float]
    positive_factors: List[str]
    negative_factors: List[str]
    feature_contributions: Dict[str, float]
    explanation_summary: str
