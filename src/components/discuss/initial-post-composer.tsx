"use client";
import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addInitialDiscussionPostAction } from "@/components/discuss/discussion-actions";
import { createEmptyTipTapDocument, serializeTipTapDocument } from "@/components/db/types/poem-term-validation";
import dynamic from "next/dynamic";
import { useState } from "react";


const TiptapRenderer = dynamic(() => import("./tiptap-renderer"), { ssr: false });

export default function InitialPostComposer({
  threadId,
  threadTopic,
  revalidatePaths,
}: {
  threadId: number;
  threadTopic: string;
  revalidatePaths?: string[];
}) {
  const router = useRouter();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [caption, setCaption] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
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

  function handleSubmit() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    const summary = caption.trim();
    if (!summary) {
      toast.error("Post Caption is required.");
      return;
    }

    const contentJson = serializeTipTapDocument(editor.getJSON() as JSONContent);

    startSubmitTransition(async () => {
      const result = await addInitialDiscussionPostAction({
        threadId,
        summary,
        contentJson,
        revalidatePaths,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setCaption("");
      editor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
      router.refresh();
    });
  }

  function handleCancel() {
    setCaption("");
    if (editor) {
      editor.commands.setContent(createEmptyTipTapDocument() as JSONContent);
    }
  }

  return (
    <div className="rounded-2xl border border-[#d7ebf3] bg-[#f8fcff] px-4 py-4 text-sm text-[#3f6576] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4f7384]">
          Start New Discussion
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-[#cfe3ec] bg-white p-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_table]:border-collapse [&_table]:w-full [&_table_td]:border [&_table_td]:border-[#cfe3ec] [&_table_td]:p-2 [&_table_th]:border [&_table_th]:border-[#cfe3ec] [&_table_th]:p-2 [&_table_th]:bg-[#f0f7fa]">
        <p className="mb-2 text-xs font-semibold text-[#4f7384]">
          Topic: <span className="font-bold text-[#15384a]">{ threadTopic }</span>
        </p>
        <label className="block mb-2 text-xs font-semibold text-[#4f7384]" htmlFor="post-caption-input">
          Discussion Caption
        </label>
        <input
          id="post-caption-input"
          type="text"
          value={ caption }
          onChange={ (e) => setCaption(e.target.value) }
          placeholder="Enter a short summary/caption for this discussion"
          className="mb-4 w-full rounded border border-[#cfe3ec] bg-white px-3 py-2 text-sm text-[#15384a] focus:outline-none focus:ring-2 focus:ring-[#59cdf7]"
          maxLength={ 120 }
          disabled={ isSubmitting }
        />
        <label className="block mb-2 text-xs font-semibold text-[#4f7384]" htmlFor="post-content-editor">
          Discussion Content
        </label>
        <EditorContent id="post-content-editor" editor={ editor } />
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={ handleCancel }
          disabled={ isSubmitting }
          className="rounded-full border border-[#c9e2ec] bg-white px-4 py-1.5 text-xs font-semibold text-[#2c5f75] transition hover:bg-[#eef8fc]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={ handleSubmit }
          disabled={ isSubmitting }
          className="rounded-full bg-[#2d87a8] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#256e89] disabled:opacity-60"
        >
          { isSubmitting ? "Posting..." : "Post Discussion" }
        </button>
      </div>
    </div>
  );
}
