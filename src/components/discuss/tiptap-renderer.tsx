"use client";
import { useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

export default function TiptapRenderer({ contentJson }: { contentJson: string }) {
  const parsedContent = useMemo(() => {
    if (!contentJson || !contentJson.trim()) return null;
    try {
      return JSON.parse(contentJson);
    } catch {
      return null;
    }
  }, [contentJson]);

  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Image,
      Link,
      Underline,
      Table,
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: parsedContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap text-sm leading-6 text-[#214457] focus:outline-none",
      },
    },
  });

  if (!parsedContent) {
    return <em className="text-[#7b8a99]">(no content)</em>;
  }

  return (
    <div className="max-w-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_p]:my-2 [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_td]:border [&_.tiptap_td]:border-[#cfe3ec] [&_.tiptap_td]:p-2 [&_.tiptap_th]:border [&_.tiptap_th]:border-[#cfe3ec] [&_.tiptap_th]:bg-[#f0f7fa] [&_.tiptap_th]:p-2">
      <EditorContent editor={ editor } />
    </div>
  );
}
