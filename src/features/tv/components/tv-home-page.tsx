"use client";

import { Star, ThumbsUp, MessageSquareText, Tv, Search } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Input } from "@/components/ui/input";
import { TvScrollStrip } from "@/features/tv/components/tv-scroll-strip";

const latestShows = [
  {
    kind: "latest" as const,
    name: "Landman",
    date: "November 17, 2024",
    imageSrc: "/images/tv-shows/landman-tablet.png",
    imageAlt: "Landman TV show artwork",
  },
  {
    kind: "latest" as const,
    name: "Slow Horses",
    date: "September 4, 2024",
    imageSrc: "/images/tv-shows/slow-horses-tablet.png",
    imageAlt: "Slow Horses TV show artwork",
  },
  {
    kind: "latest" as const,
    name: "Shrinking",
    date: "October 16, 2024",
    imageSrc: "/images/tv-shows/shrinking-tablet.png",
    imageAlt: "Shrinking TV show artwork",
  },
  {
    kind: "latest" as const,
    name: "Mayor of Easttown",
    date: "May 30, 2021",
    imageSrc: "/images/tv-shows/mayor-easttown-tablet.png",
    imageAlt: "Mayor of Easttown TV show artwork",
  },
];

const topRatedShows = [
  {
    kind: "top-rated" as const,
    name: "M*A*S*H",
    rating: 5,
    recommendations: 187,
    imageSrc: "/images/tv-shows/mash-tablet.png",
    imageAlt: "MASH TV show artwork",
  },
  {
    kind: "top-rated" as const,
    name: "Hogan's Heroes",
    rating: 5,
    recommendations: 142,
    imageSrc: "/images/tv-shows/hogans-heroes-tablet.png",
    imageAlt: "Hogan's Heroes TV show artwork",
  },
  {
    kind: "top-rated" as const,
    name: "F Troop",
    rating: 4,
    recommendations: 121,
    imageSrc: "/images/tv-shows/f-troop-tablet.png",
    imageAlt: "F Troop TV show artwork",
  },
  {
    kind: "top-rated" as const,
    name: "It's Always Sunny in Philadelphia",
    rating: 5,
    recommendations: 211,
    imageSrc: "/images/tv-shows/always-sunny-tablet.png",
    imageAlt: "It's Always Sunny in Philadelphia TV show artwork",
  },
];

const showFinderRows = [
  {
    name: "Landman",
    recommendations: 187,
    averageRating: 4.8,
    seasons: 1,
    genre: "Drama",
    channel: "Paramount+",
    addedBy: "Grace",
    comments: 24,
  },
  {
    name: "Slow Horses",
    recommendations: 173,
    averageRating: 4.9,
    seasons: 4,
    genre: "Spy Thriller",
    channel: "Apple TV+",
    addedBy: "Henry",
    comments: 31,
  },
  {
    name: "Shrinking",
    recommendations: 161,
    averageRating: 4.7,
    seasons: 2,
    genre: "Comedy-Drama",
    channel: "Apple TV+",
    addedBy: "Nina",
    comments: 19,
  },
  {
    name: "Mayor of Easttown",
    recommendations: 132,
    averageRating: 4.6,
    seasons: 1,
    genre: "Crime Drama",
    channel: "HBO",
    addedBy: "Isaac",
    comments: 16,
  },
  {
    name: "M*A*S*H",
    recommendations: 205,
    averageRating: 5,
    seasons: 11,
    genre: "Comedy",
    channel: "CBS",
    addedBy: "Ruth",
    comments: 38,
  },
  {
    name: "The Simpsons",
    recommendations: 194,
    averageRating: 4.8,
    seasons: 36,
    genre: "Animated Comedy",
    channel: "FOX",
    addedBy: "Ben",
    comments: 43,
  },
  {
    name: "Hogan's Heroes",
    recommendations: 142,
    averageRating: 4.9,
    seasons: 6,
    genre: "Comedy",
    channel: "CBS",
    addedBy: "Mila",
    comments: 22,
  },
  {
    name: "It's Always Sunny in Philadelphia",
    recommendations: 211,
    averageRating: 4.9,
    seasons: 16,
    genre: "Comedy",
    channel: "FX",
    addedBy: "Owen",
    comments: 47,
  },
];

