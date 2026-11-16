import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@/lib/prisma";
import { getUserDocumentRole } from "@/lib/permissions";

describe("Document Permissions and Sharing Logic", () => {
  let ownerUser: any;
  let collaboratorUser: any;
  let unauthorizedUser: any;
  let testDoc: any;

  beforeAll(async () => {
    // Create test fixtures
    ownerUser = await prisma.user.create({
      data: {
        name: "Test Owner",
        email: `owner_${Date.now()}@ajaia.internal`,
        avatar: "TO",
      },
    });

    collaboratorUser = await prisma.user.create({
      data: {
        name: "Test Collaborator",
        email: `collab_${Date.now()}@ajaia.internal`,
        avatar: "TC",
      },
    });

    unauthorizedUser = await prisma.user.create({
      data: {
        name: "Test Stranger",
        email: `stranger_${Date.now()}@ajaia.internal`,
        avatar: "TS",
      },
    });

    testDoc = await prisma.document.create({
      data: {
        title: "Test Spec",
        content: "<p>Original content</p>",
        ownerId: ownerUser.id,
        isPublic: false,
      },
    });
  });

  afterAll(async () => {
    await prisma.documentShare.deleteMany({ where: { documentId: testDoc.id } });
    await prisma.document.delete({ where: { id: testDoc.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [ownerUser.id, collaboratorUser.id, unauthorizedUser.id] },
      },
    });
    await prisma.$disconnect();
  });

  it("identifies the creator as OWNER", async () => {
    const { role } = await getUserDocumentRole(testDoc.id, ownerUser.id);
    expect(role).toBe("OWNER");
  });

  it("denies access to unauthorized users on private document", async () => {
    const { role } = await getUserDocumentRole(testDoc.id, unauthorizedUser.id);
    expect(role).toBeNull();
  });

  it("grants VIEWER role when shared with VIEWER permission", async () => {
    await prisma.documentShare.create({
      data: {
        documentId: testDoc.id,
        userId: collaboratorUser.id,
        role: "VIEWER",
      },
    });

    const { role } = await getUserDocumentRole(testDoc.id, collaboratorUser.id);
    expect(role).toBe("VIEWER");
  });

  it("grants EDITOR role when shared with EDITOR permission", async () => {
    await prisma.documentShare.update({
      where: {
        documentId_userId: {
          documentId: testDoc.id,
          userId: collaboratorUser.id,
        },
      },
      data: {
        role: "EDITOR",
      },
    });

    const { role } = await getUserDocumentRole(testDoc.id, collaboratorUser.id);
    expect(role).toBe("EDITOR");
  });

  it("respects public link access when enabled", async () => {
    await prisma.document.update({
      where: { id: testDoc.id },
      data: { isPublic: true, publicRole: "VIEWER" },
    });

    const { role } = await getUserDocumentRole(testDoc.id, unauthorizedUser.id);
    expect(role).toBe("VIEWER");
  });
});
