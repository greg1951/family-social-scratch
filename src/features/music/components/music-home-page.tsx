"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Edit3, Eye, Heart, MessageSquare, MessageSquareText, Music, Plus, Search, ThumbsDown, ThumbsUp, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addMusicCommentAction,
  getMusicDetailAction,
  toggleMusicLikeAction,
} from "@/app/(features)/(music)/music/actions";
import TipTapCommentEditor from "@/components/common/tiptap-comment-editor";
import TiptapRenderer from "@/components/discuss/tiptap-renderer";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  normalizeSerializedTipTapDocument,
  parseSerializedTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { MusicDetail, MusicRecord } from "@/components/db/types/music";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { MusicScrollStrip } from "@/features/music/components/music-scroll-strip";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { clearQueuedFeatureComment, createClientRequestId, getPwaSyncNowEventName, isBrowserOnline, queueFeatureComment, readQueuedFeatureComments } from "@/lib/pwa-background-sync";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import StartDiscussionDialog from "@/components/discuss/start-discussion-dialog";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}

function formatShortDate(value: Date) {
  const parsed = new Date(value);
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const yy = String(parsed.getFullYear()).slice(-2);
  return `${ mm }-${ dd }-${ yy }`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${ year }-${ month }-${ day }`;
}

function getMusicDocument(musicJson?: string): JSONContent {
  if (!musicJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(musicJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function MusicViewer({ musicJson }: { musicJson?: string }) {
  const viewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ autolink: true, defaultProtocol: "https", openOnClick: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getMusicDocument(musicJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-112 text-[#4b2a18] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!viewer) {
      return;
    }

    viewer.commands.setContent(getMusicDocument(musicJson));
  }, [viewer, musicJson]);

  return (
    <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
      <EditorContent editor={ viewer } />
    </div>
  );
}

export function MusicHomePage({ musics, member }: { musics: MusicRecord[]; member: MemberKeyDetails }) {
  const router = useRouter();
  const [isEngaging, startEngageTransition] = useTransition();
  const [selectedMusicDetail, setSelectedMusicDetail] = useState<MusicDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isViewMusicOpen, setIsViewMusicOpen] = useState(false);
  const [musicStripMode, setMusicStripMode] = useState<"latest" | "top-rated">("latest");
  const [searchValue, setSearchValue] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return toDateInputValue(threeMonthsAgo);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const visibleMusics = musics.filter((music) => music.status === "published" || (includeArchived && music.status === "archived"));
  const [selectedMusic, setSelectedMusic] = useState(visibleMusics[0]?.id ?? 0);
  const [filterWithDiscussionThreads, setFilterWithDiscussionThreads] = useState(false);
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    const flushQueuedMusicComments = async () => {
      if (!isBrowserOnline()) {
        return;
      }

      const queuedComments = readQueuedFeatureComments().filter((item) => item.kind === "music");

      for (const queuedComment of queuedComments) {
        const result = await addMusicCommentAction(queuedComment.payload);

        if (!result.success) {
          continue;
        }

        if (queuedComment.payload.clientRequestId) {
          clearQueuedFeatureComment(queuedComment.payload.clientRequestId);
        }

        if (selectedMusic === queuedComment.payload.musicId) {
          setSelectedMusicDetail(result.music);
        }
      }
    };

    void flushQueuedMusicComments();

    const handleSync = () => {
      void flushQueuedMusicComments();
    };

    window.addEventListener("online", handleSync);
    window.addEventListener(getPwaSyncNowEventName(), handleSync);

    return () => {
      window.removeEventListener("online", handleSync);
      window.removeEventListener(getPwaSyncNowEventName(), handleSync);
    };
  }, [selectedMusic]);

  const latestMusics = [...visibleMusics]
    .sort((leftMusic, rightMusic) => +new Date(rightMusic.updatedAt) - +new Date(leftMusic.updatedAt))
    .slice(0, 8)
    .map((music) => ({
      kind: "latest" as const,
      id: music.id,
      name: music.musicTitle,
      date: formatShortDate(music.updatedAt),
      reviewType: music.isSong ? "Song" as const : "Album" as const,
      hasLyrics: Boolean(music.hasLyrics),
      submitterLikenessDegree: music.memberId === member.memberId ? null : music.submitterLikenessDegree,
      commentsCount: music.commentCount,
      thumbsUp: music.thumbsUpCount,
      love: music.loveCount,
      hasDiscussionThread: music.hasDiscussionThread,
      imageSrc: music.musicImageUrl ?? "/images/music/princess-bride.png",
      imageAlt: `${ music.musicTitle } music image`,
    }));

  const topRatedMusics = [...visibleMusics]
    .filter((music) => (music.thumbsUpCount + music.loveCount) > 0)
    .sort((leftMusic, rightMusic) => {
      const leftScore = leftMusic.thumbsUpCount + leftMusic.loveCount;
      const rightScore = rightMusic.thumbsUpCount + rightMusic.loveCount;

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return +new Date(rightMusic.updatedAt) - +new Date(leftMusic.updatedAt);
    })
    .slice(0, 8)
    .map((music) => ({
      kind: "top-rated" as const,
      id: music.id,
      name: music.musicTitle,
      submitterLikenessDegree: music.memberId === member.memberId ? null : music.submitterLikenessDegree,
      noRating: music.noRatingCount,
      thumbsUp: music.thumbsUpCount,
      love: music.loveCount,
      commentsCount: music.commentCount,
      hasDiscussionThread: music.hasDiscussionThread,
      imageSrc: music.musicImageUrl ?? "/images/music/robin-hood.png",
      imageAlt: `${ music.musicTitle } music image`,
    }));

  const stripItems = musicStripMode === "latest" ? latestMusics : topRatedMusics;
  const stripTitle = musicStripMode === "latest" ? "Latest Music" : "Top Rated Music";
  const stripDescription = musicStripMode === "latest"
    ? "Latest music first, based on added date."
    : "Top rated music based on total likes and loves.";
  const stripAccentClassName = musicStripMode === "latest"
    ? "bg-[linear-gradient(135deg,#4f7fd6,#2C5EAD)]"
    : "bg-[linear-gradient(135deg,#7aa0dd,#4a6fae)]";

  const finderRows = visibleMusics.map((music) => ({
    id: music.id,
    name: music.musicTitle,
    updatedAt: music.updatedAt,
    genre: music.tagNamesByType.genre?.[0] ?? "-",
    subGenre: music.tagNamesByType.subGenre?.[0] ?? "-",
    reviewType: music.isSong ? "Song" : "Album",
    year: music.musicDebutYear,
    addedBy: music.submitterName,
    thumbsDown: music.noRatingCount,
    thumbsUp: music.thumbsUpCount,
    love: music.loveCount,
    comments: music.commentCount,
    hasDiscussionThread: music.hasDiscussionThread,
  }));

  const startDateValue = startDate ? new Date(`${ startDate }T00:00:00`) : null;
  const endDateValue = endDate ? new Date(`${ endDate }T23:59:59.999`) : null;

  const filteredMusics = finderRows.filter((music) => {
    const updatedAt = new Date(music.updatedAt);

    if (startDateValue && updatedAt < startDateValue) {
      return false;
    }

    if (endDateValue && updatedAt > endDateValue) {
      return false;
    }

    if (filterWithDiscussionThreads && !music.hasDiscussionThread) {
      return false;
    }

    const query = deferredSearchValue.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [music.name, music.genre, music.subGenre, music.reviewType, music.addedBy].join(" ").toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!selectedMusic) {
      return;
    }

    let isCancelled = false;

    startEngageTransition(async () => {
      const result = await getMusicDetailAction({ musicId: selectedMusic });
      if (isCancelled) {
        return;
      }
      if (!result.success) {
        setSelectedMusicDetail(null);
        return;
      }
      setSelectedMusicDetail(result.music);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedMusic]);

  const selectedMusicBasic = (selectedMusicDetail?.id === selectedMusic ? selectedMusicDetail : musics.find((music) => music.id === selectedMusic)) ?? visibleMusics[0] ?? null;
  const canReactToSelectedMusic = Boolean(selectedMusicBasic && selectedMusicBasic.memberId !== member.memberId);
  const canCommentOnSelectedMusic = canReactToSelectedMusic;
  const canEditSelectedMusic = Boolean(selectedMusicBasic && (selectedMusicBasic.memberId === member.memberId || member.isFounder));
  const canEditLyricsSelectedMusic = Boolean(selectedMusicBasic && (selectedMusicBasic.memberId === member.memberId || member.isFounder) && selectedMusicBasic.isSong);
  const canViewLyricsSelectedMusic = Boolean(
    selectedMusicBasic?.isSong
    && selectedMusicDetail?.id === selectedMusic
    && selectedMusicDetail.lyrics,
  );

  function handleSelectMusic(musicId: number) {
    setSelectedMusic(musicId);
  }

  function handleOpenMusicFromCard(musicId: number) {
    handleSelectMusic(musicId);
    setIsViewMusicOpen(true);
  }

  function handleToggleLike(likenessDegree: number) {
    if (!selectedMusicBasic) {
      return;
    }

    if (selectedMusicBasic.memberId === member.memberId) {
      toast.error("You cannot react to your own music posting.");
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleMusicLikeAction({ musicId: selectedMusicBasic.id, likenessDegree });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSelectedMusicDetail(result.music);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedMusicBasic) {
      return;
    }

    if (!canCommentOnSelectedMusic) {
      toast.error("You cannot comment on your own music posting.");
      return;
    }

    const normalizedComment = normalizeSerializedTipTapDocument(commentText);
    if (isSerializedTipTapDocumentEmpty(normalizedComment)) {
      toast.error("Enter a comment before posting.");
      return;
    }

    startEngageTransition(async () => {
      const payload = {
        musicId: selectedMusicBasic.id,
        commentText: normalizedComment,
        clientRequestId: createClientRequestId("music-comment"),
      };
      const result = await addMusicCommentAction(payload);
      if (!result.success) {
        if (!isBrowserOnline()) {
          queueFeatureComment({
            kind: "music",
            payload,
            itemTitle: selectedMusicBasic.musicTitle,
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
      setSelectedMusicDetail(result.music);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app w-full px-4 pb-8 pt-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(44,94,173,0.96),rgba(38,81,149,0.9)_56%,rgba(26,58,110,0.86))] px-4 py-5 text-white shadow-[0_28px_80px_-40px_rgba(15,36,74,0.8)] sm:px-8 sm:py-8 md:px-10">
          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#dbe8ff] sm:text-[0.72rem] sm:tracking-[0.34em]">Family Music Salon</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/" className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#eff5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
                  <ArrowLeft className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                  Go Home
                </Link>
                <Link href="/music/templates" className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#eff5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"><Edit3 className="mr-1 size-3 sm:size-3.5" />Music Templates</Link>
              </div>
              <h1 className="mt-3 text-base font-black leading-snug tracking-tight sm:mt-4 sm:text-3xl">Your family&apos;s favorite songs and lyrics in one place.</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6">
          <div className="min-w-0 space-y-6 md:order-2">
            <div className="rounded-[1.6rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_55px_-36px_rgba(15,36,74,0.8)] backdrop-blur sm:px-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">
                Music Type
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#c8d9f3] bg-white px-4 py-2 text-sm font-semibold text-[#203b66] transition hover:bg-[#f7fbff]">
                  <input
                    type="radio"
                    name="music-strip-mode"
                    value="latest"
                    checked={ musicStripMode === "latest" }
                    onChange={ () => setMusicStripMode("latest") }
                    className="size-4 border-[#7aa0dd] text-[#2C5EAD]"
                  />
                  Latest Music
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#c8d9f3] bg-white px-4 py-2 text-sm font-semibold text-[#203b66] transition hover:bg-[#f7fbff]">
                  <input
                    type="radio"
                    name="music-strip-mode"
                    value="top-rated"
                    checked={ musicStripMode === "top-rated" }
                    onChange={ () => setMusicStripMode("top-rated") }
                    className="size-4 border-[#7aa0dd] text-[#2C5EAD]"
                  />
                  Top Rated Music
                </label>
              </div>
            </div>

            <MusicScrollStrip
              title={ stripTitle }
              description={ stripDescription }
              items={ stripItems }
              accentClassName={ stripAccentClassName }
              selectedItemId={ selectedMusic }
              onSelectItem={ handleSelectMusic }
              onOpenItem={ handleOpenMusicFromCard }
            />
          </div>

          <div className="min-w-0 space-y-6 md:order-1">
            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(15,36,74,0.72)] backdrop-blur">
              <div className="border-b border-[#c8d9f3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,245,255,0.9))] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">
                      Music Directory</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#4a6fae]">
                      <h2 className="text-2xl font-black tracking-tight text-[#203b66]">
                        Music Finder</h2>
                      <FeatureFaqHelp
                        href="/feature-faq?category=Music%20Lovers"
                        buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#c8d9f3] bg-gradient-to-b from-[#f7fbff] to-[#eaf1ff] text-[#2C5EAD] shadow-[0_8px_18px_rgba(44,94,173,0.18)] group-hover:shadow-[0_12px_26px_rgba(44,94,173,0.26)]" iconClassName="text-[#2C5EAD]" tooltipClassName="bg-[#203b66] text-[#eff5ff]" />
                      <Button type="button" onClick={ () => setIsViewMusicOpen(true) } disabled={ !selectedMusicBasic } className="h-8 shrink-0 whitespace-nowrap rounded-full border border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] disabled:opacity-50"><Eye className="size-3.5" />View Music</Button>{ canViewLyricsSelectedMusic ? <Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD]"><Link href={ `/music/lyrics?id=${ selectedMusic }` }><Eye className="size-3.5" />View Lyrics</Link></Button> : null }<Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD]"><Link href="/music/add-music"><Plus className="size-3.5" />Add Music</Link></Button><Button type="button" variant="outline" onClick={ () => router.push(`/music/add-music?id=${ selectedMusic }`) } disabled={ !canEditSelectedMusic } className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD] disabled:opacity-50"><Edit3 className="size-3.5" />Edit Music</Button><Button type="button" variant="outline" onClick={ () => router.push(`/music/lyrics?id=${ selectedMusic }`) } disabled={ !canEditLyricsSelectedMusic } className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD] disabled:opacity-50">
                        <Edit3 className="size-3.5" />Edit Lyrics
                      </Button>
                    </div>
                    {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a6fae]">
                      Search by title, genre, song or album, and family member.
                    </p> */}
                  </div>
                  {/* <div className="rounded-full border border-[#c8d9f3] bg-[#edf4ff] px-4 py-2 text-sm font-semibold text-[#4a6fae]">{ filteredMusics.length } music posts found</div> */ }
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3"><div className="relative min-w-[16rem] flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#4a6fae]" /><Input type="search" value={ searchValue } onChange={ (event) => setSearchValue(event.target.value) } placeholder="Search by music title, genre, sub genre, type, or family member" className="h-12 rounded-full border-[#c8d9f3] bg-white pl-11 pr-4 text-sm text-[#203b66] shadow-sm" aria-label="Search music" /></div><label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c8d9f3] bg-white px-3 py-2 text-xs font-semibold text-[#2C5EAD]"><input type="checkbox" checked={ includeArchived } onChange={ (event) => setIncludeArchived(event.target.checked) } className="size-4 border-[#7aa0dd] text-[#2C5EAD]" />Include Archived</label><label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c8d9f3] bg-white px-3 py-2 text-xs font-semibold text-[#2C5EAD]"><input type="checkbox" checked={ filterWithDiscussionThreads } onChange={ (event) => setFilterWithDiscussionThreads(event.target.checked) } className="size-4 border-[#7aa0dd] text-[#2C5EAD]" />Show Discussions</label></div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a6fae]">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={ startDate }
                      max={ endDate || undefined }
                      onChange={ (event) => setStartDate(event.target.value) }
                      className="h-9 rounded-xl border-[#c8d9f3] bg-white px-2 text-xs text-[#203b66]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a6fae]">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={ endDate }
                      min={ startDate || undefined }
                      onChange={ (event) => setEndDate(event.target.value) }
                      className="h-9 rounded-xl border-[#c8d9f3] bg-white px-2 text-xs text-[#203b66]"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="max-h-[68vh] overflow-y-auto pr-0.5">
                  { filteredMusics.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-[#c8d9f3] bg-white px-4 py-8 text-center text-sm text-[#4a6fae]">
                      No music posts match that search yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      { filteredMusics.map((music) => {
                        const isSelected = selectedMusic === music.id;

                        return (
                          <button
                            key={ music.id }
                            type="button"
                            onClick={ () => handleSelectMusic(music.id) }
                            onDoubleClick={ () => handleOpenMusicFromCard(music.id) }
                            title={ [
                              `${ music.genre } • ${ music.subGenre } • ${ music.reviewType }`,
                              `Added by ${ music.addedBy }`,
                            ].join("\n") }
                            className={ [
                              "w-full rounded-xl border p-2 text-left transition-all duration-200",
                              "hover:border-[#c8d9f3] hover:shadow-[0_12px_30px_-26px_rgba(15,36,74,0.8)]",
                              isSelected
                                ? "border-[#c8d9f3] bg-[#edf4ff] shadow-[0_16px_34px_-24px_rgba(15,36,74,0.85)]"
                                : "border-[#dbe8ff] bg-white",
                            ].join(" ") }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate text-[13px] font-semibold text-[#203b66]">{ music.name }</p>
                              { music.hasDiscussionThread ? (
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf4ff] text-[#2C5EAD]" title="Discussion thread available">
                                  <MessageSquare className="size-3" aria-label="Discussion thread available" />
                                </span>
                              ) : null }
                            </div>

                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#4a6fae]">
                              <Music className="size-3 shrink-0" />
                              <span className="truncate">{ music.reviewType }</span>
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#4a5f84]">
                              <span>{ music.year }</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <ThumbsDown className="size-3 text-[#526a8f]" />
                                { music.thumbsDown }
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ThumbsUp className="size-3 text-[#2C5EAD]" />
                                { music.thumbsUp }
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Heart className="size-3 text-[#5b7fd0]" />
                                { music.love }
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquareText className="size-3 text-[#2C5EAD]" />
                                { music.comments }
                              </span>
                            </div>

                            <p className="mt-1 truncate text-[10px] text-[#4a6fae]">
                              { music.addedBy }
                            </p>
                          </button>
                        );
                      }) }
                    </div>
                  ) }
                </div>
              </div>
            </div>

            { selectedMusicBasic ? (
              <div className="w-full rounded-[1.4rem] border border-[#c8d9f3] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-[#4a6fae]">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">Discussion Threads</p>
                      <FeatureFaqHelp
                        href="/feature-faq?category=Discussion%20Groups"
                        buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#c8d9f3] bg-gradient-to-b from-[#f7fbff] to-[#eaf1ff] text-[#2C5EAD] shadow-[0_8px_18px_rgba(44,94,173,0.18)] group-hover:shadow-[0_12px_26px_rgba(44,94,173,0.26)]"
                        iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#2C5EAD]"
                        tooltipClassName="bg-[#203b66] text-[#eff5ff]"
                      />
                    </div>
                    {/* <p className="mt-1 text-sm text-[#4a6fae]">Follow the conversation that belongs to this music.</p> */ }
                  </div>
                  <StartDiscussionDialog
                    targetType="music"
                    targetId={ selectedMusicBasic.id }
                    topicLabel={ `${ selectedMusicBasic.musicTitle } Discussion` }
                    revalidatePaths={ ["/music"] }
                    onSuccessRoute="/music/discussions/:threadId"
                    disabled={ isEngaging }
                    triggerLabel="Add Discussion"
                    triggerClassName="rounded-full bg-[#2C5EAD] px-4 text-xs font-semibold text-white hover:bg-[#244b8a]"
                  />
                </div>

                <div className="mt-3 space-y-3">
                  { selectedMusicBasic.discussionThreads.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#c8d9f3] bg-[#f7fbff] px-3 py-3 text-sm text-[#4a6fae]">
                      <p>No discussion threads have been added for this music yet.</p>
                    </div>
                  ) : (
                    selectedMusicBasic.discussionThreads.map((discussionThread) => (
                      <article key={ discussionThread.id } className="rounded-2xl border border-[#c8d9f3] bg-[#f7fbff] px-4 py-4 text-sm text-[#4a6fae] shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-base font-bold leading-snug text-[#203b66]">{ discussionThread.discussTopic }</p>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#4a6fae]">
                              { discussionThread.memberFirstName } · { formatCreatedAt(discussionThread.createdAt) }
                            </p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-3">
                            { discussionThread.dislikeCount > 0 || discussionThread.likeCount > 0 || discussionThread.loveCount > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                { discussionThread.dislikeCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-2 py-1 text-[0.65rem] font-semibold text-[#526a8f]">
                                    <ThumbsDown className="size-3" />
                                    { discussionThread.dislikeCount }
                                  </span>
                                ) : null }
                                { discussionThread.likeCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4ff] px-2 py-1 text-[0.65rem] font-semibold text-[#2C5EAD]">
                                    <ThumbsUp className="size-3" />
                                    { discussionThread.likeCount }
                                  </span>
                                ) : null }
                                { discussionThread.loveCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#dbe8ff] px-2 py-1 text-[0.65rem] font-semibold text-[#4a6fae]">
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
                              className="shrink-0 rounded-full border-[#c8d9f3] bg-white px-4 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD]"
                            >
                              <Link href={ `/music/discussions/${ discussionThread.id }` }>
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

            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(15,36,74,0.72)]"><div className="border-b border-[#c8d9f3] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,245,255,0.9))] px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">Music Reactions</p><p className="mt-2 max-w-2xl text-xs leading-6 text-[#4a6fae]">React to this music and post comments your family can see.</p></div></div></div><div className="space-y-5 px-5 py-5 sm:px-6">{ selectedMusicBasic ? <><div className="space-y-3 rounded-[1.4rem] border border-[#c8d9f3] bg-[#f7fbff] p-4"><div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={ () => handleToggleLike(-1) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#526a8f] text-white hover:bg-[#415674]" aria-label="Add thumbs down"><ThumbsDown className={ `size-4 ${ selectedMusicDetail?.likenessDegree === -1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(1) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#2C5EAD] text-white hover:bg-[#244b8a]" aria-label="Add thumbs up"><ThumbsUp className={ `size-4 ${ selectedMusicDetail?.likenessDegree === 1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(2) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#4a6fae] text-white hover:bg-[#3b5e93]" aria-label="Add love"><Heart className={ `size-4 ${ selectedMusicDetail?.likenessDegree === 2 ? "fill-white" : "" }` } /></Button></div>{ !canReactToSelectedMusic ? <p className="text-xs text-[#4a6fae]">You cannot react to your own music. Ask another family member to rate it.</p> : null }<div className="flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-1.5 font-semibold text-[#526a8f]"><ThumbsDown className="size-4 text-[#526a8f]" />{ (selectedMusicDetail?.noRatingCount ?? selectedMusicBasic?.noRatingCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#2C5EAD]"><ThumbsUp className="size-4 text-[#2C5EAD]" />{ (selectedMusicDetail?.thumbsUpCount ?? selectedMusicBasic?.thumbsUpCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#4f6aa1]"><Heart className="size-4 fill-[#5b7fd0] text-[#5b7fd0]" />{ (selectedMusicDetail?.loveCount ?? selectedMusicBasic?.loveCount ?? 0).toLocaleString() }</span></div></div><div className="hidden space-y-3 rounded-[1.4rem] border border-[#c8d9f3] bg-[#f7fbff] p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">Family Comments</p><p className="text-xs text-[#4a6fae]">Share your thoughts about this music with your family.</p></div><div className="space-y-2"><label className="text-sm font-semibold text-[#203b66]" htmlFor="music-comment-input">Add Comment</label><div id="music-comment-input"><TipTapCommentEditor value={ commentText } onChange={ setCommentText } placeholder="What did you think about this music?" disabled={ !selectedMusicBasic || isEngaging } toolbarClassName="border-[#c8d9f3] bg-[#edf4ff]" editorClassName="border-[#c8d9f3] text-[#203b66]" buttonClassName="border-[#b8cff2] text-[#2C5EAD]" activeButtonClassName="border-[#2C5EAD] bg-[#dbe8ff] text-[#203b66]" /></div><div className="flex justify-end"><Button type="button" onClick={ handleAddComment } disabled={ !selectedMusicBasic || isEngaging || isSerializedTipTapDocumentEmpty(commentText) } className="rounded-full bg-[#2C5EAD] text-white hover:bg-[#244b8a]">Post Comment</Button></div></div><div className="space-y-2">{ selectedMusicDetail?.id === selectedMusic && selectedMusicDetail.musicComments.length === 0 ? <p className="rounded-2xl border border-dashed border-[#c8d9f3] bg-white px-3 py-2 text-sm text-[#4a6fae]">No comments yet. Be the first family member to add one.</p> : selectedMusicDetail?.id !== selectedMusic ? <p className="rounded-2xl border border-dashed border-[#c8d9f3] bg-white px-3 py-2 text-sm text-[#4a6fae]">Loading comments...</p> : (selectedMusicDetail?.musicComments ?? []).map((comment) => <article key={ comment.id } className="rounded-2xl border border-[#c8d9f3] bg-white px-3 py-3 text-sm text-[#4a6fae]"><TiptapRenderer contentJson={ comment.commentJson } /><p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#4a6fae]">{ comment.commenterName } · { formatCreatedAt(comment.createdAt) }</p></article>) }</div></div></> : <div className="rounded-[1.5rem] border border-dashed border-[#c8d9f3] bg-[#f7fbff] px-6 py-10 text-center text-[#4a6fae]"><MessageSquareText className="mx-auto mb-3 size-10 text-[#2C5EAD]" /><p className="text-lg font-semibold text-[#203b66]">Select a music to view comments.</p><p className="mt-2 text-sm">Choose a music from the finder list to see and post family comments.</p></div> }</div></div>
          </div>
        </div>
      </div>

      <Dialog open={ isViewMusicOpen } onOpenChange={ setIsViewMusicOpen }>
        <DialogContent className="border-[#f0d9c4] bg-[#fff8f2] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-[#5c2e1a]">{ selectedMusicBasic?.musicTitle ?? "Music" }</DialogTitle>
            <DialogDescription className="text-[#8b5a3c]">Full music details and family notes.</DialogDescription>
            { selectedMusicBasic?.isSong && selectedMusicDetail?.id === selectedMusic && selectedMusicDetail.lyrics ? (
              <Link
                href={ `/music/lyrics?id=${ selectedMusic }` }
                className="mt-2 inline-flex w-fit items-center rounded-full border border-[#e8c4a0] bg-white px-3 py-1.5 text-xs font-semibold text-[#7b3306] transition hover:bg-[#fff6ef]"
              >
                View Lyrics
              </Link>
            ) : null }
          </DialogHeader>

          { selectedMusicBasic ? (
            <div className="max-h-[75vh] space-y-4 overflow-auto pr-1">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <MusicViewer musicJson={ selectedMusicBasic.musicJson } />
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-[#f0d9c4] bg-white">
                    <div className="aspect-16/10 overflow-hidden">
                      <ModalMusicImage
                        src={ selectedMusicBasic.musicImageUrl ?? "/images/music/princess-bride.png" }
                        alt={ `${ selectedMusicBasic.musicTitle } music image` }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Artist</p><p className="mt-2 text-sm leading-6 text-[#734f3a]">{ selectedMusicBasic.artistName || "No artist provided." }</p></div>
                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Details</p><div className="mt-3 space-y-3 text-sm text-[#734f3a]"><p><span className="font-semibold text-[#5c2e1a]">Submitter:</span> { selectedMusicBasic.submitterName }</p><p><span className="font-semibold text-[#5c2e1a]">Updated:</span> { formatDate(selectedMusicBasic.updatedAt) }</p><p><span className="font-semibold text-[#5c2e1a]">Debut Year:</span> { selectedMusicBasic.musicDebutYear }</p><p><span className="font-semibold text-[#5c2e1a]">Type:</span> { selectedMusicBasic.isSong ? "Song" : "Album" }</p><p><span className="font-semibold text-[#5c2e1a]">Genre:</span> { selectedMusicBasic.tagNamesByType.genre?.[0] ?? "Unknown" }</p><p><span className="font-semibold text-[#5c2e1a]">Sub Genre:</span> { selectedMusicBasic.tagNamesByType.subGenre?.[0] ?? "Unknown" }</p></div></div>
                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Reactions</p><div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[#734f3a]"><span className="inline-flex items-center gap-2 rounded-full bg-[#f7f0eb] px-3 py-1"><ThumbsDown className="size-4 text-[#6d5c52]" />{ (selectedMusicDetail?.noRatingCount ?? selectedMusicBasic.noRatingCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1 text-[#8a5a22]"><ThumbsUp className="size-4 text-[#b8581a]" />{ (selectedMusicDetail?.thumbsUpCount ?? selectedMusicBasic.thumbsUpCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-1 text-[#8f2f58]"><Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />{ (selectedMusicDetail?.loveCount ?? selectedMusicBasic.loveCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1"><MessageSquareText className="size-4 text-[#b8581a]" />{ selectedMusicDetail?.commentCount ?? selectedMusicBasic.commentCount ?? 0 }</span></div></div>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Family Comments</p>
                  <p className="text-xs text-[#8b5a3c]">Share your thoughts about this music with your family.</p>
                </div>

                <div className="space-y-2">
                  { selectedMusicDetail?.id === selectedMusic && selectedMusicDetail.musicComments.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">No comments yet. Be the first family member to add one.</p>
                  ) : selectedMusicDetail?.id !== selectedMusic ? (
                    <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">Loading comments...</p>
                  ) : (
                    (selectedMusicDetail?.musicComments ?? []).map((comment) => (
                      <article key={ comment.id } className="rounded-2xl border border-[#f0d9c4] bg-white px-3 py-3 text-sm text-[#734f3a]">
                        <TiptapRenderer contentJson={ comment.commentJson } />
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8b5a3c]">{ comment.commenterName } · { formatCreatedAt(comment.createdAt) }</p>
                      </article>
                    ))
                  ) }
                </div>

                { canCommentOnSelectedMusic ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="music-comment-input-dialog">Add Comment</label>
                    <div id="music-comment-input-dialog">
                      <TipTapCommentEditor
                        value={ commentText }
                        onChange={ setCommentText }
                        placeholder="What did you think about this music?"
                        disabled={ !selectedMusicBasic || isEngaging }
                        toolbarClassName="border-[#f0d9c4] bg-[#fff1e8]"
                        editorClassName="border-[#f0d9c4] text-[#5c2e1a]"
                        buttonClassName="border-[#e8c4a0] text-[#7b3306]"
                        activeButtonClassName="border-[#b8581a] bg-[#fde7d5] text-[#5c2e1a]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={ handleAddComment }
                        disabled={ !selectedMusicBasic || isEngaging || isSerializedTipTapDocumentEmpty(commentText) }
                        className="rounded-full bg-[#b8581a] text-white hover:bg-[#964815]"
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                ) : null }
              </div>
            </div>
          ) : null }
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ModalMusicImage({ src, alt }: { src: string; alt: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedUrl = async () => {
      const key = extractS3KeyFromValue(src);

      if (!key) {
        if (!isCancelled) {
          setResolvedSrc(src);
        }
        return;
      }

      try {
        const response = await fetch("/api/s3-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "download",
            fileName: key,
          }),
        });

        if (!response.ok) {
          if (!isCancelled) {
            setResolvedSrc(src);
          }
          return;
        }

        const body = await response.json();

        if (!isCancelled) {
          setResolvedSrc(body.url ?? src);
        }
      } catch {
        if (!isCancelled) {
          setResolvedSrc(src);
        }
      }
    };

    void resolveSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [src]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ resolvedSrc } alt={ alt } className="h-full w-full object-cover" />;
}
