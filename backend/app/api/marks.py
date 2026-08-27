from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
import csv
import io

from app.core.database import get_db
from app.api.deps import get_current_user, require_faculty_or_admin
from app.models.user import User
from app.models.academic import Student
from app.models.assessment import Exam, ExamResult, ExamType
from app.schemas.assessment import (
    ExamCreate, ExamUpdate, ExamResponse,
    ExamResultResponse, BulkMarksEntry, SingleMarkEntry
)
from app.services.audit_service import log_audit_event
from app.services.risk_engine import evaluate_student_risk

router = APIRouter(prefix="/marks", tags=["Marks & Examinations"])

@router.get("/exams", response_model=List[ExamResponse])
def list_exams(
    subject_id: Optional[int] = None,
    class_section_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Exam)
    if subject_id:
        q = q.filter(Exam.subject_id == subject_id)
    if class_section_id:
        q = q.filter(Exam.class_section_id == class_section_id)
    exams = q.order_by(Exam.exam_date.desc()).all()

    results = []
    for ex in exams:
        results.append({
            "id": ex.id,
            "title": ex.title,
            "exam_type": ex.exam_type,
            "subject_id": ex.subject_id,
            "class_section_id": ex.class_section_id,
            "max_marks": ex.max_marks,
            "weight_percentage": ex.weight_percentage,
            "exam_date": ex.exam_date,
            "is_published": ex.is_published,
            "subject_name": ex.subject.name if ex.subject else None,
            "subject_code": ex.subject.code if ex.subject else None,
            "class_section_name": ex.class_section.name if ex.class_section else None,
            "created_at": ex.created_at
        })
    return results

