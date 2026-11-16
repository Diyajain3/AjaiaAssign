"use client";

import React, { useState } from "react";
import { User, useCurrentUser } from "./UserContext";
import { IconClose, IconCheck, IconTrash } from "./Icons";

interface Share {
  id: string;
  role: "EDITOR" | "VIEWER";
  user: User;
}

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  owner: User;
  shares: Share[];
  isPublic: boolean;
  publicRole: "VIEWER" | "EDITOR";
  userRole: "OWNER" | "EDITOR" | "VIEWER";
  onClose: () => void;
  onRefresh: () => void;
}

export function ShareModal({
  documentId,
  documentTitle,
  owner,
  shares,
  isPublic,
  publicRole,
  userRole,
  onClose,
  onRefresh,
}: ShareModalProps) {
  const { currentUser, users } = useCurrentUser();
  const isOwner = userRole === "OWNER";

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available users that are not the owner and not already shared
  const availableUsers = users.filter(
    (u) => u.id !== owner.id && !shares.some((s) => s.user.id === u.id)
  );

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !currentUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: currentUser.id,
          targetUserId: selectedUserId,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to share document");
      }

      setSelectedUserId("");
      onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: "EDITOR" | "VIEWER") => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestingUserId: currentUser.id,
          targetUserId,
          role: newRole,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `/api/documents/${documentId}/shares?requestingUserId=${currentUser.id}&shareId=${shareId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublic = async (newPublic: boolean) => {
    if (!currentUser || !isOwner) return;
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          isPublic: newPublic,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublicRoleChange = async (role: "VIEWER" | "EDITOR") => {
    if (!currentUser || !isOwner) return;
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          publicRole: role,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-lg bg-paper border border-border p-6 rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-ink">Share Document</h2>
            <p className="text-xs text-ink-muted mt-0.5 truncate max-w-sm">
              {documentTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted"
          >
            <IconClose size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2 bg-danger-subtle border border-danger-border text-danger text-xs">
            {errorMessage}
          </div>
        )}

        {/* Add Collaborator Form (Owners only) */}
        {isOwner ? (
          <form onSubmit={handleAddCollaborator} className="mt-4 pb-4 border-b border-border">
            <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
              Add Collaborator
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 bg-canvas border border-border text-xs px-2.5 py-1.5 text-ink outline-none"
              >
                <option value="">Select team member...</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "EDITOR" | "VIEWER")}
                className="w-28 bg-canvas border border-border text-xs px-2 py-1.5 text-ink outline-none"
              >
                <option value="EDITOR">Can edit</option>
                <option value="VIEWER">Can view</option>
              </select>
              <button
                type="submit"
                disabled={!selectedUserId || isSubmitting}
                className="bg-accent text-paper text-xs px-3 py-1.5 font-medium hover:bg-accent-hover disabled:opacity-40"
              >
                Share
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-3 p-2 bg-canvas-muted border border-border text-xs text-ink-muted">
            Only the document owner can invite new collaborators.
          </div>
        )}

        {/* Collaborators List */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-ink-muted mb-2 uppercase tracking-wider">
            Who Has Access
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* Owner Row */}
            <div className="flex items-center justify-between p-2 bg-canvas-muted/60 border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-ink text-paper text-[10px] font-bold flex items-center justify-center">
                  {owner.avatar || "OW"}
                </div>
                <div>
                  <div className="text-xs font-medium text-ink">{owner.name}</div>
                  <div className="text-[11px] text-ink-muted">{owner.email}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-ink-muted px-2 py-0.5 border border-border bg-canvas">
                Owner
              </span>
            </div>

            {/* Shares Rows */}
            {shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between p-2 bg-canvas-muted/40 border border-border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 bg-accent text-paper text-[10px] font-bold flex items-center justify-center">
                    {share.user.avatar || "U"}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-ink">{share.user.name}</div>
                    <div className="text-[11px] text-ink-muted">{share.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <>
                      <select
                        value={share.role}
                        onChange={(e) =>
                          handleUpdateRole(share.user.id, e.target.value as "EDITOR" | "VIEWER")
                        }
                        className="bg-canvas border border-border text-xs px-2 py-1 text-ink outline-none"
                      >
                        <option value="EDITOR">Can edit</option>
                        <option value="VIEWER">Can view</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRevoke(share.id)}
                        className="p-1 text-ink-faint hover:text-danger hover:bg-canvas-muted"
                        title="Revoke access"
                      >
                        <IconTrash size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] text-ink-muted font-mono px-2 py-0.5 border border-border">
                      {share.role === "EDITOR" ? "Editor" : "Viewer"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Public Link Access */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-ink">General Access</div>
              <div className="text-[11px] text-ink-muted">
                {isPublic
                  ? `Anyone with the link can ${publicRole.toLowerCase()}`
                  : "Restricted: Only invited people can access"}
              </div>
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publicToggle"
                  checked={isPublic}
                  onChange={(e) => handleTogglePublic(e.target.checked)}
                  className="rounded-none border-border"
                />
                <label htmlFor="publicToggle" className="text-xs text-ink cursor-pointer">
                  Public Link
                </label>

                {isPublic && (
                  <select
                    value={publicRole}
                    onChange={(e) =>
                      handlePublicRoleChange(e.target.value as "VIEWER" | "EDITOR")
                    }
                    className="bg-canvas border border-border text-xs px-2 py-0.5 text-ink outline-none ml-1"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-ink bg-canvas hover:bg-canvas-muted"
          >
            {linkCopied ? (
              <>
                <IconCheck size={14} className="text-success" />
                <span>Link Copied</span>
              </>
            ) : (
              <span>Copy Document Link</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-ink text-paper text-xs px-4 py-1.5 font-medium hover:bg-accent"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
