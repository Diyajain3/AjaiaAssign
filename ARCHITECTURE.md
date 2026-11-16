# Architecture Decision Note: Ajaia Docs

## 1. Overview

Ajaia Docs is a lightweight collaborative document editor built to demonstrate core full-stack execution, sound product judgment, and deliberate technical trade-offs. Rather than attempting a complex distributed operational transformation (OT) or CRDT engine in a tight timebox, this application focuses on delivering a robust, coherent end-to-end user experience with predictable persistence, clean permissions, secure session isolation, and standard file workflows.

---

## 2. What Was Prioritized and Why

### 1. Unified Full-Stack Architecture (Next.js App Router + TypeScript)
- **Decision**: Built frontend interfaces and backend API routes in a single typed codebase.
- **Why**: Eliminates CORS friction, simplifies deployment to any Node or serverless host (Vercel, Docker, VPS), and provides type sharing between database models, API handlers, and UI components.

### 2. Predictable Relational Persistence (SQLite + Prisma)
- **Decision**: Modeled users, documents, permissions, and file attachments as relational entities in SQLite using Prisma ORM.
- **Why**: SQLite is zero-configuration and file-backed (`dev.db`), ensuring reviewers can clone and run the project immediately without configuring external cloud databases or Docker containers. Relational foreign key constraints guarantee data integrity across document shares and cascade deletions.

### 3. Rich-Text Editing Stability (TipTap Engine)
- **Decision**: Integrated TipTap (built on ProseMirror) with custom toolbar controls and native HTML serialization.
- **Why**: ContentEditable implementations built from scratch frequently suffer from cross-browser cursor bugs, undo stack breakages, and nested tag corruption. TipTap provides a stable, schema-backed document model while allowing custom editorial styling.

### 4. File Ingestion and Workflow Relevance (.docx, .md, .txt)
- **Decision**: Allowed users to upload `.docx`, `.md`, or `.txt` files directly from the dashboard to convert them into editable documents, as well as attach reference files directly to existing drafts.
- **Why**: Knowledge work rarely begins in a vacuum. Team members often have existing specifications in Markdown, Word documents, or plain text notes. Providing immediate ingestion makes the tool practical on day one.

### 5. Secure Session Authentication, Password Verification & Self-Registration
- **Decision**: Implemented real session-based authentication with mandatory password verification (`alice123`, `bob123`, `charlie123`), self-serve user registration, and HTTP cookie binding, replacing client-side user switching.
- **Why**: Initial mock switcher implementations allowed any person in a single browser window to arbitrarily impersonate other members and view their private documents. A secure productivity tool requires strict session boundaries:
  - Users authenticate at `/login` with verified email and password credentials.
  - New members can register an account self-serve via the "Create Account" tab.
  - Sessions are bound to HTTP cookies (`ajaia_session_user_id`).
  - Unauthenticated traffic is rejected with HTTP 401 and redirected to `/login`.
  - Document access is strictly guarded server-side: Owners have full control, Editors can edit, Viewers are locked into read-only, and unshared documents return HTTP 403 Forbidden.
  - Reviewer friction is minimized by providing 1-click credential fill buttons on `/login`.

### 6. Auto-Save with Keystroke Debouncing
- **Decision**: Debounced auto-save (800ms) paired with explicit visual indicators (`Saved`, `Saving changes...`, `Unsaved changes`).
- **Why**: Protects the database layer from thrashing on individual keystrokes while preventing data loss on navigation or tab closure.

---

## 3. Human Product Guidance vs. AI Scaffolding

This application highlights intentional product ownership over raw AI output:
- **Security Elevation**: When the AI assistant generated an insecure user switcher that allowed single-window impersonation, the engineer caught the vulnerability and mandated a real authentication layer with mandatory password verification and session cookie isolation.
- **Self-Serve Capability**: When the system was restricted to fixed seeded accounts, the engineer directed the addition of self-service account registration.
- **Aesthetic Restraint**: The engineer rejected standard AI design tropes (Lucide icons, drop shadows, gradients, rounded bubble cards, and emojis) in favor of a utilitarian, distraction-free editorial tool with crisp 1px borders and warm paper/canvas tones.
- **Route Flattening**: The engineer guided the refactoring of nested route brackets that caused Next.js 14 compilation failures on Windows.

---

## 4. Data Model

```prisma
model User {
  id        String          @id @default(cuid())
  name      String
  email     String          @unique
  password  String          @default("password123")
  avatar    String?
  title     String?
  documents Document[]      @relation("UserDocuments")
  shares    DocumentShare[]
  createdAt DateTime        @default(now())
}

model Document {
  id          String               @id @default(cuid())
  title       String               @default("Untitled Document")
  content     String               @default("")
  ownerId     String
  owner       User                 @relation("UserDocuments", fields: [ownerId], references: [id], onDelete: Cascade)
  isPublic    Boolean              @default(false)
  publicRole  String               @default("VIEWER")
  shares      DocumentShare[]
  attachments DocumentAttachment[]
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt
}

model DocumentShare {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role       String   @default("VIEWER")
  createdAt  DateTime @default(now())

  @@unique([documentId, userId])
}

model DocumentAttachment {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  fileName   String
  fileType   String
  fileSize   Int
  fileData   String
  createdAt  DateTime @default(now())
}
```

---

## 5. Aesthetic & Usability Direction

The interface adopts a utilitarian, distraction-free editorial design:
- Crisp 1px solid borders (`#dedbd2`) instead of drop shadows.
- Warm paper/canvas backgrounds (`#f5f4ef` canvas, `#faf9f6` paper) avoiding pure white glare.
- Standard system sans-serif typography with Georgia serif document canvas.
- Inline SVG iconography with semantic text labels (zero Lucide icons, zero emojis).
- Zero decorative fluff: no gradients, no orbs, no marketing banners.
