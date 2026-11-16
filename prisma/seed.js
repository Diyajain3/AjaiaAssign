const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.documentAttachment.deleteMany();
  await prisma.documentShare.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alice = await prisma.user.create({
    data: {
      id: "user_alice",
      name: "Alice Chen",
      email: "alice@ajaia.internal",
      password: "alice123",
      title: "Product Lead",
      avatar: "AC",
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: "user_bob",
      name: "Bob Smith",
      email: "bob@ajaia.internal",
      password: "bob123",
      title: "Senior Staff Engineer",
      avatar: "BS",
    },
  });

  const charlie = await prisma.user.create({
    data: {
      id: "user_charlie",
      name: "Charlie Davis",
      email: "charlie@ajaia.internal",
      password: "charlie123",
      title: "Product Designer",
      avatar: "CD",
    },
  });

  // Document 1: Owned by Alice
  const doc1 = await prisma.document.create({
    data: {
      id: "doc_product_strategy",
      title: "Q4 Internal Productivity Roadmap",
      ownerId: alice.id,
      content: `<h1>Q4 Internal Productivity Roadmap</h1>
<p>This document details our planned initiatives to eliminate friction in cross-functional work across teams.</p>
<h2>1. Objectives and Success Criteria</h2>
<ul>
  <li>Reduce document handover latency across product and engineering teams.</li>
  <li>Consolidate project specifications, meeting notes, and architecture decisions in one reliable workspace.</li>
  <li>Provide deterministic permissions: Owner, Editor, and Viewer access.</li>
</ul>
<h2>2. Core Functional Requirements</h2>
<p>Each document must preserve formatting, persist reliably on every change, and support standard file ingestion.</p>
<blockquote>Productivity improves when tooling remains lightweight, fast, and free of unnecessary clutter.</blockquote>
<h3>Key Deliverables</h3>
<ol>
  <li><strong>Document Editor</strong>: Rich-text editing with formatting controls for headings, lists, underline, and emphasis.</li>
  <li><strong>File Workflow</strong>: Support importing existing documents (.docx, .md, .txt) and uploading file attachments.</li>
  <li><strong>Sharing Model</strong>: Explicit collaborator access grants with role separation.</li>
</ol>
<p>Please review the milestones below and leave feedback before Friday.</p>`,
      isPublic: true,
      publicRole: "VIEWER",
    },
  });

  // Share doc1 with Bob as EDITOR and Charlie as VIEWER
  await prisma.documentShare.create({
    data: {
      documentId: doc1.id,
      userId: bob.id,
      role: "EDITOR",
    },
  });
  await prisma.documentShare.create({
    data: {
      documentId: doc1.id,
      userId: charlie.id,
      role: "VIEWER",
    },
  });

  // Document 2: Owned by Bob, shared with Alice as EDITOR
  const doc2 = await prisma.document.create({
    data: {
      id: "doc_architecture_rfc",
      title: "Architecture RFC: Collaborative Document Persistence",
      ownerId: bob.id,
      content: `<h1>Architecture RFC: Collaborative Document Persistence</h1>
<p>Author: Bob Smith (Senior Staff Engineer)</p>
<p>Status: Under Review</p>
<h2>Abstract</h2>
<p>This RFC proposes our persistence and data integrity model for browser-based document editing.</p>
<h2>Data Store Selection</h2>
<p>We use a structured relational schema in SQLite. Relational constraints guarantee relational consistency between users, documents, permissions, and file attachments.</p>
<pre><code>model Document {
  id         String   @id
  title      String
  content    String
  ownerId    String
  createdAt  DateTime
  updatedAt  DateTime
}</code></pre>
<h2>Auto-save and Concurrency Strategy</h2>
<ul>
  <li>Client-side debouncing (800ms) prevents thrashing the persistence layer on keystrokes.</li>
  <li>Explicit save action available for immediate sync.</li>
  <li>Permission middleware validates role before write operations.</li>
</ul>`,
    },
  });

  await prisma.documentShare.create({
    data: {
      documentId: doc2.id,
      userId: alice.id,
      role: "EDITOR",
    },
  });

  // Document 3: Owned by Charlie, shared with Alice as VIEWER
  const doc3 = await prisma.document.create({
    data: {
      id: "doc_editorial_standards",
      title: "Workspace Editorial and Typographic Guidelines",
      ownerId: charlie.id,
      content: `<h1>Workspace Editorial and Typographic Guidelines</h1>
<p>Prepared by Design for team documentation standards.</p>
<h2>Foundational Principles</h2>
<ul>
  <li><strong>Utility over decoration</strong>: Every interface element must serve a functional purpose.</li>
  <li><strong>Crisp structural boundaries</strong>: Use 1px architectural borders instead of heavy drop shadows or blurred elements.</li>
  <li><strong>Restraint</strong>: Avoid unnecessary color saturation, harsh gradients, and decorative animations.</li>
</ul>
<h2>Typography Rules</h2>
<p>Standard system sans-serif font family ensures native rendering performance and zero layout shift across platforms.</p>
<p>Note: This specification is currently locked for review (Read-Only).</p>`,
    },
  });

  await prisma.documentShare.create({
    data: {
      documentId: doc3.id,
      userId: alice.id,
      role: "VIEWER",
    },
  });

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
