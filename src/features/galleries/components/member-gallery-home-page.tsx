"use client";

import {
  ArrowLeft,
  Camera,
  ChevronDown,
  ChevronUp,
  Edit3,
  Images,
  Plus,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  addPhotoToAlbumAction,
  createGalleryAlbumAction,
  deleteGalleryAlbumAction,
  getAlbumPhotosAction,
  saveGalleryPhotoAction,
  updateGalleryAlbumPhotoAction,
  updateGalleryAlbumAction,
  removePhotoFromAlbumAction,
} from "@/app/(features)/(galleries)/gallery/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import type {
  GalleryPhotoItem,
  MemberAlbumItem,
  MemberPhotoItem,
} from "@/components/db/types/gallery";
import type { MemberKeyDetails } from "@/features/family/types/family-steps";

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
      if (!key) return;

      try {
        const res = await fetch("/api/s3-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "download", fileName: key }),
        });

        if (res.ok) {
          const body = await res.json();
          if (!cancelled) setResolvedSrc(body.url ?? src);
        }
      } catch {
        // Silently fall back
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [src]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ resolvedSrc } alt={ alt } className={ className } />;
}

// ── Photo strip ───────────────────────────────────────────────────────────────

function PhotoScrollStrip({
  photos,
  label,
  isUnallocatedStrip,
  onPhotoDoubleClick,
  onUpload,
  isUploading,
}: {
  photos: Array<MemberPhotoItem | GalleryPhotoItem>;
  label: string;
  isUnallocatedStrip: boolean;
  onPhotoDoubleClick?: (photo: GalleryPhotoItem) => void;
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#6f8f5d]">{ label }</p>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-full border-[#cfe2bc] bg-[#f7fdf0] px-3 text-xs font-semibold text-[#456533] hover:bg-[#ecf8e0]"
          disabled={ isUploading }
          onClick={ () => fileInputRef.current?.click() }
        >
          { isUploading ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-[#7ea263] border-t-transparent" />
          ) : (
            <Upload className="size-3" />
          ) }
          Upload Photos
        </Button>
        <input
          ref={ fileInputRef }
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={ (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              onUpload(Array.from(files));
            }
            e.target.value = "";
          } }
        />
      </div>

      { photos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#d6e8c4] bg-[#f8fdf3] py-12">
          <div className="text-center text-[#86a072]">
            <Images className="mx-auto mb-2 size-10 opacity-60" />
            <p className="text-sm">No photos yet. Upload your first photo!</p>
          </div>
        </div>
      ) : isUnallocatedStrip ? (
        <div className="max-h-[54vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            { photos.map((photo) => {
              const imageUrl = photo.photoImageUrl;
              const caption = photo.caption;
              return (
                <div
                  key={ photo.id }
                  className="group relative overflow-hidden rounded-2xl border border-[#dcebd0] bg-white shadow-[0_18px_36px_-28px_rgba(74,96,55,0.5)]"
                >
                  <div className="aspect-square w-full overflow-hidden bg-[#edf6e4]">
                    <GalleryImage
                      src={ imageUrl }
                      alt={ caption ?? "Gallery photo" }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  { caption && (
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs text-[#567145]">{ caption }</p>
                    </div>
                  ) }
                </div>
              );
            }) }
          </div>
        </div>
      ) : (
        <div className="max-h-[54vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            { photos.map((photo) => {
              const albumPhoto = photo as GalleryPhotoItem;
              const imageUrl = albumPhoto.photoImageUrl;
              const caption = albumPhoto.caption;
              // Tooltip: show description if present, else fallback
              const tooltip = albumPhoto.albumPhotoDescription?.trim()
                ? albumPhoto.albumPhotoDescription
                : "Double-click to edit photo details";
              return (
                <div
                  key={ albumPhoto.id }
                  className="group relative overflow-hidden rounded-2xl border border-[#dcebd0] bg-white shadow-[0_18px_36px_-28px_rgba(74,96,55,0.5)] cursor-pointer"
                  onDoubleClick={ () => onPhotoDoubleClick?.(albumPhoto) }
                  title={ tooltip }
                >
                  <div className="aspect-square w-full overflow-hidden bg-[#edf6e4]">
                    <GalleryImage
                      src={ imageUrl }
                      alt={ caption ?? "Gallery photo" }
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  { caption && (
                    <div className="px-2.5 py-2">
                      <p className="truncate text-xs text-[#567145]">{ caption }</p>
                    </div>
                  ) }
                </div>
              );
            }) }
          </div>
        </div>
      ) }
    </div>
  );
}

// ── Album list item ───────────────────────────────────────────────────────────

