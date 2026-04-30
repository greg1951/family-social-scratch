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
  addPoemCommentAction,
  savePoetryHomePoemAction,
  togglePoemLikeAction,
} from "@/app/(features)/(poetry)/poetry/actions";
import {
  createEmptyTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { PoemTagOption, PoetryHomePoem } from "@/components/db/types/poem-verses";
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

type PoemDraft = {
  id: number;
  poemTitle: string;
  poetName: string;
  poemYear: string;
  poemSource: string;
  submitterName: string;
  likesCount: number;
  commentCount: number;
  likedByMember: boolean;
  memberId: number;
  familyId: number;
  status: string;
  createdAt: Date;
  verseJson: string;
  analysisJson: string;
  selectedTagIds: number[];
  poemComments: Array<{
    id: number;
    createdAt: Date;
    commenterName: string;
    text: string;
  }>;
};

type ComposerMode = "view" | "edit" | "add";
type SavePhase = "idle" | "saving" | "saved" | "error";
type LinkEditorTarget = "verse" | "analysis";

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

function createSubmitterLabel(poemRecord: PoetryHomePoem, member: MemberKeyDetails) {
  if (poemRecord.submitterName) {
    return poemRecord.submitterName;
  }

  if (poemRecord.memberId === member.memberId) {
    return `${ member.firstName } ${ member.lastName }`;
  }

  return `Member #${ poemRecord.memberId }`;
}

function createDraftFromPoem(poemRecord: PoetryHomePoem, member: MemberKeyDetails): PoemDraft {
  return {
    id: poemRecord.id,
    poemTitle: poemRecord.poemTitle,
    poetName: poemRecord.poetName,
    poemYear: poemRecord.poemYear ? String(poemRecord.poemYear) : "",
    poemSource: poemRecord.poemSource,
    submitterName: createSubmitterLabel(poemRecord, member),
    likesCount: poemRecord.likesCount ?? 0,
    commentCount: poemRecord.commentCount ?? 0,
    likedByMember: poemRecord.likedByMember ?? false,
    memberId: poemRecord.memberId,
    familyId: poemRecord.familyId,
    status: poemRecord.status,
    createdAt: new Date(poemRecord.createdAt),
    verseJson: poemRecord.verseJson ?? JSON.stringify(createEmptyTipTapDocument()),
    analysisJson: poemRecord.analysisJson ?? JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: poemRecord.selectedTagIds ?? [],
    poemComments: poemRecord.poemComments ?? [],
  };
}

function createEmptyDraft(member: MemberKeyDetails): PoemDraft {
  return {
    id: -Date.now(),
    poemTitle: "",
    poetName: "",
    poemYear: "",
    poemSource: "Unknown",
    submitterName: `${ member.firstName } ${ member.lastName }`,
    likesCount: 0,
    commentCount: 0,
    likedByMember: false,
    memberId: member.memberId,
    familyId: member.familyId,
    status: "draft",
    createdAt: new Date(),
    verseJson: JSON.stringify(createEmptyTipTapDocument()),
    analysisJson: JSON.stringify(createEmptyTipTapDocument()),
    selectedTagIds: [],
    poemComments: [],
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
        ? "rounded-full border-[#8c62b5] bg-[#f2e8ff] text-[#4e2374]"
        : "rounded-full border-[#d7d0ea] bg-white text-[#6a4f83]" }
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
    <div className="flex flex-wrap gap-2 rounded-t-[1.4rem] border border-b-0 border-[#d7d0ea] bg-[#faf6ff] p-3">
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
        className={ `[&_.tiptap]:${ minHeightClass } [&_.tiptap]:rounded-b-[1.4rem] [&_.tiptap]:border [&_.tiptap]:border-[#d7d0ea] [&_.tiptap]:bg-white [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:text-[#43245d] [&_.tiptap]:outline-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#cfbbe3] [&_.tiptap_blockquote]:pl-4` }
      />
    </div>
  );
}

