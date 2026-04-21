"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import {
  Bold,
  Combine,
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
  Save,
  Table2,
  Tv,
  Underline as UnderlineIcon,
  Unlink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveShowTemplateAction } from "@/app/(features)/(tv)/tv/actions";
import { ShowTemplateRecord } from "@/components/db/types/shows";
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
        active ? "border-[#245475] bg-[#e8f5fd] text-[#12384e]" : "border-[#c6dcec]",
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
        class: "tiptap min-h-[18rem] text-[#12384e] focus:outline-none",
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

export function TvTemplatePage({ templates }: { templates: ShowTemplateRecord[] }) {
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
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
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
        class:
          "tiptap min-h-[18rem] rounded-b-2xl border border-t-0 border-[#c6dcec] bg-white px-4 py-4 text-[#12384e] shadow-xs outline-none focus:outline-none",
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

      const result = await saveShowTemplateAction({
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
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,47,66,0.95),rgba(21,98,123,0.86)_56%,rgba(106,177,198,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(8,34,50,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#b9f1ff]">
                Family TV Junkies
              </p>
              <Link
                href="/tv"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to TV Home
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Show Templates
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#d9f5ff]">
                Create your own show templates in draft or published status. Draft templates stay private to management and do not appear in Add Show template selection.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-full bg-white/20 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/30"
                onClick={ openCreateDialog }
              >
                <Plus className="mr-2 size-4" />
                Create Template
              </Button>
              <Button
                type="button"
                className="rounded-full bg-white/10 px-5 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={ openEditDialog }
                disabled={ !selectedTemplate?.canEdit }
              >
                <Edit3 className="mr-2 size-4" />
                Update Selected
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-[1.6rem] border border-[#d7ebf3] bg-white/92">
            <div className="border-b border-[#d7ebf3] px-5 py-4">
              <h2 className="text-lg font-black tracking-tight text-[#15384a]">Available Templates</h2>
              <p className="mt-1 text-xs text-[#5f7987]">Select a template to preview.</p>
            </div>
            <div className="max-h-128 overflow-y-auto p-3">
              { templates.length === 0 ? (
                <p className="rounded-xl border border-[#d7ebf3] bg-[#f5fbff] px-3 py-4 text-sm text-[#5f7987]">
                  No templates found for this family.
                </p>
              ) : (
                <div className="space-y-2">
                  { templates.map((template) => {
                    const isSelected = selectedTemplateId === template.id;

                    return (
                      <button
                        key={ template.id }
                        type="button"
                        onClick={ () => setSelectedTemplateId(template.id) }
                        className={ `w-full rounded-xl border px-3 py-3 text-left transition ${ isSelected
                          ? "border-[#8db7ca] bg-[#edf8fd]"
                          : "border-[#d7ebf3] bg-white hover:border-[#bfd8e5] hover:bg-[#f8fcff]" }` }
                      >
                        <p className="font-bold text-[#15384a]">{ template.templateName }</p>
                        <p className="mt-1 text-xs text-[#5f7987]">Owner: { template.ownerName }</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span className="rounded-full bg-[#e8f3f9] px-2 py-1 text-[#1f6078]">{ template.status }</span>
                          { template.isGlobalTemplate ? (
                            <span className="rounded-full bg-[#f3ead9] px-2 py-1 text-[#7a5323]">Global</span>
                          ) : null }
                          { template.canEdit ? (
                            <span className="rounded-full bg-[#e8f5da] px-2 py-1 text-[#3d6c21]">Editable</span>
                          ) : (
                            <span className="rounded-full bg-[#ececec] px-2 py-1 text-[#666]">Read only</span>
                          ) }
                        </div>
                      </button>
                    );
                  }) }
                </div>
              ) }
            </div>
          </aside>

          <div className="overflow-hidden rounded-[1.8rem] border border-[#d7ebf3] bg-white/92 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)]">
            <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,249,255,0.88))] px-5 py-5 sm:px-6">
              <h2 className="text-2xl font-black tracking-tight text-[#15384a]">
                { selectedTemplate ? selectedTemplate.templateName : "Template Preview" }
              </h2>
              <p className="mt-2 text-sm text-[#5f7987]">
                { selectedTemplate
                  ? `Status: ${ selectedTemplate.status } • Owner: ${ selectedTemplate.ownerName }`
                  : "Select a template from the list to preview its content." }
              </p>
            </div>

            <div className="p-5 sm:p-6">
              { selectedTemplate ? (
                <div className="rounded-xl border border-[#d7ebf3] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#c6dcec] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#c6dcec] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#c6dcec] [&_.tiptap_th]:bg-[#eaf5fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c6dcec] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                  <TemplateViewer templateJson={ selectedTemplate.templateJson } />
                </div>
              ) : (
                <p className="text-sm text-[#5f7987]">No template selected.</p>
              ) }
            </div>
          </div>
        </div>
      </div>

      <Dialog open={ isDialogOpen } onOpenChange={ setIsDialogOpen }>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(98vw,96rem)] max-w-none max-h-[90vh] overflow-hidden border-[#c6dcec] bg-[#f5fbff]">
          <DialogHeader>
            <DialogTitle className="text-[#15384a]">
              { dialogMode === "create" ? "Create Show Template" : "Update Show Template" }
            </DialogTitle>
            <DialogDescription className="text-[#5f7987]">
              Use TipTap content and choose draft or published status.
            </DialogDescription>
          </DialogHeader>

          <div className="font-app space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#15384a]" htmlFor="templateName">Template name</label>
                <Input
                  id="templateName"
                  value={ templateName }
                  onChange={ (event) => setTemplateName(event.target.value) }
                  placeholder="Enter template name"
                  className="border-[#c6dcec] bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#15384a]" htmlFor="templateStatus">Status</label>
                <Select value={ templateStatus } onValueChange={ setTemplateStatus }>
                  <SelectTrigger id="templateStatus" className="border-[#c6dcec] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-[#15384a]">Template content (TipTap)</p>
              <div className="grid gap-3 md:grid-cols-[4rem_minmax(0,1fr)] md:items-start">
                <div className="rounded-2xl border border-[#c6dcec] bg-[#eaf5fb] px-1.5 py-2">
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-center md:gap-1.5">
                    <ToolbarButton
                      label="Heading 2"
                      onClick={ () => editor?.chain().focus().toggleHeading({ level: 2 }).run() }
                      active={ editor?.isActive("heading", { level: 2 }) }
                      disabled={ !editor }
                    >
                      <Heading2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Heading 3"
                      onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }
                      active={ editor?.isActive("heading", { level: 3 }) }
                      disabled={ !editor }
                    >
                      <Heading3 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Bold"
                      onClick={ () => editor?.chain().focus().toggleBold().run() }
                      active={ editor?.isActive("bold") }
                      disabled={ !editor }
                    >
                      <Bold className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Italic"
                      onClick={ () => editor?.chain().focus().toggleItalic().run() }
                      active={ editor?.isActive("italic") }
                      disabled={ !editor }
                    >
                      <Italic className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Underline"
                      onClick={ () => editor?.chain().focus().toggleUnderline().run() }
                      active={ editor?.isActive("underline") }
                      disabled={ !editor }
                    >
                      <UnderlineIcon className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Bullet list"
                      onClick={ () => editor?.chain().focus().toggleBulletList().run() }
                      active={ editor?.isActive("bulletList") }
                      disabled={ !editor }
                    >
                      <List className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Numbered list"
                      onClick={ () => editor?.chain().focus().toggleOrderedList().run() }
                      active={ editor?.isActive("orderedList") }
                      disabled={ !editor }
                    >
                      <ListOrdered className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add link"
                      onClick={ () => {
                        if (!editor) {
                          return;
                        }

                        const value = window.prompt("Enter URL", "https://");
                        if (!value) {
                          return;
                        }

                        editor.chain().focus().setLink({ href: value }).run();
                      } }
                      disabled={ !editor }
                    >
                      <Link2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Remove link"
                      onClick={ () => editor?.chain().focus().unsetLink().run() }
                      disabled={ !editor }
                    >
                      <Unlink className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Insert horizontal line"
                      onClick={ () => editor?.chain().focus().setHorizontalRule().run() }
                      disabled={ !editor }
                    >
                      <Minus className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Insert table"
                      onClick={ () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }
                      active={ editor?.isActive("table") }
                      disabled={ !editor }
                    >
                      <Table2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete table"
                      onClick={ () => editor?.chain().focus().deleteTable().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Table2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add column after"
                      onClick={ () => editor?.chain().focus().addColumnAfter().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Columns2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete column"
                      onClick={ () => editor?.chain().focus().deleteColumn().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Columns2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Add row after"
                      onClick={ () => editor?.chain().focus().addRowAfter().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Rows2 className="size-4" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Delete row"
                      onClick={ () => editor?.chain().focus().deleteRow().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Rows2 className="size-4" />
                      <X className="size-3" />
                    </ToolbarButton>
                    <ToolbarButton
                      label="Toggle header row"
                      onClick={ () => editor?.chain().focus().toggleHeaderRow().run() }
                      disabled={ !editor || !editor.isActive("table") }
                    >
                      <Combine className="size-4" />
                    </ToolbarButton>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#c6dcec] bg-white p-0.5 [&_.tiptap]:min-h-112 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#c6dcec] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#c6dcec] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#c6dcec] [&_.tiptap_th]:bg-[#eaf5fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c6dcec] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                  <EditorContent editor={ editor } />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter showCloseButton className="border-t border-[#d7ebf3] pt-4">
            <Button
              type="button"
              className="bg-[#1f6688] text-white hover:bg-[#165777]"
              onClick={ handleSaveTemplate }
              disabled={ isSaving }
            >
              <Save className="mr-2 size-4" />
              { isSaving ? "Saving..." : dialogMode === "create" ? "Create Template" : "Update Template" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
