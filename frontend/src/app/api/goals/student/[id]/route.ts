import { NextRequest, NextResponse } from "next/server";

let MOCK_GOALS = [
  {
    id: 1,
    student_id: 1,
    subject_id: 1,
    subject_name: "Database Management Systems",
    subject_code: "CS401",
    title: "Score 85+ in DBMS Final Exam",
    target_score: 85.0,
    current_score: 78.0,
    deadline: "2026-05-20T00:00:00",
    progress_percentage: 91.7,
    status: "ACTIVE",
  },
  {
    id: 2,
    student_id: 1,
    subject_id: 2,
    subject_name: "Design & Analysis of Algorithms",
    subject_code: "CS402",
    title: "Master Dynamic Programming Graph Modules",
    target_score: 90.0,
    current_score: 84.0,
    deadline: "2026-04-30T00:00:00",
    progress_percentage: 93.3,
    status: "ACTIVE",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const studentId = Number(params.id);
  const studentGoals = MOCK_GOALS.filter((g) => g.student_id === studentId || studentId === 1);
  return NextResponse.json(studentGoals);
}
