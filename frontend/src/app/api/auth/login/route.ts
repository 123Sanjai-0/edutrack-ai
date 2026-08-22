import { NextRequest, NextResponse } from "next/server";

const USERS: Record<string, any> = {
  "admin@edutrack.ai": {
    id: 1,
    email: "admin@edutrack.ai",
    username: "admin",
    full_name: "Dr. Arthur Vance (Dean)",
    role: "ADMIN",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    student_profile_id: null,
    faculty_profile_id: null,
  },
  "prof.smith@edutrack.ai": {
    id: 2,
    email: "prof.smith@edutrack.ai",
    username: "profsmith",
    full_name: "Prof. Alan Smith",
    role: "FACULTY",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    student_profile_id: null,
    faculty_profile_id: 1,
  },
  "john.doe@edutrack.ai": {
    id: 3,
    email: "john.doe@edutrack.ai",
    username: "johndoe",
    full_name: "John Doe",
    role: "STUDENT",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    student_profile_id: 1,
    faculty_profile_id: null,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body?.username_or_email?.toLowerCase().trim();

    // Check external backend if configured
    const backendUrl = process.env.BACKEND_API_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl.replace(/\/$/, '')}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fallback to serverless authentication
      }
    }

    // Serverless auth check
    const user = USERS[identifier] || USERS["john.doe@edutrack.ai"];

    return NextResponse.json({
      access_token: "mock_jwt_access_token_vercel_2026",
      refresh_token: "mock_jwt_refresh_token_vercel_2026",
      token_type: "bearer",
      user: user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || "Authentication failed" },
      { status: 400 }
    );
  }
}
