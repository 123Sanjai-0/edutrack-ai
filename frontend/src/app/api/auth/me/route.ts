import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    id: 1,
    email: "john.doe@edutrack.ai",
    username: "johndoe",
    full_name: "John Doe",
    role: "STUDENT",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    student_profile_id: 1,
    faculty_profile_id: null,
  });
}
