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
import { useRouter } from "next/navigation";
import { clearQueuedFeatureComment, createClientRequestId, getPwaSyncNowEventName, isBrowserOnline, queueFeatureComment, readQueuedFeatureComments } from "@/lib/pwa-background-sync";

import {
  addBookCommentAction,
  toggleBookReactionAction,
  deleteBooksHomeBookAction,
} from "@/app/(features)/(books)/books/actions";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  normalizeSerializedTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { BookTagOption, BooksHomeBook } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import {
  createDraftFromBook,
  createEmptyDraft,
  useBookDialog,
} from "@/features/books/hooks/use-book-dialog";
import { useLinkDialog } from "@/features/books/hooks/use-link-dialog";
import { BookDetailsDialog } from "@/features/books/components/dialogs/book-details-dialog";
import { BookLinkDialog } from "@/features/books/components/dialogs/book-link-dialog";
import type { Club } from "@/components/db/types/clubs";
type DirectoryMode = "latest" | "top-rated";

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

export default function BooksHomePage({
  books,
  member,
  bookTags = [],
  clubs = [],
}: {
  books: BooksHomeBook[];
  member: MemberKeyDetails;
  bookTags?: BookTagOption[];
  clubs?: Club[];
}) {
  const router = useRouter();
  const previousBooksRef = useRef(books);
  const [isEngaging, startEngageTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [bookItems, setBookItems] = useState(() => books.map((bookRecord) => createDraftFromBook(bookRecord, member)));
  const [selectedBookId, setSelectedBookId] = useState<number | null>(books.find((bookRecord) => bookRecord.status === "published")?.id ?? books[0]?.id ?? null);
  const [pendingSelectedBookId, setPendingSelectedBookId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filterWithClubSessions, setFilterWithClubSessions] = useState(false);
  const [expandBookCards, setExpandBookCards] = useState(true);
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
    ? selectedBook.memberId === member.memberId || member.isFounder
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
    setSelectedBookId((currentSelectedBookId) => {
      const preferredBookId = resolvedSelectedBookId ?? currentSelectedBookId;

      if (preferredBookId && nextBookItems.some((bookItem) => bookItem.id === preferredBookId)) {
        return preferredBookId;
      }

      return nextBookItems[0]?.id ?? null;
    });

    const receivedRefreshedBooks = previousBooksRef.current !== books;

    if (receivedRefreshedBooks && pendingSelectedBookId && nextBookItems.some((bookItem) => bookItem.id === pendingSelectedBookId)) {
      setPendingSelectedBookId(null);
      markSaveSynced();
    }

    previousBooksRef.current = books;
  }, [books, member, pendingSelectedBookId, selectedBookId, markSaveSynced]);

  const linkDialog = useLinkDialog(analysisEditor);

  const visibleBookItems = useMemo(() => (
    bookItems.filter((bookItem) => bookItem.status === "published" || (includeArchived && bookItem.status === "archived"))
  ), [bookItems, includeArchived]);

  const directoryBooks = useMemo(() => {
    if (directoryMode === "latest") {
      return [...visibleBookItems].sort((leftBook, rightBook) => (
        new Date(rightBook.createdAt).getTime() - new Date(leftBook.createdAt).getTime()
      ));
    }

    return visibleBookItems
      .filter((bookItem) => (bookItem.likeCount + bookItem.loveCount) > 0)
      .sort((leftBook, rightBook) => {
        const rightScore = rightBook.likeCount + rightBook.loveCount;
        const leftScore = leftBook.likeCount + leftBook.loveCount;

        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return new Date(rightBook.createdAt).getTime() - new Date(leftBook.createdAt).getTime();
      });
  }, [directoryMode, visibleBookItems]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();
    const booksWithFilter = filterWithClubSessions
      ? directoryBooks.filter((bookItem) => bookItem.hasClubSession)
      : directoryBooks;

    if (!normalizedQuery) {
      return booksWithFilter;
    }

    return booksWithFilter.filter((bookItem) => (
      bookItem.bookTitle.toLowerCase().includes(normalizedQuery)
      || bookItem.authorName.toLowerCase().includes(normalizedQuery)
      || bookItem.bookYear.toLowerCase().includes(normalizedQuery)
      || bookItem.bookLanguage.toLowerCase().includes(normalizedQuery)
      || (bookItem.bookSeriesName ?? "").toLowerCase().includes(normalizedQuery)
      || bookItem.submitterName.toLowerCase().includes(normalizedQuery)
    ));
  }, [deferredSearchValue, directoryBooks, filterWithClubSessions]);

  const activeBookTags = useMemo(() => (
    bookTags.filter((tagOption) => tagOption.status !== "archived")
  ), [bookTags]);

  useEffect(() => {
    if (filteredBooks.length === 0) {
      return;
    }

    if (selectedBookId && filteredBooks.some((bookItem) => bookItem.id === selectedBookId)) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    const flushQueuedBookComments = async () => {
      if (!isBrowserOnline()) {
        return;
      }

      const queuedComments = readQueuedFeatureComments().filter((item) => item.kind === "book");

      for (const queuedComment of queuedComments) {
        const result = await addBookCommentAction(queuedComment.payload);

        if (!result.success) {
          continue;
        }

        if (queuedComment.payload.clientRequestId) {
          clearQueuedFeatureComment(queuedComment.payload.clientRequestId);
        }

        applyBookRefresh(result.book);
      }
    };

    void flushQueuedBookComments();

    const handleSync = () => {
      void flushQueuedBookComments();
    };

    window.addEventListener("online", handleSync);
    window.addEventListener(getPwaSyncNowEventName(), handleSync);

    return () => {
      window.removeEventListener("online", handleSync);
      window.removeEventListener(getPwaSyncNowEventName(), handleSync);
    };
  }, [member, draft.id]);

  function handleToggleReaction(reactionType: -1 | 1 | 2) {
    if (!selectedBook) {
      return;
    }

    if (!bookDialog.isBookDialogOpen || bookDialog.bookDialogMode !== "view") {
      toast.error("Open View Book before posting a reaction.");
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleBookReactionAction({
        bookId: selectedBook.id,
        reactionType,
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

    const normalizedComment = normalizeSerializedTipTapDocument(commentText);

    if (isSerializedTipTapDocumentEmpty(normalizedComment)) {
      toast.error("Enter a comment before posting.");
      return;
    }

    startEngageTransition(async () => {
      const payload = {
        bookId: selectedBook.id,
        commentText: normalizedComment,
        clientRequestId: createClientRequestId("book-comment"),
      };
      const result = await addBookCommentAction(payload);

      if (!result.success) {
        if (!isBrowserOnline()) {
          queueFeatureComment({
            kind: "book",
            payload,
            itemTitle: selectedBook.bookTitle,
            commenterName: `${ member.firstName } ${ member.lastName }`.trim(),
            queuedAt: new Date().toISOString(),
          });
          setCommentText("");
          toast.message("Comment saved locally. It will sync when you are back online.");
          return;
        }

        toast.error(result.message);
        return;
      }

      applyBookRefresh(result.book);
      setCommentText("");
      toast.success(result.message);
    });
  }

  function handleDelete() {
    if (!selectedBook?.id) {
      return;
    }

    startDeleteTransition(async () => {
      const result = await deleteBooksHomeBookAction({ bookId: selectedBook.id });
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Book deleted.");
      router.push("/books");
    });
  }

  /*---------------------------------------- Main Return ----------------------------------------------- */
  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,56,82,0.96),rgba(30,115,142,0.9)_52%,rgba(217,171,103,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-4xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#d9f3ff]">
                Family Reading Room
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Go Home
                </Link>
                <Link
                  href="/book-terms"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <LibraryBig className="mr-2 size-4" />
                  Book Terms
                </Link>
                  <Link
                    href="/add-club"
                    className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <LibraryBig className="mr-2 size-4" />
                    Book & Poetry Clubs
                  </Link>
              </div>

              <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                Post a book review and discuss it with other members of the family!
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

                <div className="mt-4 min-w-0">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#355161]">
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
                    <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c8d7df] bg-white px-3 py-2 text-xs font-semibold text-[#2a5a6f]">
                      <input
                        type="checkbox"
                        checked={ includeArchived }
                        onChange={ (event) => setIncludeArchived(event.target.checked) }
                        className="size-4 border-[#9ec3d2] text-[#0f5c78]"
                      />
                      Include Archived
                    </label>
                    <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c8d7df] bg-white px-3 py-2 text-xs font-semibold text-[#2a5a6f]">
                      <input
                        type="checkbox"
                        checked={ filterWithClubSessions }
                        onChange={ (event) => setFilterWithClubSessions(event.target.checked) }
                        className="size-4 border-[#9ec3d2] text-[#0f5c78]"
                      />
                      Filter Book Clubs
                    </label>
                    <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c8d7df] bg-white px-3 py-2 text-xs font-semibold text-[#2a5a6f]">
                      <input
                        type="checkbox"
                        checked={ expandBookCards }
                        onChange={ (event) => setExpandBookCards(event.target.checked) }
                        className="size-4 border-[#9ec3d2] text-[#0f5c78]"
                      />
                      Expand Book Cards
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[16rem] flex-1">
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
                  </div>
                </div>
              </div>

              { selectedBook ? (
                <div className="w-full rounded-[1.4rem] border border-[#d9e5ea] bg-white p-4 xl:w-104">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#51707e]">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#3d819b]">Start Book Club Session</p>
                        <FeatureFaqHelp
                          href="/feature-faq?category=Discussion%20Groups"
                          buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                          iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#1d6d8f]"
                          tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
                        />
                      </div>
                      <p className="mt-1 text-sm text-[#51707e]">Start or review book club sessions for this book.</p>
                    </div>
                    <Button
                      type="button"
                      onClick={ () => router.push(`/add-club-session?targetType=book&targetId=${ selectedBook.id }`) }
                      disabled={ isEngaging || clubs.length === 0 || selectedBook.hasClubSession }
                      className="rounded-full bg-[#0f5c78] px-4 text-xs font-semibold text-white hover:bg-[#0a4860] disabled:opacity-50"
                    >
                      Add Book Club Session
                    </Button>
                  </div>
                  { clubs.length === 0 ? (
                    <p className="mt-2 text-xs text-[#7a8f9c]">Create a club first using Book & Poetry Clubs.</p>
                  ) : selectedBook.hasClubSession ? (
                    <p className="mt-2 text-xs text-[#7a8f9c]">This book already has an active club session.</p>
                  ) : null }

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
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                  { filteredBooks.map((bookItem) => {
                    const isSelected = bookItem.id === selectedBookId;
                    const isAwaitingServerSync = pendingSelectedBookId === bookItem.id && bookDialog.savePhase === "saving";

                    return (
                      <button
                        key={ bookItem.id }
                        type="button"
                        onClick={ () => handleSelectBook(bookItem.id) }
                        onDoubleClick={ () => handleOpenBookFromCard(bookItem.id) }
                        className={ `grid w-55 md:w-55 lg:w-75 gap-2 rounded-[1.4rem] border px-2 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d819b] sm:gap-3 sm:px-4 sm:py-4 ${ isSelected
                          ? "border-[#3d819b] bg-[linear-gradient(135deg,rgba(231,247,255,0.95),rgba(248,252,255,0.95))] shadow-[0_18px_45px_-35px_rgba(9,56,82,0.7)]"
                          : "border-[#deeaef] bg-white hover:border-[#a6c6d3] hover:bg-[#fbfdff]"
                          }` }
                      >
                        <div>
                          { expandBookCards ? (
                            <div className="flex flex-wrap items-start gap-1">
                              <p className="min-w-0 wrap-break-word line-clamp-2 text-xs font-bold leading-snug text-[#183746] sm:text-sm">{ bookItem.bookTitle }</p>
                              { bookItem.hasClubSession ? (
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e4f3fa] text-[#1d6d8f]" title="Club session available">
                                  <MessageSquare className="size-3" aria-label="Club session available" />
                                </span>
                              ) : null }
                              { isAwaitingServerSync ? (
                                <span className="rounded-full bg-[#dbf1fb] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#2d667d]">
                                  Syncing
                                </span>
                              ) : null }
                            </div>
                          ) : (
                            <p className="min-w-0 wrap-break-word line-clamp-2 text-xs font-bold leading-snug text-[#183746] sm:text-sm">{ bookItem.bookTitle }</p>
                          ) }
                          <p className="mt-1 text-[0.7rem] text-[#6b8a98] sm:text-xs">Created { formatCreatedAt(bookItem.createdAt) }</p>
                        </div>
                        { expandBookCards ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1 sm:gap-x-2 md:gap-x-3">
                              <div className="min-w-26">
                                <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Author</p>
                                <p className="text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.authorName }</p>
                              </div>
                              <div className="min-w-18">
                                <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Year</p>
                                <p className="text-xs font-semibold text-[#355161] sm:text-sm">{ bookItem.bookYear || "-" }</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-1 gap-y-1 sm:gap-x-1.5 md:gap-x-2">
                              <div className="min-w-24 max-w-full">
                                <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#5d8aa0]">Submitter</p>
                                <p className="wrap-break-word text-[0.7rem] font-semibold text-[#355161] sm:text-xs">{ bookItem.submitterName }</p>
                              </div>
                              <div className="inline-flex items-center gap-0.5 text-[0.65rem] font-semibold text-[#355161] sm:text-[0.7rem]">
                                <ThumbsDown className="size-2.5 text-[#5d7c8a] sm:size-3" />
                                { bookItem.dislikeCount }
                              </div>
                              <div className="inline-flex items-center gap-0.5 text-[0.65rem] font-semibold text-[#355161] sm:text-[0.7rem]">
                                <ThumbsUp className="size-2.5 text-[#1d6d8f] sm:size-3" />
                                { bookItem.likeCount }
                              </div>
                              <div className="inline-flex items-center gap-0.5 text-[0.65rem] font-semibold text-[#355161] sm:text-[0.7rem]">
                                <Heart className="size-2.5 text-[#c06c4a] sm:size-3" />
                                { bookItem.loveCount }
                              </div>
                              <div className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-[#355161] sm:text-xs">
                                <MessageSquare className="size-3 text-[#3d819b] sm:size-3.5" />
                                { bookItem.commentCount }
                              </div>
                            </div>
                          </div>
                        ) : null }
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
        member={ member }
        tags={ {
          selectedBookTags,
          activeBookTags,
        } }
        engagement={ {
          isEngaging,
          canEngage: selectedBook?.memberId !== member.memberId,
          commentText,
          setCommentText,
          onToggleReaction: handleToggleReaction,
          onAddComment: handleAddComment,
        } }
        save={ {
          onSave: () => bookDialog.handleSave(analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson),
          onDelete: handleDelete,
        } }
        formatCreatedAt={ formatCreatedAt }
      />

      <BookLinkDialog linkDialog={ linkDialog } />
    </section>
  );
}
