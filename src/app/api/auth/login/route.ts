import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId, password } = body;

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: "Password is required to sign in." },
        { status: 400 }
      );
    }

    let user;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please check your credentials." },
        { status: 401 }
      );
    }

    // Verify password matches
    if (user.password !== password.trim()) {
      return NextResponse.json(
        { error: "Incorrect password. Please verify and try again." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        avatar: user.avatar,
      },
    });

    // Set authenticated session cookie (valid for 30 days)
    response.cookies.set("ajaia_session_user_id", user.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
