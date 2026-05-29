"use client";

import { ArrowLeft, Camera, Heart, Images, MessageSquareText, Search, ThumbsUp, User, X } from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  addGalleryAlbumCommentAction,
  getAlbumPhotosAction,
  setGalleryPhotoReactionAction,
} from "@/app/(features)/(galleries)/gallery/actions";
import FeatureFaqHelp from "@/components/common/feature-faq-help";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import type { GalleryPhotoItem, SharedAlbumListItem } from "@/components/db/types/gallery";
import type { MemberKeyDetails } from "@/features/family/types/family-steps";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// ── S3 image component ────────────────────────────────────────────────────────

function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const key = extractS3KeyFromValue(src);

      if (!key) {
        return;
      }

      try {
        const res = await fetch("/api/s3-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "download", fileName: key }),
        });

        if (res.ok) {
          const body = await res.json();
          if (!cancelled) {
            setResolvedSrc(body.url ?? src);
          }
        }
      } catch {
        // Fall back to original src on error
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [src]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ resolvedSrc } alt={ alt } className={ className } />;
}

// ── Photo scroll strip ────────────────────────────────────────────────────────

function PhotoScrollStrip({
  photos,
  selectedAlbumName,
  member,
}: {
  photos: GalleryPhotoItem[];
  selectedAlbumName: string | null;
  member: MemberKeyDetails;
}) {
  const [viewPhoto, setViewPhoto] = useState<GalleryPhotoItem | null>(null);
  const [isReacting, setIsReacting] = useState(false);

  async function handleReact(reactionType: "like" | "love") {
    if (!viewPhoto || isReacting) {
      return;
    }
    // Prevent reacting to own photo
    if (viewPhoto.memberId === member.memberId) {
      toast.error("You cannot react to your own photo.");
      return;
    }
    setIsReacting(true);
    const result = await setGalleryPhotoReactionAction({
      albumPhotoId: viewPhoto.id,
      reactionType,
    });
    setIsReacting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setViewPhoto((prev) => prev
      ? {
        ...prev,
        likeCount: result.likeCount,
        loveCount: result.loveCount,
        viewerReaction: result.viewerReaction,
      }
      : prev
    );
  }
  return (
    <>
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#6f8f5d]">
            { selectedAlbumName ? `Photos — ${ selectedAlbumName }` : "Select an album to view photos" }
          </p>
          { photos.length > 0 && (
            <span className="rounded-full border border-[#d8eac6] bg-[#f7fdf0] px-3 py-1 text-[0.68rem] font-semibold text-[#5f7b4d]">
              { photos.length } photo{ photos.length !== 1 ? "s" : "" }
            </span>
          ) }
        </div>

        { photos.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#d6e8c4] bg-[#f8fdf3] py-14">
            <div className="text-center text-[#86a072]">
              <Images className="mx-auto mb-2 size-10 opacity-60" />
              <p className="text-sm">{ selectedAlbumName ? "No photos in this album" : "Click an album to view its photos" }</p>
            </div>
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-2.5 xl:grid-cols-4">
              { photos.map((photo) => {
                // Tooltip: show description if present, else fallback
                const tooltip = photo.albumPhotoDescription?.trim()
                  ? photo.albumPhotoDescription
                  : "Double-click to view photo details";
                return (
                  <div
                    key={ photo.id }
                    className="group relative overflow-hidden rounded-2xl border border-[#dcebd0] bg-white shadow-[0_18px_36px_-28px_rgba(74,96,55,0.5)] cursor-pointer"
                    title={ tooltip }
                    onDoubleClick={ () => setViewPhoto(photo) }
                  >
                    <div className="aspect-square w-full overflow-hidden bg-[#edf6e4]">
                      <GalleryImage
                        src={ photo.photoImageUrl }
                        alt={ photo.caption ?? "Gallery photo" }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    { photo.caption && (
                      <div className="px-2.5 py-1.5">
                        <p className="truncate text-xs text-[#567145]">{ photo.caption }</p>
                      </div>
                    ) }
                    <div className="flex items-center gap-1 px-2.5 pb-2">
                      <User className="size-3 shrink-0 text-[#7f9a69]" />
                      <span className="truncate text-[11px] text-[#7f9a69]">{ photo.memberName }</span>
                    </div>
                  </div>
                );
              }) }
            </div>
          </div>
        ) }
      </div>
      {/* View-only dialog for photo details */ }
      { viewPhoto && (
        <Dialog open={ true } onOpenChange={ (open) => !open && setViewPhoto(null) }>
          <DialogContent showCloseButton className="w-[min(96vw,78rem)] max-w-none max-h-[86vh] overflow-y-auto">
            <DialogTitle className="sr-only">
              { viewPhoto.caption?.trim() ? `Photo preview: ${ viewPhoto.caption }` : "Photo preview" }
            </DialogTitle>
            <div className="space-y-3">
              { viewPhoto.caption && (
                <p className="text-base font-semibold text-[#355427]">{ viewPhoto.caption }</p>
              ) }
              <div className="flex justify-center rounded-xl border border-[#dcebd0] bg-[#f4faee] p-2">
                <GalleryImage
                  src={ viewPhoto.photoImageUrl }
                  alt={ viewPhoto.caption ?? "Gallery photo" }
                  className="max-h-[66vh] w-auto max-w-full rounded-lg object-contain"
                />
              </div>
              { viewPhoto.albumPhotoDescription && (
                <p className="text-sm text-[#567145]">{ viewPhoto.albumPhotoDescription }</p>
              ) }
              {/* Only show reaction buttons if not owner */ }
              { viewPhoto.memberId !== member.memberId && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={ viewPhoto.viewerReaction === "like" ? "default" : "outline" }
                    className="rounded-full"
                    disabled={ isReacting }
                    onClick={ () => handleReact("like") }
                  >
                    <ThumbsUp className="mr-2 size-4" />
                    Like ({ viewPhoto.likeCount })
                  </Button>
                  <Button
                    type="button"
                    variant={ viewPhoto.viewerReaction === "love" ? "default" : "outline" }
                    className="rounded-full"
                    disabled={ isReacting }
                    onClick={ () => handleReact("love") }
                  >
                    <Heart className="mr-2 size-4" />
                    Love ({ viewPhoto.loveCount })
                  </Button>
                </div>
              ) }
            </div>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      ) }
    </>
  );
}

