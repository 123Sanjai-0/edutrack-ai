from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.models.analytics import (
    RiskLevel,
    RecommendationPriority,
    RecommendationStatus,
    GoalStatus,
    NotificationType
)

# Academic Config Schemas
class AcademicConfigBase(BaseModel):
    institution_name: str = "Global Institute of Technology"
    weight_internal_assessment: float = 20.0
    weight_assignments: float = 10.0
    weight_quizzes: float = 10.0
    weight_attendance: float = 10.0
    weight_midterm: float = 20.0
    weight_final: float = 30.0
    attendance_minimum_pct: float = 75.0
    attendance_warning_pct: float = 80.0
    passing_grade_pct: float = 40.0
    risk_low_max: float = 30.0
    risk_medium_max: float = 60.0
    risk_high_max: float = 80.0

class AcademicConfigUpdate(AcademicConfigBase):
    pass

class AcademicConfigResponse(AcademicConfigBase):
    id: int
    updated_at: datetime
    class Config:
        from_attributes = True

# Risk Assessment Schemas
class RiskAssessmentResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_roll_no: Optional[str] = None
    department_name: Optional[str] = None
    risk_score: float
    risk_level: RiskLevel
    contributing_factors: Optional[List[str]] = []
    calculated_at: datetime
    class Config:
        from_attributes = True

# Prediction Schemas
class PredictionResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    predicted_final_score: float
    expected_grade: str
    confidence_score: float
    model_version: str
    positive_factors: Optional[List[str]] = []
    negative_factors: Optional[List[str]] = []
    feature_importances: Optional[Dict[str, float]] = None
    calculated_at: datetime
    class Config:
        from_attributes = True

# Recommendation Schemas
class RecommendationCreate(BaseModel):
    student_id: int
    subject_id: Optional[int] = None
    title: str
    reason: str
    action_plan: str
    priority: RecommendationPriority = RecommendationPriority.MEDIUM

class RecommendationUpdate(BaseModel):
    status: RecommendationStatus

class RecommendationResponse(BaseModel):
    id: int
    student_id: int
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    title: str
    reason: str
    action_plan: str
    priority: RecommendationPriority
    status: RecommendationStatus
    created_at: datetime
    class Config:
        from_attributes = True

# Academic Goal Schemas
class GoalCreate(BaseModel):
    student_id: Optional[int] = None
    subject_id: Optional[int] = None
    title: str
    target_score: float
    current_score: float = 0.0
    deadline: datetime

class GoalUpdate(BaseModel):
    current_score: Optional[float] = None
    progress_percentage: Optional[float] = None
    status: Optional[GoalStatus] = None

class GoalResponse(BaseModel):
    id: int
    student_id: int
    subject_id: Optional[int] = None
    subject_name: Optional[str] = None
    title: str
    target_score: float
    current_score: float
    deadline: datetime
    progress_percentage: float
    status: GoalStatus
    created_at: datetime
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationCreate(BaseModel):
    user_id: Optional[int] = None
    student_id: Optional[int] = None
    title: str
    message: str
    notification_type: NotificationType = NotificationType.ALERT
    link: Optional[str] = None


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: NotificationType
    is_read: bool
    link: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

# Dashboard Analytics Aggregates
class AdminDashboardStats(BaseModel):
    total_students: int
    total_faculty: int
    total_departments: int
    average_institution_score: float
    average_attendance: float
    at_risk_count: int
    at_risk_percentage: float
    pass_percentage: float
    department_performance: List[Dict[str, Any]]
    risk_distribution: Dict[str, int]
    grade_distribution: Dict[str, int]
    attendance_trend: List[Dict[str, Any]]
    recent_audit_logs: List[AuditLogResponse]

class FacultyDashboardStats(BaseModel):
    assigned_classes_count: int
    total_assigned_students: int
    class_average_score: float
    class_average_attendance: float
    at_risk_students_count: int
    at_risk_students: List[Dict[str, Any]]
    top_performers: List[Dict[str, Any]]
    declining_students: List[Dict[str, Any]]
    subject_comparisons: List[Dict[str, Any]]
    grade_distribution: Dict[str, int]
    pending_actions: List[Dict[str, Any]]
