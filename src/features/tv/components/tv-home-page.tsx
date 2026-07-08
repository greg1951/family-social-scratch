"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { ArrowLeft, CircleHelp, Edit3, ExternalLink, Eye, Heart, MessageSquare, MessageSquareText, Plus, Search, ThumbsDown, ThumbsUp, Tv } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addShowCommentAction,
  getShowDetailAction,
  toggleShowLikeAction,
} from "@/app/(features)/(tv)/tv/actions";
import TipTapCommentEditor from "@/components/common/tiptap-comment-editor";
import TiptapRenderer from "@/components/discuss/tiptap-renderer";
import StartDiscussionDialog from "@/components/discuss/start-discussion-dialog";
import {
  createEmptyTipTapDocument,
  isSerializedTipTapDocumentEmpty,
  normalizeSerializedTipTapDocument,
  parseSerializedTipTapDocument,
} from "@/components/db/types/poem-term-validation";
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
import { normalizeShowSiteBackgroundHex } from "@/features/support/types/constants";
import { TvScrollStrip } from "@/features/tv/components/tv-scroll-strip";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { clearQueuedFeatureComment, createClientRequestId, getPwaSyncNowEventName, isBrowserOnline, queueFeatureComment, readQueuedFeatureComments } from "@/lib/pwa-background-sync";
import FeatureFaqHelp from "@/components/common/feature-faq-help";



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

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${ year }-${ month }-${ day }`;
}

function formatShortDate(value: Date) {
  const parsed = new Date(value);
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const yy = String(parsed.getFullYear()).slice(-2);
  return `${ mm }-${ dd }-${ yy }`;
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

function ModalShowImage({ src, alt }: { src: string; alt: string }) {
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

export function TvHomePage({ shows, member }: { shows: TvShow[]; member: MemberKeyDetails }) {
  const router = useRouter();
  const [isEngaging, startEngageTransition] = useTransition();
  const [selectedShowDetail, setSelectedShowDetail] = useState<TvShowDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isViewShowOpen, setIsViewShowOpen] = useState(false);
  const [showStripMode, setShowStripMode] = useState<"latest" | "top-rated">("latest");
  const [includeArchived, setIncludeArchived] = useState(false);

  const visibleShows = shows.filter((show) => show.status === "published" || (includeArchived && show.status === "archived"));

  const latestShowRecords = [...visibleShows]
    .sort((leftShow, rightShow) => +new Date(rightShow.updatedAt) - +new Date(leftShow.updatedAt))
    .slice(0, 8);

  const latestShows = latestShowRecords.map((show) => ({
    kind: "latest" as const,
    id: show.id,
    name: show.showTitle,
    date: formatShortDate(show.updatedAt),
    submitterLikenessDegree: show.memberId === member.memberId ? null : show.submitterLikenessDegree,
    commentsCount: show.commentCount,
    thumbsUp: show.thumbsUpCount,
    love: show.loveCount,
    imageSrc: show.showImageUrl ?? null,
    imageAlt: `${ show.showTitle } show image`,
    showSiteUrl: show.showSiteUrl ?? null,
    showSiteBackground: show.showSiteBackground,
    hasDiscussionThread: show.hasDiscussionThread,
  }));

  const topRatedShows = [...visibleShows]
    .filter((show) => (show.thumbsUpCount + show.loveCount) > 0)
    .sort((leftShow, rightShow) => {
      const leftScore = leftShow.thumbsUpCount + leftShow.loveCount;
      const rightScore = rightShow.thumbsUpCount + rightShow.loveCount;

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return +new Date(rightShow.updatedAt) - +new Date(leftShow.updatedAt);
    })
    .slice(0, 8)
    .map((show) => ({
      kind: "top-rated" as const,
      id: show.id,
      name: show.showTitle,
      submitterLikenessDegree: show.memberId === member.memberId ? null : show.submitterLikenessDegree,
      noRating: show.noRatingCount,
      thumbsUp: show.thumbsUpCount,
      love: show.loveCount,
      commentsCount: show.commentCount,
      imageSrc: show.showImageUrl ?? null,
      imageAlt: `${ show.showTitle } show image`,
      showSiteUrl: show.showSiteUrl ?? null,
      showSiteBackground: show.showSiteBackground,
      hasDiscussionThread: show.hasDiscussionThread,
    }));

  const stripItems = showStripMode === "latest" ? latestShows : topRatedShows;
  const stripTitle = showStripMode === "latest" ? "Latest TV Shows" : "Top Rated TV Shows";
  const stripDescription = showStripMode === "latest"
    ? "Latest shows first, based on added date."
    : "Top rated shows based on total likes and loves.";
  const stripAccentClassName = showStripMode === "latest"
    ? "bg-[linear-gradient(135deg,#b5e6f5,#fff3ce)]"
    : "bg-[linear-gradient(135deg,#ffdbae,#ffc4c8)]";

  const showFinderRows = visibleShows.map((show) => ({
    id: show.id,
    name: show.showTitle,
    updatedAt: show.updatedAt,
    genre: show.tagNamesByType.genre?.[0] ?? "-",
    adjective: show.tagNamesByType.adjective?.[0] ?? "-",
    channel: show.tagNamesByType.channel?.[0] ?? "Unknown",
    seasons: show.seasonCount,
    addedBy: show.submitterName,
    thumbsUp: show.thumbsUpCount,
    love: show.loveCount,
    comments: show.commentCount,
    hasDiscussionThread: show.hasDiscussionThread,
  }));

  const [searchValue, setSearchValue] = useState("");
  const [filterWithDiscussionThreads, setFilterWithDiscussionThreads] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return toDateInputValue(threeMonthsAgo);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [selectedShow, setSelectedShow] = useState(showFinderRows[0]?.id ?? 0);
  const [showSelectionRevision, setShowSelectionRevision] = useState(0);
  const deferredSearchValue = useDeferredValue(searchValue);

  useEffect(() => {
    const flushQueuedShowComments = async () => {
      if (!isBrowserOnline()) {
        return;
      }

      const queuedComments = readQueuedFeatureComments().filter((item) => item.kind === "show");

      for (const queuedComment of queuedComments) {
        const result = await addShowCommentAction(queuedComment.payload);

        if (!result.success) {
          continue;
        }

        if (queuedComment.payload.clientRequestId) {
          clearQueuedFeatureComment(queuedComment.payload.clientRequestId);
        }

        if (selectedShow === queuedComment.payload.showId) {
          setSelectedShowDetail(result.show);
        }
      }
    };

    void flushQueuedShowComments();

    const handleSync = () => {
      void flushQueuedShowComments();
    };

    window.addEventListener("online", handleSync);
    window.addEventListener(getPwaSyncNowEventName(), handleSync);

    return () => {
      window.removeEventListener("online", handleSync);
      window.removeEventListener(getPwaSyncNowEventName(), handleSync);
    };
  }, [selectedShow]);

  const startDateValue = startDate ? new Date(`${ startDate }T00:00:00`) : null;
  const endDateValue = endDate ? new Date(`${ endDate }T23:59:59.999`) : null;

  const filteredShows = showFinderRows.filter((show) => {
    const updatedAt = new Date(show.updatedAt);

    if (startDateValue && updatedAt < startDateValue) {
      return false;
    }

    if (endDateValue && updatedAt > endDateValue) {
      return false;
    }

    if (filterWithDiscussionThreads && !show.hasDiscussionThread) {
      return false;
    }

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
  }, [selectedShow, showSelectionRevision]);

  // const selectedShowName = showFinderRows.find((show) => show.id === selectedShow)?.name ?? "";
  const selectedShowBasic =
    (selectedShowDetail?.id === selectedShow
      ? selectedShowDetail
      : shows.find((show) => show.id === selectedShow))
    ?? shows[0]
    ?? null;
  const canEditSelectedShow = Boolean(selectedShowBasic && (selectedShowBasic.memberId === member.memberId || member.isFounder));
  const canReactToSelectedShow = Boolean(selectedShowBasic && selectedShowBasic.memberId !== member.memberId);
  const canCommentOnSelectedShow = canReactToSelectedShow;
  const selectedShowThumbsUpCount = selectedShowDetail?.id === selectedShow
    ? selectedShowDetail.thumbsUpCount
    : canReactToSelectedShow
      ? (selectedShowBasic?.thumbsUpCount ?? 0)
      : 0;
  const selectedShowLoveCount = selectedShowDetail?.id === selectedShow
    ? selectedShowDetail.loveCount
    : canReactToSelectedShow
      ? (selectedShowBasic?.loveCount ?? 0)
      : 0;

  function handleSelectShow(showId: number) {
    setCommentText("");
    const show = shows.find((record) => record.id === showId);

    if (show) {
      setSelectedShow(showId);
      setSelectedShowDetail(null);
      setShowSelectionRevision((prev) => prev + 1);
    }
  }

  function handleOpenShowFromCard(showId: number) {
    handleSelectShow(showId);
    setIsViewShowOpen(true);
  }

  function handleToggleLike(likenessDegree: number) {
    if (!selectedShowBasic) {
      return;
    }

    if (selectedShowBasic.memberId === member.memberId) {
      toast.error("You cannot react to your own show posting.");
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

    if (!canCommentOnSelectedShow) {
      toast.error("You cannot comment on your own show posting.");
      return;
    }

    const normalizedComment = normalizeSerializedTipTapDocument(commentText);

    if (isSerializedTipTapDocumentEmpty(normalizedComment)) {
      toast.error("Enter a comment before posting.");
      return;
    }

    startEngageTransition(async () => {
      const payload = {
        showId: selectedShowBasic.id,
        commentText: normalizedComment,
        clientRequestId: createClientRequestId("show-comment"),
      };
      const result = await addShowCommentAction(payload);

      if (!result.success) {
        if (!isBrowserOnline()) {
          queueFeatureComment({
            kind: "show",
            payload,
            itemTitle: selectedShowBasic.showTitle,
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

      setSelectedShowDetail(result.show);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app h-full w-full px-4 pb-8 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,47,66,0.95),rgba(21,98,123,0.86)_56%,rgba(106,177,198,0.78))] px-4 py-5 text-white shadow-[0_28px_80px_-40px_rgba(8,34,50,0.95)] sm:px-8 sm:py-8 lg:px-10">
          <div className="flex flex-col gap-3 sm:gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#b9f1ff] sm:text-[0.72rem] sm:tracking-[0.34em]">
                Family TV Room
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
                >
                  <ArrowLeft className="font-app mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                  Go Home
                </Link>
                <Link
                  href="/tv/templates"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d9f5ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
                >
                  <Edit3 className="mr-1 size-3 sm:size-3.5" />
                  Show Templates
                </Link>
              </div>
              <h1 className="mt-3 text-base font-black leading-snug tracking-tight sm:mt-4 sm:text-3xl">
                See what TV shows your family&apos;s watching.
              </h1>
              {/* <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b9f1ff] sm:text-base">
                Comment on their favorites, add your own reviews, and find your next binge together.
              </p> */}

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1.05fr_0.95fr] md:gap-6">
          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)] backdrop-blur">
              <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,249,255,0.85))] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                      TV Directory
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5f7987]">
                      <h2 className="text-2xl font-black tracking-tight text-[#15384a]">Show Finder</h2>
                      <FeatureFaqHelp
                        href="/feature-faq?category=TV%20and%20Movie%20Reviews"
                        buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                        iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#2a819d]"
                        tooltipClassName="bg-[#15384a] text-[#ecf9ff]"
                      />
                      <Button type="button" onClick={ () => setIsViewShowOpen(true) } disabled={ !selectedShowBasic } className="h-8 shrink-0 whitespace-nowrap rounded-full border border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#15384a] hover:bg-[#dff2f9] disabled:opacity-50"><Eye className="size-3.5" />View Show</Button>
                      <Button type="button" variant="outline" asChild className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#15384a] hover:bg-[#dff2f9] hover:text-[#15384a]"><Link href="/tv/add-show"><Plus className="size-3.5" />Add Show</Link></Button>
                      <Button type="button" variant="outline" onClick={ () => router.push(`/tv/edit-show/${ selectedShow }`) } disabled={ !canEditSelectedShow } className="h-8 shrink-0 whitespace-nowrap rounded-full border-[#c9e2ec] bg-[#f6fbfe] px-3 text-xs font-semibold text-[#15384a] hover:bg-[#dff2f9] hover:text-[#15384a] disabled:opacity-50"><Edit3 className="size-3.5" />Edit Show</Button>
                    </div>
                    {/* <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">
                      Search by show title, tags, channel, or family member and pick what to watch next.
                    </p> */}
                  </div>

                  {/* <div className="rounded-full border border-[#d7ebf3] bg-[#f6fbfe] px-4 py-2 text-sm font-semibold text-[#24536a]">
                    { filteredShows.length } shows found
                  </div> */}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[16rem] flex-1">
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
                  <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c9e2ec] bg-white px-3 py-2 text-xs font-semibold text-[#24536a]">
                    <input
                      type="checkbox"
                      checked={ includeArchived }
                      onChange={ (event) => setIncludeArchived(event.target.checked) }
                      className="size-4 border-[#8ec6df] text-[#2d87a8]"
                    />
                    Include Archived
                  </label>
                  <label className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c9e2ec] bg-white px-3 py-2 text-xs font-semibold text-[#24536a]">
                    <input
                      type="checkbox"
                      checked={ filterWithDiscussionThreads }
                      onChange={ (event) => setFilterWithDiscussionThreads(event.target.checked) }
                      className="size-4 border-[#8ec6df] text-[#2d87a8]"
                    />
                    Show Discussions
                  </label>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4f7384]">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={ startDate }
                      max={ endDate || undefined }
                      onChange={ (event) => setStartDate(event.target.value) }
                      className="h-9 rounded-xl border-[#c9e2ec] bg-white px-2 text-xs text-[#15384a]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4f7384]">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={ endDate }
                      min={ startDate || undefined }
                      onChange={ (event) => setEndDate(event.target.value) }
                      className="h-9 rounded-xl border-[#c9e2ec] bg-white px-2 text-xs text-[#15384a]"
                    />
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                {/* <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#eff9fd,#f9fdff)] px-4 py-3 text-sm text-[#376176]">
                  <Tv className="size-4 text-[#2a819d]" />
                  <span className="font-semibold text-[#17384b]">Selected show:</span>
                  <span>{ selectedShowName || "Choose a show from the list" }</span>
                  <span className="rounded-full bg-[#e8f5fd] px-3 py-1 text-xs text-[#24536a]">Viewing as { member.firstName }</span>
                </div> */}

                <div className="max-h-[68vh] overflow-y-auto pr-0.5">
                  { filteredShows.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-[#d7ebf3] bg-white px-4 py-8 text-center text-sm text-[#5f7987]">
                      No shows match that search yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                      { filteredShows.map((show) => {
                        const isSelected = selectedShow === show.id;

                        return (
                          <button
                            key={ show.id }
                            type="button"
                            onClick={ () => handleSelectShow(show.id) }
                            onDoubleClick={ () => handleOpenShowFromCard(show.id) }
                            title={ [
                              `${ show.genre } • ${ show.adjective } • ${ show.channel }`,
                              `Added by ${ show.addedBy }`,
                            ].join("\n") }
                            className={ [
                              "w-full rounded-xl border p-2 text-left transition-all duration-200",
                              "hover:border-[#b9d9e7] hover:shadow-[0_12px_30px_-26px_rgba(24,77,103,0.8)]",
                              isSelected
                                ? "border-[#8ec6df] bg-[#edf8ff] shadow-[0_16px_34px_-24px_rgba(24,77,103,0.85)]"
                                : "border-[#d7ebf3] bg-white",
                            ].join(" ") }
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate text-[13px] font-semibold text-[#17384b]">{ show.name }</p>
                              { show.hasDiscussionThread ? (
                                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dff2f9] text-[#2d87a8]" title="Discussion thread available">
                                  <MessageSquare className="size-3" aria-label="Discussion thread available" />
                                </span>
                              ) : null }
                            </div>

                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#5f7987]">
                              <Tv className="size-3 shrink-0" />
                              <span className="truncate">{ show.channel }</span>
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#376176]">
                              <span>S:{ show.seasons }</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1">
                                <ThumbsUp className="size-3 text-[#2d87a8]" />
                                { show.thumbsUp }
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Heart className="size-3 text-[#cf3f7f]" />
                                { show.love }
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <MessageSquareText className="size-3 text-[#2d87a8]" />
                                { show.comments }
                              </span>
                            </div>

                            <p className="mt-1 truncate text-[10px] text-[#6d8998]">
                              { show.addedBy } · { formatShortDate(show.updatedAt) }
                            </p>
                          </button>
                        );
                      }) }
                    </div>
                  ) }
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
                          { selectedShowThumbsUpCount.toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                          <Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />
                          { selectedShowLoveCount.toLocaleString() }
                        </span>
                      </div>

                      <div className="space-y-3 rounded-4xl border border-[#d7ebf3] bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5f7987]">
                              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">Discussion Threads</p>
                              <FeatureFaqHelp
                                href="/feature-faq?category=Discussion%20Groups"
                                buttonClassName="h-4 w-4 md:h-7 md:w-7 rounded-xl border-[#c9e2ec] bg-gradient-to-b from-[#f7fcff] to-[#dff2f9] text-[#2a819d] shadow-[0_8px_18px_rgba(42,129,157,0.2)] group-hover:shadow-[0_12px_26px_rgba(42,129,157,0.3)]"
                                iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#2a819d]"
                                tooltipClassName="bg-[#15384a] text-[#ecf9ff]"
                              />
                            </div>
                            <p className="text-xs text-[#5f7987]">Follow the conversation that belongs to this show.</p>
                          </div>
                          <StartDiscussionDialog
                            targetType="show"
                            targetId={ selectedShowBasic.id }
                            topicLabel={ `${ selectedShowBasic.showTitle } Discussion ${ (selectedShowDetail?.id === selectedShow
                              ? selectedShowDetail.discussionThreads.length
                              : 0) + 1 }` }
                            revalidatePaths={ ["/tv"] }
                            onSuccessRoute="/tv/discussions/:threadId"
                            disabled={ isEngaging || selectedShowDetail?.id !== selectedShow }
                            triggerLabel="Add Discussion"
                            triggerClassName="rounded-full bg-[#2d87a8] px-4 text-xs font-semibold text-white hover:bg-[#256e89]"
                          />
                        </div>

                        { selectedShowDetail?.id !== selectedShow ? (
                          <p className="rounded-2xl border border-dashed border-[#d7ebf3] bg-[#f8fcff] px-3 py-2 text-sm text-[#5f7987]">
                            Loading discussion threads...
                          </p>
                        ) : selectedShowDetail.discussionThreads.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-[#d7ebf3] bg-[#f8fcff] px-3 py-3 text-sm text-[#5f7987]">
                            <p>No discussion threads have been added for this show yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            { selectedShowDetail.discussionThreads.map((discussionThread) => (
                              <article key={ discussionThread.id } className="rounded-2xl border border-[#d7ebf3] bg-[#f8fcff] px-4 py-4 text-sm text-[#3f6576] shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 space-y-1 flex-1">
                                    <p className="text-base font-bold leading-snug text-[#15384a]">{ discussionThread.discussTopic }</p>
                                    <p className="text-xs uppercase tracking-[0.16em] text-[#4f7384]">
                                      { discussionThread.memberFirstName } · { formatCreatedAt(discussionThread.createdAt) }
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    { discussionThread.dislikeCount > 0 || discussionThread.likeCount > 0 || discussionThread.loveCount > 0 ? (
                                      <div className="flex flex-wrap items-center gap-2">
                                        { discussionThread.dislikeCount > 0 && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-[#efebe8] px-2 py-1 text-[0.65rem] font-semibold text-[#4f433d]">
                                            <ThumbsDown className="size-3" />
                                            { discussionThread.dislikeCount }
                                          </span>
                                        ) }
                                        { discussionThread.likeCount > 0 && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f4fb] px-2 py-1 text-[0.65rem] font-semibold text-[#1f5a70]">
                                            <ThumbsUp className="size-3" />
                                            { discussionThread.likeCount }
                                          </span>
                                        ) }
                                        { discussionThread.loveCount > 0 && (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fde4ee] px-2 py-1 text-[0.65rem] font-semibold text-[#aa3368]">
                                            <Heart className="size-3 fill-current" />
                                            { discussionThread.loveCount }
                                          </span>
                                        ) }
                                      </div>
                                    ) : null }

                                    <Button
                                      type="button"
                                      variant="outline"
                                      asChild
                                      className="shrink-0 rounded-full border-[#c9e2ec] bg-white px-4 text-xs font-semibold text-[#15384a] hover:bg-[#dff2f9]"
                                    >
                                      <Link href={ `/tv/discussions/${ discussionThread.id }` }>
                                        View
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              </article>
                            )) }
                          </div>
                        ) }
                      </div>
                    </div>

                  </>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-[#d7ebf3] bg-[#f8fcff] px-6 py-10 text-center text-[#5f7987]">
                    <MessageSquareText className="mx-auto mb-3 size-10 text-[#6ea8be]" />
                    <p className="text-lg font-semibold text-[#15384a]">Select a show to react and discuss.</p>
                    <p className="mt-2 text-sm">Choose a show from the finder list to react and browse discussions.</p>
                  </div>
                ) }
              </div>
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <div className="rounded-[1.6rem] border border-white/70 bg-white/80 px-5 py-3 backdrop-blur sm:px-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                Show Type
              </p>
              <div className="mt-2 flex flex-wrap gap-2.5">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#c7dfeb] bg-white px-4 py-2 text-sm font-semibold text-[#15384a] transition hover:bg-[#f1f8fb]">
                  <input
                    type="radio"
                    name="tv-show-strip-mode"
                    value="latest"
                    checked={ showStripMode === "latest" }
                    onChange={ () => setShowStripMode("latest") }
                    className="size-4 border-[#86b3c5] text-[#2d87a8]"
                  />
                  Latest TV Shows
                </label>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#c7dfeb] bg-white px-4 py-2 text-sm font-semibold text-[#15384a] transition hover:bg-[#f1f8fb]">
                  <input
                    type="radio"
                    name="tv-show-strip-mode"
                    value="top-rated"
                    checked={ showStripMode === "top-rated" }
                    onChange={ () => setShowStripMode("top-rated") }
                    className="size-4 border-[#86b3c5] text-[#2d87a8]"
                  />
                  Top Rated TV Shows
                </label>
              </div>
            </div>

            <TvScrollStrip
              title={ stripTitle }
              description={ stripDescription }
              items={ stripItems }
              accentClassName={ stripAccentClassName }
              selectedShowId={ selectedShow }
              onSelectShow={ handleSelectShow }
              onOpenShow={ handleOpenShowFromCard }
            />
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
            <div className="max-h-[90vh] space-y-4 overflow-auto pr-1">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <ShowViewer showJson={ selectedShowBasic.showJson } />

                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-[#c6dcec] bg-white">
                    <div className="aspect-16/10 overflow-hidden">
                      { selectedShowBasic.showImageUrl ? (
                        <ModalShowImage
                          src={ selectedShowBasic.showImageUrl }
                          alt={ `${ selectedShowBasic.showTitle } show image` }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#173444] px-4">
                          <span className="text-center text-sm font-semibold text-white/80">No show image available.</span>
                        </div>
                      ) }
                    </div>
                  </div>

                  { (!selectedShowBasic.showSiteUrl || selectedShowBasic.showImageUrl) ? (
                    <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Image Credit</p>
                      <p className="mt-2 text-sm leading-6 text-[#3f6576] wrap-break-word">
                        { selectedShowBasic.showImageCredit || "No image credit provided." }
                      </p>
                    </div>
                  ) : null }

                  { selectedShowBasic.showSiteUrl ? (
                    <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Official Site</p>
                      <a
                        href={ selectedShowBasic.showSiteUrl }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1a6a8a] underline-offset-2 hover:underline"
                      >
                        <ExternalLink className="size-4" />
                        { selectedShowBasic.showSiteUrl.includes("imdb.com") ? "View on IMDb" : "View on YouTube" }
                      </a>
                    </div>
                  ) : null }

                  <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Details</p>
                    <div className="mt-2 space-y-1 text-sm leading-5 text-[#3f6576]">
                      <p><span className="font-semibold text-[#15384a]">Submitter:</span> { selectedShowBasic.submitterName }</p>
                      <p><span className="font-semibold text-[#15384a]">Updated:</span> { formatDate(selectedShowBasic.updatedAt) }</p>
                      <p><span className="font-semibold text-[#15384a]">Years:</span> { selectedShowBasic.showFirstYear } - { selectedShowBasic.showLastYear }</p>
                      <p><span className="font-semibold text-[#15384a]">Seasons:</span> { selectedShowBasic.seasonCount }</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#c6dcec] bg-white p-4">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#45829a]">Reactions</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-[#285b73]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7fb] px-3 py-0.5">
                        <ThumbsUp className="size-4 text-[#2d87a8]" />
                        { selectedShowThumbsUpCount.toLocaleString() }
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-0.5 text-[#8f2f58]">
                        <Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />
                        { selectedShowLoveCount.toLocaleString() }
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#edf7fb] px-3 py-0.5">
                        <MessageSquareText className="size-4 text-[#2d87a8]" />
                        { selectedShowDetail?.commentCount ?? selectedShowBasic.commentCount ?? 0 }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-[1.4rem] border border-[#d7ebf3] bg-[#f5fbff] p-4">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">Family Comments</p>
                  <p className="text-xs text-[#5f7987]">Share your thoughts about this show with your family.</p>
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
                        <TiptapRenderer contentJson={ comment.commentJson } />
                        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#4f7384]">
                          { comment.commenterName } · { formatCreatedAt(comment.createdAt) }
                        </p>
                      </article>
                    ))
                  ) }
                </div>

                { canCommentOnSelectedShow ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[#15384a]" htmlFor="show-comment-input-dialog">
                      Add Comment
                    </label>
                    <div id="show-comment-input-dialog">
                      <TipTapCommentEditor
                        value={ commentText }
                        onChange={ setCommentText }
                        placeholder="What did you think about this show?"
                        disabled={ !selectedShowBasic || isEngaging }
                        toolbarClassName="border-[#d7ebf3] bg-[#eef8fd]"
                        editorClassName="border-[#d7ebf3] text-[#15384a]"
                        buttonClassName="border-[#c9e2ec] text-[#24536a]"
                        activeButtonClassName="border-[#2d87a8] bg-[#dff2f9] text-[#15384a]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={ handleAddComment }
                        disabled={ !selectedShowBasic || isEngaging || isSerializedTipTapDocumentEmpty(commentText) }
                        className="rounded-full bg-[#2d87a8] text-white hover:bg-[#256e89]"
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
