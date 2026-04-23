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
  Edit3,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Plus,
  Rows2,
  Table2,
  Underline as UnderlineIcon,
  Unlink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveMusicTemplateAction } from "@/app/(features)/(music)/music/actions";
import { MusicTemplateRecord } from "@/components/db/types/music";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DialogMode = "create" | "edit";

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

function parseTemplateJson(templateJson: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(templateJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function TemplateViewer({ templateJson }: { templateJson: string }) {
  const previewEditor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: parseTemplateJson(templateJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[18rem] text-[#4b2a18] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!previewEditor) {
      return;
    }

    previewEditor.commands.setContent(parseTemplateJson(templateJson));
  }, [previewEditor, templateJson]);

  return <EditorContent editor={ previewEditor } />;
}

export function MusicTemplatePage({ templates }: { templates: MusicTemplateRecord[] }) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number>(templates[0]?.id ?? 0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateStatus, setTemplateStatus] = useState("draft");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  const editableTemplate = useMemo(
    () => templates.find((template) => template.id === editingTemplateId) ?? null,
    [editingTemplateId, templates]
  );

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
    content: createEmptyTipTapDocument(),
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[18rem] rounded-b-2xl border border-t-0 border-[#e8c4a0] bg-white px-4 py-4 text-[#4b2a18] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || !isDialogOpen) {
      return;
    }

    if (dialogMode === "create") {
      editor.commands.setContent(createEmptyTipTapDocument());
      return;
    }

    if (!editableTemplate) {
      return;
    }

    editor.commands.setContent(parseTemplateJson(editableTemplate.templateJson));
  }, [dialogMode, editableTemplate, editor, isDialogOpen]);

  function openCreateDialog() {
    setDialogMode("create");
    setEditingTemplateId(null);
    setTemplateName("");
    setTemplateStatus("draft");
    setIsDialogOpen(true);
  }

  function openEditDialog() {
    if (!selectedTemplate || !selectedTemplate.canEdit) {
      return;
    }

    setDialogMode("edit");
    setEditingTemplateId(selectedTemplate.id);
    setTemplateName(selectedTemplate.templateName);
    setTemplateStatus(selectedTemplate.status);
    setIsDialogOpen(true);
  }

  function handleSaveTemplate() {
    startSaveTransition(async () => {
      if (!editor) {
        toast.error("Editor is loading. Try again in a moment.");
        return;
      }

      const result = await saveMusicTemplateAction({
        id: dialogMode === "edit" ? editingTemplateId ?? undefined : undefined,
        templateName,
        status: templateStatus,
        templateJson: serializeTipTapDocument(editor.getJSON()),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsDialogOpen(false);
      setSelectedTemplateId(result.template.id);
      router.refresh();
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">Family Music Lovers</p>
              <Link href="/music" className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Back to Music Home</Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Music Templates</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#ffe8d1]">Create your own music templates in draft or published status. Draft templates stay out of the Add Music template selection list.</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" className="rounded-full bg-white/20 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/30" onClick={ openCreateDialog }><Plus className="mr-2 size-4" />Create Template</Button>
              <Button type="button" className="rounded-full bg-white/10 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50" onClick={ openEditDialog } disabled={ !selectedTemplate?.canEdit }><Edit3 className="mr-2 size-4" />Update Selected</Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[1.6rem] border border-[#f0d9c4] bg-white/92">
            <div className="border-b border-[#f0d9c4] px-5 py-4">
              <h2 className="text-lg font-black tracking-tight text-[#5c2e1a]">Available Templates</h2>
              <p className="mt-1 text-xs text-[#8b5a3c]">Select a template to preview.</p>
            </div>
            <div className="max-h-128 overflow-y-auto p-3">
              { templates.length === 0 ? (
                <p className="rounded-xl border border-[#f0d9c4] bg-[#fff8f2] px-3 py-4 text-sm text-[#8b5a3c]">No templates found for this family.</p>
              ) : (
                <div className="space-y-2">
                  { templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;

                    return (
                      <button key={ template.id } type="button" onClick={ () => setSelectedTemplateId(template.id) } className={ `w-full rounded-xl border px-3 py-3 text-left transition ${ isSelected ? "border-[#d8a06b] bg-[#fff1e8]" : "border-[#f0d9c4] bg-white hover:border-[#e5c2a0] hover:bg-[#fff8f2]" }` }>
                        <p className="font-bold text-[#5c2e1a]">{ template.templateName }</p>
                        <p className="mt-1 text-xs text-[#8b5a3c]">Owner: { template.ownerName }</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span className="rounded-full bg-[#fff1e8] px-2 py-1 text-[#8a4b1d]">{ template.status }</span>
                          { template.isGlobalTemplate ? <span className="rounded-full bg-[#f3ead9] px-2 py-1 text-[#7a5323]">Global</span> : null }
                          { template.canEdit ? <span className="rounded-full bg-[#e8f5da] px-2 py-1 text-[#3d6c21]">Editable</span> : <span className="rounded-full bg-[#ececec] px-2 py-1 text-[#666]">Read only</span> }
                        </div>
                      </button>
                    );
                  }) }
                </div>
              ) }
            </div>
          </aside>

          <div className="overflow-hidden rounded-[1.8rem] border border-[#f0d9c4] bg-white/92 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)]">
            <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,240,0.88))] px-5 py-5 sm:px-6">
              <h2 className="text-2xl font-black tracking-tight text-[#5c2e1a]">{ selectedTemplate ? selectedTemplate.templateName : "Template Preview" }</h2>
              <p className="mt-2 text-sm text-[#8b5a3c]">{ selectedTemplate ? `Status: ${ selectedTemplate.status } • Owner: ${ selectedTemplate.ownerName }` : "Select a template from the list to preview its content." }</p>
            </div>

            <div className="p-5 sm:p-6">
              { selectedTemplate ? (
                <div className="rounded-xl border border-[#f0d9c4] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1"><TemplateViewer templateJson={ selectedTemplate.templateJson } /></div>
              ) : <p className="text-sm text-[#8b5a3c]">No template selected.</p> }
            </div>
          </div>
        </div>
      </div>

      <Dialog open={ isDialogOpen } onOpenChange={ setIsDialogOpen }>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(98vw,96rem)] max-w-none max-h-[90vh] overflow-hidden border-[#e8c4a0] bg-[#fff8f2]">
          <DialogHeader>
            <DialogTitle className="text-[#5c2e1a]">{ dialogMode === "create" ? "Create Music Template" : "Update Music Template" }</DialogTitle>
            <DialogDescription className="text-[#8b5a3c]">Use TipTap content and choose draft or published status.</DialogDescription>
          </DialogHeader>

          <div className="font-app space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#5c2e1a]" htmlFor="templateName">Template name</label>
                <Input id="templateName" value={ templateName } onChange={ (event) => setTemplateName(event.target.value) } placeholder="Enter template name" className="border-[#e8c4a0] bg-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#5c2e1a]" htmlFor="templateStatus">Status</label>
                <Select value={ templateStatus } onValueChange={ setTemplateStatus }>
                  <SelectTrigger id="templateStatus" className="border-[#e8c4a0] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-[#5c2e1a]">Template content (TipTap)</p>
              <div className="grid gap-3 md:grid-cols-[4rem_minmax(0,1fr)] md:items-start">
                <div className="rounded-2xl border border-[#e8c4a0] bg-[#fff1e8] px-1.5 py-2">
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-center md:gap-1.5">
                    <ToolbarButton label="Heading 2" onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() } active={ editor?.isActive("heading", { level: 2 }) } disabled={ !editor }><Heading2 className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Heading 3" onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() } active={ editor?.isActive("heading", { level: 3 }) } disabled={ !editor }><Heading3 className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Bold" onClick={ () => editor?.chain().focus().toggleBold().run() } active={ editor?.isActive("bold") } disabled={ !editor }><Bold className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Italic" onClick={ () => editor?.chain().focus().toggleItalic().run() } active={ editor?.isActive("italic") } disabled={ !editor }><Italic className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Underline" onClick={ () => editor?.chain().focus().toggleUnderline().run() } active={ editor?.isActive("underline") } disabled={ !editor }><UnderlineIcon className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Bullet list" onClick={ () => editor?.chain().focus().toggleBulletList().run() } active={ editor?.isActive("bulletList") } disabled={ !editor }><List className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Numbered list" onClick={ () => editor?.chain().focus().toggleOrderedList().run() } active={ editor?.isActive("orderedList") } disabled={ !editor }><ListOrdered className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Add link" onClick={ () => { if (!editor) { return; } const value = window.prompt("Enter URL", "https://"); if (!value) { return; } editor.chain().focus().setLink({ href: value }).run(); } } disabled={ !editor }><Link2 className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Remove link" onClick={ () => editor?.chain().focus().unsetLink().run() } disabled={ !editor }><Unlink className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Insert horizontal line" onClick={ () => editor?.chain().focus().setHorizontalRule().run() } disabled={ !editor }><Minus className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Insert table" onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() } active={ editor?.isActive("table") } disabled={ !editor }><Table2 className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Delete table" onClick={ () => editor?.chain().focus().deleteTable().run() } disabled={ !editor || !editor.isActive("table") }><Table2 className="size-4" /><X className="size-3" /></ToolbarButton>
                    <ToolbarButton label="Add column after" onClick={ () => editor?.chain().focus().addColumnAfter().run() } disabled={ !editor || !editor.isActive("table") }><Columns2 className="size-4" /></ToolbarButton>
                    <ToolbarButton label="Add row after" onClick={ () => editor?.chain().focus().addRowAfter().run() } disabled={ !editor || !editor.isActive("table") }><Rows2 className="size-4" /></ToolbarButton>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#e8c4a0] bg-white [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1"><EditorContent editor={ editor } /></div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => setIsDialogOpen(false) }>Cancel</Button>
            <Button type="button" onClick={ handleSaveTemplate } disabled={ isSaving }>{ isSaving ? "Saving..." : "Save Template" }</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}