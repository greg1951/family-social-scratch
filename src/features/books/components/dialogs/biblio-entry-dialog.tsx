"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

import TipTapCommentEditor from "@/components/common/tiptap-comment-editor";
import TiptapRenderer from "@/components/discuss/tiptap-renderer";
import { BIBLIO_STATUS_OPTIONS } from "@/components/db/types/book-biblio";
import type { BookTagOption } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BiblioDraft, BiblioDialogMode } from "@/features/books/hooks/use-biblio-dialog";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

type BiblioEntryDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: BiblioDialogMode;
  draft: BiblioDraft;
  setDraft: (updater: (currentDraft: BiblioDraft) => BiblioDraft) => void;
  bookTags: BookTagOption[];
  isSaving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onToggleTag: (tagId: number, isChecked: boolean) => void;
};

function groupTagsByCategory(bookTags: BookTagOption[]) {
  const categories = new Map<number, { categoryId: number; categoryName: string; tags: BookTagOption[] }>();

  for (const tagOption of bookTags) {
    if (!tagOption.bookCategoryId) {
      continue;
    }

    if (tagOption.categoryName?.trim().toLowerCase() === "terms") {
      continue;
    }

    const existingCategory = categories.get(tagOption.bookCategoryId) ?? {
      categoryId: tagOption.bookCategoryId,
      categoryName: tagOption.categoryName?.trim() || `Category ${ tagOption.bookCategoryId }`,
      tags: [] as BookTagOption[],
    };

    existingCategory.tags.push(tagOption);
    categories.set(tagOption.bookCategoryId, existingCategory);
  }

  return [...categories.values()]
    .map((groupedCategory) => ({
      ...groupedCategory,
      tags: [...groupedCategory.tags].sort((leftTag, rightTag) => leftTag.tagName.localeCompare(rightTag.tagName)),
    }))
    .sort((leftCategory, rightCategory) => leftCategory.categoryName.localeCompare(rightCategory.categoryName));
}

