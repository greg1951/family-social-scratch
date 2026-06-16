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

function getCommentDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

type TipTapCommentEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  disabled?: boolean;
  toolbarClassName?: string;
  editorClassName?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
};

export default function TipTapCommentEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  toolbarClassName = "border-[#dbe6ef] bg-[#f6fbff]",
  editorClassName = "border-[#dbe6ef] text-[#183746]",
  buttonClassName = "border-[#c8d7df] text-[#3d5c6d]",
  activeButtonClassName = "border-[#39637a] bg-[#dff4ff] text-[#12374a]",
}: TipTapCommentEditorProps) {
  const editor = useEditor({
    editable: !disabled,
    extensions: [StarterKit, Underline],
    content: getCommentDocument(value),
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      onChange(serializeTipTapDocument(nextEditor.getJSON()));
    },
    editorProps: {
      attributes: {
        "data-placeholder": placeholder,
        class: `tiptap min-h-24 rounded-b-xl border border-t-0 bg-white px-3 py-2 text-sm leading-6 outline-none ${editorClassName}`,
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

    const nextSerialized = serializeTipTapDocument(getCommentDocument(value));
    const currentSerialized = serializeTipTapDocument(editor.getJSON());

    if (nextSerialized !== currentSerialized) {
      editor.commands.setContent(getCommentDocument(value), { emitUpdate: false });
    }
  }, [editor, value]);

  const toolbarButtonClassName = `h-8 rounded-full border bg-white px-3 text-xs font-semibold hover:bg-white ${buttonClassName}`;

  return (
    <div className="overflow-hidden rounded-xl">
      <div className={ `flex flex-wrap gap-2 rounded-t-xl border border-b-0 p-2 ${toolbarClassName}` }>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBold().run() }
          onClick={ () => editor?.chain().focus().toggleBold().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bold") ? activeButtonClassName : ""}` }
          aria-label="Bold"
        >
          B
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleItalic().run() }
          onClick={ () => editor?.chain().focus().toggleItalic().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("italic") ? activeButtonClassName : ""}` }
          aria-label="Italic"
        >
          I
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleUnderline().run() }
          onClick={ () => editor?.chain().focus().toggleUnderline().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("underline") ? activeButtonClassName : ""}` }
          aria-label="Underline"
        >
          U
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleBulletList().run() }
          onClick={ () => editor?.chain().focus().toggleBulletList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("bulletList") ? activeButtonClassName : ""}` }
          aria-label="Bulleted list"
        >
          Bullets
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleOrderedList().run() }
          onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("orderedList") ? activeButtonClassName : ""}` }
          aria-label="Numbered list"
        >
          Numbered
        </Button>
      </div>
      <EditorContent editor={ editor } />
    </div>
  );
}
