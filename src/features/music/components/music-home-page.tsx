"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Edit3, Eye, Heart, MessageSquareText, Music, Plus, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addMusicCommentAction,
  getMusicDetailAction,
  toggleMusicLikeAction,
} from "@/app/(features)/(music)/music/actions";
import { createEmptyTipTapDocument, parseSerializedTipTapDocument } from "@/components/db/types/poem-term-validation";
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
  const [selectedMusic, setSelectedMusic] = useState(musics[0]?.id ?? 0);
  const deferredSearchValue = useDeferredValue(searchValue);

  const latestMusics = [...musics]
    .sort((leftMusic, rightMusic) => +new Date(rightMusic.updatedAt) - +new Date(leftMusic.updatedAt))
    .slice(0, 8)
    .map((music) => ({
      kind: "latest" as const,
      name: music.musicTitle,
      date: formatDate(music.updatedAt),
      reviewType: music.isSong ? "Song" as const : "Album" as const,
      submitterLikenessDegree: music.submitterLikenessDegree,
      commentsCount: music.commentCount,
      thumbsUp: music.thumbsUpCount,
      love: music.loveCount,
      imageSrc: music.musicImageUrl ?? "/images/music/princess-bride.png",
      imageAlt: `${ music.musicTitle } music image`,
    }));

  const topRatedMusics = [...musics]
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
      name: music.musicTitle,
      submitterLikenessDegree: music.submitterLikenessDegree,
      noRating: music.noRatingCount,
      thumbsUp: music.thumbsUpCount,
      love: music.loveCount,
      commentsCount: music.commentCount,
      imageSrc: music.musicImageUrl ?? "/images/music/robin-hood.png",
      imageAlt: `${ music.musicTitle } music image`,
    }));

  const stripItems = musicStripMode === "latest" ? latestMusics : topRatedMusics;
  const stripTitle = musicStripMode === "latest" ? "Latest Music" : "Top Rated Music";
  const stripDescription = musicStripMode === "latest"
    ? "Latest music first, based on added date."
    : "Top rated music based on total likes and loves.";
  const stripAccentClassName = musicStripMode === "latest"
    ? "bg-[linear-gradient(135deg,#ffb366,#ff8866)]"
    : "bg-[linear-gradient(135deg,#ffa84d,#ff9933)]";

  const finderRows = musics.map((music) => ({
    id: music.id,
    name: music.musicTitle,
    genre: music.tagNamesByType.genre?.[0] ?? "-",
    subGenre: music.tagNamesByType.subGenre?.[0] ?? "-",
    reviewType: music.isSong ? "Song" : "Album",
    year: music.musicDebutYear,
    addedBy: music.submitterName,
    thumbsDown: music.noRatingCount,
    thumbsUp: music.thumbsUpCount,
    love: music.loveCount,
    comments: music.commentCount,
  }));

  const filteredMusics = finderRows.filter((music) => {
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

  const selectedMusicName = finderRows.find((music) => music.id === selectedMusic)?.name ?? "";
  const selectedMusicBasic = (selectedMusicDetail?.id === selectedMusic ? selectedMusicDetail : musics.find((music) => music.id === selectedMusic)) ?? musics[0] ?? null;
  const canReactToSelectedMusic = Boolean(selectedMusicBasic && selectedMusicBasic.memberId !== member.memberId);
  const canEditSelectedMusic = Boolean(selectedMusicBasic && selectedMusicBasic.memberId === member.memberId);
  const canEditLyricsSelectedMusic = Boolean(selectedMusicBasic && selectedMusicBasic.memberId === member.memberId && selectedMusicBasic.isSong);
  const canViewLyricsSelectedMusic = Boolean(
    selectedMusicBasic?.isSong
    && selectedMusicDetail?.id === selectedMusic
    && selectedMusicDetail.lyrics,
  );

  function handleToggleLike(likenessDegree: number) {
    if (!selectedMusicBasic) {
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

    const normalizedComment = commentText.trim();
    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addMusicCommentAction({ musicId: selectedMusicBasic.id, commentText: normalizedComment });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSelectedMusicDetail(result.music);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 md:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">Family Music Lovers</p>
              <Link href="/" className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Back to Main Page</Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Keep your family&apos;s favorite songs, albums, and reviews in one place.</h1>
              <Link href="/music/templates" className="ml-3 mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Edit3 className="mr-1 size-3.5" />Music Templates</Link>
            </div>
            {/* <Link href="/music/templates"><Edit3 className="size-4" />Music Templates</Link> */ }

            <div className="mt-8 flex flex-col items-start gap-6 md:flex-row md:items-center">
              <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[24rem]">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Music Posts</p><p className="mt-2 text-2xl font-black">{ musics.length }</p><p className="text-sm text-[#ffe8d1]">records in view</p></div>
                  <div><p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Selected</p><p className="mt-2 text-lg font-black leading-tight">{ selectedMusicBasic?.musicTitle ?? "None" }</p><p className="text-sm text-[#ffe8d1]">active music</p></div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={ () => setIsViewMusicOpen(true) } disabled={ !selectedMusicBasic } className="rounded-full bg-white text-[#6b2f10] hover:bg-[#ffe8d1]"><Eye className="size-4" />View Music</Button>
                  <Button type="button" variant="outline" asChild className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href="/music/add-music"><Plus className="size-4" />Add Music</Link></Button>
                  <Button type="button" variant="outline" onClick={ () => router.push(`/music/add-music?id=${ selectedMusic }`) } disabled={ !canEditSelectedMusic } className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"><Edit3 className="size-4" />Edit Music</Button>
                  { canViewLyricsSelectedMusic ? (
                    <Button type="button" variant="outline" asChild className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                      <Link href={ `/music/lyrics?id=${ selectedMusic }` }><Eye className="size-4" />View Lyrics</Link>
                    </Button>
                  ) : null }
                  <Button type="button" variant="outline" onClick={ () => router.push(`/music/lyrics?id=${ selectedMusic }`) } disabled={ !canEditLyricsSelectedMusic } className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"><Edit3 className="size-4" />Edit Lyrics</Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
          <div className="min-w-0 space-y-6">
            <div className="rounded-[1.6rem] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_55px_-36px_rgba(96,32,0,0.8)] backdrop-blur sm:px-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">
                Music Type
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#5c2e1a] transition hover:bg-[#fffaf5]">
                  <input
                    type="radio"
                    name="music-strip-mode"
                    value="latest"
                    checked={ musicStripMode === "latest" }
                    onChange={ () => setMusicStripMode("latest") }
                    className="size-4 border-[#d4a574] text-[#b8581a]"
                  />
                  Latest Music
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#e8c4a0] bg-white px-4 py-2 text-sm font-semibold text-[#5c2e1a] transition hover:bg-[#fffaf5]">
                  <input
                    type="radio"
                    name="music-strip-mode"
                    value="top-rated"
                    checked={ musicStripMode === "top-rated" }
                    onChange={ () => setMusicStripMode("top-rated") }
                    className="size-4 border-[#d4a574] text-[#b8581a]"
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
            />
          </div>

          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)] backdrop-blur">
              <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,240,0.85))] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Music Directory</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">Music Finder</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">Search by title, genre, song or album, and family member.</p></div>
                  <div className="rounded-full border border-[#f0d9c4] bg-[#fdf6ef] px-4 py-2 text-sm font-semibold text-[#8b5a3c]">{ filteredMusics.length } music posts found</div>
                </div>

                <div className="relative mt-5"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b5a3c]" /><Input type="search" value={ searchValue } onChange={ (event) => setSearchValue(event.target.value) } placeholder="Search by music title, genre, sub genre, type, or family member" className="h-12 rounded-full border-[#e8c4a0] bg-white pl-11 pr-4 text-sm text-[#5c2e1a] shadow-sm" aria-label="Search music" /></div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#fff6ef,#fffaf5)] px-4 py-3 text-sm text-[#8b5a3c]"><Music className="size-4 text-[#a85a3a]" /><span className="font-semibold text-[#5c2e1a]">Selected music:</span><span>{ selectedMusicName || "Choose a music post from the list" }</span><span className="rounded-full bg-[#fdf0e4] px-3 py-1 text-xs text-[#8b5a3c]"></span></div>
                <div className="min-w-0 overflow-hidden rounded-[1.4rem] border border-[#f0d9c4]"><div className="max-h-232 overflow-auto"><table className="min-w-248 border-collapse text-left"><thead className="sticky top-0 z-10 bg-[#fff6ef] text-xs uppercase tracking-[0.18em] text-[#a85a3a]"><tr><th className="px-4 py-3 font-bold">Music Name</th><th className="px-4 py-3 font-bold">Thumbs Down</th><th className="px-4 py-3 font-bold">Thumbs Up</th><th className="px-4 py-3 font-bold">Love</th><th className="px-4 py-3 font-bold">Year</th><th className="px-4 py-3 font-bold">Genre</th><th className="px-4 py-3 font-bold">Sub Genre</th><th className="px-4 py-3 font-bold">Song/Album</th><th className="px-4 py-3 font-bold">Added By</th><th className="px-4 py-3 font-bold">Comments</th></tr></thead><tbody>{ filteredMusics.map((music) => { const isSelected = selectedMusic === music.id; return <tr key={ music.id } className="border-t border-[#f5e8e0] bg-white transition hover:bg-[#fffaf5]"><td className="px-2 py-2 sm:px-3"><button type="button" onClick={ () => setSelectedMusic(music.id) } className={ ["flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]", isSelected ? "bg-[#fdf6ef] shadow-sm" : "hover:bg-[#fffbf7]"].join(" ") }><span className="font-semibold text-[#5c2e1a]">{ music.name }</span>{ isSelected ? <span className="rounded-full bg-[#b8581a] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">Selected</span> : null }</button></td><td className="px-4 py-3 text-sm font-semibold text-[#6d5c52]"><span className="inline-flex items-center gap-2"><ThumbsDown className="size-4 text-[#6d5c52]" />{ music.thumbsDown }</span></td><td className="px-4 py-3 text-sm font-semibold text-[#8a5a22]"><span className="inline-flex items-center gap-2"><ThumbsUp className="size-4 text-[#b8581a]" />{ music.thumbsUp }</span></td><td className="px-4 py-3 text-sm font-semibold text-[#8f2f58]"><span className="inline-flex items-center gap-2"><Heart className="size-4 text-[#cf3f7f]" />{ music.love }</span></td><td className="px-4 py-3 text-sm text-[#734f3a]">{ music.year }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ music.genre }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ music.subGenre }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ music.reviewType }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ music.addedBy }</td><td className="px-4 py-3 text-sm font-semibold text-[#8b5a3c]"><span className="inline-flex items-center gap-2"><MessageSquareText className="size-4 text-[#a85a3a]" />{ music.comments }</span></td></tr>; }) }</tbody></table></div>{ filteredMusics.length === 0 ? <div className="border-t border-[#f5e8e0] px-4 py-8 text-center text-sm text-[#8b5a3c]">No music posts match that search yet.</div> : null }</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)]"><div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,240,0.86))] px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Music Reactions</p><p className="mt-2 max-w-2xl text-xs leading-6 text-[#8b5a3c]">React to this music and post comments your family can see.</p></div></div></div><div className="space-y-5 px-5 py-5 sm:px-6">{ selectedMusicBasic ? <><div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4"><div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={ () => handleToggleLike(-1) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#6d5c52] text-white hover:bg-[#554940]" aria-label="Add thumbs down"><ThumbsDown className={ `size-4 ${ selectedMusicDetail?.likenessDegree === -1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(1) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#b8581a] text-white hover:bg-[#964815]" aria-label="Add thumbs up"><ThumbsUp className={ `size-4 ${ selectedMusicDetail?.likenessDegree === 1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(2) } disabled={ !selectedMusicBasic || isEngaging || !canReactToSelectedMusic } className="rounded-full bg-[#cf3f7f] text-white hover:bg-[#aa3368]" aria-label="Add love"><Heart className={ `size-4 ${ selectedMusicDetail?.likenessDegree === 2 ? "fill-white" : "" }` } /></Button></div>{ !canReactToSelectedMusic ? <p className="text-xs text-[#8b5a3c]">You cannot react to your own music. Ask another family member to rate it.</p> : null }<div className="flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-1.5 font-semibold text-[#6d5c52]"><ThumbsDown className="size-4 text-[#6d5c52]" />{ (selectedMusicDetail?.noRatingCount ?? selectedMusicBasic?.noRatingCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]"><ThumbsUp className="size-4 text-[#b8581a]" />{ (selectedMusicDetail?.thumbsUpCount ?? selectedMusicBasic?.thumbsUpCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]"><Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />{ (selectedMusicDetail?.loveCount ?? selectedMusicBasic?.loveCount ?? 0).toLocaleString() }</span></div></div><div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Family Comments</p><p className="text-xs text-[#8b5a3c]">Share your thoughts about this music with your family.</p></div><div className="space-y-2"><label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="music-comment-input">Add Comment</label><textarea id="music-comment-input" value={ commentText } onChange={ (event) => setCommentText(event.target.value) } placeholder="What did you think about this music?" disabled={ !selectedMusicBasic || isEngaging } className="min-h-24 w-full rounded-xl border border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#5c2e1a] outline-none transition focus-visible:ring-2 focus-visible:ring-[#d4a574]" /><div className="flex justify-end"><Button type="button" onClick={ handleAddComment } disabled={ !selectedMusicBasic || isEngaging || commentText.trim().length < 2 } className="rounded-full bg-[#b8581a] text-white hover:bg-[#964815]">Post Comment</Button></div></div><div className="space-y-2">{ selectedMusicDetail?.id === selectedMusic && selectedMusicDetail.musicComments.length === 0 ? <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">No comments yet. Be the first family member to add one.</p> : selectedMusicDetail?.id !== selectedMusic ? <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">Loading comments...</p> : (selectedMusicDetail?.musicComments ?? []).map((comment) => <article key={ comment.id } className="rounded-2xl border border-[#f0d9c4] bg-white px-3 py-3 text-sm text-[#734f3a]"><p className="whitespace-pre-wrap leading-6">{ comment.text || "(No text in comment)" }</p><p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8b5a3c]">{ comment.commenterName } · { formatCreatedAt(comment.createdAt) }</p></article>) }</div></div></> : <div className="rounded-[1.5rem] border border-dashed border-[#f0d9c4] bg-[#fff8f2] px-6 py-10 text-center text-[#8b5a3c]"><MessageSquareText className="mx-auto mb-3 size-10 text-[#d4a574]" /><p className="text-lg font-semibold text-[#5c2e1a]">Select a music to view comments.</p><p className="mt-2 text-sm">Choose a music from the finder list to see and post family comments.</p></div> }</div></div>
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