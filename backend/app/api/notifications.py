from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_faculty_or_admin
from app.models.user import User
from app.models.academic import Student
from app.models.analytics import Notification, NotificationType
from app.schemas.analytics import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Alerts & Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return notifications

@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notif_in: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    target_user_id = notif_in.user_id
    if not target_user_id and notif_in.student_id:
        student = db.query(Student).filter(Student.id == notif_in.student_id).first()
        if student and student.user_id:
            target_user_id = student.user_id

    if not target_user_id:
        raise HTTPException(status_code=400, detail="Target user or student must be specified")

    new_notif = Notification(
        user_id=target_user_id,
        title=notif_in.title,
        message=notif_in.message,
        notification_type=notif_in.notification_type,
        link=notif_in.link,
        is_read=False
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return new_notif

@router.put("/{id}/read")
def mark_notification_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notif = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

