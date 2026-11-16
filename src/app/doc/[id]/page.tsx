"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Editor } from "@/components/Editor";
import { useCurrentUser } from "@/components/UserContext";
import { IconArrowLeft } from "@/components/Icons";

export default function DocumentPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { currentUser, loading: userLoading } = useCurrentUser();

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoc() {
      if (!id || !currentUser) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/documents/${id}?userId=${currentUser.id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load document");
        }
        const data = await res.json();
        setDocument(data);
      } catch (err: any) {
        setError(err.message || "Failed to load document");
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      if (!currentUser) {
        router.push("/login");
      } else {
        loadDoc();
      }
    }
  }, [id, currentUser, userLoading, router]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="text-xs font-mono text-ink-muted">
          Loading document...
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-paper border border-border p-6 text-center">
          <div className="text-xs font-semibold uppercase text-danger tracking-wider">
            Access Error
          </div>
          <p className="text-xs text-ink-muted mt-2 mb-4">
            {error || "Document not found or you do not have permission to access it."}
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs text-ink hover:bg-canvas"
            >
              <IconArrowLeft size={14} />
              <span>Back to Documents</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Editor key={`${document.id}-${currentUser?.id}`} initialDocument={document} />;
}
