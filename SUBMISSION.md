# Project Submission: Ajaia Docs

## 1. Submission Overview & Deliverables
This package contains the full source code, test suite, and architectural documentation for Ajaia Docs, a lightweight collaborative document editor built for Ajaia's internal productivity tooling exploration.

The following deliverables are included:
- **Full Source Code**: Next.js 14 App Router, TypeScript, TipTap editor, Tailwind CSS, Prisma ORM, and SQLite.
- **`README.md`**: Complete local setup, run, build, and test instructions.
- **`ARCHITECTURE.md`**: Architectural decisions, technical trade-offs, schema, and human vs. AI prioritization rationale.
- **`AI_WORKFLOW_NOTE.md`**: Detailed analysis of AI tool utilization, human interventions, security pivots, and quality verification.
- **`WALKTHROUGH_VIDEO.txt`**: Video walkthrough link and script guide covering user flows, security, and architecture.
- **Automated Test Suite**: 10 automated unit and integration tests (`npm test`).
- **Seeded SQLite Database**: Pre-populated users, documents, permissions, and sample drafts (`prisma/dev.db`).

---

## 2. Reviewer Test Accounts & Credentials

To test sharing and role-based permissions, use the Sign In screen at `/login`. Reviewers can sign in using the 1-click **Reviewer Demo Accounts** buttons or enter credentials manually:

| Name | Role | Email | Password | Seeded Document Access |
| :--- | :--- | :--- | :--- | :--- |
| **Alice Chen** | Product Lead | `alice@ajaia.internal` | `alice123` | **Owner** of "Q4 Internal Productivity Roadmap" |
| **Bob Smith** | Senior Staff Engineer | `bob@ajaia.internal` | `bob123` | **Editor** on Alice's doc; Owner of "Architecture RFC" |
| **Charlie Davis** | Product Designer | `charlie@ajaia.internal` | `charlie123` | **Viewer** on Alice's doc; Owner of "Typography Guidelines" |

**Security Isolation & Account Management**:
- **Self-Serve Registration**: Reviewers can switch to the **"Create Account"** tab on `/login` to register a new user with their own name, email, and password.
- **Session Cookie Binding**: Sessions are bound to HTTP cookies (`ajaia_session_user_id`), eliminating single-window impersonation.
- **Sign Out Flow**: To switch user perspectives, click **"Sign Out"** in the top navigation, which clears the session cookie, and sign in as the target member.
- **Access Barriers**: Unauthenticated requests are rejected with HTTP 401 and redirected to `/login`. Unshared documents return HTTP 403 Forbidden.

---

## 3. Human Product Guidance vs. AI Scaffolding

This project demonstrates strong human product ownership over raw AI output:
- **Security Elevation**: When the AI assistant initially generated a client-side mock dropdown switcher that allowed arbitrary user impersonation in a single browser window, the engineer caught the flaw and mandated a real authentication layer with mandatory password verification and cookie session isolation.
- **Mandatory Passwords**: The engineer required that signing in must challenge for a password (`alice123`, `bob123`, `charlie123`), rejecting unauthenticated attempts with HTTP 401.
- **Self-Serve Capability**: The engineer directed the addition of self-service account registration with duplicate email validation (`HTTP 409`).
- **Aesthetic Restraint**: The engineer rejected standard AI design tropes (Lucide icons, drop shadows, gradients, rounded bubble cards, and emojis) in favor of a utilitarian, distraction-free editorial tool with crisp 1px borders and warm paper/canvas tones.
- **Route Flattening**: The engineer guided the refactoring of nested route brackets that broke Next.js 14 builds on Windows.

---

## 4. What Is Working End to End

- **Document Creation and Management**:
  - Create new blank documents instantly.
  - Inline document title editing with debounced auto-save.
  - Delete documents (strictly restricted to document owners).
- **Rich-Text Editing (TipTap)**:
  - Formatting controls: Bold, Italic, Underline, Strikethrough.
  - Hierarchical typography: Paragraph, Heading 1, Heading 2, Heading 3.
  - Structural formatting: Bulleted lists, Numbered lists, Blockquotes, Code blocks, Clear formatting.
  - Undo and Redo history stack.
  - Dynamic word count calculation.
- **Auto-Save & Persistence**:
  - Debounced auto-save (800ms) prevents database overload during typing.
  - Clear visual indicators: "Saved at [time]", "Saving changes...", "Unsaved changes".
  - Explicit manual "Save" button.
  - Content preserved across browser reloads via SQLite.
- **File Ingestion Workflow**:
  - "Import File" action supports `.docx`, `.md`, and `.txt` files.
  - Extracts title from file name and parses content into structured HTML for instant editing.
- **Document Attachments**:
  - Dedicated side drawer allowing users to attach reference files (PDF, images, spreadsheets, archives up to 5MB).
  - Download and delete capabilities with permission enforcement.
- **Role-Based Sharing**:
  - `OWNER`, `EDITOR`, and `VIEWER` permissions.
  - Share modal allowing owners to add teammates, change access levels, and revoke access.
  - General access link toggle ("Anyone with the link can view / edit").
  - Viewer role enforcement: read-only canvas with disabled toolbar, view-only banner, and server-side write rejection.
  - Visual segregation on dashboard between "All Documents", "Owned by me", and "Shared with me".
- **Exporting**:
  - Download local copies as Markdown (`.md`), HTML (`.html`), or Plain Text (`.txt`).

---

## 5. Deliberate Scope Prioritization & Next Steps

### What Was Intentionally Scoped Out
- **Complex CRDT / Operational Transformation Sync Engine**: Implementing Yjs or OT with WebSocket servers for character-by-character real-time cursors within a tight timebox introduces synchronization edge cases and networking fragility. We prioritized a rock-solid, production-ready document workflow with reliable persistence, role enforcement, and clean file handling first.
- **Third-Party Cloud Storage (S3 / Cloudinary)**: Modeled attachments directly in SQLite as base64 blobs, making the application 100% self-contained so reviewers can run the repository immediately without configuring cloud credentials or storage buckets.

### What We Would Build Next (With 2 to 4 More Hours)
1. **Document Version History & Restore**: Storing snapshot revisions on save to allow users to inspect diffs and roll back to previous versions.
2. **Inline Comments and Annotations**: Allowing team members (including Viewers) to highlight text ranges and leave threaded discussions.
3. **Live Collaborator Presence**: Lightweight WebSocket indicators showing avatar badges of team members currently viewing the document.

---

## 6. Verification Results

- **Automated Testing**: 10/10 Vitest tests passing (`npm test`), testing permission resolution, public access, and file parsing.
- **Production Compilation**: `npm run build` cleanly passed type checks and generated all static pages with zero errors.
- **Manual Verification**: Verified password validation, view-only locks, and file uploads across multiple authenticated accounts.

---

## 7. Local Setup and Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Synchronize database schema and seed accounts
npx prisma db push
node prisma/seed.js

# 3. Run automated tests
npm test

# 4. Start local development server
npm run dev
# Open http://localhost:3000
```
