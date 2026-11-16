"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser, User } from "./UserContext";
import {
  IconPlus,
  IconUpload,
  IconSearch,
  IconShare,
  IconTrash,
  IconFile,
  IconPaperclip,
} from "./Icons";
import { ShareModal } from "./ShareModal";

interface DocumentItem {
  id: string;
  title: string;
  ownerId: string;
  owner: User;
  userRole: "OWNER" | "EDITOR" | "VIEWER";
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  publicRole: "VIEWER" | "EDITOR";
  shares?: any[];
  _count?: {
    attachments: number;
    shares: number;
  };
}

export function DocumentList() {
  const router = useRouter();
  const { currentUser, loading: userLoading } = useCurrentUser();

  const [ownedDocs, setOwnedDocs] = useState<DocumentItem[]>([]);
  const [sharedDocs, setSharedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "owned" | "shared">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Sharing modal state from list view
  const [sharingDoc, setSharingDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setOwnedDocs(data.owned || []);
        setSharedDocs(data.shared || []);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && !currentUser) {
      router.push("/login");
    } else if (currentUser) {
      fetchDocuments();
    }
  }, [currentUser, userLoading, router]);

  const handleCreateNew = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Document",
          content: "<p></p>",
          ownerId: currentUser.id,
        }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        router.push(`/doc/${newDoc.id}`);
      }
    } catch (err) {
      console.error("Failed to create document", err);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsImporting(true);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", currentUser.id);

    try {
      const res = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import file");
      }

      const data = await res.json();
      router.push(`/doc/${data.documentId}`);
    } catch (err: any) {
      setImportError(err.message || "Failed to import file");
      setIsImporting(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${docId}?userId=${currentUser.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  // Combine and filter documents
  const allDocs = [...ownedDocs, ...sharedDocs];
  const displayedDocs = (
    activeTab === "all" ? allDocs : activeTab === "owned" ? ownedDocs : sharedDocs
  ).filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.owner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Documents</h1>
          <p className="text-xs text-ink-muted mt-1">
            Create, collaborate, and manage team documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden File Input for Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".docx,.md,.markdown,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 border border-border bg-canvas px-3 py-1.5 text-xs text-ink hover:bg-canvas-muted disabled:opacity-40"
            title="Import .docx, .md, or .txt file as a new editable document"
          >
            <IconUpload size={14} />
            <span>{isImporting ? "Importing..." : "Import File"}</span>
          </button>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 bg-accent text-paper px-3.5 py-1.5 text-xs font-medium hover:bg-accent-hover"
          >
            <IconPlus size={14} />
            <span>New Document</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="mt-4 p-2.5 bg-danger-subtle border border-danger-border text-danger text-xs">
          {importError}
        </div>
      )}

      {/* Active User Context Banner */}
      {currentUser && (
        <div className="mt-4 p-2.5 bg-canvas-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2 text-ink">
            <span className="font-medium text-ink-muted">Active Identity:</span>
            <span className="font-semibold text-accent">{currentUser.name}</span>
            <span className="text-ink-muted">({currentUser.title || "Member"})</span>
          </div>
          <div className="text-[11px] text-ink-muted">
            Tip: Switch users in the top-right menu to test Owner, Editor, and Viewer permission locks.
          </div>
        </div>
      )}

      {/* Filter Tabs and Search Bar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center border border-border bg-canvas p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 text-xs font-medium transition-none ${
              activeTab === "all"
                ? "bg-paper text-ink border border-border"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            All ({allDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("owned")}
            className={`px-3 py-1 text-xs font-medium transition-none ${
              activeTab === "owned"
                ? "bg-paper text-ink border border-border"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Owned by me ({ownedDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shared")}
            className={`px-3 py-1 text-xs font-medium transition-none ${
              activeTab === "shared"
                ? "bg-paper text-ink border border-border"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Shared with me ({sharedDocs.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents or author..."
            className="w-full bg-canvas border border-border text-xs px-8 py-1.5 text-ink outline-none"
          />
          <div className="absolute left-2.5 top-2 text-ink-faint">
            <IconSearch size={14} />
          </div>
        </div>
      </div>

      {/* Document List / Table */}
      <div className="mt-4 border border-border bg-paper">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-canvas border-b border-border text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
          <div className="col-span-6 sm:col-span-5">Name</div>
          <div className="hidden sm:block col-span-3">Owner</div>
          <div className="col-span-3 sm:col-span-2">Access</div>
          <div className="col-span-3 sm:col-span-2 text-right">Updated</div>
        </div>

        {loading || userLoading ? (
          <div className="p-8 text-center text-xs text-ink-muted">
            Loading documents...
          </div>
        ) : displayedDocs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-xs font-medium text-ink">No documents found</div>
            <p className="text-xs text-ink-muted mt-1">
              {searchQuery
                ? "No documents match your search query."
                : activeTab === "shared"
                ? "No documents have been shared with you yet."
                : "Get started by creating a new document or importing a file."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayedDocs.map((doc) => {
              const isOwner = doc.userRole === "OWNER";
              const formattedDate = new Date(doc.updatedAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-canvas transition-none group"
                >
                  {/* Name and icon */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-2.5 min-w-0">
                    <div className="text-ink-muted">
                      <IconFile size={16} />
                    </div>
                    <Link
                      href={`/doc/${doc.id}`}
                      className="text-xs font-medium text-ink hover:text-accent truncate hover:underline"
                    >
                      {doc.title || "Untitled Document"}
                    </Link>
                    {doc._count?.attachments ? (
                      <span
                        className="flex items-center text-[10px] text-ink-faint gap-0.5"
                        title={`${doc._count.attachments} attachments`}
                      >
                        <IconPaperclip size={12} />
                        <span>{doc._count.attachments}</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Owner */}
                  <div className="hidden sm:flex col-span-3 items-center gap-1.5 text-xs text-ink-muted min-w-0">
                    <div className="w-4 h-4 bg-canvas-subtle border border-border text-[9px] font-bold flex items-center justify-center text-ink shrink-0">
                      {doc.owner.avatar || "U"}
                    </div>
                    <span className="truncate">{doc.owner.name}</span>
                  </div>

                  {/* Role Badge */}
                  <div className="col-span-3 sm:col-span-2">
                    <span
                      className={`inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 border ${
                        isOwner
                          ? "bg-canvas text-ink border-border"
                          : doc.userRole === "EDITOR"
                          ? "bg-accent-subtle text-accent border-accent-border"
                          : "bg-canvas-muted text-ink-muted border-border"
                      }`}
                    >
                      {isOwner ? "Owner" : doc.userRole === "EDITOR" ? "Editor" : "Viewer"}
                    </span>
                  </div>

                  {/* Date and Quick Actions */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2 text-xs text-ink-muted">
                    <span className="text-[11px] text-ink-faint font-mono">
                      {formattedDate}
                    </span>

                    {/* Owner Quick Actions */}
                    {isOwner && (
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setSharingDoc(doc)}
                          className="p-1 hover:bg-canvas-muted text-ink-muted hover:text-ink"
                          title="Share"
                        >
                          <IconShare size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(doc.id, e)}
                          className="p-1 hover:bg-canvas-muted text-ink-muted hover:text-danger"
                          title="Delete"
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supported file formats note */}
      <div className="mt-4 text-[11px] text-ink-muted border-t border-border pt-3">
        Supported file import formats: <span className="font-mono text-ink">.docx</span>,{" "}
        <span className="font-mono text-ink">.md</span>, <span className="font-mono text-ink">.txt</span>.
        Attachments support any file type up to 5MB.
      </div>

      {/* Share Modal from List */}
      {sharingDoc && (
        <ShareModal
          documentId={sharingDoc.id}
          documentTitle={sharingDoc.title}
          owner={sharingDoc.owner}
          shares={sharingDoc.shares || []}
          isPublic={sharingDoc.isPublic}
          publicRole={sharingDoc.publicRole}
          userRole={sharingDoc.userRole}
          onClose={() => setSharingDoc(null)}
          onRefresh={() => {
            fetchDocuments();
            setSharingDoc(null);
          }}
        />
      )}
    </div>
  );
}
