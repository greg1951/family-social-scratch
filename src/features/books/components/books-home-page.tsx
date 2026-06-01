"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Eye,
  Heart,
  LibraryBig,
  MessageSquare,
  PenSquare,
  Plus,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addBookCommentAction,
  toggleBookLikeAction,
} from "@/app/(features)/(books)/books/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { BookTagOption, BooksHomeBook } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import StartDiscussionDialog from "@/components/discuss/start-discussion-dialog";
import {
  createDraftFromBook,
  createEmptyDraft,
  useBookDialog,
} from "@/features/books/hooks/use-book-dialog";
import { useLinkDialog } from "@/features/books/hooks/use-link-dialog";
import { BookDetailsDialog } from "@/features/books/components/dialogs/book-details-dialog";
import { BookLinkDialog } from "@/features/books/components/dialogs/book-link-dialog";
type DirectoryMode = "latest" | "top-rated";

const BOOK_TAG_CATEGORY_SLOTS = [
  { seqNo: 10, fallbackName: "Fiction" },
  { seqNo: 30, fallbackName: "Non-Fiction" },
  { seqNo: 90, fallbackName: "Other" },
] as const;

function getEditorDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

function getSeqNoRange(seqNo: number) {
  const rangeStart = Math.floor(seqNo / 10) * 10;

  return {
    rangeStart,
    rangeEnd: rangeStart + 9,
  };
}

