from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from app.models.academic import AcademicStatus
from app.models.analytics import RiskLevel

class StudentBase(BaseModel):
    student_id: str
    department_id: int
    course_id: int
    semester_id: int
    class_section_id: Optional[int] = None
    dob: Optional[date] = None
    admission_year: int = 2024
    academic_status: AcademicStatus = AcademicStatus.ACTIVE
    cgpa: float = 0.0
    total_credits_earned: int = 0

class StudentCreate(StudentBase):
    email: EmailStr
    username: str
    full_name: str
    password: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class StudentUpdate(BaseModel):
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    class_section_id: Optional[int] = None
    dob: Optional[date] = None
    academic_status: Optional[AcademicStatus] = None
    cgpa: Optional[float] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    course_name: Optional[str] = None
    class_section_name: Optional[str] = None
    semester_number: Optional[int] = None
    
    # Calculated analytics snapshots
    overall_attendance_pct: Optional[float] = 0.0
    overall_score_pct: Optional[float] = 0.0
    current_risk_level: Optional[RiskLevel] = RiskLevel.LOW
    predicted_score: Optional[float] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StudentListResponse(BaseModel):
    items: List[StudentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class SubjectPerformance(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    credits: int
    attendance_pct: float
    internal_score: float
    assignment_score: float
    midterm_score: float
    final_score: Optional[float] = None
    total_weighted_score: float
    grade: str
    class_average: float
    status: str  # EXCELLENT, GOOD, AVERAGE, WEAK, AT_RISK

class StudentAnalyticsResponse(BaseModel):
    student: StudentResponse
    overall_percentage: float
    cgpa: float
    attendance_percentage: float
    risk_score: float
    risk_level: RiskLevel
    risk_reasons: List[str]
    predicted_final_score: Optional[float] = None
    predicted_grade: Optional[str] = None
    prediction_confidence: Optional[float] = None
    positive_factors: List[str] = []
    negative_factors: List[str] = []
    subject_performances: List[SubjectPerformance]
    performance_trends: List[Dict[str, Any]]  # [{"assessment": "Quiz 1", "score": 85}, ...]
    weak_subjects: List[str]
    radar_data: List[Dict[str, Any]]
