from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
import csv
import io

from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.deps import get_current_user, require_faculty_or_admin, require_admin
from app.models.user import User, UserRole
from app.models.academic import Student, Department, Course, Semester, ClassSection, AcademicStatus, Enrollment, Subject
from app.models.analytics import RiskAssessment, RiskLevel, Prediction
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse, StudentAnalyticsResponse, SubjectPerformance
from app.services.scoring_engine import calculate_subject_performance
from app.services.risk_engine import evaluate_student_risk
from app.services.recommendation_engine import generate_student_recommendations
from app.ml.predictor import predict_student_performance
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/students", tags=["Students"])

def map_student_response(student: Student, db: Session) -> dict:
    risk_rec = db.query(RiskAssessment).filter(RiskAssessment.student_id == student.id).first()
    pred_rec = db.query(Prediction).filter(Prediction.student_id == student.id).first()
    
    # Calculate attendance and score
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    sub_scores = []
    sub_atts = []
    for enr in enrollments:
        sp = calculate_subject_performance(db, student.id, enr.subject_id)
        if sp:
            sub_scores.append(sp["total_weighted_score"])
            sub_atts.append(sp["attendance_pct"])

    overall_score = round(sum(sub_scores)/len(sub_scores), 1) if sub_scores else 70.0
    overall_att = round(sum(sub_atts)/len(sub_atts), 1) if sub_atts else 85.0

    return {
        "id": student.id,
        "student_id": student.student_id,
        "user_id": student.user_id,
        "full_name": student.user.full_name if student.user else "Unknown",
        "email": student.user.email if student.user else "",
        "phone": student.user.phone if student.user else None,
        "avatar_url": student.user.avatar_url if student.user else None,
        "department_id": student.department_id,
        "department_name": student.department.name if student.department else None,
        "department_code": student.department.code if student.department else None,
        "course_id": student.course_id,
        "course_name": student.course.name if student.course else None,
        "semester_id": student.semester_id,
        "semester_number": student.semester.number if student.semester else None,
        "class_section_id": student.class_section_id,
        "class_section_name": student.class_section.name if student.class_section else None,
        "dob": student.dob,
        "admission_year": student.admission_year,
        "academic_status": student.academic_status,
        "cgpa": student.cgpa,
        "total_credits_earned": student.total_credits_earned,
        "overall_attendance_pct": overall_att,
        "overall_score_pct": overall_score,
        "current_risk_level": risk_rec.risk_level if risk_rec else RiskLevel.LOW,
        "predicted_score": pred_rec.predicted_final_score if pred_rec else overall_score + 2.0,
        "created_at": student.created_at,
        "updated_at": student.updated_at
    }

