import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/components/UserContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Ajaia Docs - Collaborative Editor",
  description: "A lightweight collaborative document editor inspired by Google Docs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <UserProvider>
          <Navbar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
