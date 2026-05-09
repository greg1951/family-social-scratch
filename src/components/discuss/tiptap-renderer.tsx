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
  });

  if (!parsedContent) {
    return <em className="text-[#7b8a99]">(no content)</em>;
  }

  return (
    <div className="prose prose-sm max-w-none">
      <EditorContent editor={ editor } />
    </div>
  );
}
