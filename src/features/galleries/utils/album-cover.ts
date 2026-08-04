import type { MemberPhotoItem } from "@/components/db/types/gallery";

export function pickAlbumCoverPhotoUrl(selectedPhotoIds: number[], photos: MemberPhotoItem[]) {
  if (selectedPhotoIds.length === 0) {
    return null;
  }

  const selectedPhoto = photos.find((photo) => selectedPhotoIds.includes(photo.id));

  return selectedPhoto?.photoImageUrl ?? null;
}