export default function PoetryHomePage({
  poems,
  member,
  poemTags = [],
}: {
  poems: PoetryHomePoem[];
  member: MemberKeyDetails;
  poemTags?: PoemTagOption[];
}) {
  const router = useRouter();
  const previousPoemsRef = useRef(poems);
  const [isSaving, startSaveTransition] = useTransition();
  const [isEngaging, startEngageTransition] = useTransition();
  const [poemItems, setPoemItems] = useState(() => poems.map((poemRecord) => createDraftFromPoem(poemRecord, member)));
  const [selectedPoemId, setSelectedPoemId] = useState<number | null>(poems[0]?.id ?? null);
  const [composerMode, setComposerMode] = useState<ComposerMode>(poems.length > 0 ? "view" : "add");
  const [savePhase, setSavePhase] = useState<SavePhase>("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [pendingSelectedPoemId, setPendingSelectedPoemId] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkEditorTarget, setLinkEditorTarget] = useState<LinkEditorTarget | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [draft, setDraft] = useState<PoemDraft>(() => {
    if (poems[0]) {
      return createDraftFromPoem(poems[0], member);
    }

    return createEmptyDraft(member);
  });
  const activePoemTags = poemTags.filter((tagOption) => tagOption.status !== "archived");
  const categoryTags = activePoemTags
    .filter((tagOption) => tagOption.tagType === "category")
    .sort((leftTag, rightTag) => leftTag.seqNo - rightTag.seqNo || leftTag.tagName.localeCompare(rightTag.tagName));
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categoryTags[0]?.id ?? null);

  const selectedPoem = poemItems.find((poemItem) => poemItem.id === selectedPoemId) ?? null;
  const selectedPoemComments = selectedPoem?.poemComments ?? [];
  const selectedCategory = categoryTags.find((tagOption) => tagOption.id === selectedCategoryId) ?? null;
  const selectedCategoryRange = selectedCategory ? getSeqNoRange(selectedCategory.seqNo) : null;
  const scopedPoemTags = selectedCategoryRange
    ? activePoemTags
      .filter((tagOption) => tagOption.seqNo >= selectedCategoryRange.rangeStart && tagOption.seqNo <= selectedCategoryRange.rangeEnd)
      .sort((leftTag, rightTag) => leftTag.seqNo - rightTag.seqNo || leftTag.tagName.localeCompare(rightTag.tagName))
    : [];
  const canEditSelected = selectedPoem
    ? Boolean(member.isAdmin) || selectedPoem.memberId === member.memberId
    : false;

  const verseEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
    ],
    content: getEditorDocument(draft.verseJson),
    editable: composerMode !== "view",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[14rem]",
      },
    },
    onUpdate({ editor }) {
      setDraft((currentDraft) => ({
        ...currentDraft,
        verseJson: serializeTipTapDocument(editor.getJSON()),
      }));
    },
  });

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
    if (!verseEditor) {
      return;
    }

    verseEditor.setEditable(composerMode !== "view");
  }, [composerMode, verseEditor]);

  useEffect(() => {
    if (!analysisEditor) {
      return;
    }

    analysisEditor.setEditable(composerMode !== "view");
  }, [analysisEditor, composerMode]);

  useEffect(() => {
    if (!verseEditor) {
      return;
    }

    const editorJson = serializeTipTapDocument(verseEditor.getJSON());

    if (editorJson !== draft.verseJson) {
      verseEditor.commands.setContent(getEditorDocument(draft.verseJson));
    }
  }, [draft.id, draft.verseJson, verseEditor]);

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
    const nextPoemItems = poems.map((poem) => createDraftFromPoem(poem, member));
    const resolvedSelectedPoemId = pendingSelectedPoemId
      && nextPoemItems.some((poemItem) => poemItem.id === pendingSelectedPoemId)
      ? pendingSelectedPoemId
      : selectedPoemId;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPoemItems(nextPoemItems);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedPoemId((currentSelectedPoemId) => {
      const preferredPoemId = resolvedSelectedPoemId ?? currentSelectedPoemId;

      if (preferredPoemId && nextPoemItems.some((poemItem) => poemItem.id === preferredPoemId)) {
        return preferredPoemId;
      }

      return nextPoemItems[0]?.id ?? null;
    });

    if (composerMode === "view") {
      const nextSelectedPoem = nextPoemItems.find((poemItem) => poemItem.id === resolvedSelectedPoemId) ?? nextPoemItems[0] ?? null;

      if (nextSelectedPoem) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(nextSelectedPoem);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDraft(createEmptyDraft(member));
      }
    }

    const receivedRefreshedPoems = previousPoemsRef.current !== poems;

    if (receivedRefreshedPoems && pendingSelectedPoemId && nextPoemItems.some((poemItem) => poemItem.id === pendingSelectedPoemId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingSelectedPoemId(null);

      if (savePhase === "saving") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavePhase("saved");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSaveMessage("Poem synced with the server order.");
      }
    }

    previousPoemsRef.current = poems;
  }, [composerMode, member, pendingSelectedPoemId, poems, savePhase, selectedPoemId]);

  useEffect(() => {
    if (categoryTags.length === 0) {
      if (selectedCategoryId !== null) {
        setSelectedCategoryId(null);
      }

      return;
    }

    if (selectedCategoryId && categoryTags.some((tagOption) => tagOption.id === selectedCategoryId)) {
      return;
    }

    const selectedTag = activePoemTags.find((tagOption) => draft.selectedTagIds.includes(tagOption.id));

    if (!selectedTag) {
      setSelectedCategoryId(categoryTags[0].id);
      return;
    }

    const selectedRange = getSeqNoRange(selectedTag.seqNo);
    const matchingCategory = categoryTags.find((tagOption) => (
      tagOption.seqNo >= selectedRange.rangeStart && tagOption.seqNo <= selectedRange.rangeEnd
    ));

    setSelectedCategoryId(matchingCategory?.id ?? categoryTags[0].id);
  }, [activePoemTags, categoryTags, draft.selectedTagIds, selectedCategoryId]);

  function getEditorForTarget(target: LinkEditorTarget | null): Editor | null {
    if (target === "verse") {
      return verseEditor;
    }

    if (target === "analysis") {
      return analysisEditor;
    }

    return null;
  }

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

  function openLinkDialog(target: LinkEditorTarget) {
    const editor = getEditorForTarget(target);

    if (!editor || !editor.isEditable) {
      return;
    }

    const linkAttributes = editor.getAttributes("link") as {
      href?: string;
      target?: string | null;
    };

    setLinkEditorTarget(target);
    setLinkValue(linkAttributes.href ?? "https://");
    setOpenLinkInNewTab(linkAttributes.target === "_blank");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    const editor = getEditorForTarget(linkEditorTarget);

    if (!editor) {
      return;
    }

    const trimmedUrl = linkValue.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
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

    editor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedUrl,
      target: openLinkInNewTab ? "_blank" : null,
      rel: openLinkInNewTab ? "noopener noreferrer nofollow" : null,
    }).run();

    setIsLinkDialogOpen(false);
  }

  const normalizedLinkPreview = linkValue.trim() ? normalizeLinkUrl(linkValue) : null;

  function loadPoemIntoComposer(poemItem: PoemDraft, mode: ComposerMode) {
    setSelectedPoemId(poemItem.id);
    setDraft({ ...poemItem });
    setComposerMode(mode);
  }

  function handleSelectPoem(poemId: number) {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    const poemItem = poemItems.find((candidate) => candidate.id === poemId);

    if (!poemItem) {
      return;
    }

    loadPoemIntoComposer(poemItem, "view");
  }

  function handleAddPoem() {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    setDraft(createEmptyDraft(member));
    setComposerMode("add");
  }

  function handleEditPoem() {
    if (!selectedPoem) {
      return;
    }

    if (!canEditSelected) {
      toast.error("Only the poem submitter or an admin can edit this poem.");
      return;
    }

    loadPoemIntoComposer(selectedPoem, "edit");
  }

  function handleCancel() {
    setSavePhase("idle");
    setSaveMessage("");
    setCommentText("");
    if (selectedPoem) {
      loadPoemIntoComposer(selectedPoem, "view");
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
            toast.error("Select no more than three poem tags.");
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

  function handleCategorySelect(categoryId: number) {
    const nextCategory = categoryTags.find((tagOption) => tagOption.id === categoryId);

    if (!nextCategory) {
      return;
    }

    setSelectedCategoryId(categoryId);

    const range = getSeqNoRange(nextCategory.seqNo);
    const allowedTagIds = new Set(
      activePoemTags
        .filter((tagOption) => tagOption.seqNo >= range.rangeStart && tagOption.seqNo <= range.rangeEnd)
        .map((tagOption) => tagOption.id)
    );

    setDraft((currentDraft) => ({
      ...currentDraft,
      selectedTagIds: currentDraft.selectedTagIds.filter((selectedTagId) => allowedTagIds.has(selectedTagId)),
    }));
  }

  function handleSave() {
    const normalizedTitle = draft.poemTitle.trim();
    const normalizedPoetName = draft.poetName.trim();
    const normalizedYear = draft.poemYear.trim();

    if (!normalizedTitle) {
      toast.error("Enter a poem name before saving.");
      return;
    }

    if (!normalizedPoetName) {
      toast.error("Enter a poet name before saving.");
      return;
    }

    if (!/^\d{1,4}$/.test(normalizedYear)) {
      toast.error("Enter a valid numeric poem year.");
      return;
    }

    setSavePhase("saving");
    setSaveMessage("Saving poem and waiting for the refreshed server order...");

    startSaveTransition(async () => {
      const result = await savePoetryHomePoemAction({
        id: draft.id > 0 ? draft.id : undefined,
        poemTitle: normalizedTitle,
        poetName: normalizedPoetName,
        poemSource: draft.poemSource,
        poemYear: Number(normalizedYear),
        status: draft.status,
        verseJson: verseEditor ? serializeTipTapDocument(verseEditor.getJSON()) : draft.verseJson,
        analysisJson: analysisEditor ? serializeTipTapDocument(analysisEditor.getJSON()) : draft.analysisJson,
        selectedTagIds: draft.selectedTagIds,
      });

      if (!result.success) {
        setSavePhase("error");
        setSaveMessage(result.message);
        toast.error(result.message);
        return;
      }

      const savedPoem = createDraftFromPoem(result.poem, member);

      setPendingSelectedPoemId(savedPoem.id);
      setSelectedPoemId(savedPoem.id);
      setDraft(savedPoem);
      setComposerMode("view");
      setSaveMessage("Saved. Refreshing the poem list from the server...");
      toast.success(result.message);
      router.refresh();
    });
  }

  function applyPoemRefresh(updatedPoem: PoetryHomePoem) {
    const updatedDraft = createDraftFromPoem(updatedPoem, member);

    setPoemItems((currentPoems) => currentPoems.map((poemItem) => (
      poemItem.id === updatedDraft.id ? updatedDraft : poemItem
    )));
    setSelectedPoemId(updatedDraft.id);

    if (composerMode === "view" && draft.id === updatedDraft.id) {
      setDraft(updatedDraft);
    }
  }

  function handleToggleLike() {
    if (!selectedPoem || composerMode !== "view") {
      return;
    }

    startEngageTransition(async () => {
      const result = await togglePoemLikeAction({
        poemId: selectedPoem.id,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      applyPoemRefresh(result.poem);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedPoem || composerMode !== "view") {
      return;
    }

    const normalizedComment = commentText.trim();

    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addPoemCommentAction({
        poemId: selectedPoem.id,
        commentText: normalizedComment,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      applyPoemRefresh(result.poem);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(57,27,88,0.96),rgba(104,53,148,0.88)_56%,rgba(195,150,110,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(46,18,70,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f1deff]">
                Family Poetry Cafe
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Main Page
                </Link>

              </div>

              <h1 className="mt-4 text-lg font-black tracking-tight sm:text-2xl">
                Welcome to your family Poetry Cafe. Share your favorite poems and comment on each other's favorites.
              </h1>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/poem-terms"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f6ebff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <LibraryBig className="mr-2 size-4" />
                  Poetry Terms
                </Link>

              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-88">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ead3ff]">Poems</p>
                  <p className="mt-2 text-2xl font-black">{ poemItems.length }</p>
                  <p className="text-sm text-[#f3e8ff]">records in view</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#ead3ff]">Selected</p>
                  <p className="mt-2 text-lg font-black leading-tight">
                    { selectedPoem?.poemTitle ?? "New poem" }
                  </p>
                  { savePhase !== "idle" ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#f3e8ff]">
                      { savePhase === "saving" ? "Saving" : savePhase === "saved" ? "Synced" : "Save Error" }
                    </p>
                  ) : null }
                </div>
              </div>

              { saveMessage ? (
                <div className={ `rounded-3xl px-4 py-2 text-sm ${ savePhase === "error"
                  ? "border border-[#f3bfd1] bg-[#fff1f5] text-[#7b2345]"
                  : "border border-white/20 bg-white/10 text-[#f6ebff]"
                  }` }>
                  { saveMessage }
                </div>
              ) : null }

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={ () => selectedPoem && loadPoemIntoComposer(selectedPoem, "view") }
                  disabled={ !selectedPoem || isSaving }
                  className="rounded-full bg-white text-[#4e2374] hover:bg-[#f6ebff]"
                >
                  <Eye className="size-4" />
                  View Poem
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleToggleLike }
                  disabled={ !selectedPoem || composerMode !== "view" || isEngaging }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Heart className={ `size-4 ${ selectedPoem?.likedByMember ? "fill-white" : "" }` } />
                  { selectedPoem?.likedByMember ? "Unlike" : "Like" }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleEditPoem }
                  disabled={ !selectedPoem || !canEditSelected || isSaving }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <PenSquare className="size-4" />
                  Edit Poem
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={ handleAddPoem }
                  disabled={ isSaving }
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Plus className="size-4" />
                  Add Poem
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)] backdrop-blur xl:row-span-2">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                    Poem Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#43245d]">
                    Select a Poem Submission
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                    Select a poem in the Poem Directory to see its details. Or, if you like a poem then you can like it and comment on it as well.
                  </p>
                </div>

                <div className="rounded-full border border-[#e4d9ee] bg-[#faf6ff] px-4 py-2 text-sm font-semibold text-[#77578f]">
                  { poemItems.length } poem{ poemItems.length !== 1 ? "s" : "" }
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              { poemItems.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-[#d7d0ea] bg-[#faf8ff] px-6 py-10 text-center text-[#77578f]">
                  <LibraryBig className="mx-auto mb-3 size-10 text-[#9a79b8]" />
                  <p className="text-lg font-semibold text-[#43245d]">No poem facts are available yet.</p>
                  <p className="mt-2 text-sm">Use Add Poem to create the first submission for this family.</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">

                  { poemItems.map((poemItem) => {
                    const isSelected = poemItem.id === selectedPoemId;
                    const isAwaitingServerSync = pendingSelectedPoemId === poemItem.id && savePhase === "saving";

                    return (
                      <button
                        key={ poemItem.id }
                        type="button"
                        onClick={ () => handleSelectPoem(poemItem.id) }
                        className={ `grid w-full gap-2 rounded-[1.4rem] border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c62b5] sm:gap-3 sm:px-4 sm:py-4 ${ isSelected
                          ? "border-[#8c62b5] bg-[linear-gradient(135deg,rgba(244,236,255,0.95),rgba(252,248,255,0.95))] shadow-[0_18px_45px_-35px_rgba(80,40,120,0.7)]"
                          : "border-[#e6deef] bg-white hover:border-[#c7b2db] hover:bg-[#fcfaff]"
                          }` }
                      >
                        <div>
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#8b69ab]">Poem</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="wrap-break-word text-base font-bold leading-snug text-[#43245d] sm:text-lg">{ poemItem.poemTitle }</p>
                            { isAwaitingServerSync ? (
                              <span className="rounded-full bg-[#efe3fb] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#7b54a0]">
                                Syncing
                              </span>
                            ) : null }
                          </div>
                          <p className="mt-1 text-[0.7rem] text-[#8d739f] sm:text-xs">Created { formatCreatedAt(poemItem.createdAt) }</p>
                        </div>
                        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:gap-x-8 md:items-center md:gap-x-10">
                          <div className="min-w-26">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#8b69ab]">Poet</p>
                            <p className="text-xs font-semibold text-[#5c446f] sm:text-sm">{ poemItem.poetName }</p>
                          </div>
                          <div className="min-w-18">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#8b69ab]">Year</p>
                            <p className="text-xs font-semibold text-[#5c446f] sm:text-sm">{ poemItem.poemYear || "-" }</p>
                          </div>
                          <div className="min-w-32 max-w-full">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#8b69ab]">Submitter</p>
                            <p className="wrap-break-word text-xs font-semibold text-[#5c446f] sm:text-sm">{ poemItem.submitterName }</p>
                          </div>
                          <div className="inline-flex min-w-18 items-center gap-1.5 text-xs font-semibold text-[#5c446f] sm:text-sm">
                            <Heart className="size-3.5 text-[#a86a8e] sm:size-4" />
                            { poemItem.likesCount }
                          </div>
                          <div className="inline-flex min-w-18 items-center gap-1.5 text-xs font-semibold text-[#5c446f] sm:text-sm">
                            <MessageSquare className="size-3.5 text-[#7a5a9f] sm:size-4" />
                            { poemItem.commentCount }
                          </div>
                        </div>
                      </button>
                    );
                  }) }
                </div>
              ) }
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                    Poem Verse
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#43245d]">
                    { composerMode === "add" ? "Add a New Poem" : composerMode === "edit" ? "Edit the Selected Poem" : "View the Selected Poem" }
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                    The submitter must provide the poem title, poet name, year, and verse content. The verse editor is intended to serialize into the poem_verse record.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={ handleCancel }
                    disabled={ isSaving }
                    className="rounded-full border-[#d7d0ea] text-[#6d5384]"
                  >
                    <X className="size-4" />
                    Cancel
                  </Button>

                  <Button
                    type="button"
                    onClick={ handleSave }
                    disabled={ composerMode === "view" || isSaving }
                    className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
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
                  <label className="text-sm font-semibold text-[#5d426f]">Poem Name</label>
                  <Input
                    value={ draft.poemTitle }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemTitle: event.target.value })) }
                    placeholder="Enter the poem title"
                    disabled={ composerMode === "view" }
                    className="border-[#d7d0ea] text-[#43245d]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5d426f]">Poet Name</label>
                  <Input
                    value={ draft.poetName }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poetName: event.target.value })) }
                    placeholder="Enter the poet name"
                    disabled={ composerMode === "view" }
                    className="border-[#d7d0ea] text-[#43245d]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5d426f]">Poem Year</label>
                  <Input
                    value={ draft.poemYear }
                    onChange={ (event) => setDraft((currentDraft) => ({ ...currentDraft, poemYear: event.target.value })) }
                    placeholder="e.g. 1923"
                    disabled={ composerMode === "view" }
                    inputMode="numeric"
                    className="border-[#d7d0ea] text-[#43245d]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#5d426f]">Submitting Member</label>
                  <Input
                    value={ draft.submitterName }
                    disabled
                    className="border-[#d7d0ea] bg-[#f7f2fc] text-[#6d5384]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-[#5d426f]">Poem Verse</p>
                  <p className="text-sm leading-6 text-[#77578f]">
                    Write or paste the verse here.
                  </p>
                </div>
                <RichTextField
                  editor={ verseEditor }
                  minHeightClass="min-h-[18rem]"
                  onSetLink={ () => openLinkDialog("verse") }
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(57,27,88,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-5 py-5 sm:px-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#8154a3]">
                Poem Analysis
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77578f]">
                The poem submitter&apos;s analysis of the poem appears below.
              </p>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-[#5d426f]">Poem Analysis</p>
                </div>
                <RichTextField
                  editor={ analysisEditor }
                  minHeightClass="min-h-[14rem]"
                  onSetLink={ () => openLinkDialog("analysis") }
                />
              </div>

              <div className="space-y-3 rounded-[1.4rem] border border-[#e4d9ee] bg-[#fcfaff] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#5d426f]">Poem Tags</p>
                    <p className="text-sm text-[#77578f]">Choose up to three tags for this poem submission.</p>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-[#d7d0ea] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7b54a0]">
                    <Tags className="mr-2 size-3.5" />
                    { draft.selectedTagIds.length } / 3 selected
                  </div>
                </div>

                { activePoemTags.length === 0 ? (
                  <p className="rounded-3xl border border-dashed border-[#d7d0ea] bg-white px-4 py-3 text-sm text-[#7a5f91]">
                    No poem tag options are loaded on this page yet. Add a poem_tag_reference query and pass those options here to enable database-backed tag assignment.
                  </p>
                ) : composerMode === "view" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    { poemTags.filter((tagOption) => draft.selectedTagIds.includes(tagOption.id)).map((tagOption) => {
                      const isChecked = draft.selectedTagIds.includes(tagOption.id);

                      return (
                        <label
                          key={ tagOption.id }
                          className={ `flex items-start gap-3 rounded-3xl border px-4 py-3 ${ isChecked
                            ? "border-[#8c62b5] bg-[#f4ecff]"
                            : "border-[#ded3ea] bg-white"
                            } opacity-80` }
                        >
                          <Checkbox
                            checked={ isChecked }
                            disabled
                            className="mt-0.5"
                          />
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#43245d]">{ tagOption.tagName }</span>
                            { tagOption.tagDesc ? (
                              <span className="mt-1 block text-xs text-[#77578f]">{ tagOption.tagDesc }</span>
                            ) : null }
                          </span>
                        </label>
                      );
                    }) }
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b54a0]">Category</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        { categoryTags.map((categoryTag) => (
                          <Button
                            key={ categoryTag.id }
                            type="button"
                            variant="outline"
                            onClick={ () => handleCategorySelect(categoryTag.id) }
                            className={ selectedCategoryId === categoryTag.id
                              ? "rounded-full border-[#8c62b5] bg-[#f2e8ff] text-[#4e2374]"
                              : "rounded-full border-[#d7d0ea] bg-white text-[#6a4f83]" }
                          >
                            { categoryTag.tagName }
                          </Button>
                        )) }
                      </div>
                    </div>

                    { scopedPoemTags.length === 0 ? (
                      <p className="rounded-3xl border border-dashed border-[#d7d0ea] bg-white px-4 py-3 text-sm text-[#7a5f91]">
                        Select a category to load tag references.
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        { scopedPoemTags.map((tagOption) => {
                          const isChecked = draft.selectedTagIds.includes(tagOption.id);

                          return (
                            <label
                              key={ tagOption.id }
                              className={ `flex items-start gap-3 rounded-3xl border px-4 py-3 ${ isChecked
                                ? "border-[#8c62b5] bg-[#f4ecff]"
                                : "border-[#ded3ea] bg-white"
                                } cursor-pointer` }
                            >
                              <Checkbox
                                checked={ isChecked }
                                onCheckedChange={ (checked) => toggleTag(tagOption.id, checked) }
                                disabled={ !isChecked && draft.selectedTagIds.length >= 3 }
                                className="mt-0.5"
                              />
                              <span className="min-w-0">
                                <span className="block font-semibold text-[#43245d]">{ tagOption.tagName }</span>
                                { tagOption.tagDesc ? (
                                  <span className="mt-1 block text-xs text-[#77578f]">{ tagOption.tagDesc }</span>
                                ) : null }
                              </span>
                            </label>
                          );
                        }) }
                      </div>
                    ) }
                  </div>
                ) }
              </div>

              { composerMode !== "add" ? (
                <div className="space-y-3 rounded-[1.4rem] border border-[#e4d9ee] bg-[#fcfaff] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#5d426f]">Family Comments</p>
                      <p className="text-sm text-[#77578f]">Share your thoughts on this poem with your family.</p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-[#d7d0ea] bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#7b54a0]">
                      <MessageSquare className="mr-2 size-3.5" />
                      { selectedPoem?.commentCount ?? 0 } comments
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#5d426f]" htmlFor="poem-comment-input">Add Comment</label>
                    <textarea
                      id="poem-comment-input"
                      value={ commentText }
                      onChange={ (event) => setCommentText(event.target.value) }
                      placeholder="What stood out to you in this poem?"
                      disabled={ !selectedPoem || composerMode !== "view" || isEngaging }
                      className="min-h-24 w-full rounded-xl border border-[#d7d0ea] bg-white px-3 py-2 text-sm text-[#43245d] outline-none transition focus-visible:ring-2 focus-visible:ring-[#8c62b5]"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={ handleAddComment }
                        disabled={ !selectedPoem || composerMode !== "view" || isEngaging || commentText.trim().length < 2 }
                        className="rounded-full bg-[#5a2f85] text-white hover:bg-[#47216b]"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    { selectedPoemComments.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-[#d7d0ea] bg-white px-3 py-2 text-sm text-[#77578f]">
                        No comments yet. Be the first family member to add one.
                      </p>
                    ) : (
                      selectedPoemComments.map((poemComment) => (
                        <article key={ poemComment.id } className="rounded-2xl border border-[#e5daf0] bg-white px-3 py-3 text-sm text-[#5f466f]">
                          <p className="whitespace-pre-wrap leading-6">{ poemComment.text || "(No text in comment)" }</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8a6da3]">
                            { poemComment.commenterName } · { formatCreatedAt(poemComment.createdAt) }
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
        <DialogContent className="border-[#d7d0ea] bg-[#fcf9ff] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#43245d]">Edit Link</DialogTitle>
            <DialogDescription className="text-[#77578f]">
              Add or replace the URL for the selected text. Leave it blank to remove the link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#43245d]" htmlFor="poetry-home-link-url">
              URL
            </label>
            <Input
              id="poetry-home-link-url"
              value={ linkValue }
              onChange={ (event) => {
                setLinkValue(event.target.value);

                if (linkError) {
                  setLinkError(null);
                }
              } }
              placeholder="https://example.com"
              className="border-[#d7d0ea] bg-white text-[#43245d]"
            />
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="poetry-home-link-target"
                checked={ openLinkInNewTab }
                onCheckedChange={ (checked) => setOpenLinkInNewTab(checked === true) }
              />
              <label className="text-sm text-[#5f466f]" htmlFor="poetry-home-link-target">
                Open in new tab
              </label>
            </div>
            { linkError ? (
              <p className="text-sm text-red-500">{ linkError }</p>
            ) : null }
            <div className="rounded-xl border border-[#e5daf0] bg-white px-3 py-3 text-sm text-[#5f466f]">
              <p className="font-semibold text-[#43245d]">Preview</p>
              <p className="mt-1 break-all">
                { normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#81619b]">
                { openLinkInNewTab ? "Opens In New Tab" : "Opens In Current Tab" }
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={ () => {
                const editor = getEditorForTarget(linkEditorTarget);

                if (editor?.isActive("link")) {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
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