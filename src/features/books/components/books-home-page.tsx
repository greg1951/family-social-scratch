"use client";

import type { JSONContent } from "@tiptap/core";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import {
  ArrowLeft,
  Bold,
  Eye,
  Heading3,
  Heart,
  Italic,
  LibraryBig,
  Link2,
  List,
  MessageSquare,
  PenSquare,
  Plus,
  Redo2,
  Save,
  Search,
  Tags,
  Underline as UnderlineIcon,
  Unlink,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  addBookCommentAction,
  saveBooksHomeBookAction,
  toggleBookLikeAction,
} from "@/app/(features)/(books)/books/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { BookTagOption, BooksHomeBook } from "@/components/db/types/books";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import FeatureFaqHelp from "@/components/common/feature-faq-help";

type BookDraft = {
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
  bookComments: Array<{
    id: number;
    createdAt: Date;
    commenterName: string;
    text: string;
  }>;
};

type BookDialogMode = "view" | "edit" | "add";
type DirectoryMode = "latest" | "top-rated";
type SavePhase = "idle" | "saving" | "saved" | "error";

const BOOK_TAG_CATEGORY_SLOTS = [
  { seqNo: 10, fallbackName: "Fiction" },
  { seqNo: 30, fallbackName: "Non-Fiction" },
  { seqNo: 90, fallbackName: "Other" },
] as const;

type ToolbarButtonProps = {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

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

function createSubmitterLabel(bookRecord: BooksHomeBook, member: MemberKeyDetails) {
  if (bookRecord.submitterName) {
    return bookRecord.submitterName;
  }

  if (bookRecord.memberId === member.memberId) {
    return `${ member.firstName } ${ member.lastName }`;
  }

  return `Member #${ bookRecord.memberId }`;
}

function createDraftFromBook(bookRecord: BooksHomeBook, member: MemberKeyDetails): BookDraft {
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
    bookComments: summaryComments,
  };
}

function createEmptyDraft(member: MemberKeyDetails): BookDraft {
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
    bookComments: [],
  };
}

function ToolbarButton({ label, active = false, disabled = false, onClick, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={ onClick }
      disabled={ disabled }
      className={ active
        ? "rounded-full border-[#39637a] bg-[#dff4ff] text-[#12374a]"
        : "rounded-full border-[#c8d7df] bg-white text-[#3d5c6d]" }
      aria-label={ label }
    >
      { children }
    </Button>
  );
}

