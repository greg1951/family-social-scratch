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
import { useEffect, useState, useTransition } from "react";
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
import StartDiscussionDialog from "@/components/discuss/start-discussion-dialog";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import EditPostIcon from "@/components/common/edit-post-icon";
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
import {
  clearQueuedFeatureComment,
  createClientRequestId,
  getPwaSyncNowEventName,
  isBrowserOnline,
  queueFeatureComment,
  readQueuedFeatureComments,
} from "@/lib/pwa-background-sync";

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

function getOneMonthAgo(referenceDate = new Date()) {
  const oneMonthAgo = new Date(referenceDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return oneMonthAgo;
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
  const [musicStripMode, setMusicStripMode] = useState<"all" | "latest" | "top-rated">("all");
  const [searchValue, setSearchValue] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const canAccessDraftMusic = (musicMemberId: number) => musicMemberId === member.memberId || member.isFounder;
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return toDateInputValue(threeMonthsAgo);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const visibleMusics = musics.filter((music) => (
    music.status === "published"
    || (music.status === "draft" && canAccessDraftMusic(music.memberId))
    || (includeArchived && music.status === "archived")
  ));
  const latestCutoffDate = getOneMonthAgo();
  const [selectedMusic, setSelectedMusic] = useState(visibleMusics[0]?.id ?? 0);
  const [filterWithDiscussionThreads, setFilterWithDiscussionThreads] = useState(false);
  const startDateValue = startDate ? new Date(`${ startDate }T00:00:00`) : null;
  const endDateValue = endDate ? new Date(`${ endDate }T23:59:59.999`) : null;

  const filteredFinderMusics = visibleMusics.filter((music) => {
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

    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      music.musicTitle,
      music.tagNamesByType.genre?.[0] ?? "",
      music.tagNamesByType.subGenre?.[0] ?? "",
      music.isSong ? "song" : "album",
      music.submitterName,
    ].join(" ").toLowerCase().includes(query);
  });

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

  const allMusics = [...filteredFinderMusics]
    .sort((leftMusic, rightMusic) => +new Date(rightMusic.updatedAt) - +new Date(leftMusic.updatedAt))
    .map((music) => ({
      kind: "all" as const,
      id: music.id,
      name: music.musicTitle,
      date: formatShortDate(music.updatedAt),
      submitterName: music.submitterName,
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

  const latestMusics = [...filteredFinderMusics]
    .filter((music) => new Date(music.updatedAt) >= latestCutoffDate)
    .sort((leftMusic, rightMusic) => +new Date(rightMusic.updatedAt) - +new Date(leftMusic.updatedAt))
    .slice(0, 8)
    .map((music) => ({
      kind: "latest" as const,
      id: music.id,
      name: music.musicTitle,
      date: formatShortDate(music.updatedAt),
      submitterName: music.submitterName,
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

  const topRatedMusics = [...filteredFinderMusics]
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
      date: formatShortDate(music.updatedAt),
      submitterName: music.submitterName,
      submitterLikenessDegree: music.memberId === member.memberId ? null : music.submitterLikenessDegree,
      noRating: music.noRatingCount,
      thumbsUp: music.thumbsUpCount,
      love: music.loveCount,
      commentsCount: music.commentCount,
      hasDiscussionThread: music.hasDiscussionThread,
      imageSrc: music.musicImageUrl ?? "/images/music/robin-hood.png",
      imageAlt: `${ music.musicTitle } music image`,
    }));

  const stripItems = musicStripMode === "all" ? allMusics : musicStripMode === "latest" ? latestMusics : topRatedMusics;
  const stripTitle = musicStripMode === "all" ? "All Music" : musicStripMode === "latest" ? "Latest Music" : "Top Rated Music";
  const stripDescription = musicStripMode === "all"
    ? "All songs and albums, ordered by the most recently updated."
    : musicStripMode === "latest"
      ? "Latest music first, based on added date."
      : "Top rated music based on total likes and loves.";
  const stripAccentClassName = musicStripMode === "all"
    ? "bg-[linear-gradient(135deg,#cdddf9,#dbe8ff)]"
    : musicStripMode === "latest"
      ? "bg-[linear-gradient(135deg,#4f7fd6,#2C5EAD)]"
      : "bg-[linear-gradient(135deg,#7aa0dd,#4a6fae)]";

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
    <section className="font-app w-full px-4 pb-8 pt-2 sm:px-6 sm:pt-4 md:px-8">
      <div className="mx-auto max-w-7xl space-y-3 sm:space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(44,94,173,0.96),rgba(38,81,149,0.9)_56%,rgba(26,58,110,0.86))] px-4 py-5 text-white shadow-[0_28px_80px_-40px_rgba(15,36,74,0.8)] sm:px-8 sm:py-8 md:px-10">
          <div className="max-w-3xl">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#dbe8ff] sm:text-[0.72rem] sm:tracking-[0.34em]">Family Music Salon</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href="/" className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#eff5ff] transition hover:bg-white/25 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"><ArrowLeft className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" />Go Home</Link>
              <Link href="/music/templates" className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#eff5ff] transition hover:bg-white/25 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"><Edit3 className="mr-1 size-3 sm:size-3.5" />Music Templates</Link>
            </div>
            {/* <h1 className="mt-3 text-base font-black leading-snug tracking-tight sm:mt-4 sm:text-3xl">Your family&apos;s favorite songs and lyrics in one place.</h1> */}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(15,36,74,0.72)] backdrop-blur">
          <div className="border-b border-[#c8d9f3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(239,245,255,0.9))] px-4 py-3.5 sm:px-6 sm:py-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#2C5EAD]">Music Directory</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#4a6fae]">
              <h2 className="text-2xl font-black tracking-tight text-[#203b66]">Music Finder</h2>
              <FeatureFaqHelp 
                  href="/feature-faq?category=Music%20Lovers" 
                  buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#c8d9f3] bg-gradient-to-b from-[#f7fbff] to-[#eaf1ff] text-[#2C5EAD]" 
                  iconClassName="h-3 w-3 text-[#2C5EAD]" 
                  tooltipClassName="bg-[#203b66] text-[#eff5ff]" 
              />
              <EditPostIcon tooltip="View Music" tooltipClassName="bg-[#203b66] text-[#eff5ff]"><Button type="button" onClick={ () => setIsViewMusicOpen(true) } disabled={ !selectedMusicBasic } className="h-8 rounded-full border border-[#c8d9f3] bg-[#f7fbff] px-2 text-xs font-semibold text-[#2C5EAD] sm:px-3" aria-label="View selected music"><Eye className="size-3.5" /><span className="hidden sm:inline">View</span></Button></EditPostIcon>
              { canViewLyricsSelectedMusic ? (
                <EditPostIcon tooltip="View Lyrics" tooltipClassName="bg-[#203b66] text-[#eff5ff]"><Button type="button" variant="outline" asChild className="h-8 rounded-full border-[#c8d9f3] bg-[#f7fbff] px-3 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD]"><Link href={ `/music/lyrics?id=${ selectedMusic }` } aria-label="View selected lyrics"><Eye className="size-3.5" /><span className="hidden sm:inline">View Lyrics</span></Link></Button></EditPostIcon>
              ) : null }
              <EditPostIcon tooltip="Add Music" tooltipClassName="bg-[#203b66] text-[#eff5ff]"><Button type="button" variant="outline" asChild className="h-8 rounded-full border-[#c8d9f3] bg-[#f7fbff] px-2 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD] sm:px-3"><Link href="/music/add-music" aria-label="Add music"><Plus className="size-3.5" /><span className="hidden sm:inline">Add</span></Link></Button></EditPostIcon>
              <EditPostIcon tooltip="Edit Music" tooltipClassName="bg-[#203b66] text-[#eff5ff]"><Button type="button" variant="outline" onClick={ () => router.push(`/music/add-music?id=${ selectedMusic }`) } disabled={ !canEditSelectedMusic } className="h-8 rounded-full border-[#c8d9f3] bg-[#f7fbff] px-2 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD] disabled:opacity-50 sm:px-3" aria-label="Edit selected music"><Edit3 className="size-3.5" /><span className="hidden sm:inline">Edit</span></Button></EditPostIcon>
              <EditPostIcon tooltip="Edit Lyrics" tooltipClassName="bg-[#203b66] text-[#eff5ff]"><Button type="button" variant="outline" onClick={ () => router.push(`/music/lyrics?id=${ selectedMusic }`) } disabled={ !canEditLyricsSelectedMusic } className="h-8 rounded-full border-[#c8d9f3] bg-[#f7fbff] px-2 text-xs font-semibold text-[#2C5EAD] hover:bg-[#edf4ff] hover:text-[#2C5EAD] disabled:opacity-50 sm:px-3" aria-label="Edit selected lyrics"><Edit3 className="size-3.5" /><span className="hidden sm:inline">Edit Lyrics</span></Button></EditPostIcon>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-center sm:gap-2">
              <div className="relative min-w-0 w-full sm:w-52 md:w-56 lg:w-64 xl:w-72"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#4a6fae]" /><Input type="search" value={ searchValue } onChange={ (event) => setSearchValue(event.target.value) } placeholder="Search by music title, genre, sub genre, type, or family member" className="h-9 w-full rounded-full border-[#c8d9f3] bg-white pl-10 pr-3 text-xs text-[#203b66] shadow-sm sm:h-12 sm:pl-11 sm:pr-4 sm:text-sm" aria-label="Search music" /></div>
              <div className="flex flex-row flex-nowrap items-center gap-2"><label className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8d9f3] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C5EAD] sm:px-2.5 sm:py-2 sm:text-sm"><input type="checkbox" checked={ includeArchived } onChange={ (event) => setIncludeArchived(event.target.checked) } className="size-3.5 border-[#7aa0dd] text-[#2C5EAD] sm:size-4" />Archived</label><label className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8d9f3] bg-white px-3 py-1.5 text-xs font-semibold text-[#2C5EAD] sm:px-2.5 sm:py-2 sm:text-sm"><input type="checkbox" checked={ filterWithDiscussionThreads } onChange={ (event) => setFilterWithDiscussionThreads(event.target.checked) } className="size-3.5 border-[#7aa0dd] text-[#2C5EAD] sm:size-4" />Discussions</label></div>
            </div>

            <div className="-mt-1 flex flex-row flex-nowrap items-end gap-2 sm:mt-0">
              <div className="min-w-0 w-[calc(50%-0.25rem)] space-y-1"><label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a6fae]">Start Date</label><Input type="date" value={ startDate } max={ endDate || undefined } onChange={ (event) => setStartDate(event.target.value) } className="h-8 rounded-xl border-[#c8d9f3] bg-white px-2 text-[11px] text-[#203b66] sm:h-9 sm:text-xs" /></div>
              <div className="min-w-0 w-[calc(50%-0.25rem)] space-y-1"><label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a6fae]">End Date</label><Input type="date" value={ endDate } min={ startDate || undefined } onChange={ (event) => setEndDate(event.target.value) } className="h-8 rounded-xl border-[#c8d9f3] bg-white px-2 text-[11px] text-[#203b66] sm:h-9 sm:text-xs" /></div>
            </div>

            <div className="mt-3 rounded-[1.4rem] border border-[#c8d9f3] bg-[#f7fbff] px-4 py-2 text-sm text-[#4a6fae] sm:py-3">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.26em] text-[#2C5EAD] sm:text-[0.68rem] sm:tracking-[0.32em]">Music Type</p>
              <div className="mt-1.5 flex flex-nowrap gap-2 overflow-x-auto sm:mt-2">
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#c8d9f3] bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#203b66] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"><input type="radio" name="music-strip-mode" value="all" checked={ musicStripMode === "all" } onChange={ () => setMusicStripMode("all") } className="size-3.5 border-[#7aa0dd] text-[#2C5EAD] sm:size-4" />All</label>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#c8d9f3] bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#203b66] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"><input type="radio" name="music-strip-mode" value="latest" checked={ musicStripMode === "latest" } onChange={ () => setMusicStripMode("latest") } className="size-3.5 border-[#7aa0dd] text-[#2C5EAD] sm:size-4" />Latest</label>
                <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#c8d9f3] bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#203b66] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"><input type="radio" name="music-strip-mode" value="top-rated" checked={ musicStripMode === "top-rated" } onChange={ () => setMusicStripMode("top-rated") } className="size-3.5 border-[#7aa0dd] text-[#2C5EAD] sm:size-4" />Top Rated</label>
              </div>
            </div>

            <div className="mt-1"><MusicScrollStrip title={ stripTitle } description={ stripDescription } items={ stripItems } accentClassName={ stripAccentClassName } selectedItemId={ selectedMusic } onSelectItem={ handleSelectMusic } onOpenItem={ handleOpenMusicFromCard } /></div>
          </div>
        </div>

        <Dialog open={ isViewMusicOpen } onOpenChange={ setIsViewMusicOpen }>
          <DialogContent className="border-[#f0d9c4] bg-[#fff8f2] sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-[#5c2e1a]">{ selectedMusicBasic?.musicTitle ?? "Music" }</DialogTitle>
              <DialogDescription className="text-[#8b5a3c]">Full music details and family notes.</DialogDescription>
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
                  </div>
                </div>

                { selectedMusicDetail?.id === selectedMusic && selectedMusicDetail.lyrics ? (
                  <div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-white p-4">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Lyrics</p>
                    </div>
                    <MusicViewer musicJson={ selectedMusicDetail.lyrics.lyricsJson } />
                  </div>
                ) : null }

                <div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Family Comments</p>
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
                </div>

                <div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Discussion Threads</p>
                    <StartDiscussionDialog
                      targetType="music"
                      targetId={ selectedMusicBasic.id }
                      topicLabel={ `${ selectedMusicBasic.musicTitle } Discussion ${ (selectedMusicDetail?.id === selectedMusic ? selectedMusicDetail.discussionThreads.length : 0) + 1 }` }
                      revalidatePaths={ ["/music"] }
                      onSuccessRoute="/music/discussions/:threadId"
                      disabled={ isEngaging || selectedMusicDetail?.id !== selectedMusic }
                      triggerLabel="Add Discussion"
                      triggerClassName="rounded-full bg-[#b8581a] px-4 text-xs font-semibold text-white hover:bg-[#964815]"
                    />
                  </div>
                  { selectedMusicDetail?.id !== selectedMusic ? (
                    <p className="text-sm text-[#8b5a3c]">Loading discussion threads...</p>
                  ) : selectedMusicDetail.discussionThreads.length === 0 ? (
                    <p className="text-sm text-[#8b5a3c]">No discussion threads have been added for this music yet.</p>
                  ) : (
                    <div className="space-y-2">
                      { selectedMusicDetail.discussionThreads.map((discussionThread) => (
                        <article key={ discussionThread.id } className="rounded-xl border border-[#f0d9c4] bg-[#fff8f2] p-3 text-sm text-[#734f3a]">
                          <p className="font-semibold text-[#5c2e1a]">{ discussionThread.discussTopic }</p>
                        </article>
                      )) }
                    </div>
                  ) }
                </div>
              </div>
            ) : null }
          </DialogContent>
        </Dialog>
      </div>
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
