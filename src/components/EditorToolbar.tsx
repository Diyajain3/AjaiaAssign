"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrike,
  IconListBullet,
  IconListOrdered,
  IconQuote,
  IconCode,
  IconUndo,
  IconRedo,
} from "./Icons";

interface EditorToolbarProps {
  editor: Editor | null;
  readOnly?: boolean;
}

export function EditorToolbar({ editor, readOnly = false }: EditorToolbarProps) {
  if (!editor) return null;

  if (readOnly) {
    return (
      <div className="w-full bg-canvas-muted border-y border-border px-4 py-2 flex items-center justify-between text-xs text-ink-muted">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-border bg-paper text-ink">
            View-Only
          </span>
          <span>You do not have permission to edit this document. Contact the owner to request edit access.</span>
        </div>
      </div>
    );
  }

  // Active status helpers
  const isBold = editor.isActive("bold");
  const isItalic = editor.isActive("italic");
  const isUnderline = editor.isActive("underline");
  const isStrike = editor.isActive("strike");
  const isH1 = editor.isActive("heading", { level: 1 });
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });
  const isBulletList = editor.isActive("bulletList");
  const isOrderedList = editor.isActive("orderedList");
  const isBlockquote = editor.isActive("blockquote");
  const isCodeBlock = editor.isActive("codeBlock");

  const btnClass = (active: boolean) =>
    `p-1.5 border border-transparent hover:border-border hover:bg-canvas rounded-none text-ink ${
      active ? "bg-canvas-subtle border-border font-semibold text-accent" : ""
    }`;

  const currentHeadingValue = isH1 ? "1" : isH2 ? "2" : isH3 ? "3" : "p";

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "p") {
      editor.chain().focus().setParagraph().run();
    } else if (val === "1") {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    } else if (val === "2") {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    } else if (val === "3") {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  };

  return (
    <div className="w-full bg-paper border-y border-border px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 select-none">
      <div className="flex flex-wrap items-center gap-1">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 hover:bg-canvas text-ink disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <IconUndo size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 hover:bg-canvas text-ink disabled:opacity-30"
          title="Redo (Ctrl+Y)"
        >
          <IconRedo size={14} />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Headings Selector */}
        <select
          value={currentHeadingValue}
          onChange={handleHeadingChange}
          className="bg-canvas border border-border text-xs px-2 py-1 text-ink outline-none"
        >
          <option value="p">Normal text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Basic formatting: Bold, Italic, Underline, Strike */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(isBold)}
          title="Bold (Ctrl+B)"
        >
          <IconBold size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(isItalic)}
          title="Italic (Ctrl+I)"
        >
          <IconItalic size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(isUnderline)}
          title="Underline (Ctrl+U)"
        >
          <IconUnderline size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(isStrike)}
          title="Strikethrough"
        >
          <IconStrike size={14} />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(isBulletList)}
          title="Bulleted list"
        >
          <IconListBullet size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(isOrderedList)}
          title="Numbered list"
        >
          <IconListOrdered size={14} />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Quote & Code */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(isBlockquote)}
          title="Blockquote"
        >
          <IconQuote size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(isCodeBlock)}
          title="Code block"
        >
          <IconCode size={14} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="px-2 py-1 text-xs border border-transparent hover:border-border hover:bg-canvas text-ink-muted"
          title="Clear formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor statistics */}
      <div className="text-[11px] text-ink-faint font-mono">
        {editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  );
}
