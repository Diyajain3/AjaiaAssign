"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorToolbar } from "./EditorToolbar";
import { ShareModal } from "./ShareModal";
import { AttachmentsDrawer, Attachment } from "./AttachmentsDrawer";
import { ExportModal } from "./ExportModal";
import { useCurrentUser, User } from "./UserContext";
import {
  IconArrowLeft,
  IconShare,
  IconPaperclip,
  IconDownload,
  IconCheck,
} from "./Icons";

interface DocumentDetail {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: User;
  isPublic: boolean;
  publicRole: "VIEWER" | "EDITOR";
  userRole: "OWNER" | "EDITOR" | "VIEWER";
  shares: any[];
  attachments: Attachment[];
  updatedAt: string;
}

interface EditorProps {
  initialDocument: DocumentDetail;
}

export function Editor({ initialDocument }: EditorProps) {
  const { currentUser } = useCurrentUser();
  const [doc, setDoc] = useState<DocumentDetail>(initialDocument);
  const [title, setTitle] = useState(initialDocument.title);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAttachmentsDrawer, setShowAttachmentsDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isReadOnly = doc.userRole === "VIEWER";
  const canEdit = !isReadOnly;

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<string>(initialDocument.content);
  const latestTitleRef = useRef<string>(initialDocument.title);

  // Refresh document data from server
  const refreshDocument = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}?userId=${currentUser.id}`);
      if (res.ok) {
        const data: DocumentDetail = await res.json();
        setDoc(data);
        setTitle(data.title);
        latestTitleRef.current = data.title;
      }
    } catch (err) {
      console.error("Failed to refresh document", err);
    }
  }, [doc.id, currentUser]);

  // Save changes to database
  const saveDocument = useCallback(
    async (newContent?: string, newTitle?: string) => {
      if (!currentUser || isReadOnly) return;

      const contentToSave = newContent !== undefined ? newContent : latestContentRef.current;
      const titleToSave = (newTitle !== undefined ? newTitle : latestTitleRef.current).trim() || "Untitled Document";

      setSaveStatus("saving");
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/documents/${doc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            title: titleToSave,
            content: contentToSave,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save document");
        }

        const updated = await res.json();
        setSaveStatus("saved");
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        setDoc((prev) => ({
          ...prev,
          title: updated.title,
          updatedAt: updated.updatedAt,
        }));
      } catch (err: any) {
        setSaveStatus("unsaved");
        setErrorMessage(err.message || "Failed to save changes");
      }
    },
    [currentUser, doc.id, isReadOnly]
  );

  // Initialize TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: initialDocument.content,
    editable: canEdit,
    onUpdate: ({ editor }) => {
      if (isReadOnly) return;
      const html = editor.getHTML();
      latestContentRef.current = html;
      setSaveStatus("unsaved");

      // Debounce auto-save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveDocument(html);
      }, 800);
    },
  });

  // Handle title edit
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    latestTitleRef.current = newTitle;
    setSaveStatus("unsaved");

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveDocument(undefined, newTitle);
    }, 800);
  };

  // Re-sync editable status when role changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Top Header / Actions */}
      <header className="bg-paper border-b border-border px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-1.5 border border-border bg-canvas hover:bg-canvas-muted text-ink"
            title="Back to all documents"
          >
            <IconArrowLeft size={16} />
          </Link>

          <div className="min-w-0">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => saveDocument(undefined, title)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  saveDocument(undefined, title);
                }
              }}
              disabled={isReadOnly}
              placeholder="Untitled Document"
              className="font-medium text-sm text-ink bg-transparent border border-transparent hover:border-border focus:border-accent focus:bg-canvas px-1.5 py-0.5 outline-none rounded-none w-56 sm:w-80 truncate"
            />
            <div className="flex items-center gap-2 px-1 text-[11px] text-ink-muted">
              {doc.userRole === "OWNER" ? (
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-border bg-canvas text-ink font-semibold">
                  Owner (Full Access)
                </span>
              ) : doc.userRole === "EDITOR" ? (
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-accent-border bg-accent-subtle text-accent font-semibold">
                  Editor (Can Edit)
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-border bg-canvas-muted text-ink-faint font-semibold">
                  Viewer (Read-Only)
                </span>
              )}

              <span className="text-ink-faint">•</span>

              {isReadOnly ? (
                <span className="text-ink-muted">Read-Only</span>
              ) : saveStatus === "saving" ? (
                <span className="text-ink-muted">Saving changes...</span>
              ) : saveStatus === "saved" ? (
                <span className="flex items-center gap-1 text-ink-muted">
                  <IconCheck size={12} className="text-success" />
                  <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}</span>
                </span>
              ) : (
                <span className="text-danger">Unsaved changes</span>
              )}

              <span className="text-ink-faint">•</span>
              <span>Owner: {doc.owner.name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Attachments Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowAttachmentsDrawer(!showAttachmentsDrawer)}
            className="flex items-center gap-1.5 border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-muted"
            title="Manage document file attachments"
          >
            <IconPaperclip size={14} />
            <span className="hidden sm:inline">Attachments</span>
            {doc.attachments?.length > 0 && (
              <span className="text-[10px] font-mono px-1 py-0.2 bg-canvas-muted border border-border">
                {doc.attachments.length}
              </span>
            )}
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-muted"
            title="Download copy as Markdown, HTML, or Text"
          >
            <IconDownload size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 bg-accent text-paper px-3 py-1.5 text-xs font-medium hover:bg-accent-hover"
            title="Share document with team members"
          >
            <IconShare size={14} />
            <span>Share</span>
          </button>

          {/* Manual Save Button (if can edit) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => saveDocument()}
              disabled={saveStatus === "saving"}
              className="border border-border bg-canvas px-2.5 py-1.5 text-xs text-ink hover:bg-canvas-muted disabled:opacity-40"
            >
              Save
            </button>
          )}
        </div>
      </header>

      {errorMessage && (
        <div className="px-4 py-2 bg-danger-subtle border-b border-danger-border text-danger text-xs text-center">
          {errorMessage}
        </div>
      )}

      {/* Editor Formatting Toolbar */}
      <EditorToolbar editor={editor} readOnly={isReadOnly} />

      {/* Document Canvas Sheet */}
      <main className="flex-1 py-8 px-4 flex justify-center">
        <div className="w-full max-w-3xl bg-paper-elevated border border-border p-10 sm:p-14 min-h-[750px]">
          <EditorContent editor={editor} />
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          documentId={doc.id}
          documentTitle={doc.title}
          owner={doc.owner}
          shares={doc.shares || []}
          isPublic={doc.isPublic}
          publicRole={doc.publicRole}
          userRole={doc.userRole}
          onClose={() => setShowShareModal(false)}
          onRefresh={refreshDocument}
        />
      )}

      {/* Attachments Drawer */}
      {showAttachmentsDrawer && (
        <AttachmentsDrawer
          documentId={doc.id}
          attachments={doc.attachments || []}
          canEdit={canEdit}
          onClose={() => setShowAttachmentsDrawer(false)}
          onRefresh={refreshDocument}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          documentTitle={doc.title}
          documentHtml={latestContentRef.current}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
