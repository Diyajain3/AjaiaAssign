# AI-Native Workflow Note: Division of Work, Interventions, and Verification

## 1. Executive Summary of Collaboration

This document details the practical collaboration between the engineer (human product owner) and the AI assistant (Antigravity powered by Gemini 3.8 Flash). 

Rather than allowing the AI to generate a superficial, generic SaaS prototype, the engineer actively steered the product direction, caught critical security flaws in the AI's default output, established strict design and aesthetic guidelines, and mandated a real authentication boundary.

---

## 2. What the AI Generated vs. What the Engineer Approached and Directed

| Area | What the AI Generated | What the Engineer Approached & Mandated |
| :--- | :--- | :--- |
| **Aesthetic & Design System** | Defaulted to generic SaaS styles (Lucide icons, rounded cards, drop shadows, gradients, emojis). | **Strictly rejected defaults**: Mandated zero drop shadows, crisp 1px borders, warm paper/canvas tones (`#f5f4ef`, `#faf9f6`), custom inline stroked SVGs, native system fonts, and zero emojis. |
| **Multi-User Simulation & Security** | Implemented a client-side user switcher in the navbar where anyone could click another member's name and impersonate them. | **Identified critical security flaw**: Recognized that accessing all members' documents from one window was unsafe. Mandated real session-based authentication, HTTP cookies, and route guards. |
| **Sign-In Verification** | Allowed passwordless 1-click bypass logins. | **Mandated strict passwords**: Required that signing in must ask for and verify passwords (`alice123`, `bob123`, `charlie123`), rejecting invalid attempts with HTTP 401. |
| **Account Management** | Restricted the workspace to fixed seeded database accounts. | **Mandated self-serve registration**: Added a "Create Account" tab allowing new team members to register custom credentials with unique email validation. |
| **Next.js Route Architecture** | Generated deeply nested dynamic brackets (`[id]/attachments/[attachmentId]`), breaking Windows Next.js 14 builds. | **Architectural refactor**: Directed the AI to flatten nested route handlers to parent routes using query parameter dispatching (`?attachmentId=...`). |
| **Core Full-Stack Scaffolding** | Synthesized Prisma schema, relational SQLite database, TipTap rich-text integration, file parsers, and Vitest test suite. | **Scope prioritization**: Prioritized relational integrity, reliable file ingestion (.docx/.md/.txt), and deterministic role enforcement (Owner/Editor/Viewer) over fragile real-time CRDT sync. |

---

## 3. Specific Human Interventions and Architectural Pivots

### Intervention 1: Eliminating Insecure Client-Side User Impersonation
- **The Issue**: The AI assistant initially built an instant user switcher dropdown in the navigation bar. While convenient for quick testing, it meant any person sitting at one browser window could arbitrarily access and edit any team member's private documents without authentication boundaries.
- **The Engineer's Direction**: "From 1 window I can access all member documents so it is not safe. How can we make it secure?"
- **The Architectural Change**:
  1. Completely removed the user switcher dropdown from the navigation.
  2. Created a dedicated authentication layer (`/login`) with session management (`src/lib/auth.ts`).
  3. Bound user identity to an HTTP session cookie (`ajaia_session_user_id`).
  4. Protected dashboard and editor pages: unauthenticated requests redirect to `/login` with HTTP 401.
  5. Added a secure **Sign Out** button in the header that clears the session cookie.

### Intervention 2: Enforcing Mandatory Password Verification
- **The Issue**: Early authentication drafts allowed 1-click bypass into seeded accounts without credential challenge.
- **The Engineer's Direction**: "While sign in it should ask for pass."
- **The Architectural Change**:
  1. Added a `password` field to the `User` table in `prisma/schema.prisma`.
  2. Updated `POST /api/auth/login` to require and verify the password against database records.
  3. Returns `HTTP 401: Incorrect password. Please verify and try again.` on mismatch.
  4. Configured seeded passwords: Alice (`alice123`), Bob (`bob123`), Charlie (`charlie123`), with 1-click credential autofill to balance security with reviewer convenience.

### Intervention 3: Adding Self-Serve User Registration
- **The Issue**: The product originally relied entirely on pre-seeded accounts, preventing new team members from signing up independently.
- **The Engineer's Direction**: "Can't we make new account by self?"
- **The Architectural Change**:
  1. Created `POST /api/auth/register` with input validation and duplicate email rejection (`HTTP 409 Conflict`).
  2. Built a **"Create Account"** tab directly into `/login` allowing self-service registration (Name, Email, Password, Job Title).
  3. Automatically writes the session cookie upon registration, immediately logging the new member into their workspace.

### Intervention 4: Resolving Next.js Windows Build Failures
- **The Issue**: The AI's initial App Router directory structure nested dynamic route segments two levels deep (`src/app/api/documents/[id]/attachments/[attachmentId]`). On Windows environments, Next.js 14 failed during `next build` with `PageNotFoundError: Cannot find module for page`.
- **The Engineer's Direction**: Flatten the nested route tree into standard parent endpoints with query parameter handlers (`/api/documents/[id]/attachments?attachmentId=...`), eliminating compilation failures while preserving a clean REST contract.

---

## 4. Verification Methodology

Correctness and implementation reliability were verified through three layers:

1. **Automated Testing**:
   - Ran `npm test` using Vitest across 10 automated unit and integration tests.
   - Tested permission role resolution (`OWNER`, `EDITOR`, `VIEWER`), public link access, Markdown parsing, and plain text conversion.
2. **Production Compilation**:
   - Ran `npm run build` to confirm strict TypeScript adherence, clean Prisma client generation, and static page optimization with zero warnings or errors.
3. **End-to-End Role and Security Verification**:
   - Tested password rejection: Submitting an invalid password on `/login` correctly blocked access with HTTP 401.
   - Tested Viewer restrictions: Signed in as Charlie Davis (`charlie123`) and opened Alice's document; confirmed that toolbar controls were locked, the view-only banner displayed, and server-side write attempts returned 403 Forbidden.
   - Tested private document isolation: Verified that Bob's unshared documents never appeared on Charlie's dashboard, and accessing direct URLs returned 403 Access Denied.
   - Tested self-registration: Registered a new user (`Diana Prince` / `diana123`), confirmed instant session creation, and verified that existing accounts could invite Diana via the Share modal.
