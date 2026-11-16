import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseFileToHtml } from "@/lib/fileParser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file into title and clean HTML
    const { title, html } = await parseFileToHtml(fileName, buffer);

    // Create new document in database
    const document = await prisma.document.create({
      data: {
        title: title || "Imported Document",
        content: html,
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        documentId: document.id,
        title: document.title,
        document,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to import document:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse and import document" },
      { status: 500 }
    );
  }
}
