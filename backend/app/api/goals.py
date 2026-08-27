from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.academic import Student
from app.models.analytics import AcademicGoal, GoalStatus
from app.schemas.analytics import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter(prefix="/goals", tags=["Academic Goals"])

@router.get("/student/{id}", response_model=List[GoalResponse])
def get_student_goals(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == UserRole.STUDENT and current_user.student_profile and current_user.student_profile.id != student.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    goals = db.query(AcademicGoal).filter(AcademicGoal.student_id == id).order_by(AcademicGoal.created_at.desc()).all()
    out = []
    for g in goals:
        out.append({
            "id": g.id,
            "student_id": g.student_id,
            "subject_id": g.subject_id,
            "subject_name": g.subject.name if g.subject else "Overall Performance",
            "title": g.title,
            "target_score": g.target_score,
            "current_score": g.current_score,
            "deadline": g.deadline,
            "progress_percentage": g.progress_percentage,
            "status": g.status,
            "created_at": g.created_at
        })
    return out

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if goal_in.student_id:
        student_id = goal_in.student_id
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
    elif current_user.student_profile:
        student_id = current_user.student_profile.id
    else:
        raise HTTPException(status_code=400, detail="Student ID required when created by faculty/admin")

    
    # Calculate initial progress
    progress = 0.0
    if goal_in.target_score > 0:
        progress = round(min(100.0, (goal_in.current_score / goal_in.target_score) * 100.0), 1)

    new_goal = AcademicGoal(
        student_id=student_id,
        subject_id=goal_in.subject_id,
        title=goal_in.title,
        target_score=goal_in.target_score,
        current_score=goal_in.current_score,
        deadline=goal_in.deadline,
        progress_percentage=progress,
        status=GoalStatus.ACTIVE,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return {
        "id": new_goal.id,
        "student_id": new_goal.student_id,
        "subject_id": new_goal.subject_id,
        "subject_name": new_goal.subject.name if new_goal.subject else "Overall Performance",
        "title": new_goal.title,
        "target_score": new_goal.target_score,
        "current_score": new_goal.current_score,
        "deadline": new_goal.deadline,
        "progress_percentage": new_goal.progress_percentage,
        "status": new_goal.status,
        "created_at": new_goal.created_at
    }

@router.put("/{id}", response_model=GoalResponse)
def update_goal(
    id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(AcademicGoal).filter(AcademicGoal.id == id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_update.current_score is not None:
        goal.current_score = goal_update.current_score
        if goal.target_score > 0:
            goal.progress_percentage = round(min(100.0, (goal.current_score / goal.target_score) * 100.0), 1)
            if goal.progress_percentage >= 100.0:
                goal.status = GoalStatus.ACHIEVED
    
    if goal_update.status is not None:
        goal.status = goal_update.status

    db.commit()
    db.refresh(goal)

    return {
        "id": goal.id,
        "student_id": goal.student_id,
        "subject_id": goal.subject_id,
        "subject_name": goal.subject.name if goal.subject else "Overall Performance",
        "title": goal.title,
        "target_score": goal.target_score,
        "current_score": goal.current_score,
        "deadline": goal.deadline,
        "progress_percentage": goal.progress_percentage,
        "status": goal.status,
        "created_at": goal.created_at
    }
