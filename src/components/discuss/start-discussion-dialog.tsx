"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
  Unlink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { startDiscussionThreadAction } from "@/components/discuss/discussion-actions";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type StartDiscussionDialogProps = {
  targetType: string;
  targetId: number;
  topicLabel: string;
  revalidatePaths?: string[];
  onSuccessRoute: string | ((threadId: number) => string);
  disabled?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
};

function resolveSuccessRoute(onSuccessRoute: StartDiscussionDialogProps["onSuccessRoute"], threadId: number): string {
  if (typeof onSuccessRoute === "function") {
    return onSuccessRoute(threadId);
  }

  return onSuccessRoute.includes(":threadId")
    ? onSuccessRoute.replace(":threadId", String(threadId))
    : onSuccessRoute;
}

export default function StartDiscussionDialog({
  targetType,
  targetId,
  topicLabel,
  revalidatePaths,
  onSuccessRoute,
  disabled = false,
  triggerLabel = "Add Discussion",
  triggerClassName,
}: StartDiscussionDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: createEmptyTipTapDocument() as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[12rem] text-sm leading-6 text-[#15384a] focus:outline-none",
      },
    },
  });

  function resetDialog() {
    setCaption("");
    if (editor) {
      editor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
    }
  }

  function openDialog() {
    setIsOpen(true);
    resetDialog();
  }

  function handleSetLink() {
    if (!editor) {
      return;
    }

    const currentUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Enter URL", currentUrl ?? "https://");

    if (nextUrl === null) {
      return;
    }

    const normalizedUrl = nextUrl.trim();

    if (!normalizedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedUrl }).run();
  }

  async function handleSubmit() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    const summary = caption.trim();

    if (!summary) {
      toast.error("Post Caption is required.");
      return;
    }

    // Use the user-entered caption as the discussion thread title.
    const discussTopic = summary || topicLabel.trim();

    if (!discussTopic) {
      toast.error("Discussion topic is required.");
      return;
    }

    const contentJson = serializeTipTapDocument(editor.getJSON() as JSONContent);

    setIsSubmitting(true);

    const result = await startDiscussionThreadAction({
      targetType,
      targetId,
      discussTopic,
      initialSummary: summary,
      initialContentJson: contentJson,
      revalidatePaths,
    });

    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    setIsOpen(false);
    resetDialog();

    const route = resolveSuccessRoute(onSuccessRoute, result.threadId);
    router.push(route);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        onClick={ openDialog }
        disabled={ disabled }
        className={ triggerClassName ?? "rounded-full bg-[#2d87a8] px-4 text-xs font-semibold text-white hover:bg-[#256e89]" }
      >
        { triggerLabel }
      </Button>

      <Dialog open={ isOpen } onOpenChange={ setIsOpen }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Discussion</DialogTitle>
            <DialogDescription>
              Start a new discussion: A short attention grabbing caption and then enter your post content below.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2">
            <label className="mb-2 block text-xs font-semibold text-[#4f7384]" htmlFor="start-discussion-caption-input">
              Discussion Caption
            </label>
            <Input
              id="start-discussion-caption-input"
              type="text"
              value={ caption }
              onChange={ (event) => setCaption(event.target.value) }
              placeholder="Enter a short summary/caption for this post"
              className="mb-4 w-full rounded border border-[#cfe3ec] bg-white px-3 py-2 text-sm text-[#15384a] focus:outline-none focus:ring-2 focus:ring-[#59cdf7]"
              maxLength={ 120 }
              disabled={ isSubmitting }
            />

            <label className="mb-2 block text-xs font-semibold text-[#4f7384]" htmlFor="start-discussion-content-editor">
              Discussion Content
            </label>
            <div className="rounded-t-xl border-b border-[#cfe3ec] bg-[#f9faff] px-3 py-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleBold().run() }><Bold className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleItalic().run() }><Italic className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleUnderline().run() }><UnderlineIcon className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }><Heading2 className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }><Heading3 className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleOrderedList().run() }><ListOrdered className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().toggleBulletList().run() }><List className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().setHorizontalRule().run() }><Minus className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ handleSetLink }><Link2 className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().unsetLink().run() }><Unlink className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().undo().run() }><Undo2 className="size-4" /></Button>
                <Button type="button" size="sm" variant="outline" onClick={ () => editor?.chain().focus().redo().run() }><Redo2 className="size-4" /></Button>
              </div>
            </div>
            <EditorContent
              id="start-discussion-content-editor"
              editor={ editor }
              className="[&_.tiptap]:min-h-56 [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:outline-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={ handleSubmit }
              disabled={ isSubmitting }
              className="rounded-full bg-[#2d87a8] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#256e89] disabled:opacity-60"
            >
              { isSubmitting ? "Posting..." : "Post Discussion" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
