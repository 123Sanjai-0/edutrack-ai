import os
import random
from datetime import datetime, timezone, date, timedelta
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
import app.models  # ensure models are registered
from app.models.user import User, UserRole
from app.models.academic import (
    Department, Course, Semester, Subject, ClassSection,
    Student, Faculty, Enrollment, FacultySubjectAssignment, AcademicStatus
)
from app.models.assessment import (
    Exam, ExamResult, ExamType,
    Assignment, AssignmentSubmission, SubmissionStatus,
    AttendanceRecord, AttendanceStatus
)
from app.models.analytics import (
    AcademicConfig, AcademicGoal, GoalStatus,
    Notification, NotificationType, AuditLog
)
from app.ml.model_trainer import train_academic_models
from app.services.risk_engine import evaluate_student_risk
from app.services.recommendation_engine import generate_student_recommendations

FIRST_NAMES = [
    "Aarav", "Aditi", "Alexander", "Ananya", "Benjamin", "Charlotte", "Daniel", "Divya",
    "Emma", "Ethan", "Fatima", "Gabriel", "Grace", "Harsh", "Ibrahim", "Ishaan",
    "James", "Jessica", "Kabir", "Kavya", "Liam", "Lucas", "Maya", "Meera",
    "Michael", "Neha", "Noah", "Olivia", "Pooja", "Pranav", "Rahul", "Rhea",
    "Rohan", "Samantha", "Samuel", "Sarah", "Shreya", "Siddharth", "Sophia", "Tanvi",
    "Varun", "Vikram", "William", "Yash", "Zara", "Aiden", "Amara", "Carlos",
    "Elena", "Felix", "Hana", "Isaac", "Jasmine", "Kai", "Layla", "Leo",
    "Mateo", "Nora", "Oscar", "Priya", "Quinn", "Rayyan", "Sonia", "Tariq",
    "Uma", "Victor", "Wren", "Xavier", "Yusuf", "Zoe", "Aditya", "Bhavya",
    "Chetan", "Deepak", "Esha", "Gaurav", "Hemant", "Indu", "Jatin", "Kiran",
    "Lalit", "Manoj", "Naveen", "Omkar", "Pankaj", "Rakesh", "Suresh", "Tarun",
    "Umesh", "Vivek", "Zain", "Austin", "Bella", "Connor", "Daisy", "Eli"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Iyer", "Nair", "Gupta", "Singh",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
    "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Perez",
    "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
    "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
    "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner"
]

