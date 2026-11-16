import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserDocumentRole } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const { role } = await getUserDocumentRole(id, userId);
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const shares = await prisma.documentShare.findMany({
      where: { documentId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, title: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error("Failed to fetch shares:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = params;
    const body = await request.json();
    const { requestingUserId, targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "targetUserId and role ('EDITOR' | 'VIEWER') are required" },
        { status: 400 }
      );
    }

    if (role !== "EDITOR" && role !== "VIEWER") {
      return NextResponse.json({ error: "Role must be 'EDITOR' or 'VIEWER'" }, { status: 400 });
    }

    const { role: userRole, document } = await getUserDocumentRole(documentId, requestingUserId);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (userRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only the document owner can manage collaborators" },
        { status: 403 }
      );
    }

    if (document.ownerId === targetUserId) {
      return NextResponse.json(
        { error: "Cannot share document with the document owner" },
        { status: 400 }
      );
    }

    // Upsert share
    const share = await prisma.documentShare.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId: targetUserId,
        },
      },
      update: {
        role,
      },
      create: {
        documentId,
        userId: targetUserId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, title: true },
        },
      },
    });

    return NextResponse.json(share, { status: 200 });
  } catch (error) {
    console.error("Failed to share document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: documentId } = params;
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get("requestingUserId");
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 });
    }

    const { role: userRole } = await getUserDocumentRole(documentId, requestingUserId);

    if (userRole !== "OWNER") {
      return NextResponse.json(
        { error: "Only the document owner can revoke access" },
        { status: 403 }
      );
    }

    await prisma.documentShare.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true, message: "Access revoked" });
  } catch (error) {
    console.error("Failed to revoke share:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