function RichTextToolbar({
  editor,
  onSetLink,
}: {
  editor: Editor | null;
  onSetLink: () => void;
}) {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-t-[1.4rem] border border-b-0 border-[#c8d7df] bg-[#f4fbff] p-3">
      <ToolbarButton
        label="Heading 3"
        onClick={ () => editor.chain().focus().toggleHeading({ level: 3 }).run() }
        active={ editor.isActive("heading", { level: 3 }) }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleHeading({ level: 3 }).run() }
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bold"
        onClick={ () => editor.chain().focus().toggleBold().run() }
        active={ editor.isActive("bold") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleBold().run() }
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        onClick={ () => editor.chain().focus().toggleItalic().run() }
        active={ editor.isActive("italic") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleItalic().run() }
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        onClick={ () => editor.chain().focus().toggleUnderline().run() }
        active={ editor.isActive("underline") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleUnderline().run() }
      >
        <UnderlineIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Set link"
        onClick={ onSetLink }
        active={ editor.isActive("link") }
        disabled={ !editor.isEditable }
      >
        <Link2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Remove link"
        onClick={ () => editor.chain().focus().extendMarkRange("link").unsetLink().run() }
        disabled={ !editor.isEditable || !editor.isActive("link") }
      >
        <Unlink className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        onClick={ () => editor.chain().focus().toggleBulletList().run() }
        active={ editor.isActive("bulletList") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleBulletList().run() }
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Undo"
        onClick={ () => editor.chain().focus().undo().run() }
        disabled={ !editor.can().chain().focus().undo().run() }
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        onClick={ () => editor.chain().focus().redo().run() }
        disabled={ !editor.can().chain().focus().redo().run() }
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function RichTextField({
  editor,
  minHeightClass,
  onSetLink,
}: {
  editor: Editor | null;
  minHeightClass: string;
  onSetLink: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] shadow-inner">
      <RichTextToolbar editor={ editor } onSetLink={ onSetLink } />
      <EditorContent
        editor={ editor }
        className={ `[&_.tiptap]:${ minHeightClass } [&_.tiptap]:rounded-b-[1.4rem] [&_.tiptap]:border [&_.tiptap]:border-[#c8d7df] [&_.tiptap]:bg-white [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-[#183746] [&_.tiptap]:outline-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#7eb2c7] [&_.tiptap_blockquote]:pl-4` }
      />
    </div>
  );
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
  const router = useRouter();
  const previousBooksRef = useRef(books);
  const [isSaving, startSaveTransition] = useTransition();
  const [isEngaging, startEngageTransition] = useTransition();
  const [bookItems, setBookItems] = useState(() => books.map((bookRecord) => createDraftFromBook(bookRecord, member)));
  const [selectedBookId, setSelectedBookId] = useState<number | null>(books[0]?.id ?? null);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [bookDialogMode, setBookDialogMode] = useState<BookDialogMode>("view");
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [pendingSelectedBookId, setPendingSelectedBookId] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [directoryMode, setDirectoryMode] = useState<DirectoryMode>("latest");
  const deferredSearchValue = useDeferredValue(searchValue);
  const [draft, setDraft] = useState<BookDraft>(() => {
    if (books[0]) {
      return createDraftFromBook(books[0], member);
    }

    return createEmptyDraft(member);
  });

  const selectedBook = bookItems.find((bookItem) => bookItem.id === selectedBookId) ?? null;
  const canEditSelected = selectedBook
    ? Boolean(member.isAdmin) || selectedBook.memberId === member.memberId
    : false;

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
    editable: bookDialogMode !== "view",
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

    analysisEditor.setEditable(bookDialogMode !== "view");
  }, [analysisEditor, bookDialogMode]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavePhase("saved");
    }

    previousBooksRef.current = books;
  }, [books, member, pendingSelectedBookId, selectedBookId]);

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

  function normalizeLinkUrl(value: string): string | null {
    const trimmedUrl = value.trim();

    if (!trimmedUrl) {
      return null;
    }

    const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl)
      ? trimmedUrl
      : `https://${ trimmedUrl }`;

    try {
      const normalizedUrl = new URL(candidate);

      if (!["http:", "https:", "mailto:", "tel:"].includes(normalizedUrl.protocol)) {
        return null;
      }

      return normalizedUrl.toString();
    } catch {
      return null;
    }
  }

  function openLinkDialog() {
    if (!analysisEditor || !analysisEditor.isEditable) {
      return;
    }

    const linkAttributes = analysisEditor.getAttributes("link") as {
      href?: string;
      target?: string | null;
    };

    setLinkValue(linkAttributes.href ?? "https://");
    setOpenLinkInNewTab(linkAttributes.target === "_blank");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!analysisEditor) {
      return;
    }

    const trimmedUrl = linkValue.trim();

    if (!trimmedUrl) {
      analysisEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkError(null);
      setIsLinkDialogOpen(false);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedUrl);

    if (!normalizedUrl) {
      setLinkError("Enter a valid http, https, mailto, or tel link.");
      return;
    }

    setLinkValue(normalizedUrl);
    setLinkError(null);

    analysisEditor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedUrl,
      target: openLinkInNewTab ? "_blank" : null,
      rel: openLinkInNewTab ? "noopener noreferrer nofollow" : null,
    }).run();

    setIsLinkDialogOpen(false);
  }

  const normalizedLinkPreview = linkValue.trim() ? normalizeLinkUrl(linkValue) : null;

  function getSelectedTagForCategory(categorySeqNo: number) {
    const categoryRange = getSeqNoRange(categorySeqNo);

    return draft.selectedTagIds.find((selectedTagId) => {
      const tagOption = activeBookTags.find((candidateTag) => candidateTag.id === selectedTagId);

      if (!tagOption) {
        return false;
      }

      return tagOption.seqNo >= categoryRange.rangeStart && tagOption.seqNo <= categoryRange.rangeEnd;
    });
  }

  function handleCategoryTagSelect(categorySeqNo: number, selectedValue: string) {
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

  function handleSelectBook(bookId: number) {
    setCommentText("");
    setSelectedBookId(bookId);
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

  function handleSave() {
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
        analysisJson: analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson,
        selectedTagIds: draft.selectedTagIds,
      });

      if (!result.success) {
        setSavePhase("error");
        toast.error(result.message);
        return;
      }

      const savedBook = createDraftFromBook(result.book, member);

      setPendingSelectedBookId(savedBook.id);
      setSelectedBookId(savedBook.id);
      setDraft(savedBook);
      setBookDialogMode("view");
      toast.success(result.message);
      router.refresh();
    });
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">Book Directory</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#51707e]">
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#183746]">Select a Book Submission</h2>
                  <FeatureFaqHelp
                    href=" /feature-faq?category=Book%20Besties"
                    buttonClassName="border-[#9dd8f0] bg-gradient-to-b from-[#f4fcff] to-[#d9f2ff] text-[#1d6d8f] shadow-[0_8px_18px_rgba(29,109,143,0.2)] group-hover:shadow-[0_12px_26px_rgba(29,109,143,0.3)]"
                    iconClassName="text-[#1d6d8f]"
                    tooltipClassName="bg-[#0f435c] text-[#ecfaff]"
                  />
                  <Button
                    type="button"
                    onClick={ () => openBookDialog("view") }
                    disabled={ !selectedBook }
                    className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                  >
                    <Eye className="size-4" />
                    View Book
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => openBookDialog("edit") }
                    disabled={ !selectedBook || !canEditSelected }
                    className="rounded-full border-[#0f5c78]/20 bg-white text-[#0f5c78] hover:bg-[#e9f5fa]"
                  >
                    <PenSquare className="size-4" />
                    Edit Book
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ () => openBookDialog("add") }
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

              <div className="rounded-full border border-[#d9e5ea] bg-[#f4fbff] px-4 py-2 text-sm font-semibold text-[#51707e]">
                { filteredBooks.length } visible book{ filteredBooks.length !== 1 ? "s" : "" }
              </div>
            </div>

            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#3d819b]" />
              <Input
                type="search"
                value={ searchValue }
                onChange={ (event) => setSearchValue(event.target.value) }
                placeholder="Search by title, author, year, language, or family member"
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
                    const isAwaitingServerSync = pendingSelectedBookId === bookItem.id && savePhase === "saving";

                    return (
                      <button
                        key={ bookItem.id }
                        type="button"
                        onClick={ () => handleSelectBook(bookItem.id) }
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

      <Dialog open={ isBookDialogOpen } onOpenChange={ setIsBookDialogOpen }>
        <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-[#183746]">
              { bookDialogMode === "add" ? "Add a New Book" : draft.bookTitle || "Book Details" }
            </DialogTitle>
            <DialogDescription className="text-[#51707e]">
              { bookDialogMode === "add"
                ? "Fill in the book details and analysis, then save."
                : bookDialogMode === "edit"
                  ? "Update the book details and analysis, then save."
                  : "Read book details, analysis, tags, and family reactions." }
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[85vh] space-y-4 overflow-auto pr-1">
            { bookDialogMode !== "view" ? (
              <div className="rounded-2xl border border-[#bdd9e8] bg-[#edf7fb] px-4 py-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[#2d5a6f]">
                    { bookDialogMode === "add" ? "Enter details for the new book submission." : "You are editing this book submission." }
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={ handleCancelDialog }
                      disabled={ isSaving }
                      className="rounded-full border-[#c8d7df] text-[#3d5c6d]"
                    >
                      <X className="size-4" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={ handleSave }
                      disabled={ isSaving }
                      className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                    >
                      <Save className="size-4" />
                      { isSaving ? "Saving..." : "Save Book" }
                    </Button>
                  </div>
                </div>
              </div>
            ) : null }

            <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#42748a]">Book Details</p>
                  { bookDialogMode === "view" ? (
                    <p className="mt-1 text-sm text-[#355161]">
                      { draft.bookTitle } by { draft.authorName } ({ draft.bookYear || "Unknown year" }) &middot; { draft.bookLanguage }
                    </p>
                  ) : null }
                </div>
                { bookDialogMode === "view" ? (
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5d8aa0]">
                    Added { formatCreatedAt(draft.createdAt) }
                  </p>
                ) : null }
              </div>

              { bookDialogMode !== "view" ? (
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
                  {/* <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-[#355161]">Submitting Member</label>
                    <Input
                      value={ draft.submitterName }
                      disabled
                      className="border-[#c8d7df] bg-[#f2f8fb] text-[#3d5c6d]"
                    />
                  </div> */}
                </div>
              ) : null }
            </div>

            <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#42748a]">Book Analysis</p>
              { bookDialogMode === "view" ? (
                <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#c8d7df] bg-white px-4 py-4 [&_.tiptap]:text-[#183746] [&_.tiptap]:outline-none [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#7eb2c7] [&_.tiptap_blockquote]:pl-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5">
                  <EditorContent editor={ analysisEditor } />
                </div>
              ) : (
                <div className="mt-3">
                  <RichTextField
                    editor={ analysisEditor }
                    minHeightClass="min-h-[14rem]"
                    onSetLink={ openLinkDialog }
                  />
                </div>
              ) }
            </div>

            <div className="rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#355161]">Book Tags</p>
                <div className="inline-flex items-center rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#2f6a80]">
                  <Tags className="mr-2 size-3.5" />
                  { bookDialogMode === "view"
                    ? `${ selectedBookTags.length } tag${ selectedBookTags.length !== 1 ? "s" : "" }`
                    : `${ draft.selectedTagIds.length } / 3 selected` }
                </div>
              </div>

              { bookDialogMode === "view" ? (
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
                        const selectedTagId = getSelectedTagForCategory(categoryTagOption.seqNo);

                        return (
                          <div key={ categoryTagOption.seqNo } className="space-y-2 rounded-2xl border border-[#d7e4ea] bg-white p-3">
                            <label className="text-sm font-semibold text-[#355161]">
                              { categoryTagOption.categoryName }
                            </label>
                            <Select
                              value={ selectedTagId ? String(selectedTagId) : "none" }
                              onValueChange={ (value) => handleCategoryTagSelect(categoryTagOption.seqNo, value) }
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

            { bookDialogMode === "view" ? (
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
                      onClick={ handleToggleLike }
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
                        onClick={ handleAddComment }
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

      <Dialog open={ isLinkDialogOpen } onOpenChange={ setIsLinkDialogOpen }>
        <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#183746]">Edit Link</DialogTitle>
            <DialogDescription className="text-[#51707e]">
              Add or replace the URL for the selected text. Leave it blank to remove the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#183746]" htmlFor="books-home-link-url">
              URL
            </label>
            <Input
              id="books-home-link-url"
              value={ linkValue }
              onChange={ (event) => {
                setLinkValue(event.target.value);

                if (linkError) {
                  setLinkError(null);
                }
              } }
              placeholder="https://example.com"
              className="border-[#c8d7df] bg-white text-[#183746]"
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="books-home-link-target"
                checked={ openLinkInNewTab }
                onCheckedChange={ (checked: boolean | "indeterminate") => setOpenLinkInNewTab(checked === true) }
              />
              <label className="text-sm text-[#355161]" htmlFor="books-home-link-target">
                Open in new tab
              </label>
            </div>
            { linkError ? (
              <p className="text-sm text-red-500">{ linkError }</p>
            ) : null }
            <div className="rounded-xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
              <p className="font-semibold text-[#183746]">Preview</p>
              <p className="mt-1 break-all">
                { normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#5d8aa0]">
                { openLinkInNewTab ? "Opens In New Tab" : "Opens In Current Tab" }
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={ () => {
                if (analysisEditor?.isActive("link")) {
                  analysisEditor.chain().focus().extendMarkRange("link").unsetLink().run();
                }

                setIsLinkDialogOpen(false);
              } }
            >
              Remove Link
            </Button>
            <Button type="button" onClick={ applyLink }>
              Apply Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
