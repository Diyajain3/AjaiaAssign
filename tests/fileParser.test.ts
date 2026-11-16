import { describe, it, expect } from "vitest";
import { markdownToHtml, plainTextToHtml, parseFileToHtml } from "@/lib/fileParser";

describe("File Parser Utility", () => {
  it("converts markdown headings and formatting into semantic HTML", () => {
    const md = `# Document Title
## Section Header
### Subsection
This is **bold** text and *italic* text.`;

    const html = markdownToHtml(md);
    expect(html).toContain("<h1>Document Title</h1>");
    expect(html).toContain("<h2>Section Header</h2>");
    expect(html).toContain("<h3>Subsection</h3>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("converts markdown lists and blockquotes correctly", () => {
    const md = `> Important notice

- Item A
- Item B

1. First step
2. Second step`;

    const html = markdownToHtml(md);
    expect(html).toContain("<blockquote><p>Important notice</p></blockquote>");
    expect(html).toContain("<ul><li>Item A</li><li>Item B</li></ul>");
    expect(html).toContain("<ol><li>First step</li><li>Second step</li></ol>");
  });

  it("converts plain text line breaks into paragraphs", () => {
    const txt = `Paragraph one.

Paragraph two has multiple lines.`;

    const html = plainTextToHtml(txt);
    expect(html).toContain("<p>Paragraph one.</p>");
    expect(html).toContain("<p>Paragraph two has multiple lines.</p>");
  });

  it("handles parseFileToHtml for .md files and infers title", async () => {
    const buffer = Buffer.from("# Project Kickoff\n\nInitial notes.");
    const result = await parseFileToHtml("project-kickoff.md", buffer);

    expect(result.title).toBe("project-kickoff");
    expect(result.html).toContain("<h1>Project Kickoff</h1>");
    expect(result.html).toContain("<p>Initial notes.</p>");
  });

  it("handles parseFileToHtml for .txt files", async () => {
    const buffer = Buffer.from("Quick meeting summary.\n\nAction items pending.");
    const result = await parseFileToHtml("meeting-notes.txt", buffer);

    expect(result.title).toBe("meeting-notes");
    expect(result.html).toContain("<p>Quick meeting summary.</p>");
  });
});
