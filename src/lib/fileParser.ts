import mammoth from "mammoth";

/**
 * Parses Markdown text to clean HTML compatible with TipTap
 */
export function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inBlockquote = false;
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${inList}>`);
      inList = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      htmlParts.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Handle Code Block
    if (rawLine.trim().startsWith("```")) {
      if (inCodeBlock) {
        htmlParts.push(
          `<pre><code>${codeBuffer.join("\n")}</code></pre>`
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        closeList();
        closeBlockquote();
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      // Escape HTML in code block
      const escaped = rawLine
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      codeBuffer.push(escaped);
      continue;
    }

    const trimmed = rawLine.trim();

    if (!trimmed) {
      closeList();
      closeBlockquote();
      continue;
    }

    // Inline formatting helper
    const parseInline = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<s>$1</s>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
    };

    // Headings
    if (trimmed.startsWith("### ")) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h3>${parseInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h2>${parseInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      closeBlockquote();
      htmlParts.push(`<h1>${parseInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      closeList();
      if (!inBlockquote) {
        htmlParts.push("<blockquote>");
        inBlockquote = true;
      }
      htmlParts.push(`<p>${parseInline(trimmed.slice(2))}</p>`);
      continue;
    } else {
      closeBlockquote();
    }

    // Unordered List (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (inList !== "ul") {
        closeList();
        htmlParts.push("<ul>");
        inList = "ul";
      }
      htmlParts.push(`<li>${parseInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered List (1. ...)
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== "ol") {
        closeList();
        htmlParts.push("<ol>");
        inList = "ol";
      }
      htmlParts.push(`<li>${parseInline(olMatch[1])}</li>`);
      continue;
    }

    closeList();

    // Standard paragraph
    htmlParts.push(`<p>${parseInline(trimmed)}</p>`);
  }

  closeList();
  closeBlockquote();
  if (inCodeBlock && codeBuffer.length > 0) {
    htmlParts.push(`<pre><code>${codeBuffer.join("\n")}</code></pre>`);
  }

  return htmlParts.join("");
}

/**
 * Parses plain text to HTML paragraphs
 */
export function plainTextToHtml(text: string): string {
  const paragraphs = text.split(/\r?\n\r?\n/);
  return paragraphs
    .map((p) => {
      const clean = p
        .trim()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\r?\n/g, "<br>");
      return clean ? `<p>${clean}</p>` : "";
    })
    .filter(Boolean)
    .join("");
}

/**
 * Extracts and converts a file buffer (.docx, .md, .txt) to clean HTML
 */
export async function parseFileToHtml(
  fileName: string,
  buffer: Buffer
): Promise<{ title: string; html: string }> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const title = fileName.replace(/\.[^/.]+$/, "") || "Untitled Document";

  if (extension === "docx") {
    const result = await mammoth.convertToHtml({ buffer });
    return {
      title,
      html: result.value || "<p></p>",
    };
  }

  if (extension === "md" || extension === "markdown") {
    const content = buffer.toString("utf-8");
    return {
      title,
      html: markdownToHtml(content) || "<p></p>",
    };
  }

  if (extension === "txt") {
    const content = buffer.toString("utf-8");
    return {
      title,
      html: plainTextToHtml(content) || "<p></p>",
    };
  }

  throw new Error(`Unsupported file type: .${extension}. Supported types are .docx, .md, and .txt.`);
}
