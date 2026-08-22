from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

# Department Schemas
class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    code: str
    name: str
    department_id: int
    duration_years: int = 4
    degree_type: str = "B.Tech"

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Semester Schemas
class SemesterBase(BaseModel):
    number: int
    academic_year: str
    term: str = "Fall"
    is_current: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SemesterCreate(SemesterBase):
    pass

class SemesterResponse(SemesterBase):
    id: int
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    code: str
    name: str
    department_id: int
    semester_id: int
    credits: int = 3
    syllabus_topics: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# ClassSection Schemas
class ClassSectionBase(BaseModel):
    name: str
    department_id: int
    semester_id: int
    academic_year: str = "2025-2026"
    faculty_advisor_id: Optional[int] = None

class ClassSectionCreate(ClassSectionBase):
    pass

class ClassSectionResponse(ClassSectionBase):
    id: int
    department_name: Optional[str] = None
    semester_number: Optional[int] = None
    student_count: Optional[int] = 0
    class Config:
        from_attributes = True
