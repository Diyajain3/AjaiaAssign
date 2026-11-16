"use client";

import React from "react";
import { IconClose, IconDownload } from "./Icons";

interface ExportModalProps {
  documentTitle: string;
  documentHtml: string;
  onClose: () => void;
}

export function ExportModal({
  documentTitle,
  documentHtml,
  onClose,
}: ExportModalProps) {
  const sanitizeFilename = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "document";
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <style>
    body { font-family: Georgia, serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; }
    h1, h2, h3 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    code { background: #eee; padding: 2px 4px; font-family: monospace; }
    pre { background: #eee; padding: 10px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; margin: 0; padding-left: 15px; color: #555; }
  </style>
</head>
<body>
  ${documentHtml}
</body>
</html>`;
    downloadFile(fullHtml, `${sanitizeFilename(documentTitle)}.html`, "text/html");
  };

  const handleExportText = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = documentHtml;
    const text = tempDiv.innerText || tempDiv.textContent || "";
    downloadFile(text, `${sanitizeFilename(documentTitle)}.txt`, "text/plain");
  };

  const handleExportMarkdown = () => {
    // Basic HTML to Markdown converter
    let md = documentHtml
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      .replace(/<s>(.*?)<\/s>/gi, "~~$1~~")
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, "```\n$1\n```\n\n")
      .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, "> $1\n\n")
      .replace(/<li>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");

    downloadFile(md.trim(), `${sanitizeFilename(documentTitle)}.md`, "text/markdown");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm bg-paper border border-border p-5 rounded-none">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
            Export Document
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted"
          >
            <IconClose size={16} />
          </button>
        </div>

        <p className="text-xs text-ink-muted mt-3 mb-4">
          Choose a file format to download a copy of this document.
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="w-full text-left p-3 border border-border bg-canvas hover:bg-canvas-muted flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-medium text-ink">Markdown (.md)</div>
              <div className="text-[11px] text-ink-muted">Formatted plain text with headers and lists</div>
            </div>
            <IconDownload size={14} className="text-ink-muted" />
          </button>

          <button
            type="button"
            onClick={handleExportHtml}
            className="w-full text-left p-3 border border-border bg-canvas hover:bg-canvas-muted flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-medium text-ink">HTML Webpage (.html)</div>
              <div className="text-[11px] text-ink-muted">Styled standalone HTML document</div>
            </div>
            <IconDownload size={14} className="text-ink-muted" />
          </button>

          <button
            type="button"
            onClick={handleExportText}
            className="w-full text-left p-3 border border-border bg-canvas hover:bg-canvas-muted flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-medium text-ink">Plain Text (.txt)</div>
              <div className="text-[11px] text-ink-muted">Unformatted clean text</div>
            </div>
            <IconDownload size={14} className="text-ink-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}
