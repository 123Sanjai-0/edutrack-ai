from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_faculty_or_admin
from app.models.user import User
from app.models.academic import Department, Course, Semester, Subject, ClassSection
from app.schemas.academic import (
    DepartmentCreate, DepartmentResponse,
    CourseCreate, CourseResponse,
    SemesterCreate, SemesterResponse,
    SubjectCreate, SubjectResponse,
    ClassSectionCreate, ClassSectionResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/academics", tags=["Academics"])

# --- Departments ---
@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    dept = Department(**dept_in.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

# --- Courses ---
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(department_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Course)
    if department_id:
        q = q.filter(Course.department_id == department_id)
    return q.all()

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    course = Course(**course_in.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

# --- Semesters ---
@router.get("/semesters", response_model=List[SemesterResponse])
def get_semesters(db: Session = Depends(get_db)):
    return db.query(Semester).order_by(Semester.number).all()

@router.post("/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
def create_semester(
    sem_in: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    sem = Semester(**sem_in.model_dump())
    db.add(sem)
    db.commit()
    db.refresh(sem)
    return sem

# --- Subjects ---
@router.get("/subjects", response_model=List[SubjectResponse])
def get_subjects(
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Subject)
    if department_id:
        q = q.filter(Subject.department_id == department_id)
    if semester_id:
        q = q.filter(Subject.semester_id == semester_id)
    return q.all()

@router.post("/subjects", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    sub_in: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    sub = Subject(**sub_in.model_dump())
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

# --- Class Sections ---
@router.get("/classes", response_model=List[ClassSectionResponse])
def get_class_sections(
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ClassSection)
    if department_id:
        q = q.filter(ClassSection.department_id == department_id)
    if semester_id:
        q = q.filter(ClassSection.semester_id == semester_id)
    classes = q.all()
    results = []
    for c in classes:
        results.append({
            "id": c.id,
            "name": c.name,
            "department_id": c.department_id,
            "semester_id": c.semester_id,
            "academic_year": c.academic_year,
            "faculty_advisor_id": c.faculty_advisor_id,
            "department_name": c.department.name if c.department else None,
            "semester_number": c.semester.number if c.semester else None,
            "student_count": len(c.students)
        })
    return results
