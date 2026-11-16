import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, title } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Generate avatar initials
    const initials = name
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        title: title ? title.trim() : "Team Member",
        avatar: initials || "U",
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        title: newUser.title,
        avatar: newUser.avatar,
      },
    });

    // Automatically authenticate the new user with session cookie
    response.cookies.set("ajaia_session_user_id", newUser.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
