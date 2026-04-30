"use client";

import type { JSONContent } from "@tiptap/core";
import LinkExtension from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Edit3, Eye, Heart, MessageSquareText, Plus, Search, ThumbsDown, ThumbsUp, Film, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  addMovieCommentAction,
  getMovieDetailAction,
  toggleMovieLikeAction,
} from "@/app/(features)/(movies)/movies/actions";
import { createEmptyTipTapDocument, parseSerializedTipTapDocument } from "@/components/db/types/poem-term-validation";
import { MovieDetail, MovieRecord } from "@/components/db/types/movies";
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
import { MovieScrollStrip } from "@/features/movies/components/movie-scroll-strip";

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

function getMovieDocument(movieJson?: string): JSONContent {
  if (!movieJson) {
    return createEmptyTipTapDocument();
  }

  const parsed = parseSerializedTipTapDocument(movieJson);
  return parsed.success ? parsed.content : createEmptyTipTapDocument();
}

function MovieViewer({ movieJson }: { movieJson?: string }) {
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
    content: getMovieDocument(movieJson),
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

    viewer.commands.setContent(getMovieDocument(movieJson));
  }, [viewer, movieJson]);

  return (
    <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_hr]:my-4 [&_.tiptap_hr]:border-[#f0d9c4] [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:border [&_.tiptap_table]:border-[#f0d9c4] [&_.tiptap_th]:border [&_.tiptap_th]:border-[#f0d9c4] [&_.tiptap_th]:bg-[#fff1e8] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1 [&_.tiptap_td]:border [&_.tiptap_td]:border-[#f0d9c4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1">
      <EditorContent editor={ viewer } />
    </div>
  );
}

