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
  Underline as UnderlineIcon,
  Unlink,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveFoodiesTemplateAction } from "@/app/(features)/(foodies)/foodies/actions";
import { FoodiesTemplateRecord } from "@/components/db/types/recipes";
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
      onClick={ onClick }
      disabled={ disabled }
      aria-label={ label }
      className={ [
        "h-8 w-8 p-0",
        active ? "border-[#3d7a27] bg-[#ecf8e5] text-[#2c5c1a]" : "border-[#cadfbb]",
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
        class: "tiptap min-h-[18rem] text-[#2f4820] focus:outline-none",
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

export function FoodiesTemplatePage({
  templates,
}: {
  templates: FoodiesTemplateRecord[];
}) {
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
          "tiptap min-h-[18rem] rounded-b-2xl border border-t-0 border-[#cadfbb] bg-white px-4 py-4 text-[#2f4820] shadow-xs outline-none focus:outline-none",
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

      const result = await saveFoodiesTemplateAction({
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
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(49,67,29,0.95),rgba(87,124,36,0.88)_56%,rgba(199,216,126,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(40,54,21,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e9ffd0]">
                Family Foodies
              </p>
              <Link
                href="/foodies"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f1ffe4] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Foodies Home
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Recipe Templates
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#f1ffe4]">
                Create templates in draft or published status, browse your family template catalog, and edit only the templates you own.
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
          <aside className="overflow-hidden rounded-[1.6rem] border border-[#dbeacc] bg-white/92">
            <div className="border-b border-[#dbeacc] px-5 py-4">
              <h2 className="text-lg font-black tracking-tight text-[#2f4820]">Family Templates</h2>
              <p className="mt-1 text-xs text-[#5f7a40]">Select a template to preview it.</p>
            </div>
            <div className="max-h-128 overflow-y-auto p-3">
              { templates.length === 0 ? (
                <p className="rounded-xl border border-[#dbeacc] bg-[#f8fce9] px-3 py-4 text-sm text-[#5f7a40]">
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
                          ? "border-[#88b162] bg-[#f2f9e9]"
                          : "border-[#dbeacc] bg-white hover:border-[#bfd6aa] hover:bg-[#f8fce9]" }` }
                      >
                        <p className="font-bold text-[#2f4820]">{ template.templateName }</p>
                        <p className="mt-1 text-xs text-[#647a50]">Owner: { template.ownerName }</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]">
                          <span className="rounded-full bg-[#e8f5da] px-2 py-1 text-[#3d6c21]">{ template.status }</span>
                          { template.isGlobalTemplate ? (
                            <span className="rounded-full bg-[#d7ebf3] px-2 py-1 text-[#1f6078]">Global</span>
                          ) : null }
                          { template.canEdit ? (
                            <span className="rounded-full bg-[#f3ead9] px-2 py-1 text-[#7a5323]">Editable</span>
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

          <div className="overflow-hidden rounded-[1.8rem] border border-[#dbeacc] bg-white/92 shadow-[0_24px_70px_-40px_rgba(38,54,26,0.75)]">
            <div className="border-b border-[#dbeacc] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,235,0.88))] px-5 py-5 sm:px-6">
              <h2 className="text-2xl font-black tracking-tight text-[#2f4820]">
                { selectedTemplate ? selectedTemplate.templateName : "Template Preview" }
              </h2>
              <p className="mt-2 text-sm text-[#647a50]">
                { selectedTemplate
                  ? `Status: ${ selectedTemplate.status } • Owner: ${ selectedTemplate.ownerName }`
                  : "Select a template from the list to preview its content." }
              </p>
            </div>

            <div className="p-5 sm:p-6">
              { selectedTemplate ? (
                <div className="rounded-xl border border-[#dbeacc] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#cadfbb] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#cadfbb] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#cadfbb] [&_.tiptap_th]:bg-[#f4fae7] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#cadfbb] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                  <TemplateViewer templateJson={ selectedTemplate.templateJson } />
                </div>
              ) : (
                <p className="text-sm text-[#647a50]">No template selected.</p>
              ) }
            </div>
          </div>
        </div>
      </div>

      <Dialog open={ isDialogOpen } onOpenChange={ setIsDialogOpen }>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(98vw,96rem)] max-w-none max-h-[90vh] overflow-hidden border-[#cadfbb] bg-[#fbfff3]">
          <DialogHeader>
            <DialogTitle className="text-[#2f4820]">
              { dialogMode === "create" ? "Create Recipe Template" : "Update Recipe Template" }
            </DialogTitle>
            <DialogDescription className="text-[#5f7a40]">
              Use TipTap content and choose draft or published status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="templateName">Template name</label>
                <Input
                  id="templateName"
                  value={ templateName }
                  onChange={ (event) => setTemplateName(event.target.value) }
                  placeholder="Enter template name"
                  className="border-[#cadfbb] bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#2f4820]" htmlFor="templateStatus">Status</label>
                <Select value={ templateStatus } onValueChange={ setTemplateStatus }>
                  <SelectTrigger id="templateStatus" className="border-[#cadfbb] bg-white">
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
              <p className="text-sm font-bold text-[#2f4820]">Template content (TipTap)</p>
              <div className="grid gap-3 md:grid-cols-[4rem_minmax(0,1fr)] md:items-start">
                <div className="rounded-2xl border border-[#cadfbb] bg-[#f4fae7] px-1.5 py-2">
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

                        const value = window.prompt("Enter a URL", "https://");
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

                <div className="rounded-2xl border border-[#cadfbb] bg-white p-0.5 [&_.tiptap]:min-h-[28rem] [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#cadfbb] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#cadfbb] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#cadfbb] [&_.tiptap_th]:bg-[#f4fae7] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#cadfbb] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
                  <EditorContent editor={ editor } />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter showCloseButton className="border-t border-[#dbeacc] pt-4">
            <Button
              type="button"
              className="bg-[#3f6d23] text-white hover:bg-[#315619]"
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