def seed_database():
    print("Initializing Database and Tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    random.seed(42)

    try:
        # 1. Academic Configuration
        print("Creating Academic Configuration...")
        config = AcademicConfig(
            institution_name="Apex Institute of Technology & Advanced Science",
            weight_internal_assessment=20.0,
            weight_assignments=10.0,
            weight_quizzes=10.0,
            weight_attendance=10.0,
            weight_midterm=20.0,
            weight_final=30.0,
            attendance_minimum_pct=75.0,
            attendance_warning_pct=80.0,
            passing_grade_pct=40.0,
            risk_low_max=30.0,
            risk_medium_max=60.0,
            risk_high_max=80.0
        )
        db.add(config)
        db.commit()

        # 2. Departments
        print("Creating Departments...")
        cse = Department(code="CSE", name="Department of Computer Science & Engineering", description="Core software systems and computing architectures.")
        aids = Department(code="AIDS", name="Department of Artificial Intelligence & Data Science", description="Machine learning, big data analytics, and neural systems.")
        ece = Department(code="ECE", name="Department of Electronics & Communication", description="Embedded systems, VLSI, and digital communications.")
        db.add_all([cse, aids, ece])
        db.commit()

        # 3. Courses
        print("Creating Courses...")
        btech_cse = Course(code="BTECH-CSE", name="B.Tech in Computer Science & Engineering", department_id=cse.id, duration_years=4, degree_type="B.Tech")
        btech_aids = Course(code="BTECH-AIDS", name="B.Tech in AI & Data Science", department_id=aids.id, duration_years=4, degree_type="B.Tech")
        btech_ece = Course(code="BTECH-ECE", name="B.Tech in Electronics & Communication", department_id=ece.id, duration_years=4, degree_type="B.Tech")
        db.add_all([btech_cse, btech_aids, btech_ece])
        db.commit()

        # 4. Semesters
        print("Creating Semesters...")
        sem4 = Semester(number=4, academic_year="2025-2026", term="Spring", is_current=True, start_date=date(2026, 1, 10), end_date=date(2026, 5, 25))
        sem6 = Semester(number=6, academic_year="2025-2026", term="Spring", is_current=False, start_date=date(2026, 1, 10), end_date=date(2026, 5, 25))
        db.add_all([sem4, sem6])
        db.commit()

        # 5. Subjects
        print("Creating Subjects...")
        cse_subjects = [
            Subject(code="CS401", name="Database Management Systems", department_id=cse.id, semester_id=sem4.id, credits=4, syllabus_topics="Normalization, SQL, Indexing, Transactions"),
            Subject(code="CS402", name="Design & Analysis of Algorithms", department_id=cse.id, semester_id=sem4.id, credits=4, syllabus_topics="Dynamic Programming, Graphs, Divide & Conquer"),
            Subject(code="CS403", name="Operating Systems", department_id=cse.id, semester_id=sem4.id, credits=3, syllabus_topics="Processes, Threads, Semaphores, Memory Management"),
            Subject(code="CS404", name="Computer Networks", department_id=cse.id, semester_id=sem4.id, credits=3, syllabus_topics="OSI Model, TCP/IP, Routing, Subnetting"),
            Subject(code="MA401", name="Applied Linear Algebra & Calculus", department_id=cse.id, semester_id=sem4.id, credits=3, syllabus_topics="Eigenvalues, SVD, Vector Spaces, Optimization"),
        ]
        aids_subjects = [
            Subject(code="AI401", name="Foundations of Machine Learning", department_id=aids.id, semester_id=sem4.id, credits=4, syllabus_topics="Supervised Learning, Regressions, Decision Trees"),
            Subject(code="DS402", name="Big Data Analytics & Spark", department_id=aids.id, semester_id=sem4.id, credits=4, syllabus_topics="Hadoop, PySpark, MapReduce, Stream Processing"),
            Subject(code="AI403", name="Deep Neural Networks", department_id=aids.id, semester_id=sem4.id, credits=3, syllabus_topics="Backpropagation, CNNs, Transformers, Optimization"),
            Subject(code="DS404", name="Data Mining & Warehousing", department_id=aids.id, semester_id=sem4.id, credits=3, syllabus_topics="OLAP, Clustering, Association Rules"),
            Subject(code="MA402", name="Probability & Statistical Inference", department_id=aids.id, semester_id=sem4.id, credits=3, syllabus_topics="Bayes Theorem, Hypothesis Testing, Distributions"),
        ]
        db.add_all(cse_subjects + aids_subjects)
        db.commit()

        # 6. Admin User
        print("Creating Admin User...")
        admin_user = User(
            email="admin@edutrack.ai",
            username="admin",
            full_name="Dr. Arthur Vance (Dean)",
            hashed_password=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            phone="+1 (555) 019-2831",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            is_active=True
        )
        db.add(admin_user)
        db.commit()

        # 7. Faculty Members
        print("Creating Faculty Members...")
        faculty_configs = [
            {"name": "Prof. Alan Smith", "email": "prof.smith@edutrack.ai", "user": "profsmith", "dept": cse, "desig": "Professor & Head", "id": "FAC101", "spec": "Distributed Systems & Algorithms"},
            {"name": "Dr. Sarah Jenkins", "email": "dr.jenkins@edutrack.ai", "user": "drjenkins", "dept": cse, "desig": "Associate Professor", "id": "FAC102", "spec": "Database Architecture & Optimization"},
            {"name": "Prof. David Chen", "email": "prof.chen@edutrack.ai", "user": "profchen", "dept": aids, "desig": "Assistant Professor", "id": "FAC201", "spec": "Deep Learning & Neural Networks"},
            {"name": "Dr. Priya Raman", "email": "dr.raman@edutrack.ai", "user": "drraman", "dept": aids, "desig": "Associate Professor", "id": "FAC202", "spec": "Statistical Machine Learning"}
        ]
        
        faculty_records = []
        for fc in faculty_configs:
            f_user = User(
                email=fc["email"],
                username=fc["user"],
                full_name=fc["name"],
                hashed_password=get_password_hash("Faculty@123"),
                role=UserRole.FACULTY,
                phone="+1 (555) 018-4491",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                is_active=True
            )
            db.add(f_user)
            db.flush()

            fac = Faculty(
                faculty_id=fc["id"],
                user_id=f_user.id,
                department_id=fc["dept"].id,
                designation=fc["desig"],
                qualification="Ph.D. in Computer Science",
                specialization=fc["spec"]
            )
            db.add(fac)
            db.flush()
            faculty_records.append(fac)
        db.commit()

        # 8. Class Sections
        print("Creating Class Sections...")
        sec_cse_a = ClassSection(name="CSE-4A", department_id=cse.id, semester_id=sem4.id, academic_year="2025-2026", faculty_advisor_id=faculty_records[0].id)
        sec_cse_b = ClassSection(name="CSE-4B", department_id=cse.id, semester_id=sem4.id, academic_year="2025-2026", faculty_advisor_id=faculty_records[1].id)
        sec_aids_a = ClassSection(name="AIDS-4A", department_id=aids.id, semester_id=sem4.id, academic_year="2025-2026", faculty_advisor_id=faculty_records[2].id)
        db.add_all([sec_cse_a, sec_cse_b, sec_aids_a])
        db.commit()

        # Faculty Assignments
        fsa1 = FacultySubjectAssignment(faculty_id=faculty_records[0].id, subject_id=cse_subjects[1].id, class_section_id=sec_cse_a.id) # Algorithms
        fsa2 = FacultySubjectAssignment(faculty_id=faculty_records[1].id, subject_id=cse_subjects[0].id, class_section_id=sec_cse_a.id) # DBMS
        fsa3 = FacultySubjectAssignment(faculty_id=faculty_records[2].id, subject_id=aids_subjects[0].id, class_section_id=sec_aids_a.id) # ML
        db.add_all([fsa1, fsa2, fsa3])
        db.commit()

        # 9. Assessments Setup (Exams & Assignments)
        print("Creating Exams and Assignments...")
        all_exams = []
        all_assignments = []
        
        for sub in cse_subjects:
            # Midterm Exam
            ex_mid = Exam(title=f"{sub.code} Midterm Examination", exam_type=ExamType.MIDTERM, subject_id=sub.id, class_section_id=sec_cse_a.id, max_marks=100.0, weight_percentage=20.0, exam_date=date(2026, 3, 15))
            # Internal Unit Test
            ex_ia = Exam(title=f"{sub.code} Continuous Assessment Test 1", exam_type=ExamType.INTERNAL_ASSESSMENT, subject_id=sub.id, class_section_id=sec_cse_a.id, max_marks=50.0, weight_percentage=20.0, exam_date=date(2026, 2, 20))
            # Quiz
            ex_quiz = Exam(title=f"{sub.code} Concept Quiz 1", exam_type=ExamType.QUIZ, subject_id=sub.id, class_section_id=sec_cse_a.id, max_marks=20.0, weight_percentage=10.0, exam_date=date(2026, 2, 5))
            all_exams.extend([ex_mid, ex_ia, ex_quiz])
            
            # Assignment
            ass = Assignment(title=f"{sub.name} Practical Problem Set 1", description="Solve core syllabus problems and submit code/derivations.", subject_id=sub.id, class_section_id=sec_cse_a.id, max_marks=20.0, weight_percentage=10.0, due_date=datetime(2026, 2, 28, 23, 59))
            all_assignments.append(ass)

        for sub in aids_subjects:
            ex_mid = Exam(title=f"{sub.code} Midterm Examination", exam_type=ExamType.MIDTERM, subject_id=sub.id, class_section_id=sec_aids_a.id, max_marks=100.0, weight_percentage=20.0, exam_date=date(2026, 3, 15))
            ex_ia = Exam(title=f"{sub.code} Continuous Assessment Test 1", exam_type=ExamType.INTERNAL_ASSESSMENT, subject_id=sub.id, class_section_id=sec_aids_a.id, max_marks=50.0, weight_percentage=20.0, exam_date=date(2026, 2, 20))
            ex_quiz = Exam(title=f"{sub.code} Concept Quiz 1", exam_type=ExamType.QUIZ, subject_id=sub.id, class_section_id=sec_aids_a.id, max_marks=20.0, weight_percentage=10.0, exam_date=date(2026, 2, 5))
            all_exams.extend([ex_mid, ex_ia, ex_quiz])

            ass = Assignment(title=f"{sub.name} Project Assignment 1", description="Implement algorithms and evaluate on test datasets.", subject_id=sub.id, class_section_id=sec_aids_a.id, max_marks=20.0, weight_percentage=10.0, due_date=datetime(2026, 2, 28, 23, 59))
            all_assignments.append(ass)

        db.add_all(all_exams + all_assignments)
        db.commit()

        # 10. Generate 110 Realistic Students
        print("Generating 110 Correlated Student Records...")
        
        # Primary Demo Student
        demo_user = User(
            email="john.doe@edutrack.ai",
            username="johndoe",
            full_name="John Doe",
            hashed_password=get_password_hash("Student@123"),
            role=UserRole.STUDENT,
            phone="+1 (555) 014-9921",
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            is_active=True
        )
        db.add(demo_user)
        db.flush()

        demo_student = Student(
            student_id="STU2025001",
            user_id=demo_user.id,
            department_id=cse.id,
            course_id=btech_cse.id,
            semester_id=sem4.id,
            class_section_id=sec_cse_a.id,
            dob=date(2004, 5, 14),
            admission_year=2024,
            academic_status=AcademicStatus.ACTIVE,
            cgpa=8.45,
            total_credits_earned=68
        )
        db.add(demo_student)
        db.flush()

        # Student cohort generation
        students_cohort = [demo_student]
        
        for i in range(2, 115):
            fn = FIRST_NAMES[(i - 2) % len(FIRST_NAMES)]
            ln = LAST_NAMES[(i * 3) % len(LAST_NAMES)]
            full_name = f"{fn} {ln}"
            stu_id_code = f"STU2025{i:03d}"
            email_handle = f"{fn.lower()}.{ln.lower()}{i}@edutrack.ai"
            username = f"{fn.lower()}{i}"

            # Distribute across departments
            if i % 3 == 0:
                cur_dept = aids
                cur_course = btech_aids
                cur_sec = sec_aids_a
            elif i % 3 == 1:
                cur_dept = cse
                cur_course = btech_cse
                cur_sec = sec_cse_a
            else:
                cur_dept = cse
                cur_course = btech_cse
                cur_sec = sec_cse_b

            u = User(
                email=email_handle,
                username=username,
                full_name=full_name,
                hashed_password=get_password_hash("Student@123"),
                role=UserRole.STUDENT,
                phone=f"+1 (555) 012-{random.randint(1000, 9999)}",
                avatar_url=None,
                is_active=True
            )
            db.add(u)
            db.flush()

            # Realistic baseline CGPA with deliberate risk clusters
            # i % 7 == 0 -> high risk student
            # i % 5 == 0 -> top performer
            if i % 7 == 0:
                base_cgpa = round(random.uniform(3.8, 5.4), 2)
                acad_status = AcademicStatus.AT_RISK
            elif i % 5 == 0:
                base_cgpa = round(random.uniform(8.8, 9.7), 2)
                acad_status = AcademicStatus.ACTIVE
            else:
                base_cgpa = round(random.uniform(6.5, 8.4), 2)
                acad_status = AcademicStatus.ACTIVE

            stu = Student(
                student_id=stu_id_code,
                user_id=u.id,
                department_id=cur_dept.id,
                course_id=cur_course.id,
                semester_id=sem4.id,
                class_section_id=cur_sec.id,
                dob=date(2004, random.randint(1, 12), random.randint(1, 28)),
                admission_year=2024,
                academic_status=acad_status,
                cgpa=base_cgpa,
                total_credits_earned=64
            )
            db.add(stu)
            db.flush()
            students_cohort.append(stu)

        db.commit()

        # 11. Populate Enrollments, Marks, Submissions, and Attendance
        print("Populating Marks, Submissions, and Attendance records...")
        
        # Dates for attendance (30 lecture days)
        attendance_dates = [date(2026, 1, 15) + timedelta(days=d*3) for d in range(25)]

        for stu in students_cohort:
            dept_subjects = cse_subjects if stu.department_id == cse.id else aids_subjects
            is_at_risk = (stu.academic_status == AcademicStatus.AT_RISK) or (stu.cgpa < 5.8)
            is_top = (stu.cgpa > 8.7)

            for sub in dept_subjects:
                # 1. Enrollment
                enr = Enrollment(student_id=stu.id, subject_id=sub.id, semester_id=sem4.id, is_completed=False)
                db.add(enr)

                # 2. Attendance Records (correlated)
                # At risk student has ~55-68% attendance; Normal has ~82-94%; Top has ~92-98%
                att_prob = random.uniform(0.52, 0.68) if is_at_risk else (random.uniform(0.92, 0.98) if is_top else random.uniform(0.78, 0.90))
                for att_date in attendance_dates:
                    is_present = random.random() < att_prob
                    status_val = AttendanceStatus.PRESENT if is_present else (AttendanceStatus.LATE if random.random() < 0.1 else AttendanceStatus.ABSENT)
                    rec = AttendanceRecord(
                        student_id=stu.id,
                        subject_id=sub.id,
                        class_section_id=stu.class_section_id or sec_cse_a.id,
                        date=att_date,
                        period=1,
                        status=status_val
                    )
                    db.add(rec)

                # 3. Exam Results
                sub_exams = [e for e in all_exams if e.subject_id == sub.id and e.class_section_id == (stu.class_section_id or sec_cse_a.id)]
                for ex in sub_exams:
                    if is_at_risk:
                        earned_pct = random.uniform(28.0, 52.0)
                    elif is_top:
                        earned_pct = random.uniform(85.0, 98.0)
                    else:
                        earned_pct = random.uniform(62.0, 84.0)

                    marks_val = round((earned_pct / 100.0) * ex.max_marks, 1)
                    res = ExamResult(
                        exam_id=ex.id,
                        student_id=stu.id,
                        marks_obtained=marks_val,
                        is_absent=False
                    )
                    db.add(res)

                # 4. Assignment Submissions
                sub_assignments = [a for a in all_assignments if a.subject_id == sub.id and a.class_section_id == (stu.class_section_id or sec_cse_a.id)]
                for a in sub_assignments:
                    if is_at_risk and random.random() < 0.35:
                        # Missed assignment
                        submission = AssignmentSubmission(
                            assignment_id=a.id,
                            student_id=stu.id,
                            status=SubmissionStatus.MISSED,
                            marks_obtained=0.0
                        )
                    else:
                        ass_pct = random.uniform(40.0, 65.0) if is_at_risk else (random.uniform(85.0, 100.0) if is_top else random.uniform(70.0, 90.0))
                        submission = AssignmentSubmission(
                            assignment_id=a.id,
                            student_id=stu.id,
                            status=SubmissionStatus.GRADED,
                            marks_obtained=round((ass_pct / 100.0) * a.max_marks, 1),
                            submitted_at=datetime(2026, 2, 27, 18, 30)
                        )
                    db.add(submission)

        db.commit()

        # 12. Create Academic Goals for Demo Student
        print("Creating Sample Academic Goals and Notifications...")
        goal1 = AcademicGoal(
            student_id=demo_student.id,
            subject_id=cse_subjects[0].id, # DBMS
            title="Score 85+ in DBMS Final Exam",
            target_score=85.0,
            current_score=78.0,
            deadline=datetime(2026, 5, 20, 0, 0),
            progress_percentage=91.7,
            status=GoalStatus.ACTIVE,
            created_at=datetime.now(timezone.utc)
        )
        goal2 = AcademicGoal(
            student_id=demo_student.id,
            subject_id=cse_subjects[1].id, # Algorithms
            title="Master Dynamic Programming Graph Modules",
            target_score=90.0,
            current_score=84.0,
            deadline=datetime(2026, 4, 30, 0, 0),
            progress_percentage=93.3,
            status=GoalStatus.ACTIVE,
            created_at=datetime.now(timezone.utc)
        )
        db.add_all([goal1, goal2])

        # Notifications
        notif1 = Notification(
            user_id=demo_user.id,
            title="Midterm Examination Results Published",
            message="Your results for CS401 and CS402 have been published. Check your scorecard.",
            notification_type=NotificationType.INFO,
            is_read=False,
            link="/student/marks",
            created_at=datetime.now(timezone.utc)
        )
        notif2 = Notification(
            user_id=demo_user.id,
            title="Personalized AI Study Plan Ready",
            message="EduTrack AI generated 2 new practice problem recommendations for DBMS Normalization.",
            notification_type=NotificationType.ALERT,
            is_read=False,
            link="/student/recommendations",
            created_at=datetime.now(timezone.utc)
        )
        notif_admin = Notification(
            user_id=admin_user.id,
            title="Weekly Early Warning Summary",
            message="14 students have been flagged with high risk due to attendance shortages (<75%).",
            notification_type=NotificationType.WARNING,
            is_read=False,
            link="/admin/analytics",
            created_at=datetime.now(timezone.utc)
        )
        db.add_all([notif1, notif2, notif_admin])

        # Initial Audit Log Entry
        audit1 = AuditLog(
            user_id=admin_user.id,
            user_email=admin_user.email,
            action="SYSTEM_INITIALIZED",
            entity_type="Institution",
            entity_id="1",
            details={"students_seeded": len(students_cohort), "departments": 3},
            ip_address="127.0.0.1",
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit1)
        db.commit()

        # 13. Pre-train ML Models and Evaluate Initial Risks
        print("Training Machine Learning Models and calculating risk vectors...")
        train_academic_models()
        
        for s in students_cohort[:30]:
            evaluate_student_risk(db, s.id)
            generate_student_recommendations(db, s.id)

        print("Database Seed Completed Successfully!")
        print(f"Total Students: {len(students_cohort)}")
        print("Demo Credentials:")
        print("  Admin:   admin@edutrack.ai / Admin@123")
        print("  Faculty: prof.smith@edutrack.ai / Faculty@123")
        print("  Student: john.doe@edutrack.ai / Student@123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
