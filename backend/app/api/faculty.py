from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.deps import get_current_user, require_admin, require_faculty_or_admin
from app.models.user import User, UserRole
from app.models.academic import Faculty, Department, FacultySubjectAssignment, ClassSection, Subject
from app.schemas.faculty import (
    FacultyCreate,
    FacultyResponse,
    FacultySubjectAssignmentCreate,
    FacultySubjectAssignmentResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/faculty", tags=["Faculty"])

def map_faculty_response(faculty: Faculty) -> dict:
    assigned_classes = list(set([a.class_section.name for a in faculty.faculty_assignments if a.class_section]))
    assigned_subjects = list(set([a.subject.name for a in faculty.faculty_assignments if a.subject]))
    
    return {
        "id": faculty.id,
        "faculty_id": faculty.faculty_id,
        "user_id": faculty.user_id,
        "full_name": faculty.user.full_name if faculty.user else "Unknown",
        "email": faculty.user.email if faculty.user else "",
        "phone": faculty.user.phone if faculty.user else None,
        "avatar_url": faculty.user.avatar_url if faculty.user else None,
        "department_id": faculty.department_id,
        "department_name": faculty.department.name if faculty.department else None,
        "designation": faculty.designation,
        "qualification": faculty.qualification,
        "specialization": faculty.specialization,
        "assigned_classes": assigned_classes,
        "assigned_subjects": assigned_subjects,
        "created_at": faculty.created_at
    }

@router.get("", response_model=List[FacultyResponse])
def list_faculty(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    faculty_list = query.all()
    return [map_faculty_response(f) for f in faculty_list]

@router.post("", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED)
def create_faculty(
    faculty_in: FacultyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    existing_user = db.query(User).filter(
        (User.email == faculty_in.email) | (User.username == faculty_in.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists")

    existing_faculty = db.query(Faculty).filter(Faculty.faculty_id == faculty_in.faculty_id).first()
    if existing_faculty:
        raise HTTPException(status_code=400, detail=f"Faculty with ID {faculty_in.faculty_id} already exists")

    new_user = User(
        email=faculty_in.email,
        username=faculty_in.username,
        full_name=faculty_in.full_name,
        hashed_password=get_password_hash(faculty_in.password),
        role=UserRole.FACULTY,
        phone=faculty_in.phone,
        avatar_url=faculty_in.avatar_url,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_faculty = Faculty(
        faculty_id=faculty_in.faculty_id,
        user_id=new_user.id,
        department_id=faculty_in.department_id,
        designation=faculty_in.designation,
        qualification=faculty_in.qualification,
        specialization=faculty_in.specialization
    )
    db.add(new_faculty)
    db.commit()
    db.refresh(new_faculty)

    log_audit_event(
        db=db,
        action="FACULTY_CREATED",
        entity_type="Faculty",
        entity_id=str(new_faculty.id),
        user=current_user,
        details={"faculty_id": new_faculty.faculty_id, "name": new_user.full_name}
    )

    return map_faculty_response(new_faculty)

@router.get("/me/classes")
def get_faculty_assigned_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    faculty = current_user.faculty_profile
    if not faculty:
        # Fallback to first faculty if admin checking
        faculty = db.query(Faculty).first()
        if not faculty:
            return []

    assignments = db.query(FacultySubjectAssignment).filter(FacultySubjectAssignment.faculty_id == faculty.id).all()
    results = []
    for a in assignments:
        student_count = len(a.class_section.students) if a.class_section else 0
        results.append({
            "assignment_id": a.id,
            "class_section_id": a.class_section_id,
            "class_name": a.class_section.name if a.class_section else "N/A",
            "subject_id": a.subject_id,
            "subject_name": a.subject.name if a.subject else "N/A",
            "subject_code": a.subject.code if a.subject else "N/A",
            "student_count": student_count,
            "academic_year": a.academic_year
        })
    return results
