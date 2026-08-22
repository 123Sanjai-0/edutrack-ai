import enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class AcademicStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PROBATION = "PROBATION"
    AT_RISK = "AT_RISK"
    GRADUATED = "GRADUATED"
    SUSPENDED = "SUSPENDED"

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="department")
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department")
    class_sections = relationship("ClassSection", back_populates="department")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    duration_years = Column(Integer, default=4, nullable=False)
    degree_type = Column(String(50), default="B.Tech", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    department = relationship("Department", back_populates="courses")
    students = relationship("Student", back_populates="course")

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)  # 1 to 8
    academic_year = Column(String(20), nullable=False)  # e.g., "2025-2026"
    term = Column(String(20), default="Fall", nullable=False)  # Fall, Spring, Summer
    is_current = Column(Boolean, default=False, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)

    # Relationships
    subjects = relationship("Subject", back_populates="semester")
    class_sections = relationship("ClassSection", back_populates="semester")
    enrollments = relationship("Enrollment", back_populates="semester")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    credits = Column(Integer, default=3, nullable=False)
    syllabus_topics = Column(Text, nullable=True)  # Comma-separated or JSON list of key topics
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    department = relationship("Department", back_populates="subjects")
    semester = relationship("Semester", back_populates="subjects")
    enrollments = relationship("Enrollment", back_populates="subject", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="subject", cascade="all, delete-orphan")
    faculty_assignments = relationship("FacultySubjectAssignment", back_populates="subject")
    recommendations = relationship("Recommendation", back_populates="subject")
    goals = relationship("AcademicGoal", back_populates="subject")

class ClassSection(Base):
    __tablename__ = "class_sections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # e.g., "CSE-4A", "CSE-4B"
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    academic_year = Column(String(20), default="2025-2026", nullable=False)
    faculty_advisor_id = Column(Integer, ForeignKey("faculty.id"), nullable=True)

    # Relationships
    department = relationship("Department", back_populates="class_sections")
    semester = relationship("Semester", back_populates="class_sections")
    faculty_advisor = relationship("Faculty", foreign_keys=[faculty_advisor_id])
    students = relationship("Student", back_populates="class_section")
    faculty_assignments = relationship("FacultySubjectAssignment", back_populates="class_section")
    exams = relationship("Exam", back_populates="class_section")
    assignments = relationship("Assignment", back_populates="class_section")
    attendance_records = relationship("AttendanceRecord", back_populates="class_section")

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "STU2025001"
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=True)
    
    dob = Column(Date, nullable=True)
    admission_year = Column(Integer, default=2024, nullable=False)
    academic_status = Column(Enum(AcademicStatus), default=AcademicStatus.ACTIVE, nullable=False)
    cgpa = Column(Float, default=0.0, nullable=False)
    total_credits_earned = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    course = relationship("Course", back_populates="students")
    semester = relationship("Semester")
    class_section = relationship("ClassSection", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    exam_results = relationship("ExamResult", back_populates="student", cascade="all, delete-orphan")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="student", cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="student", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="student", cascade="all, delete-orphan")
    goals = relationship("AcademicGoal", back_populates="student", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "FAC101"
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    designation = Column(String(100), default="Assistant Professor", nullable=False)
    qualification = Column(String(100), default="Ph.D. / M.Tech", nullable=False)
    specialization = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    faculty_assignments = relationship("FacultySubjectAssignment", back_populates="faculty", cascade="all, delete-orphan")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    grade = Column(String(5), nullable=True)  # A+, A, B, C, F
    score_percentage = Column(Float, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    enrolled_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    subject = relationship("Subject", back_populates="enrollments")
    semester = relationship("Semester", back_populates="enrollments")

class FacultySubjectAssignment(Base):
    __tablename__ = "faculty_subject_assignments"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_section_id = Column(Integer, ForeignKey("class_sections.id"), nullable=False)
    academic_year = Column(String(20), default="2025-2026", nullable=False)

    # Relationships
    faculty = relationship("Faculty", back_populates="faculty_assignments")
    subject = relationship("Subject", back_populates="faculty_assignments")
    class_section = relationship("ClassSection", back_populates="faculty_assignments")
