"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Link2, List, ListOrdered, Unlink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function getCommentDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

function normalizeLinkUrl(value: string): string | null {
  const trimmedUrl = value.trim();

  if (!trimmedUrl) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl)
    ? trimmedUrl
    : `https://${ trimmedUrl }`;

  try {
    const normalizedUrl = new URL(candidate);

    if (!["http:", "https:", "mailto:", "tel:"].includes(normalizedUrl.protocol)) {
      return null;
    }

    return normalizedUrl.toString();
  } catch {
    return null;
  }
}

type TipTapCommentEditorProps = {
  value: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  disabled?: boolean;
  enableLinks?: boolean;
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
  enableLinks = false,
  toolbarClassName = "border-[#dbe6ef] bg-[#f6fbff]",
  editorClassName = "border-[#dbe6ef] text-[#183746]",
  buttonClassName = "border-[#c8d7df] text-[#3d5c6d]",
  activeButtonClassName = "border-[#39637a] bg-[#dff4ff] text-[#12374a]",
}: TipTapCommentEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);

  const editor = useEditor({
    editable: !disabled,
    extensions: enableLinks
      ? [
        StarterKit,
        Underline,
        LinkExtension.configure({
          autolink: true,
          defaultProtocol: "https",
          openOnClick: false,
        }),
      ]
      : [StarterKit, Underline],
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

  const normalizedLinkPreview = useMemo(
    () => (linkValue.trim() ? normalizeLinkUrl(linkValue) : null),
    [linkValue]
  );

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

  function openLinkDialog() {
    if (!editor || !editor.isEditable) {
      return;
    }

    const linkAttributes = editor.getAttributes("link") as { href?: string; target?: string | null };

    setLinkValue(linkAttributes.href ?? "https://");
    setOpenLinkInNewTab(linkAttributes.target === "_blank");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!editor) {
      return;
    }

    const trimmedUrl = linkValue.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkError(null);
      setIsLinkDialogOpen(false);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedUrl);

    if (!normalizedUrl) {
      setLinkError("Enter a valid http, https, mailto, or tel link.");
      return;
    }

    setLinkValue(normalizedUrl);
    setLinkError(null);

    editor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedUrl,
      target: openLinkInNewTab ? "_blank" : null,
      rel: openLinkInNewTab ? "noopener noreferrer nofollow" : null,
    }).run();

    setIsLinkDialogOpen(false);
  }

  function removeLink() {
    if (editor?.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    setIsLinkDialogOpen(false);
  }

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
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ disabled || !editor || !editor.can().chain().focus().toggleOrderedList().run() }
          onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
          className={ `${toolbarButtonClassName} ${editor?.isActive("orderedList") ? activeButtonClassName : ""}` }
          aria-label="Numbered list"
        >
          <ListOrdered className="size-4" />
        </Button>
        { enableLinks ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={ disabled || !editor }
              onClick={ openLinkDialog }
              className={ `${toolbarButtonClassName} ${editor?.isActive("link") ? activeButtonClassName : ""}` }
              aria-label="Set link"
            >
              <Link2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={ disabled || !editor || !editor.isActive("link") }
              onClick={ () => editor?.chain().focus().extendMarkRange("link").unsetLink().run() }
              className={ toolbarButtonClassName }
              aria-label="Remove link"
            >
              <Unlink className="size-4" />
            </Button>
          </>
        ) : null }
      </div>
      <EditorContent
        editor={ editor }
        className="[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_a]:text-[#0f5c78] [&_.tiptap_a]:underline [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b9d2dd] [&_.tiptap_blockquote]:pl-4"
      />

      { enableLinks ? (
        <Dialog open={ isLinkDialogOpen } onOpenChange={ setIsLinkDialogOpen }>
          <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#183746]">Edit Link</DialogTitle>
              <DialogDescription className="text-[#51707e]">
                Add or replace the URL for the selected text. Leave it blank to remove the link.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#183746]" htmlFor="comment-editor-link-url">
                URL
              </label>
              <Input
                id="comment-editor-link-url"
                value={ linkValue }
                onChange={ (event) => { setLinkValue(event.target.value); setLinkError(null); } }
                placeholder="https://example.com"
                className="border-[#c8d7df] bg-white text-[#183746]"
              />
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="comment-editor-link-target"
                  checked={ openLinkInNewTab }
                  onCheckedChange={ (checked: boolean | "indeterminate") => setOpenLinkInNewTab(checked === true) }
                />
                <label className="text-sm text-[#355161]" htmlFor="comment-editor-link-target">
                  Open in new tab
                </label>
              </div>
              { linkError ? <p className="text-sm text-red-500">{ linkError }</p> : null }
              <div className="rounded-xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
                <p className="font-semibold text-[#183746]">Preview</p>
                <p className="mt-1 break-all">
                  { normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={ removeLink }>
                Remove Link
              </Button>
              <Button type="button" onClick={ applyLink }>
                Apply Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : null }
    </div>
  );
}
