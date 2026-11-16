"use client";

import React, { useState } from "react";
import { IconClose, IconDownload, IconTrash, IconUpload } from "./Icons";
import { useCurrentUser } from "./UserContext";

export interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

interface AttachmentsDrawerProps {
  documentId: string;
  attachments: Attachment[];
  canEdit: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function AttachmentsDrawer({
  documentId,
  attachments,
  canEdit,
  onClose,
  onRefresh,
}: AttachmentsDrawerProps) {
  const { currentUser } = useCurrentUser();
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch(`/api/documents/${documentId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
            fileData: base64Data,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to upload attachment");
        }

        onRefresh();
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `/api/documents/${documentId}/attachments?userId=${currentUser.id}&attachmentId=${attachmentId}`
      );
      if (res.ok) {
        const data = await res.json();
        const link = document.createElement("a");
        link.href = data.fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to download attachment", err);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!currentUser || !canEdit) return;
    try {
      const res = await fetch(
        `/api/documents/${documentId}/attachments?userId=${currentUser.id}&attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete attachment", err);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 w-80 bg-paper border-l border-border z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Attachments ({attachments.length})
          </h3>
          <p className="text-[11px] text-ink-muted">
            Files linked to this document
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted"
        >
          <IconClose size={16} />
        </button>
      </div>

      {errorMessage && (
        <div className="m-3 p-2 bg-danger-subtle border border-danger-border text-danger text-xs">
          {errorMessage}
        </div>
      )}

      {/* Upload button */}
      {canEdit && (
        <div className="p-3 border-b border-border bg-canvas-muted/40">
          <label className="flex items-center justify-center gap-2 w-full border border-dashed border-border-strong hover:border-accent p-2.5 text-xs text-ink cursor-pointer bg-canvas">
            <IconUpload size={14} />
            <span>{isUploading ? "Uploading..." : "Upload File Attachment"}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-ink-faint text-center mt-1">
            Max 5MB. Any file type (PDF, images, spreadsheets, archives).
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {attachments.length === 0 ? (
          <div className="text-center py-10 text-xs text-ink-muted">
            No attachments added yet.
          </div>
        ) : (
          attachments.map((att) => (
            <div
              key={att.id}
              className="border border-border p-2.5 bg-canvas flex items-center justify-between"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-xs font-medium text-ink truncate" title={att.fileName}>
                  {att.fileName}
                </div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  {formatFileSize(att.fileSize)} : {new Date(att.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(att.id, att.fileName)}
                  className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted"
                  title="Download file"
                >
                  <IconDownload size={14} />
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(att.id)}
                    className="p-1 text-ink-muted hover:text-danger hover:bg-canvas-muted"
                    title="Delete attachment"
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
