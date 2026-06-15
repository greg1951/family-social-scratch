"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import { ArrowLeft, Bold, Circle, Italic, Link2, List, ListOrdered, Pencil, Plus, Save, Trash2, Underline as UnderlineIcon, Unlink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deletePoemCategoryAction,
  deletePoemCategoryTagReferenceAction,
  savePoemCategoryAction,
  savePoemCategoryTagReferenceAction,
} from "@/app/(support)/(logged-in)/(poetry)/add-poem-tags/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import {
  PoemCategory,
  PoemCategoryTagReferenceItem,
  PoemCategoryWithTags,
} from "@/components/db/types/poem-verses";
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
import { Textarea } from "@/components/ui/textarea";

function parseTagJson(tagJson?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(tagJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function TagPreview({ tagJson }: { tagJson: string }) {
  const previewEditor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: true }),
    ],
    content: parseTagJson(tagJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap text-[1rem] leading-7 text-[#2f2f2f] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!previewEditor) {
      return;
    }

    previewEditor.commands.setContent(parseTagJson(tagJson));
  }, [previewEditor, tagJson]);

  return (
    <div className="rounded-xl border border-[#d9d9dc] bg-[#f6f6f7] px-3 py-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
      <EditorContent editor={ previewEditor } />
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  editor,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  editor: Editor | null;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ !editor }
      className={ active ? "border-[#6e6e74] bg-[#efeff1]" : "border-[#d0d0d3] bg-white" }
      aria-label={ label }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

