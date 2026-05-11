import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveBooksHomeBookAction } from "@/app/(features)/(books)/books/actions";
import { BookTagOption, BooksHomeBook } from "@/components/db/types/books";
import { createEmptyTipTapDocument } from "@/components/db/types/poem-term-validation";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

export type BookDraft = {
  id: number;
  bookTitle: string;
  authorName: string;
  bookLanguage: string;
  bookYear: string;
  submitterName: string;
  likesCount: number;
  commentCount: number;
  likedByMember: boolean;
  memberId: number;
  familyId: number;
  status: string;
  createdAt: Date;
  analysisJson: string;
  selectedTagIds: number[];
  discussionThreads: BooksHomeBook["discussionThreads"];
  hasDiscussionThread: boolean;
  bookComments: Array<{
    id: number;
    createdAt: Date;
    commenterName: string;
    text: string;
  }>;
};

export type BookDialogMode = "view" | "edit" | "add";
export type SavePhase = "idle" | "saving" | "saved" | "error";

function getSeqNoRange(seqNo: number) {
  const rangeStart = Math.floor(seqNo / 10) * 10;

  return {
    rangeStart,
    rangeEnd: rangeStart + 9,
  };
}

function createSubmitterLabel(bookRecord: BooksHomeBook, member: MemberKeyDetails) {
  if (bookRecord.submitterName) {
    return bookRecord.submitterName;
  }

  if (bookRecord.memberId === member.memberId) {
    return `${ member.firstName } ${ member.lastName }`;
  }

  return `Member #${ bookRecord.memberId }`;
}

export function createDraftFromBook(bookRecord: BooksHomeBook, member: MemberKeyDetails): BookDraft {
  const summaryComments = bookRecord.bookComments ?? [];

  return {
    id: bookRecord.id,
    bookTitle: bookRecord.bookTitle,
    authorName: bookRecord.authorName,
    bookLanguage: bookRecord.bookLanguage,
    bookYear: bookRecord.bookYear ? String(bookRecord.bookYear) : "",
    submitterName: createSubmitterLabel(bookRecord, member),
    likesCount: bookRecord.likesCount ?? 0,
    commentCount: summaryComments.length,
    likedByMember: bookRecord.likedByMember ?? false,
    memberId: bookRecord.memberId,
    familyId: bookRecord.familyId,
    status: bookRecord.status,
    createdAt: new Date(bookRecord.createdAt),
    analysisJson: bookRecord.analysisJson ?? JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: bookRecord.selectedTagIds ?? [],
    discussionThreads: bookRecord.discussionThreads ?? [],
    hasDiscussionThread: bookRecord.hasDiscussionThread ?? false,
    bookComments: summaryComments,
  };
}

export function createEmptyDraft(member: MemberKeyDetails): BookDraft {
  return {
    id: -Date.now(),
    bookTitle: "",
    authorName: "",
    bookLanguage: "English",
    bookYear: "",
    submitterName: `${ member.firstName } ${ member.lastName }`,
    likesCount: 0,
    commentCount: 0,
    likedByMember: false,
    memberId: member.memberId,
    familyId: member.familyId,
    status: "draft",
    createdAt: new Date(),
    analysisJson: JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: [],
    discussionThreads: [],
    hasDiscussionThread: false,
    bookComments: [],
  };
}

type UseBookDialogParams = {
  initialDraft: BookDraft;
  member: MemberKeyDetails;
  selectedBook: BookDraft | null;
  canEditSelected: boolean;
  onBookSaved: (savedBook: BookDraft) => void;
};

