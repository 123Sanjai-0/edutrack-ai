from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class FacultyBase(BaseModel):
    faculty_id: str
    department_id: int
    designation: str = "Assistant Professor"
    qualification: str = "Ph.D. / M.Tech"
    specialization: Optional[str] = None

class FacultyCreate(FacultyBase):
    email: EmailStr
    username: str
    full_name: str
    password: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class FacultyResponse(FacultyBase):
    id: int
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    department_name: Optional[str] = None
    assigned_classes: List[str] = []
    assigned_subjects: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class FacultySubjectAssignmentCreate(BaseModel):
    faculty_id: int
    subject_id: int
    class_section_id: int
    academic_year: str = "2025-2026"

class FacultySubjectAssignmentResponse(FacultySubjectAssignmentCreate):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    class_section_name: Optional[str] = None

    class Config:
        from_attributes = True
