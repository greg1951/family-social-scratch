"use client";

import { Disc, DiscAlbum, Heart, MessageSquare, MessageSquareText, MicVocal, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestMusicItem = {
  kind: "latest";
  id: number;
  name: string;
  status: string;
  date: string;
  submitterName: string;
  reviewType: "Song" | "Album";
  hasLyrics: boolean;
  hasDiscussionThread: boolean;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  imageSrc: string | null;
  imageAlt: string;
};

type TopRatedMusicItem = {
  kind: "top-rated";
  id: number;
  name: string;
  status: string;
  date: string;
  submitterName: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  hasDiscussionThread: boolean;
  imageSrc: string | null;
  imageAlt: string;
};

type AllMusicItem = {
  kind: "all";
  id: number;
  name: string;
  status: string;
  date: string;
  submitterName: string;
  reviewType: "Song" | "Album";
  hasLyrics: boolean;
  hasDiscussionThread: boolean;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  imageSrc: string | null;
  imageAlt: string;
};

type MusicScrollItem = LatestMusicItem | TopRatedMusicItem | AllMusicItem;

type MusicScrollStripProps = {
  title: string;
  description: string;
  items: MusicScrollItem[];
  accentClassName: string;
  selectedItemId?: number;
  onSelectItem?: (id: number) => void;
  onOpenItem?: (id: number) => void;
};

function SubmitterRatingIcon({ likenessDegree }: { likenessDegree: number | null }) {
  if (likenessDegree === 1) {
    return <ThumbsUp className="size-4 text-[#245475]" aria-label="Submitter rated thumbs up" />;
  }

  if (likenessDegree === 2) {
    return <Heart className="size-4 text-[#b33f6c]" aria-label="Submitter rated love" />;
  }

  return null;
}

function SubmitterRatingBadge({ likenessDegree }: { likenessDegree: number | null }) {
  if (![1, 2].includes(likenessDegree ?? -1)) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#f2d28f] bg-[#fff3c9] p-2.5 shadow-[0_8px_18px_-12px_rgba(145,100,0,0.65)]">
      <SubmitterRatingIcon likenessDegree={ likenessDegree } />
    </span>
  );
}

function MusicTypeIconBadge({ item }: { item: LatestMusicItem | AllMusicItem }) {
  if (item.reviewType === "Song" && item.hasLyrics) {
    return (
      <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef6fb] text-[#2d6a82]" title="Lyrics">
        <MicVocal className="size-4" aria-label="Lyrics" />
      </span>
    );
  }

  if (item.reviewType === "Album") {
    return (
      <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef6fb] text-[#2d6a82]" title="Album">
        <DiscAlbum className="size-4" aria-label="Album" />
      </span>
    );
  }

  return (
    <span className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eef6fb] text-[#2d6a82]" title="Song">
      <Disc className="size-4" aria-label="Song" />
    </span>
  );
}

