import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserDocumentRole } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; shareId: string } }
) {
  try {
    const { id: documentId, shareId } = params;
    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get("requestingUserId");

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
