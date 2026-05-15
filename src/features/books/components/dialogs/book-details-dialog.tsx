import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { Heart, MessageSquare, Save, Tags, X } from "lucide-react";

import type { BookTagOption } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextField } from "@/features/books/components/book-rich-text-field";
import { useBookDialog } from "@/features/books/hooks/use-book-dialog";
import { useLinkDialog } from "@/features/books/hooks/use-link-dialog";

type CategoryTagOption = {
  seqNo: number;
  categoryName: string;
  qualifierOptions: BookTagOption[];
};

type BookDialogTags = {
  selectedBookTags: BookTagOption[];
  activeBookTags: BookTagOption[];
  categoryTagOptions: CategoryTagOption[];
};

type BookDialogEngagement = {
  isEngaging: boolean;
  commentText: string;
  setCommentText: (value: string) => void;
  onToggleLike: () => void;
  onAddComment: () => void;
};

type BookDialogSave = {
  onSave: () => void;
};

type BookDetailsDialogProps = {
  bookDialog: ReturnType<typeof useBookDialog>;
  linkDialog: ReturnType<typeof useLinkDialog>;
  analysisEditor: Editor | null;
  tags: BookDialogTags;
  engagement: BookDialogEngagement;
  save: BookDialogSave;
  formatCreatedAt: (createdAt: Date) => string;
};