// ── Album finder ──────────────────────────────────────────────────────────────

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatUpdatedAtShort(date: Date) {
  const parsed = new Date(date);
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const yy = String(parsed.getFullYear()).slice(-2);
  return `${ mm }-${ dd }-${ yy }`;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${ year }-${ month }-${ day }`;
}

function AlbumFinder({
  albums,
  selectedAlbumId,
  onSelectAlbum,
}: {
  albums: SharedAlbumListItem[];
  selectedAlbumId: number | null;
  onSelectAlbum: (album: SharedAlbumListItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return toDateInputValue(threeMonthsAgo);
  });
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));

  const startDateValue = startDate ? new Date(`${ startDate }T00:00:00`) : null;
  const endDateValue = endDate ? new Date(`${ endDate }T23:59:59.999`) : null;

  const filtered = albums.filter((album) => {
    const updatedAt = new Date(album.updatedAt);

    if (startDateValue && updatedAt < startDateValue) {
      return false;
    }

    if (endDateValue && updatedAt > endDateValue) {
      return false;
    }

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      album.albumName.toLowerCase().includes(q) ||
      album.memberName.toLowerCase().includes(q) ||
      (album.albumDescription ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#80a066]" />
        <Input
          value={ query }
          onChange={ (e) => setQuery(e.target.value) }
          placeholder="Search by caption or member name…"
          className="h-10 rounded-full border-[#cee1bc] bg-white pl-10 pr-9 text-sm text-[#355427]"
        />
        { query && (
          <button
            type="button"
            onClick={ () => setQuery("") }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89a273] transition hover:text-[#5b7549]"
          >
            <X className="size-3.5" />
          </button>
        ) }
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f8f5d]">
            Start Date
          </label>
          <Input
            type="date"
            value={ startDate }
            max={ endDate || undefined }
            onChange={ (e) => setStartDate(e.target.value) }
            className="h-9 rounded-xl border-[#cee1bc] bg-white px-2 text-xs text-[#355427]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6f8f5d]">
            End Date
          </label>
          <Input
            type="date"
            value={ endDate }
            min={ startDate || undefined }
            onChange={ (e) => setEndDate(e.target.value) }
            className="h-9 rounded-xl border-[#cee1bc] bg-white px-2 text-xs text-[#355427]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5">
        { filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#d6e8c4] bg-[#f8fdf3] py-9">
            <p className="text-sm text-[#86a072]">No shared albums found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            { filtered.map((album) => (
              <button
                key={ album.id }
                type="button"
                onClick={ () => onSelectAlbum(album) }
                title={ [
                  `Updated ${ formatUpdatedAt(album.updatedAt) }`,
                  album.albumDescription?.trim() ? album.albumDescription.trim() : "",
                ].filter(Boolean).join("\n") }
                className={ [
                  "w-full rounded-2xl border p-2 text-left transition-all duration-200",
                  "hover:border-[#b9d89a] hover:shadow-[0_12px_30px_-26px_rgba(74,96,55,0.8)]",
                  selectedAlbumId === album.id
                    ? "border-[#a7cc84] bg-[#f2fae8] shadow-[0_16px_34px_-24px_rgba(74,96,55,0.85)]"
                    : "border-[#dbe9cf] bg-white",
                ].join(" ") }
              >
                <div className="flex items-start gap-2">
                  { album.coverPhotoUrl ? (
                    <div className="size-9 flex-none overflow-hidden rounded-md border border-[#deebd3] bg-[#eff7e6]">
                      <GalleryImage
                        src={ album.coverPhotoUrl }
                        alt={ album.albumName }
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-9 flex-none items-center justify-center rounded-md border border-[#deebd3] bg-[#eff7e6]">
                      <Images className="size-4.5 text-[#9cb88a]" />
                    </div>
                  ) }
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#355427]">{ album.albumName }</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#6d8b58]">
                      <User className="size-3 shrink-0" />
                      <span className="truncate">{ album.memberName }</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#88a272]">
                      <span>{ album.photoCount } photo{ album.photoCount !== 1 ? "s" : "" }</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquareText className="size-3" />
                        { album.commentCount }
                      </span>
                      <span>·</span>
                      <span>{ formatUpdatedAtShort(album.updatedAt) }</span>
                    </div>
                  </div>
                </div>
              </button>
            )) }
          </div>
        ) }
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface FamilyGalleryHomePageProps {
  sharedAlbums: SharedAlbumListItem[];
  member: MemberKeyDetails;
}

export default function FamilyGalleryHomePage({ sharedAlbums, member: _member }: FamilyGalleryHomePageProps) {
  const [localAlbums, setLocalAlbums] = useState(sharedAlbums);
  const [selectedAlbum, setSelectedAlbum] = useState<SharedAlbumListItem | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<GalleryPhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLocalAlbums(sharedAlbums);
  }, [sharedAlbums]);

  const selectedAlbumRecord = selectedAlbum
    ? localAlbums.find((album) => album.id === selectedAlbum.id) ?? selectedAlbum
    : null;
  const canCommentOnSelectedAlbum = Boolean(
    selectedAlbumRecord && selectedAlbumRecord.memberId !== _member.memberId
  );

  function handleSelectAlbum(album: SharedAlbumListItem) {
    if (selectedAlbum?.id === album.id) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setSelectedAlbum(album);
    setAlbumPhotos([]);
    setIsLoadingPhotos(true);

    startTransition(async () => {
      const result = await getAlbumPhotosAction(album.id);

      if (ctrl.signal.aborted) return;

      setIsLoadingPhotos(false);

      if (result.success) {
        setAlbumPhotos(result.photos);
      } else {
        toast.error(result.message);
      }
    });
  }

  async function handleSaveComment() {
    if (!selectedAlbumRecord) {
      return;
    }

    if (selectedAlbumRecord.memberId === _member.memberId) {
      toast.error("You cannot comment on your own album.");
      return;
    }

    if (!commentText.trim()) {
      toast.error("Enter a comment before saving.");
      return;
    }

    setIsSavingComment(true);
    const result = await addGalleryAlbumCommentAction({
      albumId: selectedAlbumRecord.id,
      commentText,
    });
    setIsSavingComment(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    const newComment = {
      id: Date.now(),
      albumId: selectedAlbumRecord.id,
      memberId: _member.memberId,
      memberName: `${ _member.firstName } ${ _member.lastName }`.trim(),
      commentText: commentText.trim(),
      createdAt: new Date(),
    };

    setLocalAlbums((prev) => prev.map((album) => {
      if (album.id !== selectedAlbumRecord.id) {
        return album;
      }

      return {
        ...album,
        commentCount: album.commentCount + 1,
        comments: [newComment, ...album.comments],
      };
    }));

    setCommentText("");
    toast.success("Comment posted.");
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(82,126,53,0.9),rgba(138,186,86,0.82)_54%,rgba(228,245,190,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(56,84,35,0.8)] sm:px-8 md:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#eefdd6]">
                Family Photo Galleries
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5ffe8] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Main Page
                </Link>
                <Link
                  href="/member-gallery"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5ffe8] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Camera className="mr-2 size-4" />
                  My Gallery
                </Link>
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Explore albums shared by your family and friends.
              </h1>
              {/* <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f0fde0] sm:text-sm">
                Browse photo albums shared by family members. Then select an album to view the shared photos in the Photo Scroll Strip.
              </p> */}
            </div>
          </div>
        </div>

        <main>
          { sharedAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[1.8rem] border border-[#dbeacb] bg-white/85 py-24 text-center shadow-[0_24px_70px_-42px_rgba(63,93,42,0.75)]">
              <Images className="mb-4 size-16 text-[#9eb889]" />
              <p className="text-lg font-semibold text-[#3e5f2d]">No shared albums yet</p>
              <p className="mt-1 text-sm text-[#7e9870]">
                When family members share their albums, they will appear here.
              </p>
              <Link href="/member-gallery" className="mt-4">
                <Button size="sm" className="rounded-full bg-[#5e8a39] text-white hover:bg-[#4e7430]">Go to My Gallery</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6">
              <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(63,93,42,0.75)] backdrop-blur">
                <div className="border-b border-[#d6e8c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,252,236,0.88))] px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#6f8f5d]">
                        Album Preview
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#355427]">Photo Scroll Strip</h2>
                      {/* <p className="mt-2 max-w-xl text-sm leading-6 text-[#6f8f5d]">
                        Photos are shown in the saved album sequence, with newest album updates visible first.
                      </p> */}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 sm:px-6 sm:py-5">
                  { isLoadingPhotos ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#89b364] border-t-transparent" />
                    </div>
                  ) : (
                    <PhotoScrollStrip
                      photos={ albumPhotos }
                      selectedAlbumName={ selectedAlbumRecord?.albumName ?? selectedAlbum?.albumName ?? null }
                      member={ _member }
                    />
                  ) }
                </div>
              </div>

              <div className="min-w-0">
                <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(63,93,42,0.75)] backdrop-blur md:max-h-[68vh] xl:max-h-[76vh]">
                  <div className="border-b border-[#d6e8c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,252,236,0.88))] px-5 py-5 sm:px-6">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#6f8f5d]">
                      Family Directory
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight text-[#355427]">Album Finder</h2>
                      <FeatureFaqHelp
                        href="/feature-faq?category=Photo%20Galleries"
                        buttonClassName="h-4 w-4 md:h-7 md:w-7 border-[#c5dbb4] bg-gradient-to-b from-[#f8fdf3] to-[#e7f3db] text-[#4e7430] shadow-[0_8px_18px_rgba(78,116,48,0.18)] group-hover:shadow-[0_12px_26px_rgba(78,116,48,0.26)]"
                        iconClassName="h-3 w-3 md:h-4 md:w-4 text-[#4e7430]"
                        tooltipClassName="bg-[#355427] text-[#f4fee9]"
                      />
                    </div>
                    {/* <p className="mt-2 text-sm leading-6 text-[#6f8f5d]">
                      Search all shared albums by caption, album details, or family member name.
                    </p> */}
                  </div>

                  <div className="px-4 py-4 sm:px-6 sm:py-5 md:h-[calc(68vh-7.5rem)] xl:h-[calc(76vh-7.5rem)]">
                    <AlbumFinder
                      albums={ localAlbums }
                      selectedAlbumId={ selectedAlbum?.id ?? null }
                      onSelectAlbum={ handleSelectAlbum }
                    />
                  </div>
                </div>
              </div>
            </div>

              { selectedAlbumRecord && (
                <div className="mt-4 rounded-[1.3rem] border border-white/70 bg-white/85 p-4 shadow-[0_18px_44px_-36px_rgba(63,93,42,0.75)] backdrop-blur">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <div className="rounded-xl border border-[#dbe9cf] bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8f5d]">
                      <MessageSquareText className="size-3.5" />
                      Family Comments { selectedAlbumRecord.albumName ? `- ${ selectedAlbumRecord.albumName }` : "" }
                    </div>
                    { selectedAlbumRecord.comments.length === 0 ? (
                      <p className="text-xs text-[#7f9a69]">No comments yet.</p>
                    ) : (
                      <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
                        { selectedAlbumRecord.comments.map((comment) => (
                          <div key={ comment.id } className="rounded-lg border border-[#e2efda] bg-[#f9fdf5] px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-[11px] font-semibold text-[#557044]">{ comment.memberName }</p>
                              <p className="shrink-0 text-[10px] text-[#86a072]">{ formatUpdatedAt(comment.createdAt) }</p>
                            </div>
                            <p className="mt-1 text-xs text-[#5f7b4d]">{ comment.commentText }</p>
                          </div>
                        )) }
                      </div>
                    ) }
                  </div>

                  <div className="rounded-xl border border-[#dbe9cf] bg-[#f8fdf3] p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8f5d]">
                      <MessageSquareText className="size-3.5" />
                      Add Comment { selectedAlbumRecord.albumName ? `- ${ selectedAlbumRecord.albumName }` : "" }
                    </div>
                    <Textarea
                      value={ commentText }
                      onChange={ (e) => setCommentText(e.target.value) }
                      placeholder="Add a comment for this album"
                      disabled={ !canCommentOnSelectedAlbum || isSavingComment }
                      className="min-h-20 border-[#cfe2bc] bg-white text-sm text-[#355427]"
                    />
                    { !canCommentOnSelectedAlbum && (
                      <p className="mt-2 text-xs text-[#7f9a69]">
                        You cannot comment on your own album.
                      </p>
                    ) }
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[#5e8a39] text-white hover:bg-[#4e7430]"
                        disabled={ !canCommentOnSelectedAlbum || isSavingComment || !commentText.trim() }
                        onClick={ handleSaveComment }
                      >
                        { isSavingComment ? "Posting..." : "Post Comment" }
                      </Button>
                    </div>
                  </div>
                </div>
                </div>
              ) }

            </>
          ) }
        </main>
      </div>
    </section>
  );
}
