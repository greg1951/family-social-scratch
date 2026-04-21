"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Edit3, Eye, Heart, MessageSquareText, Plus, Search, ThumbsUp, Tv } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addShowCommentAction,
  getShowDetailAction,
  toggleShowLikeAction,
} from "@/app/(features)/(tv)/tv/actions";
import { createEmptyTipTapDocument, parseSerializedTipTapDocument } from "@/components/db/types/poem-term-validation";
import { TvShow, TvShowDetail } from "@/components/db/types/shows";
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
import { TvScrollStrip } from "@/features/tv/components/tv-scroll-strip";

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

function getShowDocument(showJson?: string): JSONContent {
  if (!showJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(showJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function ShowViewer({ showJson }: { showJson?: string }) {
  const viewer = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: getShowDocument(showJson),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-112 text-[#12384e] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!viewer) {
      return;
    }

    viewer.commands.setContent(getShowDocument(showJson));
  }, [viewer, showJson]);

  return (
    <div className="rounded-2xl border border-[#c6dcec] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#c6dcec] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#c6dcec] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#c6dcec] [&_.tiptap_th]:bg-[#eaf5fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c6dcec] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
      <EditorContent editor={ viewer } />
    </div>
  );
}

export function TvHomePage({
  shows,
  member,
}: {
  shows: TvShow[];
  member: MemberKeyDetails;
}) {
  const [isEngaging, startEngageTransition] = useTransition();
  const [selectedShowDetail, setSelectedShowDetail] = useState<TvShowDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isViewShowOpen, setIsViewShowOpen] = useState(false);

  const latestShowRecords = [...shows]
    .sort((leftShow, rightShow) => +new Date(rightShow.updatedAt) - +new Date(leftShow.updatedAt))
    .slice(0, 8);

  const latestShows = latestShowRecords.map((show) => ({
    kind: "latest" as const,
    name: show.showTitle,
    date: formatDate(show.updatedAt),
    commentsCount: show.commentCount,
    thumbsUp: show.thumbsUpCount,
    love: show.loveCount,
    imageSrc: show.showImageUrl ?? "/images/tv-shows/landman-tablet.png",
    imageAlt: `${ show.showTitle } show image`,
  }));

  const topRatedShows = [...shows]
    .filter((show) => (show.thumbsUpCount + show.loveCount) > 0)
    .sort((leftShow, rightShow) => {
      const leftScore = leftShow.thumbsUpCount + (leftShow.loveCount * 2);
      const rightScore = rightShow.thumbsUpCount + (rightShow.loveCount * 2);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftShow.commentCount !== rightShow.commentCount) {
        return rightShow.commentCount - leftShow.commentCount;
      }

      return +new Date(rightShow.updatedAt) - +new Date(leftShow.updatedAt);
    })
    .slice(0, 8)
    .map((show) => ({
      kind: "top-rated" as const,
      name: show.showTitle,
      noRating: show.noRatingCount,
      thumbsUp: show.thumbsUpCount,
      love: show.loveCount,
      commentsCount: show.commentCount,
      imageSrc: show.showImageUrl ?? "/images/tv-shows/always-sunny-tablet.png",
      imageAlt: `${ show.showTitle } show image`,
    }));

  const showFinderRows = shows.map((show) => ({
    id: show.id,
    name: show.showTitle,
    genre: show.tagNamesByType.genre?.[0] ?? "-",
    adjective: show.tagNamesByType.adjective?.[0] ?? "-",
    channel: show.tagNamesByType.channel?.[0] ?? "Unknown",
    seasons: show.seasonCount,
    addedBy: show.submitterName,
    thumbsUp: show.thumbsUpCount,
    love: show.loveCount,
    comments: show.commentCount,
  }));

  const [searchValue, setSearchValue] = useState("");
  const [selectedShow, setSelectedShow] = useState(showFinderRows[0]?.id ?? 0);
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredShows = showFinderRows.filter((show) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [show.name, show.genre, show.adjective, show.channel, show.addedBy]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  useEffect(() => {
    if (!selectedShow) {
      setSelectedShowDetail(null);
      return;
    }

    let isCancelled = false;

    startEngageTransition(async () => {
      const result = await getShowDetailAction({ showId: selectedShow });

      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setSelectedShowDetail(null);
        return;
      }

      setSelectedShowDetail(result.show);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedShow]);

  const selectedShowName = showFinderRows.find((show) => show.id === selectedShow)?.name ?? "";
  const selectedShowBasic =
    (selectedShowDetail?.id === selectedShow
      ? selectedShowDetail
      : shows.find((show) => show.id === selectedShow))
    ?? shows[0]
    ?? null;
  const canEditSelectedShow = Boolean(selectedShowBasic && selectedShowBasic.memberId === member.memberId);
  const canReactToSelectedShow = Boolean(selectedShowBasic && selectedShowBasic.memberId !== member.memberId);

  function handleSelectShow(showId: number) {
    setCommentText("");
    const show = shows.find((record) => record.id === showId);

    if (show) {
      setSelectedShow(showId);
      setSelectedShowDetail(null);
    }
  }

  function handleToggleLike(likenessDegree: number) {
    if (!selectedShowBasic) {
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleShowLikeAction({
        showId: selectedShowBasic.id,
        likenessDegree,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedShowDetail(result.show);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedShowBasic) {
      return;
    }

    const normalizedComment = commentText.trim();

    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addShowCommentAction({
        showId: selectedShowBasic.id,
        commentText: normalizedComment,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setSelectedShowDetail(result.show);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,47,66,0.95),rgba(21,98,123,0.86)_56%,rgba(106,177,198,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(8,34,50,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#b9f1ff]">
                Family TV Junkies
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                See what TV shows your family&apos;s watching.
              </h1>
              <Link
                href="/tv/templates"
                className="ml-3 mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Edit3 className="mr-1 size-3.5" />
                Show Templates
              </Link>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[24rem]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#b9f1ff]">Shows</p>
                  <p className="mt-2 text-2xl font-black">{ shows.length }</p>
                  <p className="text-sm text-[#d9f5ff]">records in view</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#b9f1ff]">Selected</p>
                  <p className="mt-2 text-lg font-black leading-tight">
                    { selectedShowBasic?.showTitle ?? "None" }
                  </p>
                  <p className="text-sm text-[#d9f5ff]">active show</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={ () => setIsViewShowOpen(true) }
                  disabled={ !selectedShowBasic }
                  className="rounded-full bg-white text-[#15384a] hover:bg-[#d9f5ff]"
                >
                  <Eye className="size-4" />
                  View Show
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Link href="/tv/add-show">
                    <Plus className="size-4" />
                    Add Show
                  </Link>
                </Button>

                { canEditSelectedShow && selectedShowBasic ? (
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href={ `/tv/edit-show/${ selectedShowBasic.id }` }>
                      Edit Show
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    className="rounded-full border-white/20 bg-white/5 text-white/55"
                  >
                    Edit Show
                  </Button>
                ) }
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6">
            <TvScrollStrip
              title="Latest TV Shows"
              description="Fresh picks added for the family."
              items={ latestShows }
              accentClassName="bg-[linear-gradient(135deg,#b5e6f5,#fff3ce)]"
            />

            <TvScrollStrip
              title="Top Rated TV Shows"
              description="Top rated TV shows based on family ratings (Likes and Loves)."
              items={ topRatedShows }
              accentClassName="bg-[linear-gradient(135deg,#ffdbae,#ffc4c8)]"
            />
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)] backdrop-blur">
              <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,249,255,0.85))] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                      TV Directory
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-[#15384a]">Show Finder</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">
                      Search by show title, tags, channel, or family member and pick what to watch next.
                    </p>
                  </div>

                  <div className="rounded-full border border-[#d7ebf3] bg-[#f6fbfe] px-4 py-2 text-sm font-semibold text-[#24536a]">
                    { filteredShows.length } shows found
                  </div>
                </div>

                <div className="relative mt-5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#5f7987]" />
                  <Input
                    type="search"
                    value={ searchValue }
                    onChange={ (event) => setSearchValue(event.target.value) }
                    placeholder="Search by show, genre, adjective, channel, or family member"
                    className="h-12 rounded-full border-[#c9e2ec] bg-white pl-11 pr-4 text-sm text-[#15384a] shadow-sm"
                    aria-label="Search TV shows"
                  />
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#eff9fd,#f9fdff)] px-4 py-3 text-sm text-[#376176]">
                  <Tv className="size-4 text-[#2a819d]" />
                  <span className="font-semibold text-[#17384b]">Selected show:</span>
                  <span>{ selectedShowName || "Choose a show from the list" }</span>
                  <span className="rounded-full bg-[#e8f5fd] px-3 py-1 text-xs text-[#24536a]">Viewing as { member.firstName }</span>
                </div>

                <div className="overflow-hidden rounded-[1.4rem] border border-[#d7ebf3]">
                  <div className="max-h-232 overflow-auto">
                    <table className="min-w-248 border-collapse text-left">
                      <thead className="sticky top-0 z-10 bg-[#eef8fc] text-xs uppercase tracking-[0.18em] text-[#4f7384]">
                        <tr>
                          <th className="px-4 py-3 font-bold">Show Name</th>
                          <th className="px-4 py-3 font-bold">Thumbs Up</th>
                          <th className="px-4 py-3 font-bold">Love</th>
                          <th className="px-4 py-3 font-bold"># of Seasons</th>
                          <th className="px-4 py-3 font-bold">Genre</th>
                          <th className="px-4 py-3 font-bold">Adjective</th>
                          <th className="px-4 py-3 font-bold">Channel</th>
                          <th className="px-4 py-3 font-bold">Added By</th>
                          <th className="px-4 py-3 font-bold">Comments</th>
                        </tr>
                      </thead>
                      <tbody>
                        { filteredShows.map((show) => {
                          const isSelected = selectedShow === show.id;

                          return (
                            <tr
                              key={ show.id }
                              className="border-t border-[#e4f0f5] bg-white transition hover:bg-[#f8fcff]"
                            >
                              <td className="px-2 py-2 sm:px-3">
                                <button
                                  type="button"
                                  onClick={ () => handleSelectShow(show.id) }
                                  className={ [
                                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59cdf7]",
                                    isSelected ? "bg-[#ecf9ff] shadow-sm" : "hover:bg-[#f4fbfe]",
                                  ].join(" ") }
                                >
                                  <span className="font-semibold text-[#17384b]">{ show.name }</span>
                                  { isSelected ? (
                                    <span className="rounded-full bg-[#15384a] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">
                                      Selected
                                    </span>
                                  ) : null }
                                </button>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-[#285b73]">
                                <span className="inline-flex items-center gap-2">
                                  <ThumbsUp className="size-4 text-[#2d87a8]" />
                                  { show.thumbsUp }
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">
                                <span className="inline-flex items-center gap-2 font-semibold text-[#8f2f58]">
                                  <Heart className="size-4 text-[#cf3f7f]" />
                                  { show.love }
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.seasons }</td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.genre }</td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.adjective }</td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.channel }</td>
                              <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.addedBy }</td>
                              <td className="px-4 py-3 text-sm font-semibold text-[#285b73]">
                                <span className="inline-flex items-center gap-2">
                                  <MessageSquareText className="size-4 text-[#2d87a8]" />
                                  { show.comments }
                                </span>
                              </td>
                            </tr>
                          );
                        }) }
                      </tbody>
                    </table>
                  </div>

                  { filteredShows.length === 0 ? (
                    <div className="border-t border-[#e4f0f5] px-4 py-8 text-center text-sm text-[#5f7987]">
                      No shows match that search yet.
                    </div>
                  ) : null }
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)]">
              <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,249,255,0.86))] px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                      Show Reactions
                    </p>
                    <p className="mt-2 max-w-2xl text-xs leading-6 text-[#5f7987]">
                      React to this show and post comments your family can see.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 px-5 py-5 sm:px-6">
                { selectedShowBasic ? (
                  <>
                    <div className="space-y-3 rounded-[1.4rem] border border-[#d7ebf3] bg-[#f5fbff] p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={ () => handleToggleLike(1) }
                          disabled={ !selectedShowBasic || isEngaging || !canReactToSelectedShow }
                          className="rounded-full bg-[#2d87a8] text-white hover:bg-[#256e89]"
                          aria-label={ selectedShowDetail?.likenessDegree === 1 ? "Remove thumbs up" : "Add thumbs up" }
                        >
                          <ThumbsUp className={ `size-4 ${ selectedShowDetail?.likenessDegree === 1 ? "fill-white" : "" }` } />
                        </Button>
                        <Button
                          type="button"
                          onClick={ () => handleToggleLike(2) }
                          disabled={ !selectedShowBasic || isEngaging || !canReactToSelectedShow }
                          className="rounded-full bg-[#cf3f7f] text-white hover:bg-[#aa3368]"
                          aria-label={ selectedShowDetail?.likenessDegree === 2 ? "Remove love" : "Add love" }
                        >
                          <Heart className={ `size-4 ${ selectedShowDetail?.likenessDegree === 2 ? "fill-white" : "" }` } />
                        </Button>
                      </div>
                      { !canReactToSelectedShow && selectedShowBasic ? (
                        <p className="text-xs text-[#5f7987]">
                          Come on, you cannot like or love your own show! Ask another family member to react to it.
                        </p>
                      ) : null }
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#285b73]">
                          <ThumbsUp className="size-4 text-[#2d87a8]" />
                          { (selectedShowDetail?.thumbsUpCount ?? selectedShowBasic?.thumbsUpCount ?? 0).toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                          <Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />
                          { (selectedShowDetail?.loveCount ?? selectedShowBasic?.loveCount ?? 0).toLocaleString() }
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[1.4rem] border border-[#d7ebf3] bg-[#f5fbff] p-4">
                      <div>
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">Family Comments</p>
                        <p className="text-xs text-[#5f7987]">Share your thoughts about this show with your family.</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-comment-input">
                          Add Comment
                        </label>
                        <textarea
                          id="show-comment-input"
                          value={ commentText }
                          onChange={ (event) => setCommentText(event.target.value) }
                          placeholder="What did you think about this show?"
                          disabled={ !selectedShowBasic || isEngaging }
                          className="min-h-24 w-full rounded-xl border border-[#d7ebf3] bg-white px-3 py-2 text-sm text-[#15384a] outline-none transition focus-visible:ring-2 focus-visible:ring-[#59cdf7]"
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={ handleAddComment }
                            disabled={ !selectedShowBasic || isEngaging || commentText.trim().length < 2 }
                            className="rounded-full bg-[#2d87a8] text-white hover:bg-[#256e89]"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        { selectedShowDetail?.id === selectedShow && selectedShowDetail.showComments.length === 0 ? (
                          <p className="rounded-2xl border border-dashed border-[#d7ebf3] bg-white px-3 py-2 text-sm text-[#5f7987]">
                            No comments yet. Be the first family member to add one.
                          </p>
                        ) : selectedShowDetail?.id !== selectedShow ? (
                          <p className="rounded-2xl border border-dashed border-[#d7ebf3] bg-white px-3 py-2 text-sm text-[#5f7987]">
                            Loading comments...
                          </p>
                        ) : (
                          (selectedShowDetail?.showComments ?? []).map((comment) => (
                            <article key={ comment.id } className="rounded-2xl border border-[#d7ebf3] bg-white px-3 py-3 text-sm text-[#3f6576]">
                              <p className="whitespace-pre-wrap leading-6">{ comment.text || "(No text in comment)" }</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#4f7384]">
                                { comment.commenterName } · { formatCreatedAt(comment.createdAt) }
                              </p>
                            </article>
                          ))
                        ) }
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[#d7ebf3] bg-[#f8fcff] px-6 py-10 text-center text-[#5f7987]">
                    <MessageSquareText className="mx-auto mb-3 size-10 text-[#6ea8be]" />
                    <p className="text-lg font-semibold text-[#15384a]">Select a show to view comments.</p>
                    <p className="mt-2 text-sm">Choose a show from the finder list to see and post family comments.</p>
                  </div>
                ) }
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={ isViewShowOpen } onOpenChange={ setIsViewShowOpen }>
        <DialogContent className="border-[#c6dcec] bg-[#f5fbff] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-[#15384a]">{ selectedShowBasic?.showTitle ?? "Show" }</DialogTitle>
            <DialogDescription className="text-[#5f7987]">
              Full show details and family notes.
            </DialogDescription>
          </DialogHeader>

          { selectedShowBasic ? (
            <div className="max-h-[75vh] space-y-4 overflow-auto pr-1">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <ShowViewer showJson={ selectedShowBasic.showJson } />

                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Caption</p>
                    <p className="mt-2 text-sm leading-6 text-[#3f6576]">
                      { selectedShowBasic.showCaption || "No caption provided." }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Details</p>
                    <div className="mt-3 space-y-3 text-sm text-[#3f6576]">
                      <p><span className="font-semibold text-[#15384a]">Submitter:</span> { selectedShowBasic.submitterName }</p>
                      <p><span className="font-semibold text-[#15384a]">Updated:</span> { formatDate(selectedShowBasic.updatedAt) }</p>
                      <p><span className="font-semibold text-[#15384a]">Years:</span> { selectedShowBasic.showFirstYear } - { selectedShowBasic.showLastYear }</p>
                      <p><span className="font-semibold text-[#15384a]">Seasons:</span> { selectedShowBasic.seasonCount }</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Reactions</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[#285b73]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7fb] px-3 py-1">
                        <ThumbsUp className="size-4 text-[#2d87a8]" />
                        { (selectedShowDetail?.thumbsUpCount ?? selectedShowBasic.thumbsUpCount ?? 0).toLocaleString() }
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-1 text-[#8f2f58]">
                        <Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />
                        { (selectedShowDetail?.loveCount ?? selectedShowBasic.loveCount ?? 0).toLocaleString() }
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7fb] px-3 py-1">
                        <MessageSquareText className="size-4 text-[#2d87a8]" />
                        { selectedShowDetail?.commentCount ?? selectedShowBasic.commentCount ?? 0 }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null }
        </DialogContent>
      </Dialog>
    </section>
  );
}