export default function BooksHomePage({
  books,
  member,
  bookTags = [],
}: {
  books: BooksHomeBook[];
  member: MemberKeyDetails;
  bookTags?: BookTagOption[];
}) {
  const previousBooksRef = useRef(books);
  const [isEngaging, startEngageTransition] = useTransition();
  const [bookItems, setBookItems] = useState(() => books.map((bookRecord) => createDraftFromBook(bookRecord, member)));
  const [selectedBookId, setSelectedBookId] = useState<number | null>(books[0]?.id ?? null);
  const [pendingSelectedBookId, setPendingSelectedBookId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [directoryMode, setDirectoryMode] = useState<DirectoryMode>("latest");
  const deferredSearchValue = useDeferredValue(searchValue);
  const initialDraft = useMemo(() => {
    if (books[0]) {
      return createDraftFromBook(books[0], member);
    }

    return createEmptyDraft(member);
  }, [books, member]);

  const selectedBook = bookItems.find((bookItem) => bookItem.id === selectedBookId) ?? null;
  const canEditSelected = selectedBook
    ? Boolean(member.isAdmin) || selectedBook.memberId === member.memberId
    : false;

  const bookDialog = useBookDialog({
    initialDraft,
    member,
    selectedBook,
    canEditSelected,
    onBookSaved(savedBook) {
      setPendingSelectedBookId(savedBook.id);
      setSelectedBookId(savedBook.id);
    },
  });

  const draft = bookDialog.draft;
  const { setDraft } = bookDialog;
  const { markSaveSynced } = bookDialog;

  const analysisEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: getEditorDocument(draft.analysisJson),
    editable: bookDialog.bookDialogMode !== "view",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[12rem]",
      },
    },
    onUpdate({ editor }) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        analysisJson: serializeTipTapDocument(editor.getJSON()),
      }));
    },
  });

  useEffect(() => {
    if (!analysisEditor) {
      return;
    }

    analysisEditor.setEditable(bookDialog.bookDialogMode !== "view");
  }, [analysisEditor, bookDialog.bookDialogMode]);

  useEffect(() => {
    if (!analysisEditor) {
      return;
    }

    const editorJson = serializeTipTapDocument(analysisEditor.getJSON());

    if (editorJson !== draft.analysisJson) {
      analysisEditor.commands.setContent(getEditorDocument(draft.analysisJson));
    }
  }, [analysisEditor, draft.analysisJson, draft.id]);

  useEffect(() => {
    const nextBookItems = books.map((bookRecord) => createDraftFromBook(bookRecord, member));
    const resolvedSelectedBookId = pendingSelectedBookId
      && nextBookItems.some((bookItem) => bookItem.id === pendingSelectedBookId)
      ? pendingSelectedBookId
      : selectedBookId;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookItems(nextBookItems);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBookId((currentSelectedBookId) => {
      const preferredBookId = resolvedSelectedBookId ?? currentSelectedBookId;

      if (preferredBookId && nextBookItems.some((bookItem) => bookItem.id === preferredBookId)) {
        return preferredBookId;
      }

      return nextBookItems[0]?.id ?? null;
    });

    const receivedRefreshedBooks = previousBooksRef.current !== books;

    if (receivedRefreshedBooks && pendingSelectedBookId && nextBookItems.some((bookItem) => bookItem.id === pendingSelectedBookId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingSelectedBookId(null);
      markSaveSynced();
    }

    previousBooksRef.current = books;
  }, [books, member, pendingSelectedBookId, selectedBookId, markSaveSynced]);

  const linkDialog = useLinkDialog(analysisEditor);

  const directoryBooks = useMemo(() => {
    if (directoryMode === "latest") {
      return [...bookItems].sort((leftBook, rightBook) => (
        new Date(rightBook.createdAt).getTime() - new Date(leftBook.createdAt).getTime()
      ));
    }

    return bookItems
      .filter((bookItem) => bookItem.likesCount > 0)
      .sort((leftBook, rightBook) => {
        if (rightBook.likesCount !== leftBook.likesCount) {
          return rightBook.likesCount - leftBook.likesCount;
        }

        return new Date(rightBook.createdAt).getTime() - new Date(leftBook.createdAt).getTime();
      });
  }, [directoryMode, bookItems]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (!normalizedQuery) {
      return directoryBooks;
    }

    return directoryBooks.filter((bookItem) => (
      bookItem.bookTitle.toLowerCase().includes(normalizedQuery)
      || bookItem.authorName.toLowerCase().includes(normalizedQuery)
      || bookItem.bookYear.toLowerCase().includes(normalizedQuery)
      || bookItem.bookLanguage.toLowerCase().includes(normalizedQuery)
      || (bookItem.bookSeriesName ?? "").toLowerCase().includes(normalizedQuery)
      || bookItem.submitterName.toLowerCase().includes(normalizedQuery)
    ));
  }, [deferredSearchValue, directoryBooks]);

  const activeBookTags = useMemo(() => (
    bookTags.filter((tagOption) => tagOption.status !== "archived")
  ), [bookTags]);

  const categoryTagOptions = useMemo(() => (
    BOOK_TAG_CATEGORY_SLOTS.map((slot) => {
      const categoryRange = getSeqNoRange(slot.seqNo);
      const categoryTag = activeBookTags.find((tagOption) => (
        tagOption.tagType === "category" && tagOption.seqNo === slot.seqNo
      ));

      const qualifierOptions = activeBookTags
        .filter((tagOption) => (
          tagOption.tagType === "qualifier"
          && tagOption.seqNo >= categoryRange.rangeStart + 1
          && tagOption.seqNo <= categoryRange.rangeEnd
        ))
        .sort((a, b) => a.seqNo - b.seqNo || a.tagName.localeCompare(b.tagName));

      return {
        seqNo: slot.seqNo,
        categoryName: categoryTag?.tagName ?? slot.fallbackName,
        qualifierOptions,
      };
    })
  ), [activeBookTags]);

  useEffect(() => {
    if (filteredBooks.length === 0) {
      return;
    }

    if (selectedBookId && filteredBooks.some((bookItem) => bookItem.id === selectedBookId)) {
      return;
    }

    setSelectedBookId(filteredBooks[0].id);
  }, [filteredBooks, selectedBookId]);

  const selectedBookTags = useMemo(() => {
    if (!selectedBook) {
      return [] as BookTagOption[];
    }

    return bookTags.filter((tagOption) => selectedBook.selectedTagIds.includes(tagOption.id));
  }, [bookTags, selectedBook]);

  function handleSelectBook(bookId: number) {
    setCommentText("");
    setSelectedBookId(bookId);
  }

  function handleOpenBookFromCard(bookId: number) {
    handleSelectBook(bookId);
    setTimeout(() => {
      bookDialog.openBookDialog("view");
    }, 0);
  }

  function applyBookRefresh(updatedBook: BooksHomeBook) {
    const updatedDraft = createDraftFromBook(updatedBook, member);

    setBookItems((currentBooks) => currentBooks.map((bookItem) => (
      bookItem.id === updatedDraft.id ? updatedDraft : bookItem
    )));
    setSelectedBookId(updatedDraft.id);

    if (draft.id === updatedDraft.id) {
      setDraft(updatedDraft);
    }
  }

  function handleToggleLike() {
    if (!selectedBook) {
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleBookLikeAction({
        bookId: selectedBook.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      applyBookRefresh(result.book);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedBook) {
      return;
    }

    const normalizedComment = commentText.trim();

    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addBookCommentAction({
        bookId: selectedBook.id,
        commentText: normalizedComment,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      applyBookRefresh(result.book);
      setCommentText("");
      toast.success(result.message);
    });
  }

  /*---------------------------------------- Main Return ----------------------------------------------- */
  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,56,82,0.96),rgba(30,115,142,0.9)_52%,rgba(217,171,103,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#d9f3ff]">
                Book Besties
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Main Page
                </Link>
                <Link
                  href="/book-terms"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <LibraryBig className="mr-2 size-4" />
                  Book Terms
                </Link>
              </div>

              <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                Book Besties is your family&apos;s book club. Post a book and discuss it with other book lovers in the family!
              </h1>
            </div>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)] backdrop-blur">
          <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">Book Directory</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#51707e]">
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#183746]">Select a Book Submission</h2>
                  <FeatureFaqHelp
                    href=" /feature-faq?category=Book%20Besties"
                    buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#9dd8f0] bg-gradient-to-b from-[#f4fcff] to-[#d9f2ff] text-[#1d6d8f] shadow-[0_8px_18px_rgba(29,109,143,0.2)] group-hover:shadow-[0_12px_26px_rgba(29,109,143,0.3)]"
                    iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#1d6d8f]"
                    tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
                  />
                  <Button
                    type="button"
                    onClick={ () => bookDialog.openBookDialog("view") }
                    disabled={ !selectedBook }
                    className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                  >
                    <Eye className="size-4" />
                    View Book
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => bookDialog.openBookDialog("edit") }
                    disabled={ !selectedBook || !canEditSelected }
                    className="rounded-full border-[#0f5c78]/20 bg-white text-[#0f5c78] hover:bg-[#e9f5fa]"
                  >
                    <PenSquare className="size-4" />
                    Edit Book
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => bookDialog.openBookDialog("add") }
                    className="rounded-full border-[#0f5c78]/20 bg-white text-[#0f5c78] hover:bg-[#e9f5fa]"
                  >
                    <Plus className="size-4" />
                    Add Book
                  </Button>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51707e]">
                  Select a book card from the directory, or use search to narrow the list, then open View Book or Edit Book details in a separate dialog.
                </p>
              </div>

              { selectedBook ? (
                <div className="w-full rounded-[1.4rem] border border-[#d9e5ea] bg-white p-4 xl:w-104">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#51707e]">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#3d819b]">Discussion Threads</p>
                        <FeatureFaqHelp
                          href="/feature-faq?category=Discussion%20Groups"
                          buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                          iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#1d6d8f]"
                          tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#51707e]">Start or review book-specific discussion threads.</p>
                    </div>
                    <StartDiscussionDialog
                      targetType="book"
                      targetId={ selectedBook.id }
                      topicLabel={ `${ selectedBook.bookTitle } Discussion` }
                      revalidatePaths={ ["/books"] }
                      onSuccessRoute="/books/discussions/:threadId"
                      disabled={ isEngaging }
                      triggerLabel="Add Discussion"
                      triggerClassName="rounded-full bg-[#0f5c78] px-4 text-xs font-semibold text-white hover:bg-[#0a4860]"
                    />
                  </div>

                  <div className="mt-3 space-y-3">
                    { selectedBook.discussionThreads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#c8d7df] bg-[#f8fcff] px-3 py-3 text-sm text-[#51707e]">
                        <p>No discussion threads have been added for this book yet.</p>
                      </div>
                    ) : (
                      selectedBook.discussionThreads.map((discussionThread) => (
                        <article key={ discussionThread.id } className="rounded-2xl border border-[#d9e5ea] bg-[#fbfdff] px-4 py-4 text-sm text-[#355161] shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-base font-bold leading-snug text-[#183746]">{ discussionThread.discussTopic }</p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[#648596]">
                                { discussionThread.memberFirstName } · { formatCreatedAt(discussionThread.createdAt) }
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-3">
                              { discussionThread.dislikeCount > 0 || discussionThread.likeCount > 0 || discussionThread.loveCount > 0 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  { discussionThread.dislikeCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#edf5f8] px-2 py-1 text-[0.65rem] font-semibold text-[#355161]">
                                      <ThumbsDown className="size-3" />
                                      { discussionThread.dislikeCount }
                                    </span>
                                  ) : null }
                                  { discussionThread.likeCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f3fa] px-2 py-1 text-[0.65rem] font-semibold text-[#1d6d8f]">
                                      <ThumbsUp className="size-3" />
                                      { discussionThread.likeCount }
                                    </span>
                                  ) : null }
                                  { discussionThread.loveCount > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fde9e0] px-2 py-1 text-[0.65rem] font-semibold text-[#b45b32]">
                                      <Heart className="size-3 fill-current" />
                                      { discussionThread.loveCount }
                                    </span>
                                  ) : null }
                                </div>
                              ) : null }

                              <Button
                                type="button"
                                variant="outline"
                                asChild
                                className="shrink-0 rounded-full border-[#9dd8f0] bg-white px-4 text-xs font-semibold text-[#0f5c78] hover:bg-[#e9f5fa] hover:text-[#0f5c78]"
                              >
                                <Link href={ `/books/discussions/${ discussionThread.id }` }>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) }
                  </div>
                </div>
              ) : null }

              {/* <div className="rounded-full border border-[#d9e5ea] bg-[#f4fbff] px-4 py-2 text-sm font-semibold text-[#51707e]">
                { filteredBooks.length } visible book{ filteredBooks.length !== 1 ? "s" : "" }
              </div> */}
            </div>

            <div className="mt-5">
              <div className="min-w-0">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#3d819b]" />
                  <Input
                    type="search"
                    value={ searchValue }
                    onChange={ (event) => setSearchValue(event.target.value) }
                    placeholder="Search by title, author, year, language, series, or family member"
                    className="h-12 rounded-full border-[#c8d7df] bg-white pl-11 pr-4 text-sm text-[#183746] shadow-sm"
                    aria-label="Search books"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#355161]">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="book-directory-mode"
                      value="latest"
                      checked={ directoryMode === "latest" }
                      onChange={ () => setDirectoryMode("latest") }
                      className="size-4 border-[#9ec3d2] text-[#0f5c78] focus:ring-[#3d819b]"
                    />
                    <span className="font-semibold">Latest Books</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="book-directory-mode"
                      value="top-rated"
                      checked={ directoryMode === "top-rated" }
                      onChange={ () => setDirectoryMode("top-rated") }
                      className="size-4 border-[#9ec3d2] text-[#0f5c78] focus:ring-[#3d819b]"
                    />
                    <span className="font-semibold">Top Rated Books</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            { bookItems.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#c8d7df] bg-[#f8fcff] px-6 py-10 text-center text-[#51707e]">
                <LibraryBig className="mx-auto mb-3 size-10 text-[#6f9cb0]" />
                <p className="text-lg font-semibold text-[#183746]">No books have been added yet.</p>
                <p className="mt-2 text-sm">Use Add Book to create the first submission for this family.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#edf7fb,#f8fdff)] px-4 py-3 text-sm text-[#355161]">
                  <LibraryBig className="size-4 text-[#3d819b]" />
                  <span className="font-semibold text-[#183746]">Selected book:</span>
                  <span>{ selectedBook?.bookTitle || "Choose a book from the list" }</span>
                  <span className="rounded-full bg-[#ddf0f8] px-3 py-1 text-xs text-[#2a5a6f]">Viewing as { member.firstName }</span>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  { filteredBooks.map((bookItem) => {
                    const isSelected = bookItem.id === selectedBookId;
                    const isAwaitingServerSync = pendingSelectedBookId === bookItem.id && bookDialog.savePhase === "saving";

                    return (
                      <button
                        key={ bookItem.id }
                        type="button"
                        onClick={ () => handleSelectBook(bookItem.id) }
                        onDoubleClick={ () => handleOpenBookFromCard(bookItem.id) }
                        className={ `grid w-full gap-2 rounded-[1.4rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d819b] sm:gap-3 sm:px-4 sm:py-4 ${ isSelected
                          ? "border-[#3d819b] bg-[linear-gradient(135deg,rgba(231,247,255,0.95),rgba(248,252,255,0.95))] shadow-[0_18px_45px_-35px_rgba(9,56,82,0.7)]"
                          : "border-[#deeaef] bg-white hover:border-[#a6c6d3] hover:bg-[#fbfdff]"
                          }` }
                      >
                        <div>
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Book</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="wrap-break-word text-base font-bold leading-snug text-[#183746] sm:text-lg">{ bookItem.bookTitle }</p>
                            { isAwaitingServerSync ? (
                              <span className="rounded-full bg-[#dbf1fb] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#2d667d]">
                                Syncing
                              </span>
                            ) : null }
                          </div>
                          <p className="mt-1 text-[0.7rem] text-[#6b8a98] sm:text-xs">Created { formatCreatedAt(bookItem.createdAt) }</p>
                        </div>
                        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:gap-x-8 md:items-center md:gap-x-10">
                          <div className="min-w-26">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Author</p>
                            <p className="text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.authorName }</p>
                          </div>
                          <div className="min-w-18">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Year</p>
                            <p className="text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.bookYear || "-" }</p>
                          </div>
                          <div className="min-w-18">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Language</p>
                            <p className="text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.bookLanguage }</p>
                          </div>
                          <div className="min-w-32 max-w-full">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Submitter</p>
                            <p className="wrap-break-word text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.submitterName }</p>
                          </div>
                          <div className="inline-flex min-w-18 items-center gap-1.5 text-xs font-semibold text-[#355161] sm:text-sm">
                            <Heart className="size-3.5 text-[#c06c4a] sm:size-4" />
                            { bookItem.likesCount }
                          </div>
                          <div className="inline-flex min-w-18 items-center gap-1.5 text-xs font-semibold text-[#355161] sm:text-sm">
                            <MessageSquare className="size-3.5 text-[#3d819b] sm:size-4" />
                            { bookItem.commentCount }
                          </div>
                        </div>
                      </button>
                    );
                  }) }
                </div>

                { filteredBooks.length === 0 ? (
                  <div className="mt-4 rounded-[1.3rem] border border-dashed border-[#c8d7df] bg-[#f8fcff] px-4 py-6 text-center text-sm text-[#51707e]">
                    { directoryMode === "top-rated"
                      ? "No top-rated books match this view yet."
                      : "No books match that search yet." }
                  </div>
                ) : null }
              </>
            ) }
          </div>
        </div>
      </div>

      <BookDetailsDialog
        bookDialog={ bookDialog }
        linkDialog={ linkDialog }
        analysisEditor={ analysisEditor }
        tags={ {
          selectedBookTags,
          activeBookTags,
          categoryTagOptions,
        } }
        engagement={ {
          isEngaging,
          commentText,
          setCommentText,
          onToggleLike: handleToggleLike,
          onAddComment: handleAddComment,
        } }
        save={ {
          onSave: () => bookDialog.handleSave(analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson),
        } }
        formatCreatedAt={ formatCreatedAt }
      />

      <BookLinkDialog linkDialog={ linkDialog } />
    </section>
  );
}
