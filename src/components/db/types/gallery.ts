export interface GalleryPhoto {
  id: number;
  caption: string | null;
  photoYear: number;
  photoImageUrl: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: Date;
  memberId: number;
}

export interface MemberAlbumItem {
  id: number;
  albumName: string;
  albumDescription: string | null;
  isShared: boolean;
  isLiked: boolean;
  updatedAt: Date;
  photoCount: number;
  coverPhotoUrl: string | null;
}

export interface MemberPhotoItem {
  id: number;
  caption: string | null;
  photoYear: number;
  photoImageUrl: string;
  fileName: string | null;
  createdAt: Date;
  isInAlbum: boolean;
}

export interface SharedAlbumListItem {
  id: number;
  albumName: string;
  albumDescription: string | null;
  updatedAt: Date;
  memberId: number;
  memberName: string;
  photoCount: number;
  commentCount: number;
  comments: GalleryAlbumCommentItem[];
  coverPhotoUrl: string | null;
}

export interface GalleryAlbumCommentItem {
  id: number;
  albumId: number;
  memberId: number;
  memberName: string;
  commentText: string;
  createdAt: Date;
}

export interface GalleryPhotoItem {
  id: number;
  photoId: number;
  albumId: number;
  caption: string | null;
  albumPhotoDescription: string | null;
  photoImageUrl: string;
  seqNo: number;
  memberId: number;
  memberName: string;
  likeCount: number;
  loveCount: number;
  viewerReaction: "like" | "love" | null;
}

export interface SetGalleryPhotoReactionInput {
  albumPhotoId: number;
  reactionType: "like" | "love";
}

export type SetGalleryPhotoReactionReturn =
  | { success: true; likeCount: number; loveCount: number; viewerReaction: "like" | "love" }
  | { success: false; message: string };

export interface AddGalleryAlbumCommentInput {
  albumId: number;
  commentText: string;
}

export type AddGalleryAlbumCommentReturn =
  | { success: true }
  | { success: false; message: string };

// ── Return types ─────────────────────────────────────────────────────────────

export type GetFamilyGalleryDataReturn =
  | { success: true; sharedAlbums: SharedAlbumListItem[] }
  | { success: false; message: string };

export type GetAlbumPhotosReturn =
  | { success: true; photos: GalleryPhotoItem[] }
  | { success: false; message: string };

export type GetMemberGalleryDataReturn =
  | { success: true; albums: MemberAlbumItem[]; unallocatedPhotos: MemberPhotoItem[] }
  | { success: false; message: string };

export type SaveGalleryPhotoReturn =
  | { success: true; photo: GalleryPhoto }
  | { success: false; message: string };

export type CreateAlbumReturn =
  | { success: true; album: MemberAlbumItem }
  | { success: false; message: string };

export type UpdateAlbumReturn =
  | { success: true }
  | { success: false; message: string };

export type DeleteAlbumReturn =
  | { success: true }
  | { success: false; message: string };

export type AddPhotoToAlbumReturn =
  | { success: true; albumPhotoId: number; seqNo: number }
  | { success: false; message: string };

export type UpdateGalleryAlbumPhotoReturn =
  | { success: true }
  | { success: false; message: string };

export type ResequenceAlbumPhotosReturn =
  | { success: true }
  | { success: false; message: string };

// ── Input types ───────────────────────────────────────────────────────────────

export interface SaveGalleryPhotoInput {
  caption: string | null;
  photoYear: number;
  photoImageUrl: string;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
}

export interface CreateAlbumInput {
  albumName: string;
  albumDescription: string | null;
  isShared: boolean;
}

export interface UpdateAlbumInput {
  id: number;
  albumName: string;
  albumDescription: string | null;
  isShared: boolean;
}

export interface AddPhotoToAlbumInput {
  photoId: number;
  albumId: number;
  caption: string | null;
}

export interface UpdateGalleryAlbumPhotoInput {
  id: number;
  albumId: number;
  caption: string | null;
  albumPhotoDescription: string | null;
  seqNo: number;
}

export interface ResequenceAlbumPhotosInput {
  albumId: number;
  orderedAlbumPhotoIds: number[];
}