export function PoemTagCategoriesAdminPage({ categories }: { categories: PoemCategoryWithTags[] }) {
  const router = useRouter();
  const [isSavingCategory, startSaveCategory] = useTransition();
  const [isSavingTag, startSaveTag] = useTransition();
  const [isDeletingCategory, startDeleteCategory] = useTransition();
  const [isDeletingTag, startDeleteTag] = useTransition();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PoemCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");

  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PoemCategoryTagReferenceItem | null>(null);
  const [tagCategoryId, setTagCategoryId] = useState<number>(categories[0]?.category.id ?? 0);
  const [tagName, setTagName] = useState("");

  const categoryOptions = useMemo(
    () => categories.map((entry) => entry.category),
    [categories]
  );

  const tagEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: createEmptyTipTapDocument(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-52 rounded-b-2xl border border-t-0 border-[#d0d0d3] bg-white px-4 py-4 text-[#2f2f2f] shadow-xs outline-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!tagEditor || !isTagDialogOpen) {
      return;
    }

    if (!editingTag) {
      tagEditor.commands.setContent(createEmptyTipTapDocument());
      return;
    }

    tagEditor.commands.setContent(parseTagJson(editingTag.tagJson));
  }, [editingTag, isTagDialogOpen, tagEditor]);

  function openAddCategoryDialog() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDesc("");
    setIsCategoryDialogOpen(true);
  }

  function openEditCategoryDialog(category: PoemCategory) {
    setEditingCategory(category);
    setCategoryName(category.categoryName);
    setCategoryDesc(category.categoryDesc ?? "");
    setIsCategoryDialogOpen(true);
  }

  function openAddTagDialog(categoryId: number) {
    setEditingTag(null);
    setTagName("");
    setTagCategoryId(categoryId);
    setIsTagDialogOpen(true);
  }

  function openEditTagDialog(tag: PoemCategoryTagReferenceItem) {
    setEditingTag(tag);
    setTagName(tag.tagName);
    setTagCategoryId(tag.poemCategoryId);
    setIsTagDialogOpen(true);
  }

  function handleSaveCategory() {
    startSaveCategory(async () => {
      const result = await savePoemCategoryAction({
        id: editingCategory?.id,
        categoryName,
        categoryDesc,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsCategoryDialogOpen(false);
      router.refresh();
    });
  }

  function handleSaveTag() {
    startSaveTag(async () => {
      if (!tagEditor) {
        toast.error("Tag editor is still loading.");
        return;
      }

      const result = await savePoemCategoryTagReferenceAction({
        id: editingTag?.id,
        poemCategoryId: tagCategoryId,
        tagName,
        tagJson: serializeTipTapDocument(tagEditor.getJSON()),
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsTagDialogOpen(false);
      router.refresh();
    });
  }

  function handleDeleteTag(tag: PoemCategoryTagReferenceItem) {
    const shouldDelete = window.confirm(`Delete tag "${ tag.tagName }"? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    startDeleteTag(async () => {
      const result = await deletePoemCategoryTagReferenceAction({ id: tag.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleDeleteCategory(category: PoemCategory) {
    const shouldDelete = window.confirm(`Delete category "${ category.categoryName }" and all its tags? This cannot be undone.`);

    if (!shouldDelete) {
      return;
    }

    startDeleteCategory(async () => {
      const result = await deletePoemCategoryAction({ id: category.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <section className="font-app min-h-screen bg-[linear-gradient(180deg,#efeff1_0%,#ececef_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[1.7rem] border border-[#d8d8dc] bg-[#f8f8f9] px-6 py-6 shadow-[0_24px_60px_-44px_rgba(33,33,38,0.4)] sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#616168]">Support Admin</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1f1f24]">Poetry Tag Categories</h1>
              <div className="mt-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-[#c8c8ce] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#2f2f35] transition hover:bg-[#f1f1f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a2a2ad]"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Main Page
                </Link>
              </div>
              {/* <p className="mt-2 max-w-3xl text-sm text-[#52525b]">
                Manage poetry categories and the tag details shown under each category. Each tag detail supports rich text content with TipTap.
              </p> */}
            </div>
            <Button
              type="button"
              className="rounded-full bg-[#232329] px-5 text-white hover:bg-[#111115]"
              onClick={ openAddCategoryDialog }
            >
              <Plus className="mr-2 size-4" />
              Add Category
            </Button>
          </div>
        </div>

        { categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#c9c9cf] bg-[#f7f7f8] px-6 py-10 text-center text-[#4b4b54]">
            <p className="text-lg font-semibold">No categories yet.</p>
            <p className="mt-2 text-sm">Create your first poetry tag category to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            { categories.map((entry) => (
              <article key={ entry.category.id } className="rounded-[1.4rem] border border-[#d2d2d7] bg-[#f9f9fa] p-4 shadow-[0_20px_35px_-30px_rgba(18,18,22,0.55)]">
                <header className="mb-4 border-b border-[#dddddf] pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-3xl font-black tracking-tight text-[#212127]">{ entry.category.categoryName }</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={ () => openEditCategoryDialog(entry.category) }
                        className="h-8 w-8 border-[#c7c7cd] bg-white text-[#2f2f35] hover:bg-[#f0f0f2]"
                        aria-label="Edit category"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={ () => handleDeleteCategory(entry.category) }
                        disabled={ isDeletingCategory }
                        className="h-8 w-8 border-[#e8b4b4] bg-white text-[#9f2727] hover:bg-[#ffecec]"
                        aria-label="Delete category"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#5d5d66]">
                    { entry.category.categoryDesc?.trim() ? entry.category.categoryDesc : "No category description yet." }
                  </p>
                  <div className="mt-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={ () => openAddTagDialog(entry.category.id) }
                      className="rounded-full bg-[#2f2f35] text-white hover:bg-[#17171c]"
                    >
                      <Plus className="mr-1 size-3.5" />
                      Add Tag
                    </Button>
                  </div>
                </header>

                <div className="space-y-4">
                  { entry.tags.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#d3d3d8] bg-white px-3 py-4 text-sm text-[#6a6a73]">
                      No tags yet for this category.
                    </p>
                  ) : (
                    entry.tags.map((tag) => (
                      <div key={ tag.id } className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Circle className="size-4 text-[#9a9aa2]" />
                            <p className="text-xl font-semibold text-[#2c2c32]">{ tag.tagName }</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={ () => openEditTagDialog(tag) }
                              className="h-8 w-8 border-[#c7c7cd] bg-white text-[#2f2f35] hover:bg-[#f0f0f2]"
                              aria-label="Edit tag"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={ () => handleDeleteTag(tag) }
                              disabled={ isDeletingTag }
                              className="h-8 w-8 border-[#e8b4b4] bg-white text-[#9f2727] hover:bg-[#ffecec]"
                              aria-label="Delete tag"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                        <TagPreview tagJson={ tag.tagJson } />
                      </div>
                    ))
                  ) }
                </div>
              </article>
            )) }
          </div>
        ) }
      </div>

      <Dialog open={ isCategoryDialogOpen } onOpenChange={ setIsCategoryDialogOpen }>
        <DialogContent className="border-[#d2d2d7] bg-[#f9f9fa] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-[#1f1f24]">{ editingCategory ? "Edit Category" : "Add Category" }</DialogTitle>
            <DialogDescription className="text-[#575761]">
              Category name and description are shown as group headings for poetry tags.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="categoryName" className="text-sm font-bold text-[#2b2b30]">Category name</label>
              <Input
                id="categoryName"
                value={ categoryName }
                onChange={ (event) => setCategoryName(event.target.value) }
                placeholder="Form, Theme, Structure..."
                className="border-[#d0d0d3] bg-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="categoryDesc" className="text-sm font-bold text-[#2b2b30]">Category description</label>
              <Textarea
                id="categoryDesc"
                value={ categoryDesc }
                onChange={ (event) => setCategoryDesc(event.target.value) }
                placeholder="Short description to explain the category"
                className="min-h-22 border-[#d0d0d3] bg-white"
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              className="bg-[#2f2f35] text-white hover:bg-[#17171c]"
              onClick={ handleSaveCategory }
              disabled={ isSavingCategory }
            >
              <Save className="mr-2 size-4" />
              { isSavingCategory ? "Saving..." : editingCategory ? "Update Category" : "Create Category" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ isTagDialogOpen } onOpenChange={ setIsTagDialogOpen }>
        <DialogContent className="grid-rows-[auto_minmax(0,1fr)_auto] w-[min(96vw,68rem)] max-h-[90vh] max-w-none overflow-hidden border-[#d2d2d7] bg-[#f9f9fa]">
          <DialogHeader>
            <DialogTitle className="text-[#1f1f24]">{ editingTag ? "Edit Tag" : "Add Tag" }</DialogTitle>
            <DialogDescription className="text-[#575761]">
              Enter the tag name and rich-text details for this category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="tagCategory" className="text-sm font-bold text-[#2b2b30]">Category</label>
                <Select value={ String(tagCategoryId) } onValueChange={ (value) => setTagCategoryId(Number(value)) }>
                  <SelectTrigger id="tagCategory" className="border-[#d0d0d3] bg-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    { categoryOptions.map((category) => (
                      <SelectItem key={ category.id } value={ String(category.id) }>
                        { category.categoryName }
                      </SelectItem>
                    )) }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="tagName" className="text-sm font-bold text-[#2b2b30]">Tag name</label>
                <Input
                  id="tagName"
                  value={ tagName }
                  onChange={ (event) => setTagName(event.target.value) }
                  placeholder="Sonnet, Metaphor, Iambic..."
                  className="border-[#d0d0d3] bg-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-bold text-[#2b2b30]">Tag details (TipTap)</p>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 rounded-xl border border-[#d0d0d3] bg-[#ededf0] p-2">
                  <ToolbarButton
                    label="Bold"
                    editor={ tagEditor }
                    active={ tagEditor?.isActive("bold") }
                    onClick={ () => tagEditor?.chain().focus().toggleBold().run() }
                  >
                    <Bold className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Italic"
                    editor={ tagEditor }
                    active={ tagEditor?.isActive("italic") }
                    onClick={ () => tagEditor?.chain().focus().toggleItalic().run() }
                  >
                    <Italic className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Underline"
                    editor={ tagEditor }
                    active={ tagEditor?.isActive("underline") }
                    onClick={ () => tagEditor?.chain().focus().toggleUnderline().run() }
                  >
                    <UnderlineIcon className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Bullet list"
                    editor={ tagEditor }
                    active={ tagEditor?.isActive("bulletList") }
                    onClick={ () => tagEditor?.chain().focus().toggleBulletList().run() }
                  >
                    <List className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Numbered list"
                    editor={ tagEditor }
                    active={ tagEditor?.isActive("orderedList") }
                    onClick={ () => tagEditor?.chain().focus().toggleOrderedList().run() }
                  >
                    <ListOrdered className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Add link"
                    editor={ tagEditor }
                    onClick={ () => {
                      if (!tagEditor) {
                        return;
                      }

                      const value = window.prompt("Enter URL", "https://");
                      if (!value) {
                        return;
                      }

                      tagEditor.chain().focus().setLink({ href: value }).run();
                    } }
                  >
                    <Link2 className="size-4" />
                  </ToolbarButton>
                  <ToolbarButton
                    label="Remove link"
                    editor={ tagEditor }
                    onClick={ () => tagEditor?.chain().focus().unsetLink().run() }
                  >
                    <Unlink className="size-4" />
                  </ToolbarButton>
                </div>

                <div className="rounded-2xl border border-[#d0d0d3] bg-white p-0.5 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1">
                  <EditorContent editor={ tagEditor } />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter showCloseButton className="border-t border-[#d7d7db] pt-4">
            <Button
              type="button"
              className="bg-[#2f2f35] text-white hover:bg-[#17171c]"
              onClick={ handleSaveTag }
              disabled={ isSavingTag }
            >
              <Save className="mr-2 size-4" />
              { isSavingTag ? "Saving..." : editingTag ? "Update Tag" : "Create Tag" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
