# Ajaia Docs

A lightweight collaborative document editor inspired by Google Docs, built for Ajaia's internal productivity tooling exploration.

The project demonstrates document creation, rich-text editing, file ingestion (.docx, .md, .txt), file attachments, role-based sharing, and local persistence.

## Core Capabilities

1. **Document Creation and Editing**:
   - Create new documents and rename them inline.
   - Rich-text editor powered by TipTap: Bold, Italic, Underline, Strikethrough, Headings (H1, H2, H3), Bulleted and Numbered lists, Blockquotes, and Code blocks.
   - Debounced auto-save (800ms) with visible status indicators: "Saved", "Saving changes...", "Unsaved changes".
   - Export documents to Markdown (.md), HTML (.html), or Plain Text (.txt).

2. **File Handling and Import**:
   - **File Import**: Ingest existing `.docx`, `.md`, or `.txt` files directly from the dashboard into new editable documents with formatting preserved.
   - **Document Attachments**: Attach reference files (PDFs, images, spreadsheets, archives up to 5MB) directly to any document with preview, download, and deletion.

3. **Sharing Model & Access Control**:
   - Distinct roles: `Owner`, `Editor`, and `Viewer`.
   - Owners can grant collaborator access, update permissions, or revoke access.
   - General access link toggle: option to make documents public with Viewer or Editor permissions.
   - Viewers are restricted to a read-only canvas with disabled editor controls.
   - Dashboard visually separates documents into "Owned by me" and "Shared with me".

4. **Multi-User Simulation**:
   - The top navigation bar includes an instant user switcher between three seeded team accounts:
     - **Alice Chen** (Product Lead)
     - **Bob Smith** (Senior Staff Engineer)
     - **Charlie Davis** (Product Designer)
   - Allows reviewers to test permission enforcement, sharing transitions, and view-only restrictions without needing repeated logins.

5. **Persistence**:
   - Relational SQLite database managed via Prisma ORM (`prisma/dev.db`).
   - Retains all documents, formatting, shares, and attachments across browser reloads.

## Getting Started

### Prerequisites
- Node.js (v18 or newer recommended, tested on v24)
- npm (v9 or newer)

### 1. Installation
Clone or navigate to the project directory:
```bash
npm install
```

### 2. Database Initialization & Seeding
Push the schema to SQLite and seed initial users and sample documents:
```bash
npx prisma db push
node prisma/seed.js
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Production Build
```bash
npm run build
npm start
```

### 5. Run Automated Tests
Execute the automated test suite powered by Vitest:
```bash
npm test
```

## Reviewer Test Accounts & Passwords

| User | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Alice Chen** | `alice@ajaia.internal` | `alice123` | Owner of "Q4 Internal Productivity Roadmap" |
| **Bob Smith** | `bob@ajaia.internal` | `bob123` | Owner of "Architecture RFC", Editor on Alice's doc |
| **Charlie Davis** | `charlie@ajaia.internal` | `charlie123` | Owner of "Typography Guidelines", Viewer on Alice's doc |

You can also click the **"Create Account"** tab on `/login` to register a new account with your own name, email, and password.

## Reviewer Verification Walkthrough

1. **Test Document Editing**:
   - Click "New Document" on the dashboard.
   - Type a title and format text using Bold, Italic, Underline, Headings, and Lists.
   - Refresh the page to verify that content and title persist.

2. **Test File Ingestion**:
   - Click "Import File" on the dashboard.
   - Select any `.docx`, `.md`, or `.txt` file.
   - The app parses headings, paragraphs, and lists into a new editable document immediately.

3. **Test Role-Based Sharing & Security**:
   - Sign in as **Alice Chen** on `/login`.
   - Open document *"Q4 Internal Productivity Roadmap"* (owned by Alice).
   - Click "Share". Notice Bob has Editor access and Charlie has Viewer access.
   - Click **"Sign Out"** in the top navigation to destroy the session.
   - Sign in as **Charlie Davis** (Viewer).
   - Open the document again. The top banner displays "View-Only" and editing controls are disabled.
   - Sign out and sign in as **Bob Smith** (Editor). Bob can edit the document content.
   - Notice that unshared documents belonging to other members do not appear on Charlie's dashboard and direct URLs return 403 Forbidden.

4. **Test Attachments**:
   - Open any document where you are Owner or Editor.
   - Click "Attachments" in the header.
   - Upload any file (e.g., an image or PDF). Download it back to verify file retrieval.

## Project Structure

```
AjaiaAssign/
├── prisma/
│   ├── schema.prisma       # Relational models: User, Document, DocumentShare, DocumentAttachment
│   └── seed.js             # Seeds team accounts and sample collaborative docs
├── src/
│   ├── app/
│   │   ├── api/            # REST API endpoints for documents, shares, attachments, import
│   │   ├── doc/[id]/       # Document editor page
│   │   ├── globals.css     # Clean typography and ProseMirror styles
│   │   ├── layout.tsx      # Root layout with user provider and top navigation
│   │   └── page.tsx        # Dashboard page
│   ├── components/
│   │   ├── AttachmentsDrawer.tsx # File attachments side drawer
│   │   ├── DocumentList.tsx      # Dashboard table with filter tabs and search
│   │   ├── Editor.tsx            # TipTap editor wrapper with auto-save & actions
│   │   ├── EditorToolbar.tsx     # Rich-text formatting toolbar
│   │   ├── ExportModal.tsx       # Export to MD, HTML, TXT
│   │   ├── Icons.tsx             # Semantic stroked inline SVGs
│   │   ├── Navbar.tsx            # Brand header and simulated user switcher
│   │   ├── ShareModal.tsx        # Collaborator permissions dialog
│   │   └── UserContext.tsx       # Active reviewer user state management
│   └── lib/
│       ├── fileParser.ts   # .docx, .md, and .txt parsing engine
│       ├── permissions.ts  # Role check utility (Owner / Editor / Viewer)
│       └── prisma.ts       # Database client singleton
├── tests/
│   ├── fileParser.test.ts  # Tests for markdown and text conversions
│   └── permissions.test.ts # Tests for role enforcement and sharing access
├── ARCHITECTURE.md         # Design decisions and prioritization notes
├── package.json
└── README.md
```
