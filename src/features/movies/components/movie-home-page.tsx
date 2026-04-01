"use client";

import { Check, MessageSquareText, Search, Film } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { Input } from "@/components/ui/input";
import { MovieScrollStrip } from "@/features/movies/components/movie-scroll-strip";

const latestMovies = [
  {
    kind: "latest" as const,
    name: "The Princess Bride",
    date: "March 30, 2026",
    imageSrc: "/images/movies/princess-bride.png",
    imageAlt: "The Princess Bride movie poster",
  },
  {
    kind: "latest" as const,
    name: "Superman",
    date: "March 28, 2026",
    imageSrc: "/images/movies/superman.png",
    imageAlt: "Superman movie poster",
  },
  {
    kind: "latest" as const,
    name: "One Battle",
    date: "March 26, 2026",
    imageSrc: "/images/movies/one-battle.png",
    imageAlt: "One Battle movie poster",
  },
  {
    kind: "latest" as const,
    name: "Hail Mary",
    date: "March 24, 2026",
    imageSrc: "/images/movies/hail-mary.png",
    imageAlt: "Hail Mary movie poster",
  },
];

const topRatedMovies = [
  {
    kind: "top-rated" as const,
    name: "Robin Hood",
    rating: 5,
    recommendations: 245,
    imageSrc: "/images/movies/robin-hood.png",
    imageAlt: "Robin Hood movie poster",
  },
  {
    kind: "top-rated" as const,
    name: "Sponge Bob",
    rating: 5,
    recommendations: 189,
    imageSrc: "/images/movies/sponge-bob.png",
    imageAlt: "Sponge Bob movie poster",
  },
  {
    kind: "top-rated" as const,
    name: "The King",
    rating: 4,
    recommendations: 156,
    imageSrc: "/images/movies/the-king.png",
    imageAlt: "The King movie poster",
  },
  {
    kind: "top-rated" as const,
    name: "Sinners",
    rating: 4,
    recommendations: 142,
    imageSrc: "/images/movies/sinners.png",
    imageAlt: "Sinners movie poster",
  },
];

const movieFinderRows = [
  {
    movieName: "The Princess Bride",
    contributedBy: "Sarah",
    channel: "Netflix",
    category: "Family",
    kidFriendly: true,
    comments: 24,
  },
  {
    movieName: "Superman",
    contributedBy: "James",
    channel: "Theater",
    category: "Action",
    kidFriendly: true,
    comments: 18,
  },
  {
    movieName: "One Battle",
    contributedBy: "Maria",
    channel: "AppleTV+",
    category: "Drama",
    kidFriendly: false,
    comments: 31,
  },
  {
    movieName: "Hail Mary",
    contributedBy: "Tom",
    channel: "Amazon Prime",
    category: "Sports",
    kidFriendly: false,
    comments: 15,
  },
  {
    movieName: "Robin Hood",
    contributedBy: "Lisa",
    channel: "Disney+",
    category: "Adventure",
    kidFriendly: true,
    comments: 27,
  },
  {
    movieName: "Sponge Bob",
    contributedBy: "Emma",
    channel: "Netflix",
    category: "Comedy",
    kidFriendly: true,
    comments: 42,
  },
  {
    movieName: "The King",
    contributedBy: "David",
    channel: "Netflix",
    category: "Drama",
    kidFriendly: false,
    comments: 19,
  },
  {
    movieName: "Sinners",
    contributedBy: "Rachel",
    channel: "Theater",
    category: "Drama",
    kidFriendly: false,
    comments: 14,
  },
];

