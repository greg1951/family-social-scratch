import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteBiblioEntryAction,
  saveBiblioEntryAction,
} from "@/app/(features)/(books)/member-books/actions";
import type { BiblioEntry } from "@/components/db/types/book-biblio";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";

export type BiblioDialogMode = "view" | "edit" | "add";

export type BiblioDraft = {
  id: number;
  bookTitle: string;
  authorName: string;
  bookSeriesName: string;
  publishedYear: string;
  readYear: string;
  rating: number;
  status: string;
  summaryJson: string;
  commentsJson: string;
  selectedTagIds: number[];
};

export function createDraftFromEntry(entry: BiblioEntry): BiblioDraft {
  return {
    id: entry.id,
    bookTitle: entry.bookTitle,
    authorName: entry.authorName,
    bookSeriesName: entry.bookSeriesName ?? "",
    publishedYear: entry.publishedYear ? String(entry.publishedYear) : "",
    readYear: entry.readYear ? String(entry.readYear) : "",
    rating: entry.rating,
    status: entry.status,
    summaryJson: entry.summaryJson,
    commentsJson: entry.commentsJson,
    selectedTagIds: entry.selectedTagIds,
  };
}

export function createEmptyDraft(): BiblioDraft {
  const emptyDocument = serializeTipTapDocument(createEmptyTipTapDocument());
  const currentYear = String(new Date().getFullYear());

  return {
    id: 0,
    bookTitle: "",
    authorName: "",
    bookSeriesName: "",
    publishedYear: currentYear,
    readYear: currentYear,
    rating: 0,
    status: "private",
    summaryJson: emptyDocument,
    commentsJson: emptyDocument,
    selectedTagIds: [],
  };
}

type UseBiblioDialogParams = {
  onEntrySaved: (entry: BiblioEntry) => void;
  onEntryDeleted: (biblioId: number) => void;
};

export function useBiblioDialog({ onEntrySaved, onEntryDeleted }: UseBiblioDialogParams) {
  const [isSaving, startSaveTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<BiblioDialogMode>("view");
  const [draft, setDraft] = useState<BiblioDraft>(() => createEmptyDraft());

  function openDialog(mode: BiblioDialogMode, entry?: BiblioEntry | null) {
    if (mode === "add") {
      setDraft(createEmptyDraft());
    } else {
      if (!entry) {
        return;
      }

      setDraft(createDraftFromEntry(entry));
    }

    setDialogMode(mode);
    setIsDialogOpen(true);
  }

  function handleToggleTag(tagId: number, isChecked: boolean) {
    setDraft((currentDraft) => {
      const isAlreadySelected = currentDraft.selectedTagIds.includes(tagId);

      if (isChecked && !isAlreadySelected) {
        return { ...currentDraft, selectedTagIds: [...currentDraft.selectedTagIds, tagId] };
      }

      if (!isChecked && isAlreadySelected) {
        return {
          ...currentDraft,
          selectedTagIds: currentDraft.selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId),
        };
      }

      return currentDraft;
    });
  }

  function handleSave() {
    const normalizedTitle = draft.bookTitle.trim();
    const normalizedAuthorName = draft.authorName.trim();

    if (!normalizedTitle) {
      toast.error("Enter a book title before saving.");
      return;
    }

    if (!normalizedAuthorName) {
      toast.error("Enter an author name before saving.");
      return;
    }

    if (isSerializedTipTapDocumentEmpty(draft.summaryJson) && isSerializedTipTapDocumentEmpty(draft.commentsJson)) {
      toast.error("Add a summary or a comment before saving.");
      return;
    }

    startSaveTransition(async () => {
      const result = await saveBiblioEntryAction({
        id: draft.id > 0 ? draft.id : undefined,
        bookTitle: normalizedTitle,
        authorName: normalizedAuthorName,
        bookSeriesName: draft.bookSeriesName.trim(),
        publishedYear: draft.publishedYear.trim() ? Number(draft.publishedYear) : 0,
        readYear: draft.readYear.trim() ? Number(draft.readYear) : 0,
        rating: draft.rating,
        status: draft.status,
        summaryJson: draft.summaryJson,
        commentsJson: draft.commentsJson,
        selectedTagIds: draft.selectedTagIds,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onEntrySaved(result.entry);
      setIsDialogOpen(false);
      toast.success(result.message);
    });
  }

  function handleDelete() {
    if (draft.id <= 0) {
      return;
    }

    const deletedBiblioId = draft.id;

    startSaveTransition(async () => {
      const result = await deleteBiblioEntryAction({ biblioId: deletedBiblioId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      onEntryDeleted(deletedBiblioId);
      setIsDialogOpen(false);
      toast.success(result.message);
    });
  }

  return {
    isSaving,
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    draft,
    setDraft,
    openDialog,
    handleToggleTag,
    handleSave,
    handleDelete,
  };
}
