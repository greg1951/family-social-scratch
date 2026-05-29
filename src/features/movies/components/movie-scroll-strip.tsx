"use client";

import { Heart, MessageSquare, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { normalizeShowSiteBackgroundHex } from "@/features/support/types/constants";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { cn } from "@/lib/utils";

type LatestMovieItem = {
  kind: "latest";
  id: number;
  name: string;
  date: string;
  submitterLikenessDegree: number | null;
  commentsCount: number;
  thumbsUp: number;
  love: number;
  hasDiscussionThread: boolean;
  imageSrc: string | null;
  imageAlt: string;
  movieSiteUrl: string | null;
  movieSiteBackground: string;
};

type TopRatedMovieItem = {
  kind: "top-rated";
  id: number;
  name: string;
  submitterLikenessDegree: number | null;
  noRating: number;
  thumbsUp: number;
  love: number;
  commentsCount: number;
  hasDiscussionThread: boolean;
  imageSrc: string | null;
  imageAlt: string;
  movieSiteUrl: string | null;
  movieSiteBackground: string;
};

type MovieScrollItem = LatestMovieItem | TopRatedMovieItem;

type MovieScrollStripProps = {
  title: string;
  description: string;
  items: MovieScrollItem[];
  accentClassName: string;
  selectedItemId?: number;
  onSelectItem?: (id: number) => void;
};

function SubmitterRatingIcon({ likenessDegree }: { likenessDegree: number | null }) {
  if (likenessDegree === 1) {
    return <ThumbsUp className="size-4 text-[#b8581a]" aria-label="Submitter rated thumbs up" />;
  }

  if (likenessDegree === 2) {
    return <Heart className="size-4 text-[#cf3f7f]" aria-label="Submitter rated love" />;
  }

  return null;
}

function SubmitterRatingBadge({ likenessDegree }: { likenessDegree: number | null }) {
  if (![1, 2].includes(likenessDegree ?? -1)) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#fff3e8] p-2 shadow-sm">
      <SubmitterRatingIcon likenessDegree={ likenessDegree } />
    </span>
  );
}

export function MovieScrollStrip({
  title,
  description,
  items,
  accentClassName,
  selectedItemId,
  onSelectItem,
}: MovieScrollStripProps) {

  function MovieImage({ src, alt }: { src: string; alt: string }) {
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
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(102,34,0,0.8)] backdrop-blur">
      <CardHeader className="gap-4 border-b border-[#ffe0b5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,240,0.82))] px-5 py-5 sm:px-6">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">
            Movie Maniacs
          </p>
          <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">
            { title }
          </CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">{ description }</p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-5 sm:py-4">
        <div
          className="grid max-h-800 grid-cols-1 gap-3 overflow-y-auto px-1 pb-1 pt-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          { items.map((item) => {
            const isSelected = selectedItemId === item.id;

            return (
              <article
                key={ item.name }
                className="min-w-0"
              >
                <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(92,46,26,0.72)]", isSelected ? "ring-2 ring-[#b8581a] ring-offset-1" : accentClassName) }>
                  <div
                    role={ onSelectItem ? "button" : undefined }
                    tabIndex={ onSelectItem ? 0 : undefined }
                    onClick={ onSelectItem ? () => onSelectItem(item.id) : undefined }
                    onKeyDown={ onSelectItem ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectItem(item.id); } } : undefined }
                    aria-label={ onSelectItem ? (isSelected ? `${ item.name } is selected` : `Select ${ item.name }`) : undefined }
                    aria-pressed={ onSelectItem ? isSelected : undefined }
                    className={ cn(
                      "overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfeff]",
                      onSelectItem && "cursor-pointer",
                      onSelectItem && !isSelected && "hover:bg-[#fff8f2]",
                      isSelected && "bg-[#fff3e8]",
                    ) }
                  >
                    <div className="relative aspect-[16/6.7] overflow-hidden sm:aspect-16/10">
                      { item.imageSrc ? (
                        <MovieImage src={ item.imageSrc } alt={ item.imageAlt } />
                      ) : item.movieSiteUrl ? (
                        <div className="flex h-full w-full items-center justify-center px-4 py-6" style={ { backgroundColor: normalizeShowSiteBackgroundHex(item.movieSiteBackground) } }>
                          <span className="text-center text-lg font-black leading-tight tracking-tight text-white/80">{ item.name }</span>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#3b2315]">
                          <span className="text-center text-sm font-semibold text-white/75">{ item.name }</span>
                        </div>
                      ) }
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                      { item.kind === "top-rated" ? (
                        <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#5c2e1a] shadow-sm">
                          Top rated
                        </div>
                      ) : null }
                      <div className="pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-2">
                        { item.hasDiscussionThread ? (
                          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-[#b8581a] shadow-sm">
                            <MessageSquare className="size-4" aria-label="Discussion thread available" />
                          </div>
                        ) : null }
                      </div>
                    </div>

                    <div className="space-y-3 px-4 py-4">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="min-w-0 text-base font-black leading-snug tracking-tight text-[#13364a]">
                            { item.movieSiteUrl ? (
                              <a
                                href={ item.movieSiteUrl }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline-offset-2 hover:underline"
                                onClick={ (event) => event.stopPropagation() }
                                onKeyDown={ (event) => event.stopPropagation() }
                              >
                                { item.name }
                              </a>
                            ) : (
                              item.name
                            ) }
                          </h3>
                          <SubmitterRatingBadge likenessDegree={ item.submitterLikenessDegree } />
                        </div>
                        { item.kind === "latest" ? (
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#607887]">
                            <span>{ item.date }</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]">
                              <ThumbsUp className="size-4 text-[#b8581a]" />
                              { item.thumbsUp.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                              <Heart className="size-4 text-[#cf3f7f]" />
                              { item.love.toLocaleString() }
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]">
                              <MessageSquareText className="size-4 text-[#b8581a]" />
                              { item.commentsCount.toLocaleString() }
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2 text-sm text-[#607887]">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#6d5c52]">
                                <ThumbsDown className="size-4 text-[#6d5c52]" />
                                { item.noRating.toLocaleString() }
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]">
                                <ThumbsUp className="size-4 text-[#b8581a]" />
                                { item.thumbsUp.toLocaleString() }
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]">
                                <Heart className="size-4 text-[#cf3f7f]" />
                                { item.love.toLocaleString() }
                              </span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]">
                              <MessageSquareText className="size-4 text-[#b8581a]" />
                              { item.commentsCount.toLocaleString() }
                            </span>
                          </div>
                        ) }
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
