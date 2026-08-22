from typing import List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.analytics import Recommendation, RecommendationPriority, RecommendationStatus
from app.models.academic import Student, Subject
from app.services.scoring_engine import calculate_subject_performance

TOPIC_RECOMMENDATIONS = {
    "DBMS": {
        "weak_topic": "Database Normalization & Indexing",
        "action": "Review 3NF/BCNF decomposition rules and solve 5 schema normalization problem sets.",
    },
    "DSA": {
        "weak_topic": "Dynamic Programming & Graph Algorithms",
        "action": "Practice shortest path (Dijkstra) and top-down DP memoization problems on the practice portal.",
    },
    "OS": {
        "weak_topic": "Process Synchronization & Semaphores",
        "action": "Implement classic concurrency problems (Producer-Consumer, Dining Philosophers) in C.",
    },
    "CN": {
        "weak_topic": "TCP/IP Congestion Control & Subnetting",
        "action": "Review CIDR subnet calculation practice sheets and Wireshark packet capture lab notes.",
    },
    "AI": {
        "weak_topic": "A* Search & Neural Network Backpropagation",
        "action": "Complete step-by-step heuristic derivation exercises and gradient descent coding assignments.",
    },
    "MATH": {
        "weak_topic": "Eigenvalues & Multivariate Calculus",
        "action": "Attend faculty tutorial hours on Wednesday for step-by-step matrix diagonalization practice.",
    }
}

def generate_student_recommendations(db: Session, student_id: int) -> List[Recommendation]:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return []

    # Check existing recommendations
    existing = db.query(Recommendation).filter(
        Recommendation.student_id == student_id,
        Recommendation.status.in_([RecommendationStatus.PENDING, RecommendationStatus.IN_PROGRESS])
    ).all()
    
    if existing and len(existing) >= 2:
        return existing

    # Generate fresh recommendations based on weak subjects
    from app.services.risk_engine import evaluate_student_risk
    risk_info = evaluate_student_risk(db, student_id)
    subject_perfs = risk_info.get("subject_performances", [])

    created_recs = []

    # 1. Attendance recommendation if low
    overall_att = risk_info.get("overall_attendance_pct", 100.0)
    if overall_att < 75.0:
        rec = Recommendation(
            student_id=student_id,
            title="Urgent: Attendance Shortage Recovery Plan",
            reason=f"Current attendance is {overall_att:.1f}%, which is below the mandatory 75% threshold.",
            action_plan="Attend all upcoming lecture blocks for the next 3 weeks and submit medical/leave documentation for authorized absences.",
            priority=RecommendationPriority.URGENT,
            status=RecommendationStatus.PENDING,
            created_at=datetime.now(timezone.utc)
        )
        db.add(rec)
        created_recs.append(rec)

    # 2. Identify weak subjects (score < 65% or below class average)
    for sp in sorted(subject_perfs, key=lambda x: x["total_weighted_score"]):
        subject_id = sp["subject_id"]
        sub_name = sp["subject_name"]
        sub_code = sp["subject_code"]
        score = sp["total_weighted_score"]
        cls_avg = sp["class_average"]

        if score < 65.0 or (score < cls_avg - 8.0):
            # Match known topic or generic action
            matched_key = None
            for key in TOPIC_RECOMMENDATIONS:
                if key.lower() in sub_code.lower() or key.lower() in sub_name.lower():
                    matched_key = key
                    break

            if matched_key:
                topic_info = TOPIC_RECOMMENDATIONS[matched_key]
                title = f"Strengthen {topic_info['weak_topic']} in {sub_name}"
                reason = f"Your current subject score is {score:.1f}% (Class average: {cls_avg:.1f}%)."
                action_plan = topic_info["action"]
            else:
                title = f"Remedial Focus for {sub_name}"
                reason = f"Performance score of {score:.1f}% indicates knowledge gaps in core syllabus modules."
                action_plan = "Review past lecture slides, complete recommended textbook problem sets, and schedule office hours with the course instructor."

            priority = RecommendationPriority.HIGH if score < 50.0 else RecommendationPriority.MEDIUM
            rec = Recommendation(
                student_id=student_id,
                subject_id=subject_id,
                title=title,
                reason=reason,
                action_plan=action_plan,
                priority=priority,
                status=RecommendationStatus.PENDING,
                created_at=datetime.now(timezone.utc)
            )
            db.add(rec)
            created_recs.append(rec)

            if len(created_recs) >= 3:
                break

    # If student is excelling across all areas, give an advanced recommendation
    if not created_recs:
        rec = Recommendation(
            student_id=student_id,
            title="Advanced Enrichment & Capstone Research",
            reason="Outstanding academic performance across all registered subjects (>80% avg).",
            action_plan="Explore departmental honors research projects, competitive coding hackathons, and peer tutoring opportunities.",
            priority=RecommendationPriority.LOW,
            status=RecommendationStatus.PENDING,
            created_at=datetime.now(timezone.utc)
        )
        db.add(rec)
        created_recs.append(rec)

    db.commit()
    for r in created_recs:
        db.refresh(r)
        
    return created_recs