export function BiblioEntryDialog({
  isOpen,
  onOpenChange,
  mode,
  draft,
  setDraft,
  bookTags,
  isSaving,
  onSave,
  onDelete,
  onToggleTag,
}: BiblioEntryDialogProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const isReadOnly = mode === "view";
  const groupedCategoryTags = groupTagsByCategory(bookTags);

  function handleDialogOpenChange(nextIsOpen: boolean) {
    if (!nextIsOpen) {
      setIsDeleteConfirmOpen(false);
    }

    onOpenChange(nextIsOpen);
  }

  return (
    <>
      <Dialog open={ isOpen } onOpenChange={ handleDialogOpenChange }>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#c9e2ec] bg-[#f8fcfe] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#183746]">
              { mode === "add" ? "Add Bibliography Entry" : mode === "edit" ? "Edit Bibliography Entry" : draft.bookTitle }
            </DialogTitle>
            <DialogDescription className="text-[#4a7388]">
              { isReadOnly
                ? "Details this family member recorded about the book they read."
                : "Track a book you have read. Public entries are visible to the rest of your family." }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 border-b border-[#d9e5ea] pb-4">
            { isReadOnly ? null : (
              <Button type="button" onClick={ onSave } disabled={ isSaving } className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]">
                { isSaving ? "Saving..." : "Save Entry" }
              </Button>
            ) }
            <Button type="button" variant="outline" onClick={ () => handleDialogOpenChange(false) } disabled={ isSaving } className="rounded-full">
              { isReadOnly ? "Close" : "Cancel" }
            </Button>
            { mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={ () => setIsDeleteConfirmOpen(true) }
                disabled={ isSaving }
                className="ml-auto rounded-full"
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null }
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="biblio-book-title" className="text-[#355161]">Book Title</Label>
                { isReadOnly ? (
                  <p className="text-sm font-semibold text-[#183746]">{ draft.bookTitle }</p>
                ) : (
                  <Input
                    id="biblio-book-title"
                    value={ draft.bookTitle }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookTitle: event.target.value })) }
                    className="border-[#c8d7df] bg-white text-[#183746]"
                  />
                ) }
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biblio-author-name" className="text-[#355161]">Author</Label>
                { isReadOnly ? (
                  <p className="text-sm text-[#355161]">{ draft.authorName }</p>
                ) : (
                  <Input
                    id="biblio-author-name"
                    value={ draft.authorName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, authorName: event.target.value })) }
                    className="border-[#c8d7df] bg-white text-[#183746]"
                  />
                ) }
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biblio-published-year" className="text-[#355161]">Published Year</Label>
                { isReadOnly ? (
                  <p className="text-sm text-[#355161]">{ draft.publishedYear || "—" }</p>
                ) : (
                  <Input
                    id="biblio-published-year"
                    type="number"
                    min={ 1 }
                    max={ 9999 }
                    step={ 1 }
                    value={ draft.publishedYear }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, publishedYear: event.target.value.replace(/\D/g, "").slice(0, 4) })) }
                    className="border-[#c8d7df] bg-white text-[#183746]"
                  />
                ) }
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biblio-series-name" className="text-[#355161]">Book Series</Label>
                { isReadOnly ? (
                  <p className="text-sm text-[#355161]">{ draft.bookSeriesName || "—" }</p>
                ) : (
                  <Input
                    id="biblio-series-name"
                    value={ draft.bookSeriesName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookSeriesName: event.target.value })) }
                    className="border-[#c8d7df] bg-white text-[#183746]"
                  />
                ) }
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biblio-read-year" className="text-[#355161]">Year Read</Label>
                { isReadOnly ? (
                  <p className="text-sm text-[#355161]">{ draft.readYear || "—" }</p>
                ) : (
                  <Input
                    id="biblio-read-year"
                    type="number"
                    min={ 1 }
                    max={ 9999 }
                    step={ 1 }
                    value={ draft.readYear }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, readYear: event.target.value.replace(/\D/g, "").slice(0, 4) })) }
                    className="border-[#c8d7df] bg-white text-[#183746]"
                  />
                ) }
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="biblio-rating" className="text-[#355161]">Rating</Label>
                { isReadOnly ? (
                  <p className="text-sm text-[#355161]">{ draft.rating > 0 ? `${ draft.rating } / 5` : "Not rated" }</p>
                ) : (
                  <select
                    id="biblio-rating"
                    value={ String(draft.rating) }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, rating: Number(event.target.value) })) }
                    className="h-9 w-full rounded-md border border-[#c8d7df] bg-white px-3 text-sm text-[#183746]"
                  >
                    <option value="0">Not rated</option>
                    { RATING_OPTIONS.map((ratingOption) => (
                      <option key={ ratingOption } value={ String(ratingOption) }>{ ratingOption } / 5</option>
                    )) }
                  </select>
                ) }
              </div>

              { isReadOnly ? null : (
                <div className="space-y-1.5">
                  <Label htmlFor="biblio-status" className="text-[#355161]">Status</Label>
                  <select
                    id="biblio-status"
                    value={ draft.status }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, status: event.target.value })) }
                    className="h-9 w-full rounded-md border border-[#c8d7df] bg-white px-3 text-sm text-[#183746]"
                  >
                    { BIBLIO_STATUS_OPTIONS.map((statusOption) => (
                      <option key={ statusOption.value } value={ statusOption.value }>{ statusOption.label }</option>
                    )) }
                  </select>
                </div>
              ) }
            </div>

            <div className="space-y-2">
              <Label className="text-[#355161]">Synopsis</Label>
              { isReadOnly ? (
                <div className="rounded-2xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
                  <TiptapRenderer contentJson={ draft.summaryJson } />
                </div>
              ) : (
                <TipTapCommentEditor
                  value={ draft.summaryJson }
                  onChange={ (nextValue) => setDraft((currentDraft) => ({ ...currentDraft, summaryJson: nextValue })) }
                  placeholder="What is this book about?"
                  disabled={ isSaving }
                  enableLinks
                />
              ) }
            </div>

            <div className="space-y-2">
              <Label className="text-[#355161]">My Comments</Label>
              { isReadOnly ? (
                <div className="rounded-2xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
                  <TiptapRenderer contentJson={ draft.commentsJson } />
                </div>
              ) : (
                <TipTapCommentEditor
                  value={ draft.commentsJson }
                  onChange={ (nextValue) => setDraft((currentDraft) => ({ ...currentDraft, commentsJson: nextValue })) }
                  placeholder="Your personal notes about this book."
                  disabled={ isSaving }
                  enableLinks
                />
              ) }
            </div>

            <div className="space-y-3 rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#3d819b]">Book Tags</p>

              { isReadOnly ? (
                <div className="flex flex-wrap gap-2">
                  { draft.selectedTagIds.length === 0 ? (
                    <p className="text-sm text-[#51707e]">No tags were selected.</p>
                  ) : (
                    bookTags
                      .filter((tagOption) => draft.selectedTagIds.includes(tagOption.id))
                      .map((tagOption) => (
                        <span key={ tagOption.id } className="rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-semibold text-[#2a5a6f]">
                          { tagOption.tagName }
                        </span>
                      ))
                  ) }
                </div>
              ) : (
                <div className="space-y-3">
                  { groupedCategoryTags.map((groupedCategory) => (
                    <div key={ groupedCategory.categoryId }>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#51707e]">{ groupedCategory.categoryName }</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                        { groupedCategory.tags.map((tagOption) => (
                          <label key={ tagOption.id } className="flex items-center gap-2 text-sm text-[#355161]">
                            <Checkbox
                              checked={ draft.selectedTagIds.includes(tagOption.id) }
                              onCheckedChange={ (checkedState) => onToggleTag(tagOption.id, checkedState === true) }
                            />
                            { tagOption.tagName }
                          </label>
                        )) }
                      </div>
                    </div>
                  )) }
                </div>
              ) }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={ isDeleteConfirmOpen } onOpenChange={ setIsDeleteConfirmOpen }>
        <DialogContent className="border-red-200 bg-[#f8fcfe] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700">Are you sure?</DialogTitle>
            <DialogDescription className="text-[#4a7388]">
              This permanently removes this book from your bibliography. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => setIsDeleteConfirmOpen(false) } disabled={ isSaving }>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={ () => { setIsDeleteConfirmOpen(false); onDelete(); } }
              disabled={ isSaving }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
