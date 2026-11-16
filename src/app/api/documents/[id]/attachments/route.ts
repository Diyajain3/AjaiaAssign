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
    const attachmentId = searchParams.get("attachmentId");

    const { role } = await getUserDocumentRole(id, userId);
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (attachmentId) {
      const attachment = await prisma.documentAttachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment || attachment.documentId !== id) {
        return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
      }

      return NextResponse.json(attachment);
    }

    const attachments = await prisma.documentAttachment.findMany({
      where: { documentId: id },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
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
    const { userId, fileName, fileType, fileSize, fileData } = body;

    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: "fileName and fileData are required" },
        { status: 400 }
      );
    }

    const { role } = await getUserDocumentRole(documentId, userId);

    if (!role || role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors and owners can upload attachments" },
        { status: 403 }
      );
    }

    const attachment = await prisma.documentAttachment.create({
      data: {
        documentId,
        fileName,
        fileType: fileType || "application/octet-stream",
        fileSize: fileSize || 0,
        fileData,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Failed to save attachment:", error);
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
    const userId = searchParams.get("userId");
    const attachmentId = searchParams.get("attachmentId");

    if (!attachmentId) {
      return NextResponse.json({ error: "attachmentId is required" }, { status: 400 });
    }

    const { role } = await getUserDocumentRole(documentId, userId);
    if (!role || role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors and owners can delete attachments" },
        { status: 403 }
      );
    }

    await prisma.documentAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true, message: "Attachment deleted" });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
