from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_faculty_or_admin
from app.models.user import User
from app.models.academic import Student, ClassSection, Subject
from app.models.assessment import AttendanceRecord, AttendanceStatus
from app.schemas.assessment import BulkAttendanceEntry, AttendanceRecordResponse
from app.services.audit_service import log_audit_event
from app.services.risk_engine import evaluate_student_risk

router = APIRouter(prefix="/attendance", tags=["Attendance Tracking"])

@router.get("/sheet")
def get_attendance_sheet(
    class_section_id: int,
    subject_id: int,
    record_date: date = Query(default_factory=date.today),
    period: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    students = db.query(Student).filter(Student.class_section_id == class_section_id).all()
    
    # Existing records for date & period
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.class_section_id == class_section_id,
        AttendanceRecord.subject_id == subject_id,
        AttendanceRecord.date == record_date,
        AttendanceRecord.period == period
    ).all()
    status_map = {r.student_id: (r.status.value, r.remarks) for r in existing}

    sheet = []
    for s in students:
        rec_status, remarks = status_map.get(s.id, (AttendanceStatus.PRESENT.value, ""))
        sheet.append({
            "student_id": s.id,
            "roll_no": s.student_id,
            "full_name": s.user.full_name if s.user else "Unknown",
            "status": rec_status,
            "remarks": remarks
        })

    return {
        "class_section_id": class_section_id,
        "subject_id": subject_id,
        "date": record_date,
        "period": period,
        "records": sheet
    }

@router.post("/bulk")
def record_bulk_attendance(
    payload: BulkAttendanceEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    recorded_count = 0
    for item in payload.records:
        rec = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == item.student_id,
            AttendanceRecord.subject_id == payload.subject_id,
            AttendanceRecord.class_section_id == payload.class_section_id,
            AttendanceRecord.date == payload.date,
            AttendanceRecord.period == payload.period
        ).first()

        if not rec:
            rec = AttendanceRecord(
                student_id=item.student_id,
                subject_id=payload.subject_id,
                class_section_id=payload.class_section_id,
                date=payload.date,
                period=payload.period,
                status=item.status,
                remarks=item.remarks
            )
            db.add(rec)
        else:
            rec.status = item.status
            rec.remarks = item.remarks

        recorded_count += 1
        evaluate_student_risk(db, item.student_id)

    db.commit()

    log_audit_event(
        db=db,
        action="ATTENDANCE_RECORDED_BULK",
        entity_type="AttendanceRecord",
        entity_id=f"Class-{payload.class_section_id}-Sub-{payload.subject_id}",
        user=current_user,
        details={"date": str(payload.date), "count": recorded_count}
    )

    return {"message": f"Successfully updated attendance for {recorded_count} students"}

@router.get("/student/{id}/summary")
def get_student_attendance_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == id).all()
    total = len(records)
    if total == 0:
        return {
            "total_classes": 0,
            "present_count": 0,
            "absent_count": 0,
            "attendance_percentage": 100.0,
            "shortage": 0.0,
            "status": "HEALTHY"
        }

    present = sum(1 for r in records if r.status in [AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED])
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    pct = round((present / total) * 100.0, 1)
    shortage = max(0.0, round(75.0 - pct, 1))

    return {
        "total_classes": total,
        "present_count": present,
        "absent_count": absent,
        "attendance_percentage": pct,
        "shortage": shortage,
        "status": "SHORTAGE" if pct < 75.0 else ("WARNING" if pct < 80.0 else "HEALTHY")
    }
