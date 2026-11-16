import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        title: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, title } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Generate avatar initials from name
    const initials = name
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        title: title ? title.trim() : "Team Member",
        avatar: initials || "U",
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