@router.post("/exams", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(
    exam_in: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = Exam(**exam_in.model_dump())
    db.add(exam)
    db.commit()
    db.refresh(exam)

    log_audit_event(
        db=db,
        action="EXAM_CREATED",
        entity_type="Exam",
        entity_id=str(exam.id),
        user=current_user,
        details={"title": exam.title, "type": exam.exam_type.value, "subject_id": exam.subject_id}
    )

    return {
        "id": exam.id,
        "title": exam.title,
        "exam_type": exam.exam_type,
        "subject_id": exam.subject_id,
        "class_section_id": exam.class_section_id,
        "max_marks": exam.max_marks,
        "weight_percentage": exam.weight_percentage,
        "exam_date": exam.exam_date,
        "is_published": exam.is_published,
        "subject_name": exam.subject.name if exam.subject else None,
        "subject_code": exam.subject.code if exam.subject else None,
        "class_section_name": exam.class_section.name if exam.class_section else None,
        "created_at": exam.created_at
    }

@router.put("/exams/{id}", response_model=ExamResponse)
def update_exam(
    id: int,
    exam_in: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    update_data = exam_in.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(exam, k, v)

    db.commit()
    db.refresh(exam)

    log_audit_event(
        db=db,
        action="EXAM_UPDATED",
        entity_type="Exam",
        entity_id=str(id),
        user=current_user,
        details={"title": exam.title}
    )

    return {
        "id": exam.id,
        "title": exam.title,
        "exam_type": exam.exam_type,
        "subject_id": exam.subject_id,
        "class_section_id": exam.class_section_id,
        "max_marks": exam.max_marks,
        "weight_percentage": exam.weight_percentage,
        "exam_date": exam.exam_date,
        "is_published": exam.is_published,
        "subject_name": exam.subject.name if exam.subject else None,
        "subject_code": exam.subject.code if exam.subject else None,
        "class_section_name": exam.class_section.name if exam.class_section else None,
        "created_at": exam.created_at
    }

@router.delete("/exams/{id}")
def delete_exam(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # Delete results first
    db.query(ExamResult).filter(ExamResult.exam_id == id).delete()
    db.delete(exam)
    db.commit()

    log_audit_event(
        db=db,
        action="EXAM_DELETED",
        entity_type="Exam",
        entity_id=str(id),
        user=current_user
    )

    return {"message": f"Exam ID {id} and associated marks deleted successfully"}

@router.get("/exams/{id}/template")
def download_exam_marks_template(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    students = db.query(Student).filter(Student.class_section_id == exam.class_section_id).all() if exam.class_section_id else db.query(Student).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["StudentID", "StudentName", "Marks", "IsAbsent", "Remarks"])
    for s in students:
        res = db.query(ExamResult).filter(ExamResult.exam_id == id, ExamResult.student_id == s.id).first()
        existing_marks = res.marks_obtained if res else ""
        absent_flag = "TRUE" if (res and res.is_absent) else "FALSE"
        rem = res.remarks if res and res.remarks else ""
        writer.writerow([s.student_id, s.user.full_name if s.user else "Student", existing_marks, absent_flag, rem])

    output.seek(0)
    filename = f"Marks_Template_Exam_{exam.id}_{exam.title.replace(' ', '_')}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/exam/{id}/results", response_model=List[ExamResultResponse])
def get_exam_results(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    results = db.query(ExamResult).filter(ExamResult.exam_id == id).all()
    out = []
    for r in results:
        pct = round((r.marks_obtained / exam.max_marks) * 100.0, 1) if exam.max_marks > 0 else 0.0
        out.append({
            "id": r.id,
            "exam_id": r.exam_id,
            "student_id": r.student_id,
            "marks_obtained": r.marks_obtained,
            "is_absent": r.is_absent,
            "remarks": r.remarks,
            "student_name": r.student.user.full_name if r.student and r.student.user else "Unknown",
            "student_roll_no": r.student.student_id if r.student else "N/A",
            "percentage": pct,
            "created_at": r.created_at
        })
    return out

@router.post("/bulk")
def save_bulk_marks(
    payload: BulkMarksEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    saved_count = 0
    for entry in payload.marks:
        res = db.query(ExamResult).filter(
            ExamResult.exam_id == payload.exam_id,
            ExamResult.student_id == entry.student_id
        ).first()

        if not res:
            res = ExamResult(
                exam_id=payload.exam_id,
                student_id=entry.student_id,
                marks_obtained=entry.marks_obtained,
                is_absent=entry.is_absent,
                remarks=entry.remarks
            )
            db.add(res)
        else:
            res.marks_obtained = entry.marks_obtained
            res.is_absent = entry.is_absent
            res.remarks = entry.remarks
        
        saved_count += 1
        # Recalculate student risk dynamically
        evaluate_student_risk(db, entry.student_id)

    db.commit()

    log_audit_event(
        db=db,
        action="MARKS_UPDATED_BULK",
        entity_type="ExamResult",
        entity_id=str(payload.exam_id),
        user=current_user,
        details={"exam_id": payload.exam_id, "updated_count": saved_count}
    )

    return {"message": f"Successfully updated marks for {saved_count} students", "exam_id": payload.exam_id}

@router.post("/upload-csv")
async def upload_marks_csv(
    exam_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    processed = 0
    for row in reader:
        # expects columns: StudentID (or student_id), Marks (or marks_obtained)
        student_id_str = row.get("StudentID") or row.get("student_id") or row.get("roll_no")
        marks_str = row.get("Marks") or row.get("marks_obtained") or row.get("score")
        
        if student_id_str and marks_str is not None:
            student = db.query(Student).filter(Student.student_id == student_id_str.strip()).first()
            if student:
                try:
                    marks_val = float(marks_str.strip())
                    res = db.query(ExamResult).filter(
                        ExamResult.exam_id == exam_id,
                        ExamResult.student_id == student.id
                    ).first()
                    if not res:
                        res = ExamResult(
                            exam_id=exam_id,
                            student_id=student.id,
                            marks_obtained=marks_val,
                            is_absent=False
                        )
                        db.add(res)
                    else:
                        res.marks_obtained = marks_val
                    processed += 1
                    evaluate_student_risk(db, student.id)
                except ValueError:
                    continue

    db.commit()

    log_audit_event(
        db=db,
        action="CSV_MARKS_UPLOADED",
        entity_type="ExamResult",
        entity_id=str(exam_id),
        user=current_user,
        details={"processed": processed, "filename": file.filename}
    )

    return {"message": f"Successfully imported marks for {processed} students from CSV"}
