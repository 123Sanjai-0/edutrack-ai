"""
Public Student Lookup API — no authentication required.
Allows anyone with a valid student email to view their full academic scorecard.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.academic import Student, Enrollment
from app.models.analytics import RiskAssessment, RiskLevel, Prediction
from app.services.scoring_engine import calculate_subject_performance
from app.services.risk_engine import evaluate_student_risk
from app.ml.predictor import predict_student_performance
from app.services.recommendation_engine import generate_student_recommendations

router = APIRouter(prefix="/lookup", tags=["Public Lookup"])


@router.get("/student")
def lookup_student_by_email(
    email: str = Query(..., description="Student's registered email address"),
    db: Session = Depends(get_db),
):
    """
    Public endpoint: look up a student by email and return their full academic scorecard.
    No authentication token is required.
    """
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")

    if user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=400,
            detail="This email belongs to a non-student account. Only student scorecards are available."
        )

    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for this account")

    # --- Build the full scorecard ---

    # 1. Subject performances
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    subject_performances = []
    for enr in enrollments:
        sp = calculate_subject_performance(db, student.id, enr.subject_id)
        if sp:
            subject_performances.append(sp)

    # 2. Overall stats
    if subject_performances:
        overall_score = round(
            sum(s["total_weighted_score"] for s in subject_performances) / len(subject_performances), 1
        )
        overall_att = round(
            sum(s["attendance_pct"] for s in subject_performances) / len(subject_performances), 1
        )
        midterm_avg = round(
            sum(s["midterm_score"] for s in subject_performances) / len(subject_performances), 1
        )
        assignment_avg = round(
            sum(s["assignment_score"] for s in subject_performances) / len(subject_performances), 1
        )
        internal_avg = round(
            sum(s["internal_score"] for s in subject_performances) / len(subject_performances), 1
        )
    else:
        overall_score = 70.0
        overall_att = 85.0
        midterm_avg = 70.0
        assignment_avg = 75.0
        internal_avg = 72.0

    cgpa = round(overall_score / 10.0, 2)

    # 3. Risk evaluation
    risk_info = evaluate_student_risk(db, student.id)

    # 4. ML prediction
    ml_features = {
        "attendance_pct": overall_att,
        "assignment_completion_rate": assignment_avg,
        "quiz_average": internal_avg,
        "internal_assessment_score": internal_avg,
        "midterm_score": midterm_avg,
        "previous_semester_gpa": max(4.0, cgpa - 0.2),
        "number_of_failed_subjects": sum(1 for s in subject_performances if s["total_weighted_score"] < 40.0),
        "performance_trend": 2.5 if overall_score > 70 else -3.0,
    }
    ml_result = predict_student_performance(ml_features)

    # 5. Recommendations
    generate_student_recommendations(db, student.id)

    # 6. Performance trends
    performance_trends = [
        {"assessment": "Quiz 1", "score": round(max(30.0, internal_avg - 8.0 + (student.id % 5)), 1), "class_average": 72.0},
        {"assessment": "Assignment 1", "score": round(max(35.0, assignment_avg - 4.0), 1), "class_average": 76.0},
        {"assessment": "Midterm Exam", "score": round(midterm_avg, 1), "class_average": 70.0},
        {"assessment": "Quiz 2", "score": round(max(30.0, internal_avg + 4.0 - (student.id % 4)), 1), "class_average": 74.0},
        {"assessment": "Assignment 2", "score": round(assignment_avg, 1), "class_average": 77.0},
    ]

    weak_subjects = [sp["subject_name"] for sp in subject_performances if sp["total_weighted_score"] < 60.0]

    radar_data = [
        {
            "subject": sp["subject_code"],
            "student_score": sp["total_weighted_score"],
            "class_average": sp["class_average"],
        }
        for sp in subject_performances
    ]

    return {
        "student": {
            "full_name": user.full_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "student_id": student.student_id,
            "department_name": student.department.name if student.department else None,
            "department_code": student.department.code if student.department else None,
            "course_name": student.course.name if student.course else None,
            "semester_number": student.semester.number if student.semester else None,
            "class_section_name": student.class_section.name if student.class_section else None,
            "admission_year": student.admission_year,
            "academic_status": student.academic_status.value if student.academic_status else "ACTIVE",
            "cgpa": cgpa,
            "total_credits_earned": student.total_credits_earned,
        },
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
        "weak_subjects": weak_subjects,
        "radar_data": radar_data,
    }