export function MovieHomePage({ movies, member }: { movies: MovieRecord[]; member: MemberKeyDetails }) {
  const router = useRouter();
  const [isEngaging, startEngageTransition] = useTransition();
  const [selectedMovieDetail, setSelectedMovieDetail] = useState<MovieDetail | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isViewMovieOpen, setIsViewMovieOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(movies[0]?.id ?? 0);
  const deferredSearchValue = useDeferredValue(searchValue);

  const latestMovies = [...movies]
    .sort((leftMovie, rightMovie) => +new Date(rightMovie.updatedAt) - +new Date(leftMovie.updatedAt))
    .slice(0, 8)
    .map((movie) => ({
      kind: "latest" as const,
      name: movie.movieTitle,
      date: formatDate(movie.updatedAt),
      submitterLikenessDegree: movie.submitterLikenessDegree,
      commentsCount: movie.commentCount,
      thumbsUp: movie.thumbsUpCount,
      love: movie.loveCount,
      imageSrc: movie.movieImageUrl ?? "/images/movies/princess-bride.png",
      imageAlt: `${ movie.movieTitle } movie image`,
    }));

  const topRatedMovies = [...movies]
    .filter((movie) => (movie.thumbsUpCount + movie.loveCount) > 0)
    .sort((leftMovie, rightMovie) => {
      const leftScore = leftMovie.thumbsUpCount + (leftMovie.loveCount * 2);
      const rightScore = rightMovie.thumbsUpCount + (rightMovie.loveCount * 2);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (leftMovie.commentCount !== rightMovie.commentCount) {
        return rightMovie.commentCount - leftMovie.commentCount;
      }

      return +new Date(rightMovie.updatedAt) - +new Date(leftMovie.updatedAt);
    })
    .slice(0, 8)
    .map((movie) => ({
      kind: "top-rated" as const,
      name: movie.movieTitle,
      submitterLikenessDegree: movie.submitterLikenessDegree,
      noRating: movie.noRatingCount,
      thumbsUp: movie.thumbsUpCount,
      love: movie.loveCount,
      commentsCount: movie.commentCount,
      imageSrc: movie.movieImageUrl ?? "/images/movies/robin-hood.png",
      imageAlt: `${ movie.movieTitle } movie image`,
    }));

  const finderRows = movies.map((movie) => ({
    id: movie.id,
    name: movie.movieTitle,
    genre: movie.tagNamesByType.genre?.[0] ?? "-",
    adjective: movie.tagNamesByType.adjective?.[0] ?? "-",
    channel: movie.tagNamesByType.channel?.[0] ?? "Unknown",
    year: movie.movieDebutYear,
    addedBy: movie.submitterName,
    thumbsDown: movie.noRatingCount,
    thumbsUp: movie.thumbsUpCount,
    love: movie.loveCount,
    comments: movie.commentCount,
  }));

  const filteredMovies = finderRows.filter((movie) => {
    const query = deferredSearchValue.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return [movie.name, movie.genre, movie.adjective, movie.channel, movie.addedBy].join(" ").toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!selectedMovie) {
      return;
    }

    let isCancelled = false;

    startEngageTransition(async () => {
      const result = await getMovieDetailAction({ movieId: selectedMovie });
      if (isCancelled) {
        return;
      }
      if (!result.success) {
        setSelectedMovieDetail(null);
        return;
      }
      setSelectedMovieDetail(result.movie);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedMovie]);

  const selectedMovieName = finderRows.find((movie) => movie.id === selectedMovie)?.name ?? "";
  const selectedMovieBasic = (selectedMovieDetail?.id === selectedMovie ? selectedMovieDetail : movies.find((movie) => movie.id === selectedMovie)) ?? movies[0] ?? null;
  const canReactToSelectedMovie = Boolean(selectedMovieBasic && selectedMovieBasic.memberId !== member.memberId);
  const canEditSelectedMovie = Boolean(selectedMovieBasic && selectedMovieBasic.memberId === member.memberId);

  function handleToggleLike(likenessDegree: number) {
    if (!selectedMovieBasic) {
      return;
    }

    startEngageTransition(async () => {
      const result = await toggleMovieLikeAction({ movieId: selectedMovieBasic.id, likenessDegree });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSelectedMovieDetail(result.movie);
      toast.success(result.message);
    });
  }

  function handleAddComment() {
    if (!selectedMovieBasic) {
      return;
    }

    const normalizedComment = commentText.trim();
    if (normalizedComment.length < 2) {
      toast.error("Enter at least 2 characters before posting your comment.");
      return;
    }

    startEngageTransition(async () => {
      const result = await addMovieCommentAction({ movieId: selectedMovieBasic.id, commentText: normalizedComment });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSelectedMovieDetail(result.movie);
      setCommentText("");
      toast.success(result.message);
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(96,32,0,0.95),rgba(140,56,12,0.86)_56%,rgba(184,88,24,0.78))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(60,20,0,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#ffd9b5]">Family Movie Maniacs</p>
              <Link href="/" className="mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <ArrowLeft className="font-app mr-2 size-4" />
                Back to Main Page
              </Link>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">Keep your family&apos;s favorite movies and reviews in one place.</h1>
              <Link href="/movies/templates" className="ml-3 mt-3 inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffe8d1] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><Edit3 className="mr-1 size-3.5" />Movie Templates</Link>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-4 shadow-inner backdrop-blur sm:min-w-[24rem]">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Movies</p><p className="mt-2 text-2xl font-black">{ movies.length }</p><p className="text-sm text-[#ffe8d1]">records in view</p></div>
                <div><p className="text-xs uppercase tracking-[0.24em] text-[#ffd9b5]">Selected</p><p className="mt-2 text-lg font-black leading-tight">{ selectedMovieBasic?.movieTitle ?? "None" }</p><p className="text-sm text-[#ffe8d1]">active movie</p></div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={ () => setIsViewMovieOpen(true) } disabled={ !selectedMovieBasic } className="rounded-full bg-white text-[#6b2f10] hover:bg-[#ffe8d1]"><Eye className="size-4" />View Movie</Button>
                <Button type="button" variant="outline" asChild className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Link href="/movies/add-movie"><Plus className="size-4" />Add Movie</Link></Button>
                <Button type="button" variant="outline" onClick={ () => router.push(`/movies/add-movie?id=${ selectedMovie }`) } disabled={ !canEditSelectedMovie } className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"><Edit3 className="size-4" />Edit Movie</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
          <div className="min-w-0 space-y-6">
            <MovieScrollStrip title="Latest Movie Reviews" description="Fresh movie reviews shared by the family." items={ latestMovies } accentClassName="bg-[linear-gradient(135deg,#ffb366,#ff8866)]" />
            <MovieScrollStrip title="Top Rated Movies" description="Top rated movies based on family thumbs down, thumbs up, and love reactions." items={ topRatedMovies } accentClassName="bg-[linear-gradient(135deg,#ffa84d,#ff9933)]" />
          </div>

          <div className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)] backdrop-blur">
              <div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,240,0.85))] px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Movie Directory</p><h2 className="mt-2 text-2xl font-black tracking-tight text-[#5c2e1a]">Movie Finder</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b5a3c]">Search by movie title, tags, channel, or family member and pick what to watch next.</p></div>
                  <div className="rounded-full border border-[#f0d9c4] bg-[#fdf6ef] px-4 py-2 text-sm font-semibold text-[#8b5a3c]">{ filteredMovies.length } movies found</div>
                </div>

                <div className="relative mt-5"><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8b5a3c]" /><Input type="search" value={ searchValue } onChange={ (event) => setSearchValue(event.target.value) } placeholder="Search by movie, genre, adjective, channel, or family member" className="h-12 rounded-full border-[#e8c4a0] bg-white pl-11 pr-4 text-sm text-[#5c2e1a] shadow-sm" aria-label="Search movies" /></div>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[1.35rem] bg-[linear-gradient(135deg,#fff6ef,#fffaf5)] px-4 py-3 text-sm text-[#8b5a3c]"><Film className="size-4 text-[#a85a3a]" /><span className="font-semibold text-[#5c2e1a]">Selected movie:</span><span>{ selectedMovieName || "Choose a movie from the list" }</span><span className="rounded-full bg-[#fdf0e4] px-3 py-1 text-xs text-[#8b5a3c]"></span></div>
                <div className="overflow-hidden rounded-[1.4rem] border border-[#f0d9c4]"><div className="max-h-232 overflow-auto"><table className="min-w-248 border-collapse text-left"><thead className="sticky top-0 z-10 bg-[#fff6ef] text-xs uppercase tracking-[0.18em] text-[#a85a3a]"><tr><th className="px-4 py-3 font-bold">Movie Name</th><th className="px-4 py-3 font-bold">Thumbs Down</th><th className="px-4 py-3 font-bold">Thumbs Up</th><th className="px-4 py-3 font-bold">Love</th><th className="px-4 py-3 font-bold">Year</th><th className="px-4 py-3 font-bold">Genre</th><th className="px-4 py-3 font-bold">Adjective</th><th className="px-4 py-3 font-bold">Channel</th><th className="px-4 py-3 font-bold">Added By</th><th className="px-4 py-3 font-bold">Comments</th></tr></thead><tbody>{ filteredMovies.map((movie) => { const isSelected = selectedMovie === movie.id; return <tr key={ movie.id } className="border-t border-[#f5e8e0] bg-white transition hover:bg-[#fffaf5]"><td className="px-2 py-2 sm:px-3"><button type="button" onClick={ () => setSelectedMovie(movie.id) } className={ ["flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]", isSelected ? "bg-[#fdf6ef] shadow-sm" : "hover:bg-[#fffbf7]"].join(" ") }><span className="font-semibold text-[#5c2e1a]">{ movie.name }</span>{ isSelected ? <span className="rounded-full bg-[#b8581a] px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white">Selected</span> : null }</button></td><td className="px-4 py-3 text-sm font-semibold text-[#6d5c52]"><span className="inline-flex items-center gap-2"><ThumbsDown className="size-4 text-[#6d5c52]" />{ movie.thumbsDown }</span></td><td className="px-4 py-3 text-sm font-semibold text-[#8a5a22]"><span className="inline-flex items-center gap-2"><ThumbsUp className="size-4 text-[#b8581a]" />{ movie.thumbsUp }</span></td><td className="px-4 py-3 text-sm font-semibold text-[#8f2f58]"><span className="inline-flex items-center gap-2"><Heart className="size-4 text-[#cf3f7f]" />{ movie.love }</span></td><td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.year }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.genre }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.adjective }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.channel }</td><td className="px-4 py-3 text-sm text-[#734f3a]">{ movie.addedBy }</td><td className="px-4 py-3 text-sm font-semibold text-[#8b5a3c]"><span className="inline-flex items-center gap-2"><MessageSquareText className="size-4 text-[#a85a3a]" />{ movie.comments }</span></td></tr>; }) }</tbody></table></div>{ filteredMovies.length === 0 ? <div className="border-t border-[#f5e8e0] px-4 py-8 text-center text-sm text-[#8b5a3c]">No movies match that search yet.</div> : null }</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(96,32,0,0.75)]"><div className="border-b border-[#f0d9c4] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,240,0.86))] px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Movie Reactions</p><p className="mt-2 max-w-2xl text-xs leading-6 text-[#8b5a3c]">React to this movie and post comments your family can see.</p></div></div></div><div className="space-y-5 px-5 py-5 sm:px-6">{ selectedMovieBasic ? <><div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4"><div className="flex flex-wrap items-center gap-3"><Button type="button" onClick={ () => handleToggleLike(-1) } disabled={ !selectedMovieBasic || isEngaging || !canReactToSelectedMovie } className="rounded-full bg-[#6d5c52] text-white hover:bg-[#554940]" aria-label="Add thumbs down"><ThumbsDown className={ `size-4 ${ selectedMovieDetail?.likenessDegree === -1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(1) } disabled={ !selectedMovieBasic || isEngaging || !canReactToSelectedMovie } className="rounded-full bg-[#b8581a] text-white hover:bg-[#964815]" aria-label="Add thumbs up"><ThumbsUp className={ `size-4 ${ selectedMovieDetail?.likenessDegree === 1 ? "fill-white" : "" }` } /></Button><Button type="button" onClick={ () => handleToggleLike(2) } disabled={ !selectedMovieBasic || isEngaging || !canReactToSelectedMovie } className="rounded-full bg-[#cf3f7f] text-white hover:bg-[#aa3368]" aria-label="Add love"><Heart className={ `size-4 ${ selectedMovieDetail?.likenessDegree === 2 ? "fill-white" : "" }` } /></Button></div>{ !canReactToSelectedMovie ? <p className="text-xs text-[#8b5a3c]">You cannot react to your own movie. Ask another family member to rate it.</p> : null }<div className="flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-1.5 font-semibold text-[#6d5c52]"><ThumbsDown className="size-4 text-[#6d5c52]" />{ (selectedMovieDetail?.noRatingCount ?? selectedMovieBasic?.noRatingCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#8a5a22]"><ThumbsUp className="size-4 text-[#b8581a]" />{ (selectedMovieDetail?.thumbsUpCount ?? selectedMovieBasic?.thumbsUpCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-1.5 font-semibold text-[#8f2f58]"><Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />{ (selectedMovieDetail?.loveCount ?? selectedMovieBasic?.loveCount ?? 0).toLocaleString() }</span></div></div><div className="space-y-3 rounded-[1.4rem] border border-[#f0d9c4] bg-[#fff8f2] p-4"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#a85a3a]">Family Comments</p><p className="text-xs text-[#8b5a3c]">Share your thoughts about this movie with your family.</p></div><div className="space-y-2"><label className="text-sm font-semibold text-[#5c2e1a]" htmlFor="movie-comment-input">Add Comment</label><textarea id="movie-comment-input" value={ commentText } onChange={ (event) => setCommentText(event.target.value) } placeholder="What did you think about this movie?" disabled={ !selectedMovieBasic || isEngaging } className="min-h-24 w-full rounded-xl border border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#5c2e1a] outline-none transition focus-visible:ring-2 focus-visible:ring-[#d4a574]" /><div className="flex justify-end"><Button type="button" onClick={ handleAddComment } disabled={ !selectedMovieBasic || isEngaging || commentText.trim().length < 2 } className="rounded-full bg-[#b8581a] text-white hover:bg-[#964815]">Post Comment</Button></div></div><div className="space-y-2">{ selectedMovieDetail?.id === selectedMovie && selectedMovieDetail.movieComments.length === 0 ? <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">No comments yet. Be the first family member to add one.</p> : selectedMovieDetail?.id !== selectedMovie ? <p className="rounded-2xl border border-dashed border-[#f0d9c4] bg-white px-3 py-2 text-sm text-[#8b5a3c]">Loading comments...</p> : (selectedMovieDetail?.movieComments ?? []).map((comment) => <article key={ comment.id } className="rounded-2xl border border-[#f0d9c4] bg-white px-3 py-3 text-sm text-[#734f3a]"><p className="whitespace-pre-wrap leading-6">{ comment.text || "(No text in comment)" }</p><p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8b5a3c]">{ comment.commenterName } · { formatCreatedAt(comment.createdAt) }</p></article>) }</div></div></> : <div className="rounded-[1.5rem] border border-dashed border-[#f0d9c4] bg-[#fff8f2] px-6 py-10 text-center text-[#8b5a3c]"><MessageSquareText className="mx-auto mb-3 size-10 text-[#d4a574]" /><p className="text-lg font-semibold text-[#5c2e1a]">Select a movie to view comments.</p><p className="mt-2 text-sm">Choose a movie from the finder list to see and post family comments.</p></div> }</div></div>
          </div>
        </div>
      </div>

      <Dialog open={ isViewMovieOpen } onOpenChange={ setIsViewMovieOpen }>
        <DialogContent className="border-[#f0d9c4] bg-[#fff8f2] sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-[#5c2e1a]">{ selectedMovieBasic?.movieTitle ?? "Movie" }</DialogTitle>
            <DialogDescription className="text-[#8b5a3c]">Full movie details and family notes.</DialogDescription>
          </DialogHeader>

          { selectedMovieBasic ? (
            <div className="max-h-[75vh] space-y-4 overflow-auto pr-1">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                <MovieViewer movieJson={ selectedMovieBasic.movieJson } />
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Caption</p><p className="mt-2 text-sm leading-6 text-[#734f3a]">{ selectedMovieBasic.movieCaption || "No caption provided." }</p></div>
                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Details</p><div className="mt-3 space-y-3 text-sm text-[#734f3a]"><p><span className="font-semibold text-[#5c2e1a]">Submitter:</span> { selectedMovieBasic.submitterName }</p><p><span className="font-semibold text-[#5c2e1a]">Updated:</span> { formatDate(selectedMovieBasic.updatedAt) }</p><p><span className="font-semibold text-[#5c2e1a]">Debut Year:</span> { selectedMovieBasic.movieDebutYear }</p><p><span className="font-semibold text-[#5c2e1a]">Channel:</span> { selectedMovieBasic.tagNamesByType.channel?.[0] ?? "Unknown" }</p></div></div>
                  <div className="rounded-2xl border border-[#f0d9c4] bg-white p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#a85a3a]">Reactions</p><div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-[#734f3a]"><span className="inline-flex items-center gap-2 rounded-full bg-[#f7f0eb] px-3 py-1"><ThumbsDown className="size-4 text-[#6d5c52]" />{ (selectedMovieDetail?.noRatingCount ?? selectedMovieBasic.noRatingCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1 text-[#8a5a22]"><ThumbsUp className="size-4 text-[#b8581a]" />{ (selectedMovieDetail?.thumbsUpCount ?? selectedMovieBasic.thumbsUpCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff0f7] px-3 py-1 text-[#8f2f58]"><Heart className="size-4 fill-[#cf3f7f] text-[#cf3f7f]" />{ (selectedMovieDetail?.loveCount ?? selectedMovieBasic.loveCount ?? 0).toLocaleString() }</span><span className="inline-flex items-center gap-2 rounded-full bg-[#fff1e8] px-3 py-1"><MessageSquareText className="size-4 text-[#b8581a]" />{ selectedMovieDetail?.commentCount ?? selectedMovieBasic.commentCount ?? 0 }</span></div></div>
                </div>
              </div>
            </div>
          ) : null }
        </DialogContent>
      </Dialog>
    </section>
  );
}