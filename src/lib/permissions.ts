import prisma from "./prisma";

export type DocumentRole = "OWNER" | "EDITOR" | "VIEWER";

export async function getUserDocumentRole(
  documentId: string,
  userId: string | null | undefined
): Promise<{
  role: DocumentRole | null;
  document: any | null;
}> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatar: true, title: true },
      },
      shares: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, title: true },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!document) {
    return { role: null, document: null };
  }

  if (userId) {
    if (document.ownerId === userId) {
      return { role: "OWNER", document };
    }

    const userShare = document.shares.find((s) => s.userId === userId);
    if (userShare) {
      return { role: userShare.role as DocumentRole, document };
    }
  }

  if (document.isPublic) {
    return { role: (document.publicRole as DocumentRole) || "VIEWER", document };
  }

  return { role: null, document };
}
