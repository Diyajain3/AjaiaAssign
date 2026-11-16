"use client";

import React from "react";
import Link from "next/link";
import { useCurrentUser } from "./UserContext";

interface NavbarProps {
  documentTitle?: string;
  isDocumentView?: boolean;
}

export function Navbar({ isDocumentView = false }: NavbarProps) {
  const { currentUser, logout, loading } = useCurrentUser();

  return (
    <header className="w-full bg-paper border-b border-border h-13 px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-ink font-semibold tracking-tight text-sm uppercase hover:text-accent"
        >
          <div className="w-5 h-5 bg-ink text-paper text-xs font-bold flex items-center justify-center rounded-none">
            A
          </div>
          <span>Ajaia Docs</span>
        </Link>
        {isDocumentView && (
          <span className="text-ink-faint text-xs font-mono">/</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {loading ? (
          <span className="text-xs text-ink-muted">Checking session...</span>
        ) : currentUser ? (
          <div className="flex items-center gap-3">
            {/* Authenticated Identity Pill */}
            <div className="flex items-center gap-2 border border-border bg-canvas-muted px-2.5 py-1 text-xs text-ink">
              <div className="w-4 h-4 bg-accent text-paper text-[10px] font-bold flex items-center justify-center">
                {currentUser.avatar || "U"}
              </div>
              <div>
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-ink-muted ml-1 hidden sm:inline">
                  ({currentUser.title || "Member"})
                </span>
              </div>
            </div>

            {/* Secure Sign Out Button */}
            <button
              type="button"
              onClick={logout}
              className="text-xs text-ink-muted hover:text-danger px-2.5 py-1 border border-border bg-canvas hover:bg-canvas-muted transition-none"
              title="Sign out of current account"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="bg-ink text-paper text-xs px-3 py-1.5 font-medium hover:bg-accent"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
