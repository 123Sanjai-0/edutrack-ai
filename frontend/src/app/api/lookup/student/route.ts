import { NextRequest, NextResponse } from "next/server";

// Sample student scorecard database for production serverless execution on Vercel
const MOCK_STUDENTS: Record<string, any> = {
  "john.doe@edutrack.ai": {
    student: {
      full_name: "John Doe",
      email: "john.doe@edutrack.ai",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      student_id: "STU2025001",
      department_name: "Department of Computer Science & Engineering",
      department_code: "CSE",
      course_name: "B.Tech in Computer Science & Engineering",
      semester_number: 4,
      class_section_name: "CSE-4A",
      admission_year: 2024,
      academic_status: "ACTIVE",
      cgpa: 8.45,
      total_credits_earned: 68,
    },
    overall_percentage: 84.5,
    cgpa: 8.45,
    attendance_percentage: 89.2,
    risk_score: 18.5,
    risk_level: "LOW",
    risk_reasons: [],
    predicted_final_score: 87.2,
    predicted_grade: "A",
    prediction_confidence: 0.94,
    positive_factors: [
      "Consistent high attendance in core CS subjects (>88%)",
      "Excellent assignment submission timeline rate (95%)",
      "Strong performance in Data Structures & Algorithms",
    ],
    negative_factors: [
      "Minor score drop in Operating Systems Midterm test",
    ],
    subject_performances: [
      {
        subject_id: 1,
        subject_code: "CS401",
        subject_name: "Database Management Systems",
        credits: 4,
        attendance_pct: 91.0,
        internal_score: 86.0,
        assignment_score: 92.0,
        midterm_score: 84.0,
        total_weighted_score: 86.8,
        grade: "A",
        class_average: 74.2,
        status: "EXCELLENT",
      },
      {
        subject_id: 2,
        subject_code: "CS402",
        subject_name: "Design & Analysis of Algorithms",
        credits: 4,
        attendance_pct: 94.0,
        internal_score: 90.0,
        assignment_score: 95.0,
        midterm_score: 88.0,
        total_weighted_score: 90.5,
        grade: "A+",
        class_average: 71.5,
        status: "EXCELLENT",
      },
      {
        subject_id: 3,
        subject_code: "CS403",
        subject_name: "Operating Systems",
        credits: 3,
        attendance_pct: 82.0,
        internal_score: 75.0,
        assignment_score: 80.0,
        midterm_score: 72.0,
        total_weighted_score: 76.4,
        grade: "B+",
        class_average: 68.0,
        status: "GOOD",
      },
      {
        subject_id: 4,
        subject_code: "CS404",
        subject_name: "Computer Networks",
        credits: 3,
        attendance_pct: 88.0,
        internal_score: 82.0,
        assignment_score: 88.0,
        midterm_score: 80.0,
        total_weighted_score: 83.2,
        grade: "A",
        class_average: 72.0,
        status: "GOOD",
      },
      {
        subject_id: 5,
        subject_code: "MA401",
        subject_name: "Applied Linear Algebra",
        credits: 3,
        attendance_pct: 91.0,
        internal_score: 88.0,
        assignment_score: 90.0,
        midterm_score: 85.0,
        total_weighted_score: 87.5,
        grade: "A",
        class_average: 70.0,
        status: "EXCELLENT",
      },
    ],
    performance_trends: [
      { assessment: "Quiz 1", score: 82.0, class_average: 72.0 },
      { assessment: "Assignment 1", score: 92.0, class_average: 76.0 },
      { assessment: "Midterm Exam", score: 84.0, class_average: 70.0 },
      { assessment: "Quiz 2", score: 88.0, class_average: 74.0 },
      { assessment: "Assignment 2", score: 90.0, class_average: 77.0 },
    ],
    weak_subjects: [],
    radar_data: [
      { subject: "CS401", student_score: 86.8, class_average: 74.2 },
      { subject: "CS402", student_score: 90.5, class_average: 71.5 },
      { subject: "CS403", student_score: 76.4, class_average: 68.0 },
      { subject: "CS404", student_score: 83.2, class_average: 72.0 },
      { subject: "MA401", student_score: 87.5, class_average: 70.0 },
    ],
    academic_goals: [
      {
        id: 1,
        title: "Score 85+ in DBMS Final Exam",
        subject_name: "Database Management Systems",
        subject_code: "CS401",
        target_score: 85.0,
        current_score: 78.0,
        deadline: "2026-05-20T00:00:00",
        progress_percentage: 91.7,
        status: "ACTIVE",
      },
      {
        id: 2,
        title: "Master Dynamic Programming Graph Modules",
        subject_name: "Design & Analysis of Algorithms",
        subject_code: "CS402",
        target_score: 90.0,
        current_score: 84.0,
        deadline: "2026-04-30T00:00:00",
        progress_percentage: 93.3,
        status: "ACTIVE",
      },
    ],
  },
  "aarav.williams4@edutrack.ai": {
    student: {
      full_name: "Aarav Williams",
      email: "aarav.williams4@edutrack.ai",
      avatar_url: null,
      student_id: "STU2025004",
      department_name: "Department of Artificial Intelligence & Data Science",
      department_code: "AIDS",
      course_name: "B.Tech in AI & Data Science",
      semester_number: 4,
      class_section_name: "AIDS-4A",
      admission_year: 2024,
      academic_status: "ACTIVE",
      cgpa: 7.8,
      total_credits_earned: 64,
    },
    overall_percentage: 78.0,
    cgpa: 7.8,
    attendance_percentage: 84.0,
    risk_score: 25.0,
    risk_level: "LOW",
    risk_reasons: [],
    predicted_final_score: 80.5,
    predicted_grade: "A",
    prediction_confidence: 0.91,
    positive_factors: ["Good performance in AI Foundation labs"],
    negative_factors: ["Attendance in Big Data is close to warning threshold"],
    subject_performances: [
      {
        subject_id: 11,
        subject_code: "AI401",
        subject_name: "Foundations of Machine Learning",
        credits: 4,
        attendance_pct: 86.0,
        internal_score: 80.0,
        assignment_score: 85.0,
        midterm_score: 78.0,
        total_weighted_score: 81.0,
        grade: "A",
        class_average: 73.0,
        status: "GOOD",
      },
    ],
    performance_trends: [
      { assessment: "Quiz 1", score: 75.0, class_average: 72.0 },
      { assessment: "Midterm Exam", score: 78.0, class_average: 70.0 },
    ],
    weak_subjects: [],
    radar_data: [
      { subject: "AI401", student_score: 81.0, class_average: 73.0 },
    ],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json(
      { detail: "Please provide a student email address." },
      { status: 400 }
    );
  }

  // Try fetching from external backend if env variable is defined
  const backendUrl = process.env.BACKEND_API_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl.replace(/\/$/, '')}/lookup/student?email=${encodeURIComponent(email)}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to native mock data
    }
  }

  // Check mock database for direct serverless execution
  const result = MOCK_STUDENTS[email];
  if (result) {
    return NextResponse.json(result);
  }

  // Generic fallback generator for any edutrack.ai email
  if (email.endsWith("@edutrack.ai")) {
    const namePart = email.split("@")[0].replace(".", " ");
    const formattedName = namePart
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return NextResponse.json({
      student: {
        full_name: formattedName,
        email: email,
        avatar_url: null,
        student_id: `STU2025${Math.floor(100 + Math.random() * 899)}`,
        department_name: "Department of Computer Science & Engineering",
        department_code: "CSE",
        course_name: "B.Tech in Computer Science & Engineering",
        semester_number: 4,
        class_section_name: "CSE-4A",
        admission_year: 2024,
        academic_status: "ACTIVE",
        cgpa: 7.9,
        total_credits_earned: 64,
      },
      overall_percentage: 79.0,
      cgpa: 7.9,
      attendance_percentage: 86.5,
      risk_score: 22.0,
      risk_level: "LOW",
      risk_reasons: [],
      predicted_final_score: 81.5,
      predicted_grade: "A",
      prediction_confidence: 0.92,
      positive_factors: ["Good attendance and lab score trend"],
      negative_factors: [],
      subject_performances: [
        {
          subject_id: 1,
          subject_code: "CS401",
          subject_name: "Database Management Systems",
          credits: 4,
          attendance_pct: 88.0,
          internal_score: 80.0,
          assignment_score: 85.0,
          midterm_score: 76.0,
          total_weighted_score: 80.5,
          grade: "A",
          class_average: 72.0,
          status: "GOOD",
        },
        {
          subject_id: 2,
          subject_code: "CS402",
          subject_name: "Design & Analysis of Algorithms",
          credits: 4,
          attendance_pct: 85.0,
          internal_score: 78.0,
          assignment_score: 82.0,
          midterm_score: 74.0,
          total_weighted_score: 77.5,
          grade: "B+",
          class_average: 70.0,
          status: "GOOD",
        },
      ],
      performance_trends: [
        { assessment: "Quiz 1", score: 78.0, class_average: 72.0 },
        { assessment: "Midterm Exam", score: 76.0, class_average: 70.0 },
      ],
      weak_subjects: [],
      radar_data: [
        { subject: "CS401", student_score: 80.5, class_average: 72.0 },
        { subject: "CS402", student_score: 77.5, class_average: 70.0 },
      ],
      academic_goals: [
        {
          id: 101,
          title: "Achieve 85%+ in Semester Examinations",
          subject_name: "Overall Target",
          target_score: 85.0,
          current_score: 79.0,
          deadline: "2026-05-30T00:00:00",
          progress_percentage: 92.9,
          status: "ACTIVE",
        },
      ],
    });
  }

  return NextResponse.json(
    { detail: `No student record found for ${email}. Try john.doe@edutrack.ai` },
    { status: 404 }
  );
}
