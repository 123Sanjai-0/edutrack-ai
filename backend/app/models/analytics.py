import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class RiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class RecommendationPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DISMISSED = "DISMISSED"

class GoalStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACHIEVED = "ACHIEVED"
    MISSED = "MISSED"

class NotificationType(str, enum.Enum):
    ALERT = "ALERT"
    WARNING = "WARNING"
    INFO = "INFO"
    SUCCESS = "SUCCESS"

class AcademicConfig(Base):
    __tablename__ = "academic_configs"

    id = Column(Integer, primary_key=True, index=True)
    institution_name = Column(String(200), default="Global Institute of Technology", nullable=False)
    
    # Weightages (Sum must be 100)
    weight_internal_assessment = Column(Float, default=20.0, nullable=False)
    weight_assignments = Column(Float, default=10.0, nullable=False)
    weight_quizzes = Column(Float, default=10.0, nullable=False)
    weight_attendance = Column(Float, default=10.0, nullable=False)
    weight_midterm = Column(Float, default=20.0, nullable=False)
    weight_final = Column(Float, default=30.0, nullable=False)
    
    # Thresholds
    attendance_minimum_pct = Column(Float, default=75.0, nullable=False)
    attendance_warning_pct = Column(Float, default=80.0, nullable=False)
    passing_grade_pct = Column(Float, default=40.0, nullable=False)
    
    # Risk score boundaries
    risk_low_max = Column(Float, default=30.0, nullable=False)
    risk_medium_max = Column(Float, default=60.0, nullable=False)
    risk_high_max = Column(Float, default=80.0, nullable=False)

    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.LOW, nullable=False, index=True)
    contributing_factors = Column(JSON, nullable=True)  # List of strings/objects explaining WHY
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="risk_assessments")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    predicted_final_score = Column(Float, nullable=False)  # percentage
    expected_grade = Column(String(5), nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0 (e.g. 0.86)
    model_version = Column(String(50), default="RF-v1.0.0", nullable=False)
    positive_factors = Column(JSON, nullable=True)  # Factors boosting score
    negative_factors = Column(JSON, nullable=True)  # Factors lowering score
    feature_importances = Column(JSON, nullable=True)  # Global/local explainability
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="predictions")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    action_plan = Column(Text, nullable=False)
    priority = Column(Enum(RecommendationPriority), default=RecommendationPriority.MEDIUM, nullable=False)
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="recommendations")
    subject = relationship("Subject", back_populates="recommendations")

class AcademicGoal(Base):
    __tablename__ = "academic_goals"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    title = Column(String(200), nullable=False)
    target_score = Column(Float, nullable=False)
    current_score = Column(Float, default=0.0, nullable=False)
    deadline = Column(DateTime, nullable=False)
    progress_percentage = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(GoalStatus), default=GoalStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="goals")
    subject = relationship("Subject", back_populates="goals")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), default=NotificationType.INFO, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")

class InterventionType(str, enum.Enum):
    REMEDIAL_ASSIGNMENT = "REMEDIAL_ASSIGNMENT"
    FACULTY_OFFICE_HOURS = "FACULTY_OFFICE_HOURS"
    PEER_TUTORING = "PEER_TUTORING"
    ACADEMIC_COUNSELING = "ACADEMIC_COUNSELING"

class InterventionStatus(str, enum.Enum):
    PENDING = "PENDING"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"

class FacultyIntervention(Base):
    __tablename__ = "faculty_interventions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    intervention_type = Column(Enum(InterventionType), default=InterventionType.REMEDIAL_ASSIGNMENT, nullable=False)
    title = Column(String(200), nullable=False)
    notes = Column(Text, nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    status = Column(Enum(InterventionStatus), default=InterventionStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student")
    faculty = relationship("Faculty")

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    topic_title = Column(String(200), nullable=False)
    target_hours = Column(Float, default=2.0, nullable=False)
    completed_hours = Column(Float, default=0.0, nullable=False)
    scheduled_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student")
    subject = relationship("Subject")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)  # "MARKS_UPDATED", "ATTENDANCE_RECORDED", "CONFIG_CHANGED"
    entity_type = Column(String(100), nullable=False)  # "ExamResult", "AttendanceRecord", "AcademicConfig"
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs")

