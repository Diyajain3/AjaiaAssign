"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/UserContext";

const DEMO_ACCOUNTS = [
  { name: "Alice Chen", email: "alice@ajaia.internal", pass: "alice123", role: "Owner" },
  { name: "Bob Smith", email: "bob@ajaia.internal", pass: "bob123", role: "Editor" },
  { name: "Charlie Davis", email: "charlie@ajaia.internal", pass: "charlie123", role: "Viewer" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, register, currentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regTitle, setRegTitle] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to home
  if (currentUser) {
    router.push("/");
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email: email.trim(), password: password.trim() });
      router.push("/");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage("Full name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        title: regTitle.trim() || "Team Member",
      });
      router.push("/");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoAccount = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setActiveTab("signin");
    setEmail(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-paper border border-border p-8 rounded-none">
        {/* Brand Header */}
        <div className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-ink text-paper text-xs font-bold flex items-center justify-center">
              A
            </div>
            <span className="text-sm font-bold tracking-tight uppercase text-ink">
              Ajaia Docs
            </span>
          </div>
          <h1 className="text-base font-semibold text-ink mt-3">Workspace Access</h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Sign in to your account or create a new team member account.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex border border-border bg-canvas p-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signin");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium transition-none ${
              activeTab === "signin"
                ? "bg-paper text-ink border border-border"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium transition-none ${
              activeTab === "register"
                ? "bg-paper text-ink border border-border"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 bg-danger-subtle border border-danger-border text-danger text-xs">
            {errorMessage}
          </div>
        )}

        {/* SIGN IN VIEW */}
        {activeTab === "signin" && (
          <>
            {/* Demo Credentials Picker */}
            <div className="mt-4 pb-4 border-b border-border">
              <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Reviewer Accounts (1-Click Fill)
              </label>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc)}
                    className={`w-full text-left p-2.5 border flex items-center justify-between text-xs transition-none ${
                      email === acc.email
                        ? "bg-canvas-subtle border-border-strong font-medium"
                        : "bg-canvas border-border hover:bg-canvas-muted"
                    }`}
                  >
                    <div>
                      <div className="text-ink font-medium">{acc.name}</div>
                      <div className="text-[11px] text-ink-muted">
                        {acc.email} : <span className="font-mono text-ink">{acc.pass}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-border text-ink-muted">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. alice@ajaia.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-ink text-paper text-xs py-2 font-medium hover:bg-accent transition-none disabled:opacity-40"
              >
                {isSubmitting ? "Authenticating..." : "Sign In to Account"}
              </button>
            </form>
          </>
        )}

        {/* REGISTER VIEW */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diana Prince"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. diana@ajaia.internal"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="Create a password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                Job Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Security Lead"
                value={regTitle}
                onChange={(e) => setRegTitle(e.target.value)}
                className="w-full bg-canvas border border-border text-xs px-3 py-2 text-ink outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-paper text-xs py-2 font-medium hover:bg-accent-hover transition-none disabled:opacity-40"
            >
              {isSubmitting ? "Creating Account..." : "Create Account & Sign In"}
            </button>
          </form>
        )}

        <div className="mt-5 text-[11px] text-ink-muted text-center border-t border-border pt-4">
          Session is isolated per browser session via secure HTTP cookies.
        </div>
      </div>
    </div>
  );
}
