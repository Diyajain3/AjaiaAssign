import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    const { searchParams } = new URL(request.url);
    const userId = sessionUser?.id || searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get documents owned by user
    const ownedDocs = await prisma.document.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: { attachments: true, shares: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get documents shared with user
    const sharedShares = await prisma.documentShare.findMany({
      where: { userId },
      include: {
        document: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            shares: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
            _count: {
              select: { attachments: true, shares: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const owned = ownedDocs.map((doc) => ({
      ...doc,
      userRole: "OWNER",
    }));

    const shared = sharedShares.map((share) => ({
      ...share.document,
      userRole: share.role,
      sharedAt: share.createdAt,
    }));

    return NextResponse.json({ owned, shared });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);
    const body = await request.json();
    const ownerId = sessionUser?.id || body.ownerId;
    const { title = "Untitled Document", content = "" } = body;

    if (!ownerId) {
      return NextResponse.json({ error: "Authentication required to create document" }, { status: 401 });
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim() || "Untitled Document",
        content: content || "<p></p>",
        ownerId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Failed to create document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
