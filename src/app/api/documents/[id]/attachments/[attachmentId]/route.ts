import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserDocumentRole } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { id: documentId, attachmentId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const { role } = await getUserDocumentRole(documentId, userId);
    if (!role) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const attachment = await prisma.documentAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment || attachment.documentId !== documentId) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Failed to fetch attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const { id: documentId, attachmentId } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

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