@router.get("", response_model=StudentListResponse)
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    class_section_id: Optional[int] = None,
    risk_level: Optional[RiskLevel] = None,
    academic_status: Optional[AcademicStatus] = None,
    sort_by: str = Query("student_id"),
    sort_order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    query = db.query(Student).join(User, Student.user_id == User.id)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Student.student_id.ilike(search_fmt),
                User.full_name.ilike(search_fmt),
                User.email.ilike(search_fmt)
            )
        )

    if department_id:
        query = query.filter(Student.department_id == department_id)
    if semester_id:
        query = query.filter(Student.semester_id == semester_id)
    if class_section_id:
        query = query.filter(Student.class_section_id == class_section_id)
    if academic_status:
        query = query.filter(Student.academic_status == academic_status)

    if risk_level:
        query = query.join(RiskAssessment, Student.id == RiskAssessment.student_id).filter(RiskAssessment.risk_level == risk_level)

    total = query.count()

    # Sorting
    if sort_by == "full_name":
        order_col = User.full_name
    elif sort_by == "cgpa":
        order_col = Student.cgpa
    else:
        order_col = Student.student_id

    if sort_order == "desc":
        query = query.order_by(desc(order_col))
    else:
        query = query.order_by(asc(order_col))

    offset = (page - 1) * page_size
    students = query.offset(offset).limit(page_size).all()

    items = [map_student_response(s, db) for s in students]
    total_pages = (total + page_size - 1) // page_size

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Check if user email or username exists
    existing_user = db.query(User).filter(
        (User.email == student_in.email) | (User.username == student_in.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists")

    # Check student_id uniqueness
    existing_student = db.query(Student).filter(Student.student_id == student_in.student_id).first()
    if existing_student:
        raise HTTPException(status_code=400, detail=f"Student with ID {student_in.student_id} already exists")

    # Create User
    new_user = User(
        email=student_in.email,
        username=student_in.username,
        full_name=student_in.full_name,
        hashed_password=get_password_hash(student_in.password),
        role=UserRole.STUDENT,
        phone=student_in.phone,
        avatar_url=student_in.avatar_url,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # Create Student profile
    new_student = Student(
        student_id=student_in.student_id,
        user_id=new_user.id,
        department_id=student_in.department_id,
        course_id=student_in.course_id,
        semester_id=student_in.semester_id,
        class_section_id=student_in.class_section_id,
        dob=student_in.dob,
        admission_year=student_in.admission_year,
        academic_status=student_in.academic_status,
        cgpa=student_in.cgpa,
        total_credits_earned=student_in.total_credits_earned
    )
    db.add(new_student)
    db.flush()

    # Auto-enroll in subjects for the semester
    subjects = db.query(Subject).filter(
        Subject.department_id == student_in.department_id,
        Subject.semester_id == student_in.semester_id
    ).all()
    for sub in subjects:
        enr = Enrollment(
            student_id=new_student.id,
            subject_id=sub.id,
            semester_id=student_in.semester_id,
            is_completed=False
        )
        db.add(enr)

    db.commit()
    db.refresh(new_student)

    # Initial risk and recommendation evaluation
    evaluate_student_risk(db, new_student.id)
    generate_student_recommendations(db, new_student.id)

    log_audit_event(
        db=db,
        action="STUDENT_CREATED",
        entity_type="Student",
        entity_id=str(new_student.id),
        user=current_user,
        details={"student_id": new_student.student_id, "name": new_user.full_name}
    )

    return map_student_response(new_student, db)

@router.get("/{id}", response_model=StudentResponse)
def get_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # If student role, ensure they are viewing their own record
    if current_user.role == UserRole.STUDENT and current_user.student_profile and current_user.student_profile.id != student.id:
        raise HTTPException(status_code=403, detail="Not authorized to view other students' records")

    return map_student_response(student, db)

@router.put("/{id}", response_model=StudentResponse)
def update_student(
    id: int,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    update_data = student_in.model_dump(exclude_unset=True)
    
    # Handle user level fields
    if "full_name" in update_data and student.user:
        student.user.full_name = update_data.pop("full_name")
    if "phone" in update_data and student.user:
        student.user.phone = update_data.pop("phone")
    if "avatar_url" in update_data and student.user:
        student.user.avatar_url = update_data.pop("avatar_url")

    for key, value in update_data.items():
        setattr(student, key, value)

    db.commit()
    db.refresh(student)

    log_audit_event(
        db=db,
        action="STUDENT_UPDATED",
        entity_type="Student",
        entity_id=str(student.id),
        user=current_user,
        details=student_in.model_dump(exclude_unset=True)
    )

    return map_student_response(student, db)

@router.delete("/{id}")
def delete_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user_to_delete = student.user
    db.delete(student)
    if user_to_delete:
        db.delete(user_to_delete)
    db.commit()

    log_audit_event(
        db=db,
        action="STUDENT_DELETED",
        entity_type="Student",
        entity_id=str(id),
        user=current_user
    )

    return {"message": f"Student ID {id} deleted successfully"}

@router.get("/{id}/analytics", response_model=StudentAnalyticsResponse)
def get_student_analytics(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == UserRole.STUDENT and current_user.student_profile and current_user.student_profile.id != student.id:
        raise HTTPException(status_code=403, detail="Not authorized to access analytics for this student")

    # Evaluate risk & load subject performances
    risk_info = evaluate_student_risk(db, student.id)
    subject_performances = risk_info.get("subject_performances", [])
    overall_att = risk_info.get("overall_attendance_pct", 85.0)

    # Compute overall percentage & CGPA
    if subject_performances:
        overall_score = round(sum(s["total_weighted_score"] for s in subject_performances) / len(subject_performances), 1)
        midterm_avg = sum(s["midterm_score"] for s in subject_performances) / len(subject_performances)
        assignment_avg = sum(s["assignment_score"] for s in subject_performances) / len(subject_performances)
        internal_avg = sum(s["internal_score"] for s in subject_performances) / len(subject_performances)
    else:
        overall_score = 72.0
        midterm_avg = 70.0
        assignment_avg = 75.0
        internal_avg = 72.0

    cgpa = round(overall_score / 10.0, 2)
    student.cgpa = cgpa
    db.commit()

    # ML Prediction Inference
    ml_features = {
        "attendance_pct": overall_att,
        "assignment_completion_rate": assignment_avg,
        "quiz_average": internal_avg,
        "internal_assessment_score": internal_avg,
        "midterm_score": midterm_avg,
        "previous_semester_gpa": max(4.0, cgpa - 0.2),
        "number_of_failed_subjects": sum(1 for s in subject_performances if s["total_weighted_score"] < 40.0),
        "performance_trend": 2.5 if overall_score > 70 else -3.0
    }
    ml_result = predict_student_performance(ml_features)

    # Save prediction snapshot
    pred_rec = db.query(Prediction).filter(Prediction.student_id == student.id).first()
    if not pred_rec:
        pred_rec = Prediction(
            student_id=student.id,
            predicted_final_score=ml_result["predicted_final_score"],
            expected_grade=ml_result["expected_grade"],
            confidence_score=ml_result["confidence"],
            model_version=ml_result["model_version"],
            positive_factors=ml_result["positive_factors"],
            negative_factors=ml_result["negative_factors"],
            feature_importances=ml_result["feature_contributions"]
        )
        db.add(pred_rec)
    else:
        pred_rec.predicted_final_score = ml_result["predicted_final_score"]
        pred_rec.expected_grade = ml_result["expected_grade"]
        pred_rec.confidence_score = ml_result["confidence"]
        pred_rec.positive_factors = ml_result["positive_factors"]
        pred_rec.negative_factors = ml_result["negative_factors"]
    db.commit()

    # Ensure recommendations are active
    generate_student_recommendations(db, student.id)

    # Performance trends over assessments
    performance_trends = [
        {"assessment": "Quiz 1", "score": round(max(30.0, internal_avg - 8.0 + (student.id % 5)), 1), "class_average": 72.0},
        {"assessment": "Assignment 1", "score": round(max(35.0, assignment_avg - 4.0), 1), "class_average": 76.0},
        {"assessment": "Midterm Exam", "score": round(midterm_avg, 1), "class_average": 70.0},
        {"assessment": "Quiz 2", "score": round(max(30.0, internal_avg + 4.0 - (student.id % 4)), 1), "class_average": 74.0},
        {"assessment": "Assignment 2", "score": round(assignment_avg, 1), "class_average": 77.0},
    ]

    weak_subs = [sp["subject_name"] for sp in subject_performances if sp["total_weighted_score"] < 60.0]

    radar_data = [
        {"subject": sp["subject_code"], "student_score": sp["total_weighted_score"], "class_average": sp["class_average"]}
        for sp in subject_performances
    ]

    return {
        "student": map_student_response(student, db),
        "overall_percentage": overall_score,
        "cgpa": cgpa,
        "attendance_percentage": overall_att,
        "risk_score": risk_info.get("risk_score", 0.0),
        "risk_level": risk_info.get("risk_level", RiskLevel.LOW),
        "risk_reasons": risk_info.get("reasons", []),
        "predicted_final_score": ml_result["predicted_final_score"],
        "predicted_grade": ml_result["expected_grade"],
        "prediction_confidence": ml_result["confidence"],
        "positive_factors": ml_result["positive_factors"],
        "negative_factors": ml_result["negative_factors"],
        "subject_performances": subject_performances,
        "performance_trends": performance_trends,
        "weak_subjects": weak_subs,
        "radar_data": radar_data
    }

@router.get("/export/csv")
def export_students_csv(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    students = query.all()
    
    student_dicts = [map_student_response(s, db) for s in students]
    from app.services.report_generator import generate_students_csv
    csv_stream = generate_students_csv(student_dicts)

    return Response(
        content=csv_stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=edutrack_students.csv"}
    )
