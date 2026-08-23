import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newGoal = {
      id: Math.floor(1000 + Math.random() * 9000),
      student_id: 1,
      title: body.title || "Academic Target Goal",
      target_score: Number(body.target_score) || 85.0,
      current_score: Number(body.current_score) || 75.0,
      deadline: body.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      progress_percentage: Math.round(((Number(body.current_score) || 75) / (Number(body.target_score) || 85)) * 100 * 10) / 10,
      status: "ACTIVE",
      subject_name: "Overall Target",
    };
    return NextResponse.json(newGoal, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create goal" }, { status: 400 });
  }
}
