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
  Heading2,
  Heading3,
  Heart,
  Italic,
  LibraryBig,
  Link2,
  List,
  MessageSquare,
  PenSquare,
  Plus,
  Quote,
  Save,
  Tags,
  Type,
  Underline as UnderlineIcon,
  Unlink,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

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

type ComposerMode = "view" | "edit" | "add";
type SavePhase = "idle" | "saving" | "saved" | "error";

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
  return {
    id: bookRecord.id,
    bookTitle: bookRecord.bookTitle,
    authorName: bookRecord.authorName,
    bookLanguage: bookRecord.bookLanguage,
    bookYear: bookRecord.bookYear ? String(bookRecord.bookYear) : "",
    submitterName: createSubmitterLabel(bookRecord, member),
    likesCount: bookRecord.likesCount ?? 0,
    commentCount: bookRecord.commentCount ?? 0,
    likedByMember: bookRecord.likedByMember ?? false,
    memberId: bookRecord.memberId,
    familyId: bookRecord.familyId,
    status: bookRecord.status,
    createdAt: new Date(bookRecord.createdAt),
    analysisJson: bookRecord.analysisJson ?? JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: bookRecord.selectedTagIds ?? [],
    bookComments: bookRecord.bookComments ?? [],
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
        label="Paragraph"
        onClick={ () => editor.chain().focus().setParagraph().run() }
        active={ editor.isActive("paragraph") }
        disabled={ !editor.isEditable }
      >
        <Type className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        onClick={ () => editor.chain().focus().toggleHeading({ level: 2 }).run() }
        active={ editor.isActive("heading", { level: 2 }) }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleHeading({ level: 2 }).run() }
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
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
        label="Quote"
        onClick={ () => editor.chain().focus().toggleBlockquote().run() }
        active={ editor.isActive("blockquote") }
        disabled={ !editor.isEditable || !editor.can().chain().focus().toggleBlockquote().run() }
      >
        <Quote className="size-4" />
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
  const [composerMode, setComposerMode] = useState<ComposerMode>(books.length > 0 ? "view" : "add");
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pendingSelectedBookId, setPendingSelectedBookId] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [draft, setDraft] = useState<BookDraft>(() => {
    if (books[0]) {
      return createDraftFromBook(books[0], member);
    }

    return createEmptyDraft(member);
  });

  const selectedBook = bookItems.find((bookItem) => bookItem.id === selectedBookId) ?? null;
  const selectedBookComments = selectedBook?.bookComments ?? [];
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
    editable: composerMode !== "view",
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

    analysisEditor.setEditable(composerMode !== "view");
  }, [analysisEditor, composerMode]);

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

    if (composerMode === "view") {
      const nextSelectedBook = nextBookItems.find((bookItem) => bookItem.id === resolvedSelectedBookId) ?? nextBookItems[0] ?? null;

      if (nextSelectedBook) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(nextSelectedBook);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(createEmptyDraft(member));
      }
    }

    const receivedRefreshedBooks = previousBooksRef.current !== books;

    if (receivedRefreshedBooks && pendingSelectedBookId && nextBookItems.some((bookItem) => bookItem.id === pendingSelectedBookId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingSelectedBookId(null);

      if (savePhase === "saving") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavePhase("saved");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaveMessage("Book synced with the server order.");
      }
    }

    previousBooksRef.current = books;
  }, [books, composerMode, member, pendingSelectedBookId, savePhase, selectedBookId]);

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

  function loadBookIntoComposer(bookItem: BookDraft, mode: ComposerMode) {
    setSelectedBookId(bookItem.id);
    setDraft({ ...bookItem });
    setComposerMode(mode);
  }

  function handleSelectBook(bookId: number) {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    const bookItem = bookItems.find((candidate) => candidate.id === bookId);

    if (!bookItem) {
      return;
    }

    loadBookIntoComposer(bookItem, "view");
  }

  function handleAddBook() {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    setDraft(createEmptyDraft(member));
    setComposerMode("add");
  }

  function handleEditBook() {
    if (!selectedBook) {
      return;
    }

    if (!canEditSelected) {
      toast.error("Only the book submitter or an admin can edit this book.");
      return;
    }

    loadBookIntoComposer(selectedBook, "edit");
  }

  function handleCancel() {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    if (selectedBook) {
      loadBookIntoComposer(selectedBook, "view");
      return;
    }

    setDraft(createEmptyDraft(member));
    setComposerMode("add");
  }

  function toggleTag(tagId: number, checked: boolean | "indeterminate") {
    if (checked === "indeterminate") {
      return;
    }

    setDraft((currentDraft) => {
      if (checked) {
        if (currentDraft.selectedTagIds.includes(tagId) || currentDraft.selectedTagIds.length >= 3) {
          if (currentDraft.selectedTagIds.length >= 3 && !currentDraft.selectedTagIds.includes(tagId)) {
            toast.error("Select no more than three book tags.");
          }

          return currentDraft;
        }

        return {
          ...currentDraft,
          selectedTagIds: [...currentDraft.selectedTagIds, tagId],
        };
      }

      return {
        ...currentDraft,
        selectedTagIds: currentDraft.selectedTagIds.filter((currentTagId) => currentTagId !== tagId),
      };
    });
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

    setSavePhase("saving");
    setSaveMessage("Saving book and waiting for the refreshed server order...");

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
        setSaveMessage(result.message);
        toast.error(result.message);
        return;
      }

      const savedBook = createDraftFromBook(result.book, member);

      setPendingSelectedBookId(savedBook.id);
      setSelectedBookId(savedBook.id);
      setDraft(savedBook);
      setComposerMode("view");
      setSaveMessage("Saved. Refreshing the book list from the server...");
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

    if (composerMode === "view" && draft.id === updatedDraft.id) {
      setDraft(updatedDraft);
    }
  }

  function handleToggleLike() {
    if (!selectedBook || composerMode !== "view") {
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
    if (!selectedBook || composerMode !== "view") {
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

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(9,56,82,0.96),rgba(30,115,142,0.9)_52%,rgba(217,171,103,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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

                <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                  Book Besties is your family&apos;s book club. Post a book and discuss it with other book lovers in the family!
                </h1>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/book-terms"
                    className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ecfaff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <LibraryBig className="mr-2 size-4" />
                    Book Terms
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-88">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d7f4ff]">Books</p>
                  <p className="mt-2 text-2xl font-black">{ bookItems.length }</p>
                  <p className="text-sm text-[#e9fbff]">records in view</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d7f4ff]">Selected</p>
                  <p className="mt-2 text-lg font-black leading-tight">
                    { selectedBook?.bookTitle ?? "New book" }
                  </p>
                  { savePhase !== "idle" ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e9fbff]">
                      { savePhase === "saving" ? "Saving" : savePhase === "saved" ? "Synced" : "Save Error" }
                    </p>
                  ) : null }
                </div>
              </div>

              { saveMessage ? (
                <div className={ `rounded-3xl px-4 py-2 text-sm ${ savePhase === "error"
                  ? "border border-[#ffd0cf] bg-[#fff2f0] text-[#7c2e25]"
                  : "border border-white/20 bg-white/10 text-[#ecfaff]"
                  }` }>
                  { saveMessage }
                </div>
              ) : null }

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={ () => selectedBook && loadBookIntoComposer(selectedBook, "view") }
                  disabled={ !selectedBook || isSaving }
                  className="rounded-full bg-white text-[#0f435c] hover:bg-[#ecfaff]"
                >
                  <Eye className="size-4" />
                  View Book
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleToggleLike }
                  disabled={ !selectedBook || composerMode !== "view" || isEngaging }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Heart className={ `size-4 ${ selectedBook?.likedByMember ? "fill-white" : "" }` } />
                  { selectedBook?.likedByMember ? "Unlike" : "Like" }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleEditBook }
                  disabled={ !selectedBook || !canEditSelected || isSaving }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <PenSquare className="size-4" />
                  Edit Book
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleAddBook }
                  disabled={ isSaving }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Plus className="size-4" />
                  Add Book
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)] backdrop-blur xl:row-span-2">
            <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">
                    Book Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#183746]">
                    Select a Book Submission
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51707e]">
                    Select a book in the Book Directory to see its details. Family members can also like a book and add comments.
                  </p>
                </div>

                <div className="rounded-full border border-[#d9e5ea] bg-[#f4fbff] px-4 py-2 text-sm font-semibold text-[#51707e]">
                  { bookItems.length } book{ bookItems.length !== 1 ? "s" : "" }
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
                <div className="grid gap-3 md:grid-cols-2">
                  { bookItems.map((bookItem) => {
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
              ) }
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)]">
            <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">
                    Book Details
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#183746]">
                    { composerMode === "add" ? "Add a New Book" : composerMode === "edit" ? "Edit the Selected Book" : "View the Selected Book" }
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51707e]">
                    The submitter must provide the book title, author, language, year, and commentary. The rich-text area captures the family-facing notes for the selected book.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ handleCancel }
                    disabled={ isSaving }
                    className="rounded-full border-[#c8d7df] text-[#3d5c6d]"
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={ handleSave }
                    disabled={ composerMode === "view" || isSaving }
                    className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                  >
                    <Save className="size-4" />
                    { isSaving ? "Saving..." : "Save" }
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Name</label>
                  <Input
                    value={ draft.bookTitle }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookTitle: event.target.value })) }
                    placeholder="Enter the book title"
                    disabled={ composerMode === "view" }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Author Name</label>
                  <Input
                    value={ draft.authorName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, authorName: event.target.value })) }
                    placeholder="Enter the author name"
                    disabled={ composerMode === "view" }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#355161]">Book Year</label>
                  <Input
                    value={ draft.bookYear }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, bookYear: event.target.value })) }
                    placeholder="e.g. 1965"
                    disabled={ composerMode === "view" }
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
                    disabled={ composerMode === "view" }
                    className="border-[#c8d7df] text-[#183746]"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-[#355161]">Submitting Member</label>
                  <Input
                    value={ draft.submitterName }
                    disabled
                    className="border-[#c8d7df] bg-[#f2f8fb] text-[#3d5c6d]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(9,56,82,0.7)]">
            <div className="border-b border-[#d9e5ea] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,250,252,0.86))] px-5 py-5 sm:px-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#42748a]">
                Book Analysis, Tags and Family Comments
              </p>
              {/* <h2 className="mt-2 text-2xl font-black tracking-tight text-[#183746]">
                Notes, Tags, and Family Comments
              </h2> */}
              {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51707e]">
                Use the commentary editor for your description, analysis, or why the book matters to the family.
              </p> */}
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-[#355161]">Book Analysis</p>
                </div>
                <RichTextField
                  editor={ analysisEditor }
                  minHeightClass="min-h-[14rem]"
                  onSetLink={ openLinkDialog }
                />
              </div>

              <div className="space-y-3 rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-[#355161]">Book Tags</p>
                    <p className="text-sm text-[#51707e]">Choose up to three tags for this book submission.</p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#2f6a80]">
                    <Tags className="mr-2 size-3.5" />
                    { draft.selectedTagIds.length } / 3 selected
                  </div>
                </div>

                { bookTags.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-[#c8d7df] bg-white px-4 py-3 text-sm text-[#51707e]">
                    No book tag options are loaded on this page yet. Add rows to book_tag_reference to enable database-backed tag assignment.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    { (composerMode === "view" ? bookTags.filter((tagOption) => draft.selectedTagIds.includes(tagOption.id)) : bookTags).map((tagOption) => {
                      const isChecked = draft.selectedTagIds.includes(tagOption.id);

                      return (
                        <label
                          key={ tagOption.id }
                          className={ `flex items-start gap-3 rounded-3xl border px-4 py-3 ${ isChecked
                            ? "border-[#3d819b] bg-[#eaf7fd]"
                            : "border-[#d7e4ea] bg-white"
                            } ${ composerMode === "view" ? "opacity-80" : "cursor-pointer" }` }
                        >
                          <Checkbox
                            checked={ isChecked }
                            onCheckedChange={ (checked) => toggleTag(tagOption.id, checked) }
                            disabled={ composerMode === "view" || (!isChecked && draft.selectedTagIds.length >= 3) }
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#183746]">{ tagOption.tagName }</span>
                            { tagOption.tagDesc ? (
                              <span className="mt-1 block text-xs text-[#51707e]">{ tagOption.tagDesc }</span>
                            ) : null }
                          </span>
                        </label>
                      );
                    }) }
                  </div>
                ) }
              </div>

              { composerMode !== "add" ? (
                <div className="space-y-3 rounded-[1.4rem] border border-[#d9e5ea] bg-[#fbfeff] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#355161]">Family Comments</p>
                      <p className="text-sm text-[#51707e]">Share your thoughts on this book with your family.</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-[#c8d7df] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#2f6a80]">
                      <MessageSquare className="mr-2 size-3.5" />
                      { selectedBook?.commentCount ?? 0 } comments
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#355161]" htmlFor="book-comment-input">Add Comment</label>
                    <textarea
                      id="book-comment-input"
                      value={ commentText }
                      onChange={ (event) => setCommentText(event.target.value) }
                      placeholder="What stood out to you about this book?"
                      disabled={ !selectedBook || composerMode !== "view" || isEngaging }
                      className="min-h-24 w-full rounded-xl border border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#183746] outline-none transition focus-visible:ring-2 focus-visible:ring-[#3d819b]"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={ handleAddComment }
                        disabled={ !selectedBook || composerMode !== "view" || isEngaging || commentText.trim().length < 2 }
                        className="rounded-full bg-[#0f5c78] text-white hover:bg-[#0a4860]"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    { selectedBookComments.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[#c8d7df] bg-white px-3 py-2 text-sm text-[#51707e]">
                        No comments yet. Be the first family member to add one.
                      </p>
                    ) : (
                      selectedBookComments.map((bookComment) => (
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
          </div>
        </div>
      </div>

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
                onCheckedChange={ (checked) => setOpenLinkInNewTab(checked === true) }
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

          <DialogFooter className="pt-2">
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}