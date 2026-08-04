"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { List, ListOrdered } from "lucide-react";
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
          "tiptap min-h-28 rounded-b-xl border border-t-0 border-[#f2c2ab] bg-white px-3 py-2 text-sm leading-6 text-[#6a3f39] outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1",
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
    "h-8 rounded-full border border-[#f2c2ab] bg-white px-3 text-xs font-semibold text-[#8a4d45] hover:bg-[#fff3ea]";

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="flex flex-wrap gap-2 rounded-t-xl border border-b-0 border-[#f2c2ab] bg-[#fff3ea] p-2">
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleHeading({ level: 3 }).run() }
          onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("heading", { level: 3 }) ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Heading 3"
        >
          H3
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBold().run() }
          onClick={ () => editor?.chain().focus().toggleBold().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bold") ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Bold"
        >
          B
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleItalic().run() }
          onClick={ () => editor?.chain().focus().toggleItalic().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("italic") ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Italic"
        >
          I
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleUnderline().run() }
          onClick={ () => editor?.chain().focus().toggleUnderline().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("underline") ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Underline"
        >
          U
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBulletList().run() }
          onClick={ () => editor?.chain().focus().toggleBulletList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bulletList") ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Bullet list"
        >
          <List className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleOrderedList().run() }
          onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("orderedList") ? "border-[#b76d68] bg-[#fde0d2] text-[#7a3e3a]" : ""}` }
          aria-label="Numbered list"
        >
          <ListOrdered className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <EditorContent editor={ editor } />
    </div>
  );
}
