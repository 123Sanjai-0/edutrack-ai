from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel
from app.models.assessment import ExamType, AttendanceStatus, SubmissionStatus

# Exam Schemas
class ExamBase(BaseModel):
    title: str
    exam_type: ExamType = ExamType.MIDTERM
    subject_id: int
    class_section_id: int
    max_marks: float = 100.0
    weight_percentage: float = 20.0
    exam_date: date
    is_published: bool = True

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    exam_type: Optional[ExamType] = None
    subject_id: Optional[int] = None
    class_section_id: Optional[int] = None
    max_marks: Optional[float] = None
    weight_percentage: Optional[float] = None
    exam_date: Optional[date] = None
    is_published: Optional[bool] = None


class ExamResponse(ExamBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    class_section_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Exam Result Schemas
class ExamResultBase(BaseModel):
    exam_id: int
    student_id: int
    marks_obtained: float
    is_absent: bool = False
    remarks: Optional[str] = None

class ExamResultCreate(ExamResultBase):
    pass

class ExamResultResponse(ExamResultBase):
    id: int
    student_name: Optional[str] = None
    student_roll_no: Optional[str] = None
    percentage: Optional[float] = None
    created_at: datetime
    class Config:
        from_attributes = True

class SingleMarkEntry(BaseModel):
    student_id: int
    marks_obtained: float
    is_absent: bool = False
    remarks: Optional[str] = None

class BulkMarksEntry(BaseModel):
    exam_id: int
    marks: List[SingleMarkEntry]

# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_id: int
    class_section_id: int
    max_marks: float = 20.0
    weight_percentage: float = 10.0
    due_date: datetime

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentResponse(AssignmentBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    class_section_name: Optional[str] = None
    submission_count: Optional[int] = 0
    created_at: datetime
    class Config:
        from_attributes = True

class AssignmentSubmissionBase(BaseModel):
    assignment_id: int
    student_id: int
    status: SubmissionStatus = SubmissionStatus.SUBMITTED
    marks_obtained: Optional[float] = None
    submitted_at: Optional[datetime] = None
    feedback: Optional[str] = None

class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    pass

class AssignmentSubmissionResponse(AssignmentSubmissionBase):
    id: int
    student_name: Optional[str] = None
    student_roll_no: Optional[str] = None
    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceRecordBase(BaseModel):
    student_id: int
    subject_id: int
    class_section_id: int
    date: date
    period: int = 1
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    student_name: Optional[str] = None
    student_roll_no: Optional[str] = None
    recorded_at: datetime
    class Config:
        from_attributes = True

class SingleStudentAttendance(BaseModel):
    student_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None

class BulkAttendanceEntry(BaseModel):
    subject_id: int
    class_section_id: int
    date: date
    period: int = 1
    records: List[SingleStudentAttendance]