function AlbumListItem({
  album,
  isSelected,
  isFirst,
  isLast,
  onSelect,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  album: MemberAlbumItem;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={ [
        "rounded-2xl border p-3 transition-all duration-200",
        isSelected
          ? "border-[#a7cc84] bg-[#f2fae8] shadow-[0_16px_34px_-24px_rgba(74,96,55,0.85)]"
          : "border-[#dbe9cf] bg-white",
      ].join(" ") }
    >
      <button type="button" className="w-full text-left" onClick={ onSelect }>
        <div className="flex items-start gap-3">
          { album.coverPhotoUrl ? (
            <div className="size-12 flex-none overflow-hidden rounded-lg border border-[#deebd3] bg-[#eff7e6]">
              <GalleryImage
                src={ album.coverPhotoUrl }
                alt={ album.albumName }
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex size-12 flex-none items-center justify-center rounded-lg border border-[#deebd3] bg-[#eff7e6]">
              <Images className="size-5 text-[#9cb88a]" />
            </div>
          ) }
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-[#355427]">{ album.albumName }</p>
              { album.isShared && (
                <Share2 className="size-3 shrink-0 text-[#6f9960]" aria-label="Shared" />
              ) }
            </div>
            { album.albumDescription && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#6d8b58]">{ album.albumDescription }</p>
            ) }
            <p className="mt-1 text-[11px] text-[#88a272]">{ album.photoCount } photo{ album.photoCount !== 1 ? "s" : "" }</p>
          </div>
        </div>
      </button>

      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={ onMoveUp }
            disabled={ isFirst }
            className="rounded p-1 text-[#8aa174] hover:bg-[#edf7e2] hover:text-[#4d6d3a] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move album up"
          >
            <ChevronUp className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={ onMoveDown }
            disabled={ isLast }
            className="rounded p-1 text-[#8aa174] hover:bg-[#edf7e2] hover:text-[#4d6d3a] disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Move album down"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={ onEdit }
            className="rounded p-1 text-[#8aa174] hover:bg-[#edf7e2] hover:text-[#4d6d3a]"
            aria-label="Edit album"
          >
            <Edit3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={ onDelete }
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete album"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit album dialog ─────────────────────────────────────────────────────

interface AlbumFormValues {
  albumName: string;
  albumDescription: string;
  isShared: boolean;
  selectedPhotoIds: number[];
}

interface AlbumPhotoFormValues {
  caption: string;
  albumPhotoDescription: string;
  seqNo: number;
}

function AddAlbumDialog({
  open,
  onClose,
  onSave,
  candidatePhotos,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: AlbumFormValues) => void;
  candidatePhotos: MemberPhotoItem[];
}) {
  const [values, setValues] = useState<AlbumFormValues>({
    albumName: "",
    albumDescription: "",
    isShared: false,
    selectedPhotoIds: [],
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues({
      albumName: "",
      albumDescription: "",
      isShared: false,
      selectedPhotoIds: [],
    });
  }, [open]);

  function togglePhotoSelection(photoId: number) {
    setValues((currentValues) => {
      if (currentValues.selectedPhotoIds.includes(photoId)) {
        return {
          ...currentValues,
          selectedPhotoIds: currentValues.selectedPhotoIds.filter((id) => id !== photoId),
        };
      }

      return {
        ...currentValues,
        selectedPhotoIds: [...currentValues.selectedPhotoIds, photoId],
      };
    });
  }

  function toggleSelectAllPhotos(checked: boolean) {
    setValues((currentValues) => ({
      ...currentValues,
      selectedPhotoIds: checked ? candidatePhotos.map((photo) => photo.id) : [],
    }));
  }

  const areAllPhotosSelected = candidatePhotos.length > 0
    && values.selectedPhotoIds.length === candidatePhotos.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.albumName.trim()) {
      toast.error("Album name is required");
      return;
    }

    if (values.selectedPhotoIds.length === 0) {
      toast.error("Select at least one unallocated photo before creating an album.");
      return;
    }

    onSave(values);
    setValues({ albumName: "", albumDescription: "", isShared: false, selectedPhotoIds: [] });
  }

  return (
    <Dialog open={ open } onOpenChange={ (isOpen) => { if (!isOpen) onClose(); } }>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Album</DialogTitle>
          <DialogDescription>Give your album a name, then select at least one unallocated photo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={ handleSubmit } className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="albumName">Album Name *</Label>
            <Input
              id="albumName"
              value={ values.albumName }
              onChange={ (e) => setValues((v) => ({ ...v, albumName: e.target.value })) }
              placeholder="e.g. Summer Vacation 2024"
              maxLength={ 120 }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="albumDescription">Description</Label>
            <Textarea
              id="albumDescription"
              value={ values.albumDescription }
              onChange={ (e) => setValues((v) => ({ ...v, albumDescription: e.target.value })) }
              placeholder="Optional description…"
              rows={ 3 }
              maxLength={ 300 }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isShared"
              type="checkbox"
              checked={ values.isShared }
              onChange={ (e) => setValues((v) => ({ ...v, isShared: e.target.checked })) }
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            <Label htmlFor="isShared" className="cursor-pointer font-normal">
              Share this album with the family
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Select Photos *</Label>
              <span className="text-xs text-[#6d8b58]">
                { values.selectedPhotoIds.length } selected
              </span>
            </div>

            { candidatePhotos.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-[#dbe9cf] bg-[#f8fdf3] px-3 py-2">
                <input
                  id="selectAllAlbumPhotos"
                  type="checkbox"
                  checked={ areAllPhotosSelected }
                  onChange={ (e) => toggleSelectAllPhotos(e.target.checked) }
                  className="h-4 w-4 rounded border-slate-300 accent-[#5e8a39]"
                />
                <Label htmlFor="selectAllAlbumPhotos" className="cursor-pointer font-normal text-[#567145]">
                  Select all photos
                </Label>
              </div>
            ) }

            { candidatePhotos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d6e8c4] bg-[#f8fdf3] px-3 py-4 text-sm text-[#6d8b58]">
                No unallocated photos available. Upload photos first.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-[#dbe9cf] bg-white p-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  { candidatePhotos.map((photo) => {
                    const isSelected = values.selectedPhotoIds.includes(photo.id);

                    return (
                      <button
                        key={ photo.id }
                        type="button"
                        onClick={ () => togglePhotoSelection(photo.id) }
                        className={ [
                          "overflow-hidden rounded-lg border text-left transition-all",
                          isSelected
                            ? "border-[#8fba67] ring-2 ring-[#b9d89a]"
                            : "border-[#dcebd0] hover:border-[#b9d89a]",
                        ].join(" ") }
                      >
                        <div className="aspect-square w-full overflow-hidden bg-[#edf6e4]">
                          <GalleryImage
                            src={ photo.photoImageUrl }
                            alt={ photo.caption ?? "Photo" }
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="px-2 py-1">
                          <p className="truncate text-[11px] text-[#567145]">
                            { photo.caption ?? photo.fileName ?? "Photo" }
                          </p>
                        </div>
                      </button>
                    );
                  }) }
                </div>
              </div>
            ) }
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ onClose }>
              Cancel
            </Button>
            <Button type="submit" disabled={ candidatePhotos.length === 0 }>
              Create Album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAlbumDialog({
  open,
  album,
  onClose,
  onSave,
  albumPhotos,
  unallocatedPhotos,
  isLoadingAlbumPhotos,
  isBusy,
  onAddPhoto,
  onRemovePhoto,
}: {
  open: boolean;
  album: MemberAlbumItem | null;
  onClose: () => void;
  onSave: (values: { albumName: string; albumDescription: string; isShared: boolean }) => void;
  albumPhotos: GalleryPhotoItem[];
  unallocatedPhotos: MemberPhotoItem[];
  isLoadingAlbumPhotos: boolean;
  isBusy: boolean;
  onAddPhoto: (photo: MemberPhotoItem) => void;
  onRemovePhoto: (photo: GalleryPhotoItem) => void;
}) {
  const [albumName, setAlbumName] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (!open || !album) {
      return;
    }

    setAlbumName(album.albumName);
    setAlbumDescription(album.albumDescription ?? "");
    setIsShared(album.isShared);
  }, [open, album]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!albumName.trim()) {
      toast.error("Album name is required");
      return;
    }

    onSave({
      albumName: albumName.trim(),
      albumDescription: albumDescription.trim(),
      isShared,
    });
  }

  return (
    <Dialog open={ open } onOpenChange={ (isOpen) => { if (!isOpen) onClose(); } }>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Album</DialogTitle>
          <DialogDescription>Update album details and manage album photos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={ handleSubmit } className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="editAlbumName">Album Name *</Label>
            <Input
              id="editAlbumName"
              value={ albumName }
              onChange={ (e) => setAlbumName(e.target.value) }
              placeholder="e.g. Summer Vacation 2024"
              maxLength={ 120 }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="editAlbumDescription">Description</Label>
            <Textarea
              id="editAlbumDescription"
              value={ albumDescription }
              onChange={ (e) => setAlbumDescription(e.target.value) }
              placeholder="Optional description…"
              rows={ 2 }
              maxLength={ 300 }
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="editAlbumIsShared"
              type="checkbox"
              checked={ isShared }
              onChange={ (e) => setIsShared(e.target.checked) }
              className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
            />
            <Label htmlFor="editAlbumIsShared" className="cursor-pointer font-normal">
              Share this album with the family
            </Label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-[#dbe9cf] bg-[#f8fdf3] p-2">
              <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#6f8f5d]">
                Current Album Scroll Strip
              </p>
              { isLoadingAlbumPhotos ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#89b364] border-t-transparent" />
                </div>
              ) : albumPhotos.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[#d6e8c4] bg-white px-3 text-center text-sm text-[#6d8b58]">
                  No photos in this album yet.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2">
                    { albumPhotos.map((photo) => (
                      <div key={ photo.id } className="overflow-hidden rounded-lg border border-[#dcebd0] bg-white p-1">
                        <div className="h-24 w-full overflow-hidden rounded-md bg-[#edf6e4]">
                          <GalleryImage
                            src={ photo.photoImageUrl }
                            alt={ photo.caption ?? "Album photo" }
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-[#456533]">{ photo.caption ?? "Untitled photo" }</p>
                        <p className="truncate text-[10px] text-[#6d8b58]">Seq { photo.seqNo }</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-0.5 h-5 w-full rounded-full border-[#d9bcbc] bg-[#fff8f8] px-1.5 text-[10px] text-[#8f3a3a] hover:bg-[#ffeaea]"
                          disabled={ isBusy }
                          onClick={ () => onRemovePhoto(photo) }
                        >
                          Remove
                        </Button>
                      </div>
                    )) }
                  </div>
                </div>
              ) }
            </div>

            <div className="rounded-xl border border-[#dbe9cf] bg-[#f8fdf3] p-2">
              <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#6f8f5d]">
                Unallocated Photos Scroll Strip
              </p>
              { unallocatedPhotos.length === 0 ? (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[#d6e8c4] bg-white px-3 text-center text-sm text-[#6d8b58]">
                  No unallocated photos available.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-2">
                    { unallocatedPhotos.map((photo) => (
                      <div key={ photo.id } className="overflow-hidden rounded-lg border border-[#dcebd0] bg-white p-1">
                        <div className="h-24 w-full overflow-hidden rounded-md bg-[#edf6e4]">
                          <GalleryImage
                            src={ photo.photoImageUrl }
                            alt={ photo.caption ?? "Unallocated photo" }
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-[#456533]">{ photo.caption ?? photo.fileName ?? "Untitled photo" }</p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-0.5 h-5 w-full rounded-full bg-[#5e8a39] px-1.5 text-[10px] text-white hover:bg-[#4e7430]"
                          disabled={ isBusy }
                          onClick={ () => onAddPhoto(photo) }
                        >
                          Add
                        </Button>
                      </div>
                    )) }
                  </div>
                </div>
              ) }
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ onClose }>
              Cancel
            </Button>
            <Button type="submit" disabled={ isBusy }>Save Album</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditAlbumPhotoDialog({
  open,
  photo,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  photo: GalleryPhotoItem | null;
  onClose: () => void;
  onSave: (values: AlbumPhotoFormValues) => void;
  onDelete: () => void;
}) {
  const [values, setValues] = useState<AlbumPhotoFormValues>({
    caption: "",
    albumPhotoDescription: "",
    seqNo: 1,
  });

  useEffect(() => {
    if (!open || !photo) {
      return;
    }

    setValues({
      caption: photo.caption ?? "",
      albumPhotoDescription: photo.albumPhotoDescription ?? "",
      seqNo: photo.seqNo,
    });
  }, [open, photo]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!photo) {
      return;
    }

    if (Number.isNaN(values.seqNo) || values.seqNo < 1) {
      toast.error("Enter a valid sequence number.");
      return;
    }

    onSave(values);
  }

  return (
    <Dialog open={ open } onOpenChange={ (isOpen) => { if (!isOpen) onClose(); } }>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Album Photo</DialogTitle>
          <DialogDescription>Update the album photo details or remove it from the album.</DialogDescription>
        </DialogHeader>

        { photo && (
          <form onSubmit={ handleSubmit } className="space-y-4 pt-1">
            <div className="overflow-hidden rounded-2xl border border-[#dbe9cf] bg-[#f8fdf3]">
              <div className="aspect-square w-full overflow-hidden bg-[#edf6e4]">
                <GalleryImage
                  src={ photo.photoImageUrl }
                  alt={ photo.caption ?? "Album photo" }
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-3 py-2 text-xs text-[#6d8b58]">
                { photo.memberName } · Seq { photo.seqNo }
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photoCaption">Caption</Label>
              <Input
                id="photoCaption"
                value={ values.caption }
                onChange={ (e) => setValues((current) => ({ ...current, caption: e.target.value })) }
                placeholder="Photo caption"
                maxLength={ 180 }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photoDescription">Description</Label>
              <Textarea
                id="photoDescription"
                value={ values.albumPhotoDescription }
                onChange={ (e) => setValues((current) => ({ ...current, albumPhotoDescription: e.target.value })) }
                placeholder="Optional photo description"
                rows={ 3 }
                maxLength={ 400 }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photoSeqNo">Sequence</Label>
              <Input
                id="photoSeqNo"
                type="number"
                min={ 1 }
                step={ 1 }
                value={ values.seqNo }
                onChange={ (e) => setValues((current) => ({ ...current, seqNo: Number(e.target.value) })) }
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button type="button" variant="destructive" onClick={ onDelete }>
                Delete from Album
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={ onClose }>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </div>
          </form>
        ) }
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteAlbumDialog({
  albumName,
  open,
  onClose,
  onConfirm,
}: {
  albumName: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={ open } onOpenChange={ (isOpen) => { if (!isOpen) onClose(); } }>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Album</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{ albumName }&rdquo;? The album will be removed,
            but your photos will not be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={ onClose }>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={ onConfirm }>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MemberGalleryHomePageProps {
  albums: MemberAlbumItem[];
  unallocatedPhotos: MemberPhotoItem[];
  member: MemberKeyDetails;
}

export default function MemberGalleryHomePage({
  albums: initialAlbums,
  unallocatedPhotos: initialPhotos,
  member,
}: MemberGalleryHomePageProps) {
  // Album list — ordered locally for instant re-ordering UX
  const [albums, setAlbums] = useState<MemberAlbumItem[]>(initialAlbums);
  const [unallocatedPhotos, setUnallocatedPhotos] = useState<MemberPhotoItem[]>(initialPhotos);

  const [selectedAlbum, setSelectedAlbum] = useState<MemberAlbumItem | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<GalleryPhotoItem[]>([]);
  const [isLoadingAlbumPhotos, setIsLoadingAlbumPhotos] = useState(false);
  const [selectedAlbumPhoto, setSelectedAlbumPhoto] = useState<GalleryPhotoItem | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberAlbumItem | null>(null);
  const [editAlbumPhotos, setEditAlbumPhotos] = useState<GalleryPhotoItem[]>([]);
  const [isLoadingEditAlbumPhotos, setIsLoadingEditAlbumPhotos] = useState(false);
  const [isEditAlbumPhotoOpen, setIsEditAlbumPhotoOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberAlbumItem | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // When an album is selected, load its photos
  function handleSelectAlbum(album: MemberAlbumItem) {
    if (selectedAlbum?.id === album.id) {
      setSelectedAlbum(null);
      setAlbumPhotos([]);
      return;
    }

    setSelectedAlbum(album);
    setAlbumPhotos([]);
    setIsLoadingAlbumPhotos(true);

    startTransition(async () => {
      const result = await getAlbumPhotosAction(album.id);
      setIsLoadingAlbumPhotos(false);

      if (result.success) {
        setAlbumPhotos(result.photos);
      } else {
        toast.error(result.message);
      }
    });
  }

  function refreshSelectedAlbumPhotos(albumId?: number) {
    const targetAlbumId = albumId ?? selectedAlbum?.id;

    if (!targetAlbumId) {
      return;
    }

    startTransition(async () => {
      const result = await getAlbumPhotosAction(targetAlbumId);

      if (result.success) {
        setAlbumPhotos(result.photos);

        if (selectedAlbumPhoto) {
          const updatedSelection = result.photos.find((photo) => photo.id === selectedAlbumPhoto.id) ?? null;
          setSelectedAlbumPhoto(updatedSelection);
          if (!updatedSelection) {
            setIsEditAlbumPhotoOpen(false);
          }
        }
      }
    });
  }

  function handleOpenAlbumPhotoEditor(photo: GalleryPhotoItem) {
    setSelectedAlbumPhoto(photo);
    setIsEditAlbumPhotoOpen(true);
  }

  // Photo upload
  async function handleUpload(files: File[]) {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadedPhotos: MemberPhotoItem[] = [];
      let successCount = 0;
      let failureCount = 0;

      const createShortPrefix = () => {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
        }

        return Math.random().toString(36).slice(2, 10);
      };

      const createDefaultCaption = (originalFileName: string) => {
        const withoutExtension = originalFileName.replace(/\.[^.]+$/, "");
        const normalized = withoutExtension.replace(/[-_]+/g, " ").trim();
        return normalized || "Untitled photo";
      };

      for (const [index, file] of files.entries()) {
        // 1. Get a pre-signed URL from the API
        const safeBaseName = file.name.replace(/[^A-Za-z0-9._-]/g, "-") || `photo-${ index + 1 }`;
        const safeName = `${ createShortPrefix() }-${ safeBaseName }`;
        const defaultCaption = createDefaultCaption(file.name);

        const signRes = await fetch("/api/s3-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "upload",
            folder: "galleries",
            fileName: safeName,
            contentType: file.type,
          }),
        });

        if (!signRes.ok) {
          failureCount += 1;
          continue;
        }

        const { url: signedUrl, s3Key, s3Uri, fileUrl } = await signRes.json();

        // 2. Upload directly to S3
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          failureCount += 1;
          continue;
        }

        // 3. Save the photo metadata in the DB
        const storedImageUrl = s3Uri ?? fileUrl ?? `s3://${ s3Key }`;
        const saveResult = await saveGalleryPhotoAction({
          caption: defaultCaption,
          photoYear: new Date().getFullYear(),
          photoImageUrl: storedImageUrl,
          fileName: safeName,
          fileSizeBytes: file.size,
          mimeType: file.type,
        });

        if (saveResult.success) {
          successCount += 1;
          uploadedPhotos.push({
            id: saveResult.photo.id,
            caption: saveResult.photo.caption,
            photoYear: saveResult.photo.photoYear,
            photoImageUrl: saveResult.photo.photoImageUrl,
            fileName: saveResult.photo.fileName,
            createdAt: saveResult.photo.createdAt ?? new Date(),
            isInAlbum: false,
          });
        } else {
          failureCount += 1;
        }
      }

      if (uploadedPhotos.length > 0) {
        setUnallocatedPhotos((prev) => [...uploadedPhotos, ...prev]);
      }

      if (successCount > 0 && failureCount === 0) {
        toast.success(`${ successCount } photo${ successCount !== 1 ? "s" : "" } uploaded successfully!`);
      } else if (successCount > 0 && failureCount > 0) {
        toast.success(`${ successCount } uploaded, ${ failureCount } failed. Please retry failed files.`);
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  }

  // Create album
  async function handleCreateAlbum(values: AlbumFormValues) {
    if (values.selectedPhotoIds.length === 0) {
      toast.error("Select at least one unallocated photo before creating an album.");
      return;
    }

    setIsBusy(true);

    startTransition(async () => {
      const result = await createGalleryAlbumAction({
        albumName: values.albumName,
        albumDescription: values.albumDescription || null,
        isShared: values.isShared,
      });

      setIsBusy(false);

      if (result.success) {
        const selectedPhotoMap = new Map(
          unallocatedPhotos.map((photo) => [photo.id, photo])
        );

        let linkedCount = 0;
        const linkedPhotoIds = new Set<number>();

        for (const photoId of values.selectedPhotoIds) {
          const selectedPhoto = selectedPhotoMap.get(photoId);

          if (!selectedPhoto) {
            continue;
          }

          const addResult = await addPhotoToAlbumAction({
            albumId: result.album.id,
            photoId,
            caption: selectedPhoto.caption,
          });

          if (addResult.success) {
            linkedCount += 1;
            linkedPhotoIds.add(photoId);
          }
        }

        if (linkedCount === 0) {
          await deleteGalleryAlbumAction(result.album.id);
          toast.error("Album was not created because no photos could be added.");
          return;
        }

        const nextAlbum: MemberAlbumItem = {
          ...result.album,
          photoCount: linkedCount,
        };

        setAlbums((prev) => [nextAlbum, ...prev]);
        setUnallocatedPhotos((prev) =>
          prev.map((photo) =>
            linkedPhotoIds.has(photo.id)
              ? { ...photo, isInAlbum: true }
              : photo
          )
        );
        setIsAddAlbumOpen(false);
        toast.success(`Album created with ${ linkedCount } photo${ linkedCount !== 1 ? "s" : "" }.`);
      } else {
        toast.error(result.message);
      }
    });
  }

  // Delete album
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsBusy(true);

    const albumId = deleteTarget.id;
    setDeleteTarget(null);

    startTransition(async () => {
      const result = await deleteGalleryAlbumAction(albumId);
      setIsBusy(false);

      if (result.success) {
        setAlbums((prev) => prev.filter((a) => a.id !== albumId));
        if (selectedAlbum?.id === albumId) {
          setSelectedAlbum(null);
          setAlbumPhotos([]);
        }
        toast.success("Album deleted.");
      } else {
        toast.error(result.message);
      }
    });
  }

  // Move album up / down (local ordering via updatedAt — UI-only swap)
  function swapAlbums(indexA: number, indexB: number) {
    setAlbums((prev) => {
      const next = [...prev];
      [next[indexA], next[indexB]] = [next[indexB]!, next[indexA]!];
      return next;
    });
  }

  // Display photos: when album selected show album photos; otherwise unallocated
  const displayPhotos: Array<MemberPhotoItem | GalleryPhotoItem> = selectedAlbum
    ? albumPhotos
    : unallocatedPhotos.filter((p) => !p.isInAlbum);

  const stripLabel = selectedAlbum
    ? `Photos — ${ selectedAlbum.albumName }`
    : "My Unallocated Photos";

  async function handleSaveAlbumPhoto(values: AlbumPhotoFormValues) {
    if (!selectedAlbumPhoto || !selectedAlbum) {
      return;
    }

    setIsBusy(true);

    startTransition(async () => {
      const result = await updateGalleryAlbumPhotoAction({
        id: selectedAlbumPhoto.id,
        albumId: selectedAlbum.id,
        caption: values.caption.trim() || null,
        albumPhotoDescription: values.albumPhotoDescription.trim() || null,
        seqNo: values.seqNo,
      });

      setIsBusy(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setIsEditAlbumPhotoOpen(false);
      refreshSelectedAlbumPhotos(selectedAlbum.id);
      toast.success("Album photo updated.");
    });
  }

  async function handleDeleteAlbumPhoto() {
    if (!selectedAlbumPhoto || !selectedAlbum) {
      return;
    }

    setIsBusy(true);

    startTransition(async () => {
      const result = await removePhotoFromAlbumAction(selectedAlbumPhoto.id);

      setIsBusy(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setAlbumPhotos((currentPhotos) => currentPhotos.filter((photo) => photo.id !== selectedAlbumPhoto.id));
      setUnallocatedPhotos((currentPhotos) =>
        currentPhotos.map((photo) =>
          photo.id === selectedAlbumPhoto.photoId
            ? { ...photo, isInAlbum: false }
            : photo
        )
      );
      setIsEditAlbumPhotoOpen(false);
      setSelectedAlbumPhoto(null);
      refreshSelectedAlbumPhotos(selectedAlbum.id);
      toast.success("Photo removed from album.");
    });
  }

  async function handleSaveAlbumDetails(values: { albumName: string; albumDescription: string; isShared: boolean }) {
    if (!editTarget) {
      return;
    }

    setIsBusy(true);

    startTransition(async () => {
      const result = await updateGalleryAlbumAction({
        id: editTarget.id,
        albumName: values.albumName,
        albumDescription: values.albumDescription || null,
        isShared: values.isShared,
      });

      setIsBusy(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setAlbums((prev) => prev.map((album) => {
        if (album.id !== editTarget.id) {
          return album;
        }

        return {
          ...album,
          albumName: values.albumName,
          albumDescription: values.albumDescription || null,
          isShared: values.isShared,
        };
      }));

      setSelectedAlbum((current) => {
        if (!current || current.id !== editTarget.id) {
          return current;
        }

        return {
          ...current,
          albumName: values.albumName,
          albumDescription: values.albumDescription || null,
          isShared: values.isShared,
        };
      });

      setIsEditAlbumOpen(false);
      setEditTarget(null);
      toast.success("Album updated.");
    });
  }

  function refreshEditAlbumPhotos(albumId: number) {
    setIsLoadingEditAlbumPhotos(true);
    startTransition(async () => {
      const result = await getAlbumPhotosAction(albumId);
      setIsLoadingEditAlbumPhotos(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setEditAlbumPhotos(result.photos);
    });
  }

  function adjustAlbumPhotoCount(albumId: number, delta: number) {
    setAlbums((prev) => prev.map((album) => {
      if (album.id !== albumId) {
        return album;
      }

      return {
        ...album,
        photoCount: Math.max(0, album.photoCount + delta),
      };
    }));

    setSelectedAlbum((current) => {
      if (!current || current.id !== albumId) {
        return current;
      }

      return {
        ...current,
        photoCount: Math.max(0, current.photoCount + delta),
      };
    });
  }

  function handleAddPhotoToEditAlbum(photo: MemberPhotoItem) {
    if (!editTarget) {
      return;
    }

    setIsBusy(true);
    startTransition(async () => {
      const result = await addPhotoToAlbumAction({
        albumId: editTarget.id,
        photoId: photo.id,
        caption: photo.caption,
      });

      setIsBusy(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setUnallocatedPhotos((prev) => prev.map((currentPhoto) =>
        currentPhoto.id === photo.id
          ? { ...currentPhoto, isInAlbum: true }
          : currentPhoto
      ));
      adjustAlbumPhotoCount(editTarget.id, 1);
      refreshEditAlbumPhotos(editTarget.id);

      if (selectedAlbum?.id === editTarget.id) {
        refreshSelectedAlbumPhotos(editTarget.id);
      }

      toast.success("Photo added to album.");
    });
  }

  function handleRemovePhotoFromEditAlbum(photo: GalleryPhotoItem) {
    if (!editTarget) {
      return;
    }

    setIsBusy(true);
    startTransition(async () => {
      const result = await removePhotoFromAlbumAction(photo.id);

      setIsBusy(false);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setEditAlbumPhotos((prev) => prev.filter((currentPhoto) => currentPhoto.id !== photo.id));
      setUnallocatedPhotos((prev) => prev.map((currentPhoto) =>
        currentPhoto.id === photo.photoId
          ? { ...currentPhoto, isInAlbum: false }
          : currentPhoto
      ));
      adjustAlbumPhotoCount(editTarget.id, -1);

      if (selectedAlbum?.id === editTarget.id) {
        refreshSelectedAlbumPhotos(editTarget.id);
      }

      toast.success("Photo removed from album.");
    });
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(82,126,53,0.9),rgba(138,186,86,0.82)_54%,rgba(228,245,190,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(56,84,35,0.8)] sm:px-8 md:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#eefdd6]">
                Member Photo Gallery
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
                  href="/family-gallery"
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5ffe8] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Camera className="mr-2 size-4" />
                  Family Gallery
                </Link>
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { member.firstName }&apos;s Private Photo and Album Workspace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f0fde0] sm:text-base">
                Upload photos, create albums, and prepare albums to share with your family. When you're ready, share them!
              </p>
            </div>
          </div>
        </div>

        <main>
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-6">
            <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(63,93,42,0.75)] backdrop-blur">
              <div className="border-b border-[#d6e8c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,252,236,0.88))] px-5 py-5 sm:px-6">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#6f8f5d]">
                  Photo Workspace
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#355427]">Photo Scroll Strip</h2>
                <p className="mt-2 text-sm leading-6 text-[#6f8f5d]">
                  Uploads appear here. Select an album from the right pane to preview its sequence.
                </p>
              </div>

              <div className="px-4 py-4 sm:px-6 sm:py-5">
                { isLoadingAlbumPhotos ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#89b364] border-t-transparent" />
                  </div>
                ) : (
                  <PhotoScrollStrip
                    photos={ displayPhotos }
                    label={ stripLabel }
                    isUnallocatedStrip={ selectedAlbum === null }
                    onPhotoDoubleClick={ selectedAlbum ? handleOpenAlbumPhotoEditor : undefined }
                    onUpload={ handleUpload }
                    isUploading={ isUploading }
                  />
                ) }
              </div>
            </div>

            <div className="min-w-0 overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/85 shadow-[0_24px_70px_-40px_rgba(63,93,42,0.75)] backdrop-blur max-h-[74vh]">
              <div className="border-b border-[#d6e8c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,252,236,0.88))] px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#6f8f5d]">
                      Album Manager
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-[#355427]">My Albums</h2>
                    <p className="mt-2 text-sm leading-6 text-[#6f8f5d]">
                      Build albums, reorder them locally, and choose what gets shared.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex h-[calc(74vh-7.5rem)] flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#6f8f5d]">
                    My Albums
                  </p>
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-full bg-[#5e8a39] px-3 text-xs font-semibold text-white hover:bg-[#4e7430]"
                    disabled={ isBusy }
                    onClick={ () => setIsAddAlbumOpen(true) }
                  >
                    <Plus className="size-3" />
                    Add Album
                  </Button>
                </div>

                { albums.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#d6e8c4] bg-[#f8fdf3] py-12">
                    <div className="text-center text-[#86a072]">
                      <Images className="mx-auto mb-2 size-10 opacity-60" />
                      <p className="text-sm">No albums yet.</p>
                      <p className="mt-1 text-xs">Click &ldquo;Add Album&rdquo; to create your first album.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    { albums.map((album, index) => (
                      <AlbumListItem
                        key={ album.id }
                        album={ album }
                        isSelected={ selectedAlbum?.id === album.id }
                        isFirst={ index === 0 }
                        isLast={ index === albums.length - 1 }
                        onSelect={ () => handleSelectAlbum(album) }
                        onMoveUp={ () => swapAlbums(index, index - 1) }
                        onMoveDown={ () => swapAlbums(index, index + 1) }
                        onEdit={ () => {
                          setEditTarget(album);
                          setIsEditAlbumOpen(true);
                          setEditAlbumPhotos([]);
                          refreshEditAlbumPhotos(album.id);
                        } }
                        onDelete={ () => setDeleteTarget(album) }
                      />
                    )) }
                  </div>
                ) }
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */ }
      <AddAlbumDialog
        open={ isAddAlbumOpen }
        onClose={ () => setIsAddAlbumOpen(false) }
        onSave={ handleCreateAlbum }
        candidatePhotos={ unallocatedPhotos.filter((photo) => !photo.isInAlbum) }
      />

      <EditAlbumDialog
        open={ isEditAlbumOpen }
        album={ editTarget }
        onClose={ () => {
          setIsEditAlbumOpen(false);
          setEditTarget(null);
          setEditAlbumPhotos([]);
        } }
        onSave={ handleSaveAlbumDetails }
        albumPhotos={ editAlbumPhotos }
        unallocatedPhotos={ unallocatedPhotos.filter((photo) => !photo.isInAlbum) }
        isLoadingAlbumPhotos={ isLoadingEditAlbumPhotos }
        isBusy={ isBusy }
        onAddPhoto={ handleAddPhotoToEditAlbum }
        onRemovePhoto={ handleRemovePhotoFromEditAlbum }
      />

      <DeleteAlbumDialog
        albumName={ deleteTarget?.albumName ?? "" }
        open={ deleteTarget !== null }
        onClose={ () => setDeleteTarget(null) }
        onConfirm={ handleConfirmDelete }
      />

      <EditAlbumPhotoDialog
        open={ isEditAlbumPhotoOpen }
        photo={ selectedAlbumPhoto }
        onClose={ () => {
          setIsEditAlbumPhotoOpen(false);
          setSelectedAlbumPhoto(null);
        } }
        onSave={ handleSaveAlbumPhoto }
        onDelete={ handleDeleteAlbumPhoto }
      />
    </section>
  );
}
