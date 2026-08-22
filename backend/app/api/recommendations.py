from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.academic import Student
from app.models.analytics import Recommendation, RecommendationStatus
from app.schemas.analytics import RecommendationResponse, RecommendationUpdate
from app.services.recommendation_engine import generate_student_recommendations

router = APIRouter(prefix="/recommendations", tags=["Personalized Recommendations"])

@router.get("/student/{id}", response_model=List[RecommendationResponse])
def get_recommendations_for_student(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == UserRole.STUDENT and current_user.student_profile and current_user.student_profile.id != student.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    recs = generate_student_recommendations(db, student.id)
    out = []
    for r in recs:
        out.append({
            "id": r.id,
            "student_id": r.student_id,
            "subject_id": r.subject_id,
            "subject_name": r.subject.name if r.subject else None,
            "title": r.title,
            "reason": r.reason,
            "action_plan": r.action_plan,
            "priority": r.priority,
            "status": r.status,
            "created_at": r.created_at
        })
    return out

@router.put("/{id}", response_model=RecommendationResponse)
def update_recommendation_status(
    id: int,
    rec_update: RecommendationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rec = db.query(Recommendation).filter(Recommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = rec_update.status
    db.commit()
    db.refresh(rec)

    return {
        "id": rec.id,
        "student_id": rec.student_id,
        "subject_id": rec.subject_id,
        "subject_name": rec.subject.name if rec.subject else None,
        "title": rec.title,
        "reason": rec.reason,
        "action_plan": rec.action_plan,
        "priority": rec.priority,
        "status": rec.status,
        "created_at": rec.created_at
    }
