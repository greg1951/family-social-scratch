"use client";

import { MessageSquareText, Music, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { Input } from "@/components/ui/input";
import { MusicScrollStrip } from "@/features/music/components/music-scroll-strip";

const latestSongs = [
  {
    kind: "latest" as const,
    name: "Aerosmith",
    date: "March 28, 2026",
    imageSrc: "/images/music/aero-artist.png",
    imageAlt: "Aerosmith artist photo",
  },
  {
    kind: "latest" as const,
    name: "Alice Cooper",
    date: "March 26, 2026",
    imageSrc: "/images/music/alice-artist.png",
    imageAlt: "Alice Cooper artist photo",
  },
  {
    kind: "latest" as const,
    name: "Jimi Hendrix",
    date: "March 22, 2026",
    imageSrc: "/images/music/jimi-artist.png",
    imageAlt: "Jimi Hendrix artist photo",
  },
  {
    kind: "latest" as const,
    name: "Tina Turner",
    date: "March 18, 2026",
    imageSrc: "/images/music/tina-artist.png",
    imageAlt: "Tina Turner artist photo",
  },
];

const topRatedAlbums = [
  {
    kind: "top-rated" as const,
    name: "Abbey Road",
    rating: 5,
    recommendations: 219,
    imageSrc: "/images/music/abbey-album.png",
    imageAlt: "Abbey Road album art",
  },
  {
    kind: "top-rated" as const,
    name: "Bohemian Rhapsody",
    rating: 5,
    recommendations: 203,
    imageSrc: "/images/music/bohemian-album.png",
    imageAlt: "Bohemian Rhapsody album art",
  },
  {
    kind: "top-rated" as const,
    name: "Hotel California",
    rating: 4,
    recommendations: 188,
    imageSrc: "/images/music/hotel-album.png",
    imageAlt: "Hotel California album art",
  },
  {
    kind: "top-rated" as const,
    name: "Bad Bunny Highlights",
    rating: 4,
    recommendations: 164,
    imageSrc: "/images/music/bad-bunny-album.png",
    imageAlt: "Bad Bunny album art",
  },
];

const musicFinderRows = [
  {
    artistName: "Aerosmith",
    contributedBy: "Grace",
    category: "Classic Rock",
    comments: 27,
  },
  {
    artistName: "Alice Cooper",
    contributedBy: "Henry",
    category: "Rock",
    comments: 18,
  },
  {
    artistName: "Jimi Hendrix",
    contributedBy: "Nina",
    category: "Psychedelic Rock",
    comments: 33,
  },
  {
    artistName: "Tina Turner",
    contributedBy: "Mila",
    category: "Soul",
    comments: 24,
  },
  {
    artistName: "The Rolling Stones",
    contributedBy: "Isaac",
    category: "Rock",
    comments: 36,
  },
  {
    artistName: "Led Zeppelin",
    contributedBy: "Owen",
    category: "Hard Rock",
    comments: 31,
  },
  {
    artistName: "Hozier",
    contributedBy: "Ruth",
    category: "Indie",
    comments: 15,
  },
  {
    artistName: "Queen",
    contributedBy: "Ben",
    category: "Classic Rock",
    comments: 40,
  },
];

export function MusicHomePage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(musicFinderRows[0]?.artistName ?? "");
  const deferredSearchValue = useDeferredValue(searchValue);

  const filteredArtists = musicFinderRows.filter((artist) => {
    const query = deferredSearchValue.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [artist.artistName, artist.contributedBy, artist.category]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(36,30,79,0.95),rgba(69,55,132,0.86)_56%,rgba(126,110,202,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(26,20,60,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#dcd6ff]">
                Family Music Lovers
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#efe8ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Keep your family&apos;s favorite songs and albums in one place.
              </h1>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:grid-cols-3 lg:min-w-[24rem]">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#dcd6ff]">Latest</p>
                <p className="mt-2 text-2xl font-black">4</p>
                <p className="text-sm text-[#efe8ff]">new artists</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#dcd6ff]">Top Rated</p>
                <p className="mt-2 text-2xl font-black">4.5</p>
                <p className="text-sm text-[#efe8ff]">average albums</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#dcd6ff]">Finder</p>
                <p className="mt-2 text-2xl font-black">8</p>
                <p className="text-sm text-[#efe8ff]">searchable artists</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6">
            <MusicScrollStrip
              title="Latest Songs"
              description="New artists and tracks shared by family members. Use arrows on larger screens, or scroll vertically on smaller screens."
              items={ latestSongs }
              accentClassName="bg-[linear-gradient(135deg,#ccc5ff,#ffe2f5)]"
            />

            <MusicScrollStrip
              title="Top Rated Albums"
              description="Albums your family keeps recommending, with ratings and thumbs-up counts at a glance."
              items={ topRatedAlbums }
              accentClassName="bg-[linear-gradient(135deg,#ffdcb8,#e2d2ff)]"
            />
          </div>

          <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(45,35,95,0.75)] backdrop-blur">
            <div className="border-b border-[#dfd6f6] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,242,255,0.85))] px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#6a5aa8]">
                    Music Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#2f225f]">Music Finder</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b6292]">
                    Search the list, then select a row to spotlight the artist your family is talking about.
                  </p>
                </div>

                <div className="rounded-full border border-[#dfd6f6] bg-[#f6f1ff] px-4 py-2 text-sm font-semibold text-[#4f4482]">
                  { filteredArtists.length } artists found
                </div>
              </div>

              <div className="relative mt-5">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6b6292]" />
                <Input
                  type="search"
                  value={ searchValue }
                  onChange={ (event) => setSearchValue(event.target.value) }
                  placeholder="Search by artist, contributor, or category"
                  className="h-12 rounded-full border-[#d4c8f7] bg-white pl-11 pr-4 text-sm text-[#2f225f] shadow-sm"
                  aria-label="Search artists"
                />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#f4f0ff,#faf8ff)] px-4 py-3 text-sm text-[#5f548f]">
                <Music className="size-4 text-[#6a5aa8]" />
                <span className="font-semibold text-[#2f225f]">Selected artist:</span>
                <span>{ selectedArtist || "Choose an artist from the list" }</span>
              </div>

              <div className="overflow-hidden rounded-[1.4rem] border border-[#dfd6f6]">
                <div className="max-h-232 overflow-auto">
                  <table className="min-w-4xl border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#f2edff] text-xs uppercase tracking-[0.18em] text-[#6a5aa8]">
                      <tr>
                        <th className="px-4 py-3 font-bold">Artist Name</th>
                        <th className="px-4 py-3 font-bold">Contributed By</th>
                        <th className="px-4 py-3 font-bold">Category</th>
                        <th className="px-4 py-3 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      { filteredArtists.map((artist) => {
                        const isSelected = selectedArtist === artist.artistName;

                        return (
                          <tr
                            key={ artist.artistName }
                            className="border-t border-[#ece5ff] bg-white transition hover:bg-[#faf8ff]"
                          >
                            <td className="px-2 py-2 sm:px-3">
                              <button
                                type="button"
                                onClick={ () => setSelectedArtist(artist.artistName) }
                                className={ [
                                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9888db]",
                                  isSelected ? "bg-[#f2edff] shadow-sm" : "hover:bg-[#f6f2ff]",
                                ].join(" ") }
                              >
                                <span className="font-semibold text-[#2f225f]">{ artist.artistName }</span>
                                { isSelected ? (
                                  <span className="rounded-full bg-[#3b2f6e] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">
                                    Selected
                                  </span>
                                ) : null }
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#5d5584]">{ artist.contributedBy }</td>
                            <td className="px-4 py-3 text-sm text-[#5d5584]">{ artist.category }</td>
                            <td className="px-4 py-3 text-sm font-semibold text-[#4f4482]">
                              <span className="inline-flex items-center gap-2">
                                <MessageSquareText className="size-4 text-[#6a5aa8]" />
                                { artist.comments }
                              </span>
                            </td>
                          </tr>
                        );
                      }) }
                    </tbody>
                  </table>
                </div>

                { filteredArtists.length === 0 ? (
                  <div className="border-t border-[#ece5ff] px-4 py-8 text-center text-sm text-[#6b6292]">
                    No artists match that search yet.
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