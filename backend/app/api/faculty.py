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
    FacultyUpdate,
    FacultyResponse,
    FacultySubjectAssignmentCreate,
    FacultySubjectAssignmentResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/faculty", tags=["Faculty"])

def map_faculty_response(faculty: Faculty) -> dict:
    assigned_classes = list(set([a.class_section.name for a in faculty.faculty_assignments if a.class_section]))
    assigned_subjects = list(set([a.subject.name for a in faculty.faculty_assignments if a.subject]))
    assignments = [
        {
            "id": a.id,
            "faculty_id": a.faculty_id,
            "subject_id": a.subject_id,
            "subject_name": a.subject.name if a.subject else "N/A",
            "subject_code": a.subject.code if a.subject else "N/A",
            "class_section_id": a.class_section_id,
            "class_section_name": a.class_section.name if a.class_section else "N/A",
            "academic_year": a.academic_year
        }
        for a in faculty.faculty_assignments
    ]
    
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
        "assignments": assignments,
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

@router.get("/{id}", response_model=FacultyResponse)
def get_faculty(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return map_faculty_response(faculty)

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
        avatar_url=faculty_in.avatar_url or f"https://ui-avatars.com/api/?name={faculty_in.full_name.replace(' ', '+')}&background=6366f1&color=fff",
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

@router.put("/{id}", response_model=FacultyResponse)
def update_faculty(
    id: int,
    faculty_in: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    update_data = faculty_in.model_dump(exclude_unset=True)

    if "full_name" in update_data and faculty.user:
        faculty.user.full_name = update_data.pop("full_name")
    if "email" in update_data and faculty.user:
        faculty.user.email = update_data.pop("email")
    if "phone" in update_data and faculty.user:
        faculty.user.phone = update_data.pop("phone")
    if "avatar_url" in update_data and faculty.user:
        faculty.user.avatar_url = update_data.pop("avatar_url")

    for k, v in update_data.items():
        setattr(faculty, k, v)

    db.commit()
    db.refresh(faculty)

    log_audit_event(
        db=db,
        action="FACULTY_UPDATED",
        entity_type="Faculty",
        entity_id=str(faculty.id),
        user=current_user,
        details={"faculty_id": faculty.faculty_id}
    )

    return map_faculty_response(faculty)

@router.delete("/{id}")
def delete_faculty(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    # Clear faculty_advisor_id in class sections
    db.query(ClassSection).filter(ClassSection.faculty_advisor_id == faculty.id).update({"faculty_advisor_id": None})
    
    user_to_delete = faculty.user
    db.delete(faculty)
    if user_to_delete:
        db.delete(user_to_delete)
    db.commit()

    log_audit_event(
        db=db,
        action="FACULTY_DELETED",
        entity_type="Faculty",
        entity_id=str(id),
        user=current_user
    )

    return {"message": f"Faculty ID {id} deleted successfully"}

@router.post("/{id}/assignments", response_model=FacultySubjectAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_faculty_subject(
    id: int,
    assignment_in: FacultySubjectAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    faculty = db.query(Faculty).filter(Faculty.id == id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty member not found")

    existing = db.query(FacultySubjectAssignment).filter(
        FacultySubjectAssignment.faculty_id == id,
        FacultySubjectAssignment.subject_id == assignment_in.subject_id,
        FacultySubjectAssignment.class_section_id == assignment_in.class_section_id,
        FacultySubjectAssignment.academic_year == assignment_in.academic_year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Assignment already exists for this subject and class section")

    assignment = FacultySubjectAssignment(
        faculty_id=id,
        subject_id=assignment_in.subject_id,
        class_section_id=assignment_in.class_section_id,
        academic_year=assignment_in.academic_year
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    log_audit_event(
        db=db,
        action="FACULTY_ASSIGNED_SUBJECT",
        entity_type="FacultySubjectAssignment",
        entity_id=str(assignment.id),
        user=current_user,
        details={"faculty_id": id, "subject_id": assignment_in.subject_id, "class_section_id": assignment_in.class_section_id}
    )

    return {
        "id": assignment.id,
        "faculty_id": assignment.faculty_id,
        "subject_id": assignment.subject_id,
        "class_section_id": assignment.class_section_id,
        "academic_year": assignment.academic_year,
        "subject_name": assignment.subject.name if assignment.subject else None,
        "subject_code": assignment.subject.code if assignment.subject else None,
        "class_section_name": assignment.class_section.name if assignment.class_section else None
    }

@router.delete("/assignments/{assignment_id}")
def remove_faculty_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    assignment = db.query(FacultySubjectAssignment).filter(FacultySubjectAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()

    log_audit_event(
        db=db,
        action="FACULTY_UNASSIGNED_SUBJECT",
        entity_type="FacultySubjectAssignment",
        entity_id=str(assignment_id),
        user=current_user
    )

    return {"message": "Assignment removed successfully"}

@router.get("/me/classes")
def get_faculty_assigned_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    faculty = current_user.faculty_profile
    if not faculty:
        # Fallback to all classes if admin or first faculty
        all_sections = db.query(ClassSection).all()
        results = []
        for sec in all_sections:
            subjects = db.query(Subject).filter(Subject.semester_id == sec.semester_id).all()
            for sub in subjects:
                student_count = len(sec.students) if sec.students else 0
                results.append({
                    "assignment_id": f"{sec.id}-{sub.id}",
                    "class_section_id": sec.id,
                    "class_name": sec.name,
                    "subject_id": sub.id,
                    "subject_name": sub.name,
                    "subject_code": sub.code,
                    "student_count": student_count,
                    "academic_year": sec.academic_year
                })
        return results

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

