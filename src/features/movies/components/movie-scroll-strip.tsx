"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Star, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LatestMovieItem = {
  kind: "latest";
  name: string;
  date: string;
  imageSrc: string;
  imageAlt: string;
};

type TopRatedMovieItem = {
  kind: "top-rated";
  name: string;
  rating: number;
  recommendations: number;
  imageSrc: string;
  imageAlt: string;
};

type MovieScrollItem = LatestMovieItem | TopRatedMovieItem;

type MovieScrollStripProps = {
  title: string;
  description: string;
  items: MovieScrollItem[];
  accentClassName: string;
};

export function MovieScrollStrip({
  title,
  description,
  items,
  accentClassName,
}: MovieScrollStripProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateScreenSize = () => {
      setIsSmallScreen(mediaQuery.matches);
    };

    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);

    return () => {
      mediaQuery.removeEventListener("change", updateScreenSize);
    };
  }, []);

  const handleScroll = (direction: "previous" | "next") => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const distance = isSmallScreen ? container.clientHeight * 0.8 : container.clientWidth * 0.8;

    container.scrollBy({
      top: isSmallScreen ? (direction === "next" ? distance : -distance) : 0,
      left: isSmallScreen ? 0 : direction === "next" ? distance : -distance,
      behavior: "smooth",
    });
  };

  return (
    <Card className="overflow-hidden border-white/70 bg-white/80 shadow-[0_22px_65px_-38px_rgba(102,34,0,0.8)] backdrop-blur">
      <CardHeader className="gap-4 border-b border-[#ffe0b5] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,240,0.82))] px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">
              Movie Maniacs
            </p>
            <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">
              { title }
            </CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">{ description }</p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full border-[#e8c4a0] bg-white/90 text-[#5c2e1a] hover:bg-[#fffaf5]"
              onClick={ () => handleScroll("previous") }
              aria-label={ `Scroll ${ title } backward` }
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full border-[#e8c4a0] bg-white/90 text-[#5c2e1a] hover:bg-[#fffaf5]"
              onClick={ () => handleScroll("next") }
              aria-label={ `Scroll ${ title } forward` }
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
        <div
          ref={ scrollRef }
          className="flex max-h-124 snap-y snap-mandatory flex-col gap-4 overflow-y-auto pr-1 md:max-h-none md:snap-x md:flex-row md:overflow-x-auto md:overflow-y-hidden md:pb-2 md:pr-0"
        >
          { items.map((item) => (
            <article
              key={ item.name }
              className="min-w-0 snap-start md:w-68 md:min-w-68 lg:w-72 lg:min-w-72"
            >
              <div className={ cn("rounded-[1.6rem] p-px shadow-[0_18px_34px_-24px_rgba(92,46,26,0.72)]", accentClassName) }>
                <div className="overflow-hidden rounded-[calc(1.6rem-1px)] border border-white/80 bg-[#fbfeff]">
                  <div className="relative aspect-16/10 overflow-hidden">
                    <Image
                      src={ item.imageSrc }
                      alt={ item.imageAlt }
                      fill
                      sizes="(max-width: 767px) 100vw, 288px"
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(4,24,34,0),rgba(4,24,34,0.78))]" />
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#5c2e1a] shadow-sm">
                      { item.kind === "latest" ? "Recently added" : "Fan favorite" }
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-[#13364a]">{ item.name }</h3>
                      { item.kind === "latest" ? (
                        <p className="mt-1 text-sm text-[#607887]">Added { item.date }</p>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#607887]">
                          <span className="inline-flex items-center gap-1.5 text-[#d68a0f]">
                            { Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={ index }
                                className={ cn("size-3.5", index < item.rating ? "fill-[#d68a0f]" : "fill-[#e8d5c0]") }
                              />
                            )) }
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[#5c7987]">
                            <ThumbsUp className="size-3.5 fill-[#5c7987]" />
                            { item.recommendations }
                          </span>
                        </div>
                      ) }
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )) }
        </div>
      </CardContent>
    </Card>
  );
}