export function BookDetailsDialog({
  bookDialog,
  linkDialog,
  analysisEditor,
  tags,
  engagement,
  save,
  formatCreatedAt,
}: BookDetailsDialogProps) {
  const { draft, setDraft } = bookDialog;
  const { selectedBookTags, activeBookTags, categoryTagOptions } = tags;
  const { isEngaging, commentText, setCommentText, onToggleLike, onAddComment } = engagement;

  return (
    <Dialog open={ bookDialog.isBookDialogOpen } onOpenChange={ bookDialog.setIsBookDialogOpen }>
      <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-[#183746]">
            { bookDialog.bookDialogMode === "add" ? "Add a New Book" : draft.bookTitle || "Book Details" }
          </DialogTitle>
          <DialogDescription className="text-[#51707e]">
            { bookDialog.bookDialogMode === "add"
              ? "Fill in the book details and analysis, then save."
              : bookDialog.bookDialogMode === "edit"
                ? "Update the book details and analysis, then save."
                : "Read book details, analysis, tags, and family reactions." }
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[85vh] space-y-4 overflow-auto pr-1">
          { bookDialog.bookDialogMode !== "view" ? (
            <div className="rounded-2xl border border-[#bdd9e8] bg-[#edf7fb] px-4 py-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#2d5a6f]">
                  { bookDialog.bookDialogMode === "add" ? "Enter details for the new book submission." : "You are editing this book submission." }
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ bookDialog.handleCancelDialog }
                    disabled={ bookDialog.isSaving }
                    className="rounded-full border-[#c8d7df] text-[#3d5c6d]"
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={ save.onSave }
                    disabled={ bookDialog.isSaving }
                    className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                  >
                    <Save className="size-4" />
                    { bookDialog.isSaving ? "Saving..." : "Save Book" }
                  </Button>
                </div>
              </div>
            </div>
          ) : null }

          <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#42748a]">Book Details</p>
                { bookDialog.bookDialogMode === "view" ? (
                  <p className="mt-1 text-sm text-[#355161]">
                    { draft.bookTitle } by { draft.authorName } ({ draft.bookYear || "Unknown year" }) &middot; { draft.bookLanguage }
                    { draft.bookSeriesName.trim() ? ` · Series: ${ draft.bookSeriesName.trim() }` : "" }
                  </p>
                ) : null }
              </div>
              { bookDialog.bookDialogMode === "view" ? (
                <p className="text-xs uppercase tracking-[0.16em] text-[#5d8aa0]">
                  Added { formatCreatedAt(draft.createdAt) }
                </p>
              ) : null }
            </div>

            { bookDialog.bookDialogMode !== "view" ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Name</label>
                  <Input
                    value={ draft.bookTitle }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookTitle: event.target.value })) }
                    placeholder="Enter the book title"
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Author Name</label>
                  <Input
                    value={ draft.authorName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, authorName: event.target.value })) }
                    placeholder="Enter the author name"
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Publication Year</label>
                  <Input
                    value={ draft.bookYear }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookYear: event.target.value })) }
                    placeholder="e.g. 1965"
                    inputMode="numeric"
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Language</label>
                  <Input
                    value={ draft.bookLanguage }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookLanguage: event.target.value })) }
                    placeholder="e.g. English"
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Series Name</label>
                  <Input
                    value={ draft.bookSeriesName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookSeriesName: event.target.value })) }
                    placeholder="Enter optional book series name if book is in a series"
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
              </div>
            ) : null }
          </div>

          <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#42748a]">Book Analysis</p>
            { bookDialog.bookDialogMode === "view" ? (
              <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#c8d7df] bg-white px-4 py-4 [&_.tiptap]:text-[#183746] [&_.tiptap]:outline-none [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#7eb2c7] [&_.tiptap_blockquote]:pl-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5">
                <EditorContent editor={ analysisEditor } />
              </div>
            ) : (
              <div className="mt-3">
                <RichTextField
                  editor={ analysisEditor }
                  minHeightClass="min-h-[14rem]"
                  onSetLink={ linkDialog.openLinkDialog }
                />
              </div>
            ) }
          </div>

          <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#355161]">Book Tags</p>
              <div className="inline-flex items-center rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#2f6a80]">
                <Tags className="mr-2 size-3.5" />
                { bookDialog.bookDialogMode === "view"
                  ? `${ selectedBookTags.length } tag${ selectedBookTags.length !== 1 ? "s" : "" }`
                  : `${ draft.selectedTagIds.length } / 3 selected` }
              </div>
            </div>

            { bookDialog.bookDialogMode === "view" ? (
              selectedBookTags.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#51707e]">
                  This book has no tags selected yet.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  { selectedBookTags.map((tagOption) => (
                    <span
                      key={ tagOption.id }
                      className="inline-flex items-center rounded-full border border-[#b8d4df] bg-white px-3 py-1 text-xs font-semibold text-[#355161]"
                    >
                      { tagOption.tagName }
                    </span>
                  )) }
                </div>
              )
            ) : (
              activeBookTags.length === 0 ? (
                <p className="mt-3 rounded-3xl border border-dashed border-[#c8d7df] bg-white px-4 py-3 text-sm text-[#51707e]">
                  No book tag options are loaded yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-[#51707e]">Choose 1-3 tags across Fiction, Non-Fiction, and Other.</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    { categoryTagOptions.map((categoryTagOption) => {
                      const selectedTagId = bookDialog.getSelectedTagForCategory(categoryTagOption.seqNo, activeBookTags);

                      return (
                        <div key={ categoryTagOption.seqNo } className="space-y-2 rounded-2xl border border-[#d7e4ea] bg-white p-3">
                          <label className="text-sm font-semibold text-[#355161]">
                            { categoryTagOption.categoryName }
                          </label>
                          <Select
                            value={ selectedTagId ? String(selectedTagId) : "none" }
                            onValueChange={ (value) => bookDialog.handleCategoryTagSelect(categoryTagOption.seqNo, value, activeBookTags) }
                          >
                            <SelectTrigger className="border-[#c8d7df] text-[#183746]">
                              <SelectValue placeholder={ `Select ${ categoryTagOption.categoryName } tag` } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No selection</SelectItem>
                              <SelectGroup>
                                <SelectLabel>Category</SelectLabel>
                                <SelectItem value={ `category-${ categoryTagOption.seqNo }` } disabled>
                                  { categoryTagOption.categoryName }
                                </SelectItem>
                              </SelectGroup>
                              { categoryTagOption.qualifierOptions.length > 0 ? (
                                <SelectGroup>
                                  <SelectLabel>Qualifiers</SelectLabel>
                                  { categoryTagOption.qualifierOptions.map((tagOption) => (
                                    <SelectItem key={ tagOption.id } value={ String(tagOption.id) }>
                                      { tagOption.tagName }
                                    </SelectItem>
                                  )) }
                                </SelectGroup>
                              ) : null }
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }) }
                  </div>
                </div>
              )
            ) }
          </div>

          { bookDialog.bookDialogMode === "view" ? (
            <div className="space-y-3 rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#355161]">Family Comments</p>
                  <p className="text-sm text-[#51707e]">Share your thoughts on this book with your family.</p>
                </div>
                <div className="inline-flex items-center rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#2f6a80]">
                  <MessageSquare className="mr-2 size-3.5" />
                  { draft.commentCount } comments
                </div>
              </div>

              <div className="rounded-[1.15rem] border border-[#d9e5ea] bg-white px-3 py-3">
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  <Button
                    type="button"
                    onClick={ onToggleLike }
                    disabled={ isEngaging }
                    className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                  >
                    <Heart className={ `size-4 ${ draft.likedByMember ? "fill-white" : "" }` } />
                    { draft.likedByMember ? "Unlike" : "Like" }
                  </Button>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#355161]">
                    <Heart className="size-4 text-[#c06c4a]" />
                    { draft.likesCount.toLocaleString() }
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]" htmlFor="book-comment-input">Add Comment</label>
                  <textarea
                    id="book-comment-input"
                    value={ commentText }
                    onChange={ (event) => setCommentText(event.target.value) }
                    placeholder="What stood out to you about this book?"
                    disabled={ isEngaging }
                    className="min-h-24 w-full rounded-xl border border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#183746] outline-none transition focus-visible:ring-2 focus-visible:ring-[#3d819b]"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={ onAddComment }
                      disabled={ isEngaging || commentText.trim().length < 2 }
                      className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                { draft.bookComments.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#51707e]">
                    No comments yet. Be the first family member to add one.
                  </p>
                ) : (
                  draft.bookComments.map((bookComment) => (
                    <article key={ bookComment.id } className="rounded-2xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
                      <p className="whitespace-pre-wrap leading-6">{ bookComment.text || "(No text in comment)" }</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#5d8aa0]">
                        { bookComment.commenterName } · { formatCreatedAt(bookComment.createdAt) }
                      </p>
                    </article>
                  ))
                ) }
              </div>
            </div>
          ) : null }
        </div>
      </DialogContent>
    </Dialog>
  );
}
