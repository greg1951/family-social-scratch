"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Columns2,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Rows2,
  Save,
  Table2,
  Underline as UnderlineIcon,
  Unlink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveMusicLyricsAction } from "@/app/(features)/(music)/music/actions";
import { MusicLyricsRecord, MusicRecord } from "@/components/db/types/music";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

function ToolbarButton({ label, active = false, onClick, disabled = false, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ [
        "h-8 w-8 p-0",
        active ? "border-[#b8581a] bg-[#fff1e8] text-[#7b3306]" : "border-[#e8c4a0]",
      ].join(" ") }
    >
      <span className="inline-flex items-center justify-center gap-0.5">{ children }</span>
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

function getLyricsDocument(value?: string): JSONContent {
  if (!value) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(value);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

export function MusicLyricsPage({
  music,
  initialLyrics,
  canSaveLyrics,
}: {
  music: MusicRecord;
  initialLyrics: MusicLyricsRecord | null;
  canSaveLyrics: boolean;
}) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [status, setStatus] = useState(initialLyrics?.status ?? "draft");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getLyricsDocument(initialLyrics?.lyricsJson),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-112 rounded-2xl border border-[#f0d9c4] bg-white px-4 py-4 text-[#4b2a18] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(getLyricsDocument(initialLyrics?.lyricsJson));
  }, [editor, initialLyrics?.lyricsJson]);

  function handleSave() {
    if (!editor) {
      toast.error("Editor is still loading.");
      return;
    }

    startSaveTransition(async () => {
      const result = await saveMusicLyricsAction({
        musicId: music.id,
        lyricsJson: serializeTipTapDocument(editor.getJSON()),
        status,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/music");
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">Family Music Lovers</p>
            <Link href="/music" className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Back to Music Home</Link>
            <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Edit Song Lyrics</h1>
            <p className="mt-2 text-sm text-[#ffe8d1]">{ music.musicTitle }</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)] backdrop-blur">
          <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,240,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Lyrics Editor</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">{ music.musicTitle }</h2>
              </div>
              <div className="flex items-center gap-3">
                <Select value={ status } onValueChange={ setStatus }>
                  <SelectTrigger className="w-40" disabled={ !canSaveLyrics }><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={ handleSave } disabled={ isSaving || !canSaveLyrics }>
                  <Save className="size-4" />
                  { isSaving ? "Saving..." : "Save Lyrics" }
                </Button>
              </div>
            </div>
            { !canSaveLyrics ? (
              <p className="mt-3 text-xs text-[#8b5a3c]">Only the family member who created these lyrics can save changes.</p>
            ) : null }
          </div>

          <div className="p-5 sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-[#f0d9c4] bg-[#fff8f2] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
              <div className="flex flex-wrap gap-2 border-b border-[#f0d9c4] px-3 py-3">
                <ToolbarButton label="Heading 2" onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() } active={ editor?.isActive("heading", { level: 2 }) } disabled={ !editor }><Heading2 /></ToolbarButton>
                <ToolbarButton label="Heading 3" onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() } active={ editor?.isActive("heading", { level: 3 }) } disabled={ !editor }><Heading3 /></ToolbarButton>
                <ToolbarButton label="Bold" onClick={ () => editor?.chain().focus().toggleBold().run() } active={ editor?.isActive("bold") } disabled={ !editor }><Bold /></ToolbarButton>
                <ToolbarButton label="Italic" onClick={ () => editor?.chain().focus().toggleItalic().run() } active={ editor?.isActive("italic") } disabled={ !editor }><Italic /></ToolbarButton>
                <ToolbarButton label="Underline" onClick={ () => editor?.chain().focus().toggleUnderline().run() } active={ editor?.isActive("underline") } disabled={ !editor }><UnderlineIcon /></ToolbarButton>
                <ToolbarButton label="Bullet list" onClick={ () => editor?.chain().focus().toggleBulletList().run() } active={ editor?.isActive("bulletList") } disabled={ !editor }><List /></ToolbarButton>
                <ToolbarButton label="Ordered list" onClick={ () => editor?.chain().focus().toggleOrderedList().run() } active={ editor?.isActive("orderedList") } disabled={ !editor }><ListOrdered /></ToolbarButton>
                <ToolbarButton label="Set link" onClick={ () => { if (!editor) { return; } const value = window.prompt("Enter URL", "https://"); if (!value) { return; } editor.chain().focus().setLink({ href: value }).run(); } } active={ editor?.isActive("link") } disabled={ !editor }><Link2 /></ToolbarButton>
                <ToolbarButton label="Remove link" onClick={ () => editor?.chain().focus().unsetLink().run() } disabled={ !editor }><Unlink /></ToolbarButton>
                <ToolbarButton label="Insert horizontal line" onClick={ () => editor?.chain().focus().setHorizontalRule().run() } disabled={ !editor }><Minus /></ToolbarButton>
                <ToolbarButton label="Insert table" onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } active={ editor?.isActive("table") } disabled={ !editor }><Table2 /></ToolbarButton>
                <ToolbarButton label="Delete table" onClick={ () => editor?.chain().focus().deleteTable().run() } disabled={ !editor || !editor.isActive("table") }><Table2 /><X className="size-3" /></ToolbarButton>
                <ToolbarButton label="Add column after" onClick={ () => editor?.chain().focus().addColumnAfter().run() } disabled={ !editor || !editor.isActive("table") }><Columns2 /></ToolbarButton>
                <ToolbarButton label="Add row after" onClick={ () => editor?.chain().focus().addRowAfter().run() } disabled={ !editor || !editor.isActive("table") }><Rows2 /></ToolbarButton>
              </div>
              <EditorContent editor={ editor } />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