export function useBookDialog({
  initialDraft,
  member,
  selectedBook,
  canEditSelected,
  onBookSaved,
}: UseBookDialogParams) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [bookDialogMode, setBookDialogMode] = useState<BookDialogMode>("view");
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [draft, setDraft] = useState<BookDraft>(initialDraft);

  function getSelectedTagForCategory(categorySeqNo: number, activeBookTags: BookTagOption[]) {
    const categoryRange = getSeqNoRange(categorySeqNo);

    return draft.selectedTagIds.find((selectedTagId) => {
      const tagOption = activeBookTags.find((candidateTag) => candidateTag.id === selectedTagId);

      if (!tagOption) {
        return false;
      }

      return tagOption.seqNo >= categoryRange.rangeStart && tagOption.seqNo <= categoryRange.rangeEnd;
    });
  }

  function handleCategoryTagSelect(categorySeqNo: number, selectedValue: string, activeBookTags: BookTagOption[]) {
    const categoryRange = getSeqNoRange(categorySeqNo);
    const nextTagId = selectedValue === "none" ? null : Number(selectedValue);

    setDraft((currentDraft) => {
      const nextSelectedTagIds = currentDraft.selectedTagIds.filter((selectedTagId) => {
        const tagOption = activeBookTags.find((candidateTag) => candidateTag.id === selectedTagId);

        if (!tagOption) {
          return false;
        }

        return !(tagOption.seqNo >= categoryRange.rangeStart && tagOption.seqNo <= categoryRange.rangeEnd);
      });

      if (nextTagId === null) {
        return {
          ...currentDraft,
          selectedTagIds: nextSelectedTagIds,
        };
      }

      if (nextSelectedTagIds.length >= 3) {
        toast.error("Select no more than three book tags.");
        return currentDraft;
      }

      return {
        ...currentDraft,
        selectedTagIds: [...nextSelectedTagIds, nextTagId],
      };
    });
  }

  function openBookDialog(mode: BookDialogMode) {
    if (mode !== "add" && !selectedBook) {
      return;
    }

    if (mode === "edit" && !canEditSelected) {
      toast.error("Only the book submitter or an admin can edit this book.");
      return;
    }

    if (mode === "add") {
      setDraft(createEmptyDraft(member));
    } else {
      setDraft({ ...selectedBook! });
    }

    setSavePhase("idle");
    setBookDialogMode(mode);
    setIsBookDialogOpen(true);
  }

  function handleCancelDialog() {
    setIsBookDialogOpen(false);
  }

  function handleSave(analysisJson: string) {
    const normalizedTitle = draft.bookTitle.trim();
    const normalizedAuthorName = draft.authorName.trim();
    const normalizedLanguage = draft.bookLanguage.trim();
    const normalizedYear = draft.bookYear.trim();

    if (!normalizedTitle) {
      toast.error("Enter a book name before saving.");
      return;
    }

    if (!normalizedAuthorName) {
      toast.error("Enter an author name before saving.");
      return;
    }

    if (!normalizedLanguage) {
      toast.error("Enter a book language before saving.");
      return;
    }

    if (!/^\d{1,4}$/.test(normalizedYear)) {
      toast.error("Enter a valid numeric book year.");
      return;
    }

    if (draft.selectedTagIds.length < 1) {
      toast.error("Select at least one book tag before saving.");
      return;
    }

    setSavePhase("saving");

    startSaveTransition(async () => {
      const result = await saveBooksHomeBookAction({
        id: draft.id > 0 ? draft.id : undefined,
        bookTitle: normalizedTitle,
        authorName: normalizedAuthorName,
        bookLanguage: normalizedLanguage,
        bookYear: Number(normalizedYear),
        status: draft.status,
        analysisJson,
        selectedTagIds: draft.selectedTagIds,
      });

      if (!result.success) {
        setSavePhase("error");
        toast.error(result.message);
        return;
      }

      const savedBook = createDraftFromBook(result.book, member);

      setDraft(savedBook);
      setBookDialogMode("view");
      setIsBookDialogOpen(false);

      onBookSaved(savedBook);
      toast.success(result.message);
      router.refresh();
    });
  }

  const markSaveSynced = useCallback(() => {
    setSavePhase("saved");
  }, []);

  return {
    isSaving,
    isBookDialogOpen,
    setIsBookDialogOpen,
    bookDialogMode,
    savePhase,
    draft,
    setDraft,
    openBookDialog,
    handleCancelDialog,
    handleSave,
    markSaveSynced,
    getSelectedTagForCategory,
    handleCategoryTagSelect,
  };
}