export function MusicScrollStrip({
  title,
  description,
  items,
  accentClassName,
  selectedItemId,
  onSelectItem,
  onOpenItem,
}: MusicScrollStripProps) {
  function MusicImage({ src, alt }: { src: string; alt: string }) {
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

  return (
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(9,44,62,0.8)] backdrop-blur">
      <CardHeader className="gap-0.5 border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(239,249,253,0.82))] px-4 py-1.5 sm:px-6 sm:py-2.5">
        <div>
          <CardTitle className="mt-0 text-lg font-black tracking-tight text-[#15384a] sm:text-xl">
            { title }
          </CardTitle>
          <p className="mt-0.5 max-w-2xl text-xs leading-5 text-[#5f7987] sm:mt-2 sm:text-sm sm:leading-6">{ description }</p>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-1 pt-1 sm:px-5 sm:py-5">
        <div
          className="grid max-h-800 grid-cols-2 gap-2 overflow-y-auto px-1 pb-1 pt-0.5 md:grid-cols-4 lg:grid-cols-4 sm:pt-1"
        >
          { items.map((item) => {
            const isSelected = selectedItemId === item.id;

            return (
              <article
                key={ item.name }
                className="min-w-0"
              >
                <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(17,53,70,0.72)]", isSelected ? "ring-2 ring-[#245475] ring-offset-1" : accentClassName) }>
                  <div
                    role={ onSelectItem ? "button" : undefined }
                    tabIndex={ onSelectItem ? 0 : undefined }
                    onClick={ onSelectItem ? () => onSelectItem(item.id) : undefined }
                    onDoubleClick={ onOpenItem ? () => onOpenItem(item.id) : undefined }
                    onKeyDown={ onSelectItem ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectItem(item.id); } } : undefined }
                    aria-label={ onSelectItem ? (isSelected ? `${ item.name } is selected` : `Select ${ item.name }`) : undefined }
                    aria-pressed={ onSelectItem ? isSelected : undefined }
                    className={ cn(
                      "overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfeff]",
                      onSelectItem && "cursor-pointer",
                      onSelectItem && !isSelected && "hover:bg-[#f8f5ff]",
                      isSelected && "bg-[#f0f5ff]",
                    ) }
                  >
                    <div className="relative aspect-[16/6.7] overflow-hidden sm:aspect-16/10">
                      { item.imageSrc ? (
                        <MusicImage src={ item.imageSrc } alt={ item.imageAlt } />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#17324f,#315d8d_52%,#587fb1_100%)] px-5 py-6 text-center">
                          <div className="max-w-[92%] rounded-[1.3rem] border border-white/15 bg-black/20 px-4 py-3 shadow-[0_14px_32px_-20px_rgba(3,18,28,0.75)] backdrop-blur-[1px]">
                            <h3 className="max-w-full text-wrap text-xl font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(4,24,34,0.58)] sm:text-2xl">
                              { item.name }
                            </h3>
                          </div>
                        </div>
                      ) }
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                      { item.hasDiscussionThread ? (
                        <div className="pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#2d87a8] shadow-sm">
                          <MessageSquare className="size-4" aria-label="Discussion thread available" />
                        </div>
                      ) : null }
                    </div>

                    <div className="select-none space-y-3 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          { item.imageSrc ? (
                            <>
                              <h3 className="min-w-0 text-base font-black leading-snug tracking-tight text-[#13364a]">{ item.name }</h3>
                              <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-[#607887] sm:flex-nowrap">
                                <span className="whitespace-nowrap font-semibold text-[#21536a]">{ item.submitterName }</span>
                                <span className="text-[#9bb0bb]">.</span>
                                <span className="whitespace-nowrap">{ item.date }</span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1 text-[11px] text-[#607887]">
                              <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap">
                                <span className="whitespace-nowrap font-semibold text-[#21536a]">{ item.submitterName }</span>
                                <span className="text-[#9bb0bb]">.</span>
                                <span className="whitespace-nowrap">{ item.date }</span>
                              </div>
                            </div>
                          ) }
                          { item.status === "draft" ? (
                            <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-[#d69b2d] bg-[#fff0b8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#8d5200] shadow-[0_8px_16px_-10px_rgba(141,82,0,0.75)]">
                              <span className="size-1.5 rounded-full bg-[#d38a00]" aria-hidden="true" />
                              Draft
                            </span>
                          ) : null }
                        </div>

                        { item.imageSrc ? <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } /> : null }
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#21536a]">
                        { item.kind === "top-rated" ? (
                          <span className="inline-flex items-center gap-1.5 text-[#5f6a70]">
                            <ThumbsDown className="size-4 text-[#66757d]" />
                            { item.noRating.toLocaleString() }
                          </span>
                        ) : null }
                        <span className="inline-flex items-center gap-1.5 text-[#245475]">
                          <ThumbsUp className="size-4 text-[#2d87a8]" />
                          { item.thumbsUp.toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#8d2f59]">
                          <Heart className="size-4 fill-[#bf3f73] text-[#bf3f73]" />
                          { item.love.toLocaleString() }
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#245475]">
                          <MessageSquareText className="size-4 text-[#2d87a8]" />
                          { item.commentsCount.toLocaleString() }
                        </span>
                        { item.kind !== "top-rated" ? <MusicTypeIconBadge item={ item } /> : null }
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          }) }
        </div>
      </CardContent>
    </Card>
  );
}