export function MovieHomePage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(movieFinderRows[0]?.movieName ?? "");
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredMovies = movieFinderRows.filter((movie) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [movie.movieName, movie.contributedBy, movie.category, movie.channel]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <section className="w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">
                Family Movie Maniacs
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Keep your family&apos;s favorite movies and reviews in one place.
              </h1>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-3 lg:min-w-[24rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Latest</p>
                <p className="mt-2 text-2xl font-black">4</p>
                <p className="text-sm text-[#ffe8d1]">new movies</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Top Rated</p>
                <p className="mt-2 text-2xl font-black">4.5</p>
                <p className="text-sm text-[#ffe8d1]">average rating</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Finder</p>
                <p className="mt-2 text-2xl font-black">8</p>
                <p className="text-sm text-[#ffe8d1]">searchable movies</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6">
            <MovieScrollStrip
              title="Latest Movie Reviews"
              description="New movie reviews shared by family members. Use arrows on larger screens, or scroll vertically on smaller screens."
              items={ latestMovies }
              accentClassName="bg-[linear-gradient(135deg,#ffb366,#ff8866)]"
            />

            <MovieScrollStrip
              title="Top Rated Movies"
              description="Movies your family keeps recommending, with ratings and thumbs-up counts at a glance."
              items={ topRatedMovies }
              accentClassName="bg-[linear-gradient(135deg,#ffa84d,#ff9933)]"
            />
          </div>

          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)] backdrop-blur">
            <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,240,0.85))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">
                    Movie Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">Movie Finder</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">
                    Search the list, then select a row to spotlight the movie your family is talking about.
                  </p>
                </div>

                <div className="rounded-full border border-[#f0d9c4] bg-[#fdf6ef] px-4 py-2 text-sm font-semibold text-[#8b5a3c]">
                  { filteredMovies.length } movies found
                </div>
              </div>

              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b5a3c]" />
                <Input
                  type="search"
                  value={ searchValue }
                  onChange={ (event) => setSearchValue(event.target.value) }
                  placeholder="Search by movie, contributor, category, or channel"
                  className="h-12 rounded-full border-[#e8c4a0] bg-white pl-11 pr-4 text-sm text-[#5c2e1a] shadow-sm"
                  aria-label="Search movies"
                />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#fef5f0,#fffaf5)] px-4 py-3 text-sm text-[#8b5a3c]">
                <Film className="size-4 text-[#a85a3a]" />
                <span className="font-semibold text-[#5c2e1a]">Selected movie:</span>
                <span>{ selectedMovie || "Choose a movie from the list" }</span>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-[#f0d9c4]">
                <div className="max-h-232 overflow-auto">
                  <table className="min-w-4xl border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#fdf6ef] text-xs uppercase tracking-[0.18em] text-[#a85a3a]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Movie Name</th>
                        <th className="px-4 py-3 font-bold">Contributed By</th>
                        <th className="px-4 py-3 font-bold">Channel</th>
                        <th className="px-4 py-3 font-bold">Category</th>
                        <th className="px-4 py-3 font-bold">Kid Friendly</th>
                        <th className="px-4 py-3 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      { filteredMovies.map((movie) => {
                        const isSelected = selectedMovie === movie.movieName;

                        return (
                          <tr
                            key={ movie.movieName }
                            className="border-t border-[#f5e8e0] bg-white transition hover:bg-[#fffaf5]"
                          >
                            <td className="px-2 py-2 sm:px-3">
                              <button
                                type="button"
                                onClick={ () => setSelectedMovie(movie.movieName) }
                                className={ [
                                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]",
                                  isSelected ? "bg-[#fdf6ef] shadow-sm" : "hover:bg-[#fffbf7]",
                                ].join(" ") }
                              >
                                <span className="font-semibold text-[#5c2e1a]">{ movie.movieName }</span>
                                { isSelected ? (
                                  <span className="rounded-full bg-[#b8581a] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">
                                    Selected
                                  </span>
                                ) : null }
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.contributedBy }</td>
                            <td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.channel }</td>
                            <td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.category }</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#a85a3a]">
                              { movie.kidFriendly ? (
                                <Check className="size-5 text-green-600" />
                              ) : (
                                <span className="text-[#b5b5b5]">—</span>
                              ) }
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#8b5a3c]">
                              <span className="inline-flex items-center gap-2">
                                <MessageSquareText className="size-4 text-[#a85a3a]" />
                                { movie.comments }
                              </span>
                            </td>
                          </tr>
                        );
                      }) }
                    </tbody>
                  </table>
                </div>

                { filteredMovies.length === 0 ? (
                  <div className="border-t border-[#f5e8e0] px-4 py-8 text-center text-sm text-[#8b5a3c]">
                    No movies match that search yet.
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
