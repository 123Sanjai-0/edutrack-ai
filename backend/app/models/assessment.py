import enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ExamType(str, enum.Enum):
    INTERNAL_ASSESSMENT = "INTERNAL_ASSESSMENT"
    MIDTERM = "MIDTERM"
    FINAL = "FINAL"
    QUIZ = "QUIZ"
    UNIT_TEST = "UNIT_TEST"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    EXCUSED = "EXCUSED"

class SubmissionStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    LATE = "LATE"
    MISSED = "MISSED"
    GRADED = "GRADED"

class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    exam_type = Column(Enum(ExamType), default=ExamType.MIDTERM, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    max_marks = Column(Float, default=100.0, nullable=False)
    weight_percentage = Column(Float, default=20.0, nullable=False)  # configurable weight
    exam_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    subject = relationship("Subject", back_populates="exams")
    class_section = relationship("ClassSection", back_populates="exams")
    results = relationship("ExamResult", back_populates="exam", cascade="all, delete-orphan")

class ExamResult(Base):
    __tablename__ = "exam_results"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    marks_obtained = Column(Float, default=0.0, nullable=False)
    is_absent = Column(Boolean, default=False, nullable=False)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    exam = relationship("Exam", back_populates="results")
    student = relationship("Student", back_populates="exam_results")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    max_marks = Column(Float, default=20.0, nullable=False)
    weight_percentage = Column(Float, default=10.0, nullable=False)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    subject = relationship("Subject", back_populates="assignments")
    class_section = relationship("ClassSection", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING, nullable=False)
    marks_obtained = Column(Float, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    feedback = Column(Text, nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="assignment_submissions")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    period = Column(Integer, default=1, nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    remarks = Column(String(255), nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="attendance_records")
    subject = relationship("Subject", back_populates="attendance_records")
    class_section = relationship("ClassSection", back_populates="attendance_records")