export function TvHomePage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedShow, setSelectedShow] = useState(showFinderRows[0]?.name ?? "");
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredShows = showFinderRows.filter((show) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [show.name, show.genre, show.channel, show.addedBy]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(11,47,66,0.95),rgba(21,98,123,0.86)_56%,rgba(106,177,198,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(8,34,50,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#b9f1ff]">
                Family TV Hub
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Keep your family&apos;s next binge watch in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d9f5ff] sm:text-base">
                Browse fresh additions, revisit the top-rated favorites, and search the full family watch list without leaving the TV group.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-3 lg:min-w-[24rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#b9f1ff]">Latest</p>
                <p className="mt-2 text-2xl font-black">4</p>
                <p className="text-sm text-[#d9f5ff]">new additions</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#b9f1ff]">Top Rated</p>
                <p className="mt-2 text-2xl font-black">4.9</p>
                <p className="text-sm text-[#d9f5ff]">average favorites</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#b9f1ff]">Finder</p>
                <p className="mt-2 text-2xl font-black">8</p>
                <p className="text-sm text-[#d9f5ff]">searchable shows</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6">
            <TvScrollStrip
              title="Latest tv shows"
              description="Fresh picks for the family queue. Use the arrows on larger screens, or scroll vertically on smaller screens."
              items={ latestShows }
              accentClassName="bg-[linear-gradient(135deg,#b5e6f5,#fff3ce)]"
            />

            <TvScrollStrip
              title="Top Rated TV Shows"
              description="These are the shows your family keeps recommending, with ratings and thumbs-up counts visible at a glance."
              items={ topRatedShows }
              accentClassName="bg-[linear-gradient(135deg,#ffdbae,#ffc4c8)]"
            />
          </div>

          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(9,44,62,0.75)] backdrop-blur">
            <div className="border-b border-[#d7ebf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(236,249,255,0.85))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#45829a]">
                    TV Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#15384a]">Show Finder</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7987]">
                    Search the list, then select a row to spotlight the show your family wants to watch next.
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
                  placeholder="Search by show, genre, channel, or family member"
                  className="h-12 rounded-full border-[#c9e2ec] bg-white pl-11 pr-4 text-sm text-[#15384a] shadow-sm"
                  aria-label="Search TV shows"
                />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#eff9fd,#f9fdff)] px-4 py-3 text-sm text-[#376176]">
                <Tv className="size-4 text-[#2a819d]" />
                <span className="font-semibold text-[#17384b]">Selected show:</span>
                <span>{ selectedShow || "Choose a show from the list" }</span>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-[#d7ebf3]">
                <div className="max-h-232 overflow-auto">
                  <table className="min-w-248 border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#eef8fc] text-xs uppercase tracking-[0.18em] text-[#4f7384]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Show Name</th>
                        <th className="px-4 py-3 font-bold">Thumbs Up</th>
                        <th className="px-4 py-3 font-bold">Average Rating</th>
                        <th className="px-4 py-3 font-bold"># of Seasons</th>
                        <th className="px-4 py-3 font-bold">Genre</th>
                        <th className="px-4 py-3 font-bold">Channel</th>
                        <th className="px-4 py-3 font-bold">Added By</th>
                        <th className="px-4 py-3 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      { filteredShows.map((show) => {
                        const isSelected = selectedShow === show.name;

                        return (
                          <tr
                            key={ show.name }
                            className="border-t border-[#e4f0f5] bg-white transition hover:bg-[#f8fcff]"
                          >
                            <td className="px-2 py-2 sm:px-3">
                              <button
                                type="button"
                                onClick={ () => setSelectedShow(show.name) }
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
                                { show.recommendations }
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#3f6576]">
                              <span className="inline-flex items-center gap-2 font-semibold text-[#c58512]">
                                <Star className="size-4 fill-current text-[#c58512]" />
                                { show.averageRating.toFixed(1) }
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.seasons }</td>
                            <td className="px-4 py-3 text-sm text-[#3f6576]">{ show.genre }</td>
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
        </div>
      </div>
    </section>
  );
}