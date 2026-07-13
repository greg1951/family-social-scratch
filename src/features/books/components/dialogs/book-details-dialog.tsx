import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { Heart, MessageSquare, Save, Tags, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import TipTapCommentEditor from "@/components/common/tiptap-comment-editor";
import TiptapRenderer from "@/components/discuss/tiptap-renderer";
import type { BookTagOption } from "@/components/db/types/books";
import {
  isSerializedTipTapDocumentEmpty,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { RichTextField } from "@/features/books/components/book-rich-text-field";
import { useBookDialog } from "@/features/books/hooks/use-book-dialog";
import { useLinkDialog } from "@/features/books/hooks/use-link-dialog";

type BookDialogTags = {
  selectedBookTags: BookTagOption[];
  activeBookTags: BookTagOption[];
};

type BookDialogEngagement = {
  isEngaging: boolean;
  canEngage: boolean;
  commentText: string;
  setCommentText: (value: string) => void;
  onToggleReaction: (reactionType: -1 | 1 | 2) => void;
  onAddComment: () => void;
};

type BookDialogSave = {
  onSave: () => void;
  onDelete?: () => void;
};

type BookDetailsDialogProps = {
  bookDialog: ReturnType<typeof useBookDialog>;
  linkDialog: ReturnType<typeof useLinkDialog>;
  analysisEditor: Editor | null;
  member: MemberKeyDetails;
  tags: BookDialogTags;
  engagement: BookDialogEngagement;
  save: BookDialogSave;
  formatCreatedAt: (createdAt: Date) => string;
};

function ReactionMemberHoverCard({
  icon,
  count,
  memberNames,
  triggerClassName,
  textClassName,
  emptyLabel,
}: {
  icon: React.ReactNode;
  count: number;
  memberNames: string[];
  triggerClassName: string;
  textClassName?: string;
  emptyLabel: string;
}) {
  return (
    <HoverCard openDelay={ 120 } closeDelay={ 100 }>
      <HoverCardTrigger asChild>
        <span className={ `inline-flex cursor-default items-center gap-1.5 text-sm font-semibold ${ triggerClassName } ${ textClassName ?? "" }` }>
          { icon }
          { count.toLocaleString() }
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="font-app w-56 border-[#c8d7df] bg-white text-xs text-[#355161]">
        <p className="font-semibold text-[#183746]">{ emptyLabel }</p>
        { memberNames.length > 0 ? (
          <ul className="mt-2 space-y-1">
            { memberNames.map((memberName) => (
              <li key={ memberName }>{ memberName }</li>
            )) }
          </ul>
        ) : (
          <p className="mt-2 text-[#51707e]">No family members yet.</p>
        ) }
      </HoverCardContent>
    </HoverCard>
  );
}

function extractTipTapText(content: unknown): string {
  const parsed = extractTipTapTextFromNode(content);

  return parsed.replace(/\s+/g, " ").trim();
}

function extractTipTapTextFromNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const candidate = node as {
    text?: string;
    content?: unknown[];
  };

  let text = "";

  if (typeof candidate.text === "string") {
    text += candidate.text;
  }

  if (Array.isArray(candidate.content)) {
    text += candidate.content.map((childNode) => extractTipTapTextFromNode(childNode)).join(" ");
  }

  return text;
}

export function BookDetailsDialog({
  bookDialog,
  linkDialog,
  analysisEditor,
  member,
  tags,
  engagement,
  save,
  formatCreatedAt,
}: BookDetailsDialogProps) {
  const { draft, setDraft } = bookDialog;
  const { selectedBookTags, activeBookTags } = tags;
  const { isEngaging, canEngage, commentText, setCommentText, onToggleReaction, onAddComment } = engagement;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const isEditing = bookDialog.bookDialogMode === "edit";
  const isOwner = draft.memberId === member.memberId;
  const canModerate = isOwner || member.isFounder;
  const isFounderModerating = isEditing && member.isFounder && !isOwner;

  useEffect(() => {
    if (analysisEditor) {
      analysisEditor.setEditable(!isFounderModerating);
    }
  }, [analysisEditor, isFounderModerating]);

  const tagsByCategory = activeBookTags.reduce((categories, tagOption) => {
    if (!tagOption.bookCategoryId) {
      return categories;
    }

    const existingCategory = categories.get(tagOption.bookCategoryId) ?? {
      categoryId: tagOption.bookCategoryId,
      categoryName: tagOption.categoryName?.trim() || `Category ${ tagOption.bookCategoryId }`,
      tags: [] as BookTagOption[],
    };

    existingCategory.tags.push(tagOption);
    categories.set(tagOption.bookCategoryId, existingCategory);

    return categories;
  }, new Map<number, { categoryId: number; categoryName: string; tags: BookTagOption[] }>());

  const groupedCategoryTags = Array.from(tagsByCategory.values())
    .map((groupedCategory) => ({
      ...groupedCategory,
      tags: [...groupedCategory.tags].sort((leftTag, rightTag) => leftTag.tagName.localeCompare(rightTag.tagName)),
    }))
    .sort((leftCategory, rightCategory) => leftCategory.categoryName.localeCompare(rightCategory.categoryName));

  function getTagDescriptionText(tagJson?: string | null) {
    const parsedTagJson = parseSerializedTipTapDocument(tagJson ?? undefined);

    if (!parsedTagJson.success) {
      return "No tag description available.";
    }

    const tagDescriptionText = extractTipTapText(parsedTagJson.content);

    return tagDescriptionText || "No tag description available.";
  }

  return (
    <>
      <Dialog open={bookDialog.isBookDialogOpen} onOpenChange={bookDialog.setIsBookDialogOpen}>
      <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-6xl">
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

                  { isEditing && canModerate ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={ () => {
                          const newStatus = draft.status === "archived" ? "published" : "archived";
                          setDraft((currentDraft) => ({ ...currentDraft, status: newStatus }));
                          if (isFounderModerating) {
                            // For founders, create a temporary draft with the new status and save it
                            const updatedDraft = { ...draft, status: newStatus };
                            const serializedAnalysis = analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson;
                            bookDialog.handleSave(serializedAnalysis, updatedDraft);
                          }
                        } }
                        disabled={ bookDialog.isSaving }
                        className="rounded-full border-[#c8d7df] text-[#3d5c6d]"
                      >
                        { draft.status === "archived" ? "Unarchive" : "Archive" }
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={ () => setIsDeleteConfirmOpen(true) }
                        disabled={ bookDialog.isSaving }
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    </>
                  ) : null }

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
              ) : !isFounderModerating ? (
                <Button
                  type="button"
                  onClick={ save.onSave }
                  disabled={ bookDialog.isSaving }
                  className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                >
                  <Save className="size-4" />
                  { bookDialog.isSaving ? "Saving..." : "Save Book" }
                </Button>
              ) : null }
            </div>

            { bookDialog.bookDialogMode !== "view" ? (
              <>
                { isFounderModerating && (
                  <div className="mb-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-900">
                    <p className="text-sm font-medium">
                      As the family founder, you can archive this book if it doesn&apos;t follow guidelines. However, only the original author can edit their own posts.
                    </p>
                  </div>
                ) }

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Name</label>
                  <Input
                    value={ draft.bookTitle }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookTitle: event.target.value })) }
                    placeholder="Enter the book title"
                    disabled={ isFounderModerating }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Author Name</label>
                  <Input
                    value={ draft.authorName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, authorName: event.target.value })) }
                    placeholder="Enter the author name"
                    disabled={ isFounderModerating }
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
                    disabled={ isFounderModerating }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Language</label>
                  <Input
                    value={ draft.bookLanguage }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookLanguage: event.target.value })) }
                    placeholder="e.g. English"
                    disabled={ isFounderModerating }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Series Name</label>
                  <Input
                    value={ draft.bookSeriesName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookSeriesName: event.target.value })) }
                    placeholder="Enter optional book series name if book is in a series"
                    disabled={ isFounderModerating }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Status</label>
                  <Select
                    value={ draft.status }
                    onValueChange={ (nextStatus) => setDraft((currentDraft) => ({ ...currentDraft, status: nextStatus })) }
                    disabled={ isFounderModerating }
                  >
                    <SelectTrigger className="w-full border-[#c8d7df] text-[#183746]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </>
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
                  : `${ draft.selectedTagIds.length } selected` }
              </div>
            </div>

            { bookDialog.bookDialogMode === "view" ? (
              selectedBookTags.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#51707e]">
                  This book has no tags selected yet.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  { groupedCategoryTags
                    .map((categoryGroup) => ({
                      ...categoryGroup,
                      selectedTags: categoryGroup.tags.filter((tagOption) => selectedBookTags.some((selectedTag) => selectedTag.id === tagOption.id)),
                    }))
                    .filter((categoryGroup) => categoryGroup.selectedTags.length > 0)
                    .map((categoryGroup) => (
                      <div key={ categoryGroup.categoryId } className="rounded-2xl border border-[#d7e4ea] bg-white p-3">
                        <p className="text-sm font-semibold text-[#355161]">{ categoryGroup.categoryName }</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          { categoryGroup.selectedTags.map((tagOption) => (
                            <span
                              key={ tagOption.id }
                              className="inline-flex items-center rounded-full border border-[#b8d4df] bg-[#f9fcff] px-3 py-1 text-xs font-semibold text-[#355161]"
                            >
                              { tagOption.tagName }
                            </span>
                          )) }
                        </div>
                      </div>
                    )) }
                </div>
              )
            ) : (
              groupedCategoryTags.length === 0 ? (
                <p className="mt-3 rounded-3xl border border-dashed border-[#c8d7df] bg-white px-4 py-3 text-sm text-[#51707e]">
                  No book tag options are loaded yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-[#51707e]">Choose one or more tags by category.</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    { groupedCategoryTags.map((categoryGroup) => (
                      <div key={ categoryGroup.categoryId } className="space-y-2 rounded-2xl border border-[#d7e4ea] bg-white p-3">
                        <p className="text-sm font-semibold text-[#355161]">{ categoryGroup.categoryName }</p>
                        <div className="grid grid-cols-2 gap-2">
                          { categoryGroup.tags.map((tagOption) => {
                            const isSelected = draft.selectedTagIds.includes(tagOption.id);

                            return (
                              <div key={ tagOption.id } className="rounded-xl border border-[#dfebf0] bg-[#fcfeff] px-3 py-2">
                                <div className="flex items-start gap-2">
                                  <Checkbox
                                    id={ `book-tag-${ tagOption.id }` }
                                    checked={ isSelected }
                                    onCheckedChange={ (checked) => bookDialog.handleToggleTag(tagOption.id, Boolean(checked)) }
                                    disabled={ bookDialog.isSaving }
                                    className="mt-0.5 border-[#9ec3d2] data-[state=checked]:bg-[#0f5c78] data-[state=checked]:text-white"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <label htmlFor={ `book-tag-${ tagOption.id }` } className="cursor-pointer text-xs font-semibold text-[#2f5668]">
                                      { tagOption.tagName }
                                    </label>
                                    <Accordion type="single" collapsible className="mt-1 w-full">
                                      <AccordionItem value={ `tag-${ tagOption.id }` } className="border-0">
                                        <AccordionTrigger className="py-1 text-[11px] text-[#387892] hover:no-underline">
                                          View tag description
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-0">
                                          <Textarea
                                            readOnly
                                            value={ getTagDescriptionText(tagOption.tagJson) }
                                            className="min-h-24 border-[#c8d7df] bg-[#f5fbfe] text-xs leading-5 text-[#355161]"
                                          />
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </div>
                                </div>
                              </div>
                            );
                          }) }
                        </div>
                      </div>
                    )) }
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
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                  { canEngage ? (
                    <>
                      <Button
                        type="button"
                        onClick={ () => onToggleReaction(-1) }
                        disabled={ isEngaging }
                        className={ `rounded-full ${ draft.userReactionType === -1
                          ? "bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                          : "border border-[#c8d7df] bg-white text-[#355161] hover:bg-[#edf7fb]" }` }
                      >
                        <ThumbsDown className="size-4" />
                        Dislike
                      </Button>
                      <Button
                        type="button"
                        onClick={ () => onToggleReaction(1) }
                        disabled={ isEngaging }
                        className={ `rounded-full ${ draft.userReactionType === 1
                          ? "bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                          : "border border-[#c8d7df] bg-white text-[#355161] hover:bg-[#edf7fb]" }` }
                      >
                        <ThumbsUp className="size-4" />
                        Like
                      </Button>
                      <Button
                        type="button"
                        onClick={ () => onToggleReaction(2) }
                        disabled={ isEngaging }
                        className={ `rounded-full ${ draft.userReactionType === 2
                          ? "bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                          : "border border-[#c8d7df] bg-white text-[#355161] hover:bg-[#edf7fb]" }` }
                      >
                        <Heart className={ `size-4 ${ draft.userReactionType === 2 ? "fill-white" : "" }` } />
                        Love
                      </Button>
                    </>
                  ) : null }
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <ReactionMemberHoverCard
                      icon={ <ThumbsDown className="size-4 text-[#5d7c8a]" /> }
                      count={ draft.dislikeCount ?? 0 }
                      memberNames={ draft.dislikeMemberNames ?? [] }
                      triggerClassName="text-[#355161]"
                      emptyLabel="Family members who disliked this book"
                    />
                    <ReactionMemberHoverCard
                      icon={ <ThumbsUp className="size-4 text-[#1d6d8f]" /> }
                      count={ draft.likeCount ?? 0 }
                      memberNames={ draft.likeMemberNames ?? [] }
                      triggerClassName="text-[#355161]"
                      emptyLabel="Family members who liked this book"
                    />
                    <ReactionMemberHoverCard
                      icon={ <Heart className="size-4 text-[#c06c4a]" /> }
                      count={ draft.loveCount ?? 0 }
                      memberNames={ draft.loveMemberNames ?? [] }
                      triggerClassName="text-[#355161]"
                      emptyLabel="Family members who loved this book"
                    />
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
                      <TiptapRenderer contentJson={ bookComment.commentJson } />
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#5d8aa0]">
                        { bookComment.commenterName } · { formatCreatedAt(bookComment.createdAt) }
                      </p>
                    </article>
                  ))
                ) }
              </div>

              { canEngage ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]" htmlFor="book-comment-input">Add Comment</label>
                  <div id="book-comment-input">
                    <TipTapCommentEditor
                      value={ commentText }
                      onChange={ setCommentText }
                      placeholder="What stood out to you about this book?"
                      disabled={ isEngaging }
                      toolbarClassName="border-[#c8d7df] bg-[#edf7fb]"
                      editorClassName="border-[#c8d7df] text-[#183746]"
                      buttonClassName="border-[#b9ccd5] text-[#355161]"
                      activeButtonClassName="border-[#0f5c78] bg-[#d9edf5] text-[#183746]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={ onAddComment }
                      disabled={ isEngaging || isSerializedTipTapDocumentEmpty(commentText) }
                      className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              ) : null }
            </div>
          ) : null }
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
      <DialogContent className="border-red-200 bg-[#f8fcfe] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-700">Are you sure?</DialogTitle>
          <DialogDescription className="text-[#4a7388]">
            This permanently deletes the book and its discussion thread. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={bookDialog.isSaving}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={() => { setIsDeleteConfirmOpen(false); save.onDelete?.(); }} disabled={bookDialog.isSaving}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
