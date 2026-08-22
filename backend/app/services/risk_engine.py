from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.analytics import RiskAssessment, RiskLevel, AcademicConfig
from app.models.academic import Student, Enrollment, Subject
from app.services.scoring_engine import calculate_subject_performance, get_academic_config

def evaluate_student_risk(db: Session, student_id: int) -> Dict[str, Any]:
    config = get_academic_config(db)
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return {}

    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    subject_performances = []
    
    for enr in enrollments:
        sp = calculate_subject_performance(db, student_id, enr.subject_id)
        if sp:
            subject_performances.append(sp)

    reasons: List[str] = []
    risk_points = 0.0

    # 1. Evaluate Overall & Subject Attendance
    if subject_performances:
        overall_att = sum(s["attendance_pct"] for s in subject_performances) / len(subject_performances)
    else:
        overall_att = 85.0

    if overall_att < config.attendance_minimum_pct:
        shortage = config.attendance_minimum_pct - overall_att
        risk_points += min(35.0, shortage * 2.5 + 15.0)
        reasons.append(f"Overall attendance ({overall_att:.1f}%) is {shortage:.1f}% below minimum mandatory {config.attendance_minimum_pct}% threshold")
    elif overall_att < config.attendance_warning_pct:
        risk_points += 10.0
        reasons.append(f"Attendance warning: {overall_att:.1f}% is in warning zone (below {config.attendance_warning_pct}%)")

    # Subject-wise attendance bottlenecks
    for sp in subject_performances:
        if sp["attendance_pct"] < config.attendance_minimum_pct:
            reasons.append(f"Critical attendance shortage in {sp['subject_name']} ({sp['attendance_pct']:.1f}%)")

    # 2. Evaluate Academic Score Deficits
    weak_subjects = []
    critical_subjects = []
    for sp in subject_performances:
        score = sp["total_weighted_score"]
        if score < config.passing_grade_pct:
            critical_subjects.append(sp["subject_name"])
            risk_points += 20.0
        elif score < 50.0:
            weak_subjects.append(sp["subject_name"])
            risk_points += 10.0

    if critical_subjects:
        reasons.append(f"Failing grade in {len(critical_subjects)} subject(s): {', '.join(critical_subjects)}")
    if weak_subjects:
        reasons.append(f"Weak academic standing in: {', '.join(weak_subjects)}")

    # 3. Assignment Deficits
    low_assignment_subjects = [sp["subject_name"] for sp in subject_performances if sp["assignment_score"] < 60.0]
    if low_assignment_subjects:
        risk_points += 12.0
        reasons.append(f"Incomplete/low assignment scores in: {', '.join(low_assignment_subjects)}")

    # 4. Midterm examination drops
    low_midterm_subjects = [sp["subject_name"] for sp in subject_performances if sp["midterm_score"] < 50.0]
    if low_midterm_subjects:
        risk_points += 15.0
        reasons.append(f"Poor midterm examination results in: {', '.join(low_midterm_subjects)}")

    # Cap risk score between 0 and 100
    risk_score = round(min(100.0, max(0.0, risk_points)), 1)

    # Classify Risk Level according to configurable thresholds
    if risk_score <= config.risk_low_max:
        risk_level = RiskLevel.LOW
        if not reasons:
            reasons.append("Good overall academic standing and consistent attendance")
    elif risk_score <= config.risk_medium_max:
        risk_level = RiskLevel.MEDIUM
    elif risk_score <= config.risk_high_max:
        risk_level = RiskLevel.HIGH
    else:
        risk_level = RiskLevel.CRITICAL

    # Persist or update RiskAssessment record
    risk_record = db.query(RiskAssessment).filter(RiskAssessment.student_id == student_id).first()
    if not risk_record:
        risk_record = RiskAssessment(
            student_id=student_id,
            risk_score=risk_score,
            risk_level=risk_level,
            contributing_factors=reasons,
            calculated_at=datetime.now(timezone.utc)
        )
        db.add(risk_record)
    else:
        risk_record.risk_score = risk_score
        risk_record.risk_level = risk_level
        risk_record.contributing_factors = reasons
        risk_record.calculated_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(risk_record)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "overall_attendance_pct": overall_att,
        "subject_performances": subject_performances
    }
