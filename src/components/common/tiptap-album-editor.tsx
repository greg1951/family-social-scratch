"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";

import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";

function getAlbumDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

type TipTapAlbumEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  disabled?: boolean;
};

export default function TipTapAlbumEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
}: TipTapAlbumEditorProps) {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3],
        },
      }),
      Underline,
    ],
    content: getAlbumDocument(value),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(serializeTipTapDocument(nextEditor.getJSON()));
    },
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
        class:
          "tiptap min-h-28 rounded-b-xl border border-t-0 border-[#dbe6ef] bg-white px-3 py-2 text-sm leading-6 text-[#183746] outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextSerialized = serializeTipTapDocument(getAlbumDocument(value));
    const currentSerialized = serializeTipTapDocument(editor.getJSON());

    if (nextSerialized !== currentSerialized) {
      editor.commands.setContent(getAlbumDocument(value), { emitUpdate: false });
    }
  }, [editor, value]);

  const toolbarButtonClassName =
    "h-8 rounded-full border border-[#c8d7df] bg-white px-3 text-xs font-semibold text-[#3d5c6d] hover:bg-white";

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="flex flex-wrap gap-2 rounded-t-xl border border-b-0 border-[#dbe6ef] bg-[#f6fbff] p-2">
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleHeading({ level: 3 }).run() }
          onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("heading", { level: 3 }) ? "border-[#39637a] bg-[#dff4ff] text-[#12374a]" : ""}` }
          aria-label="Heading 3"
        >
          H3
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBold().run() }
          onClick={ () => editor?.chain().focus().toggleBold().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bold") ? "border-[#39637a] bg-[#dff4ff] text-[#12374a]" : ""}` }
          aria-label="Bold"
        >
          B
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleItalic().run() }
          onClick={ () => editor?.chain().focus().toggleItalic().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("italic") ? "border-[#39637a] bg-[#dff4ff] text-[#12374a]" : ""}` }
          aria-label="Italic"
        >
          I
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleUnderline().run() }
          onClick={ () => editor?.chain().focus().toggleUnderline().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("underline") ? "border-[#39637a] bg-[#dff4ff] text-[#12374a]" : ""}` }
          aria-label="Underline"
        >
          U
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBulletList().run() }
          onClick={ () => editor?.chain().focus().toggleBulletList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bulletList") ? "border-[#39637a] bg-[#dff4ff] text-[#12374a]" : ""}` }
          aria-label="Bullet list"
        >
          List
        </Button>
      </div>
      <EditorContent editor={ editor } />
    </div>
  );
}
