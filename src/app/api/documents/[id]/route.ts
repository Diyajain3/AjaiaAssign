import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserDocumentRole } from "@/lib/permissions";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sessionUser = await getSessionUser(request);
    const { searchParams } = new URL(request.url);
    const userId = sessionUser?.id || searchParams.get("userId");

    const { role, document } = await getUserDocumentRole(id, userId);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!role) {
      return NextResponse.json(
        { error: "Access denied. You do not have permission to view this document." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...document,
      userRole: role,
    });
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sessionUser = await getSessionUser(request);
    const body = await request.json();
    const userId = sessionUser?.id || body.userId;

    const { role, document } = await getUserDocumentRole(id, userId);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!role || role === "VIEWER") {
      return NextResponse.json(
        { error: "You only have view access to this document." },
        { status: 403 }
      );
    }

    // Build update payload
    const updateData: Record<string, any> = {};

    if (typeof body.title === "string") {
      updateData.title = body.title.trim() || "Untitled Document";
    }

    if (typeof body.content === "string") {
      updateData.content = body.content;
    }

    // Only OWNER can alter public sharing settings
    if (role === "OWNER") {
      if (typeof body.isPublic === "boolean") {
        updateData.isPublic = body.isPublic;
      }
      if (body.publicRole === "VIEWER" || body.publicRole === "EDITOR") {
        updateData.publicRole = body.publicRole;
      }
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      userRole: role,
    });
  } catch (error) {
    console.error("Failed to update document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sessionUser = await getSessionUser(request);
    const { searchParams } = new URL(request.url);
    const userId = sessionUser?.id || searchParams.get("userId");

    const { role, document } = await getUserDocumentRole(id, userId);

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the document owner can delete this document." },
        { status: 403 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Document deleted" });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
