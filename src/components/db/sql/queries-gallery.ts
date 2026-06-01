import db from "@/components/db/drizzle";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import {
  member,
  galleryPhoto,
  galleryAlbum,
  galleryAlbumPhoto,
  galleryAlbumPhotoLike,
  galleryAlbumComment,
} from "../schema/family-social-schema-tables";
import {
  createFamilyActivityRecord,
  FAMILY_ACTIVITY_ACTION_TYPES,
} from "./queries-family-activity";
import type {
  GalleryPhoto,
  GalleryPhotoItem,
  MemberAlbumItem,
  MemberPhotoItem,
  SharedAlbumListItem,
  GetFamilyGalleryDataReturn,
  GetAlbumPhotosReturn,
  GetMemberGalleryDataReturn,
  SaveGalleryPhotoInput,
  SaveGalleryPhotoReturn,
  CreateAlbumInput,
  CreateAlbumReturn,
  UpdateAlbumInput,
  UpdateAlbumReturn,
  DeleteAlbumReturn,
  AddPhotoToAlbumInput,
  AddPhotoToAlbumReturn,
  UpdateGalleryAlbumPhotoInput,
  UpdateGalleryAlbumPhotoReturn,
  ResequenceAlbumPhotosInput,
  ResequenceAlbumPhotosReturn,
  SetGalleryPhotoReactionInput,
  SetGalleryPhotoReactionReturn,
  AddGalleryAlbumCommentInput,
  AddGalleryAlbumCommentReturn,
} from "../types/gallery";

type MemberContext = { memberId: number; familyId: number };

function buildMemberName(firstName?: string | null, lastName?: string | null) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Unknown Member";
}

// ── Family gallery ────────────────────────────────────────────────────────────

export async function getFamilyGalleryData(familyId: number): Promise<GetFamilyGalleryDataReturn> {
  try {
    const albumRows = await db
      .select({
        id: galleryAlbum.id,
        albumName: galleryAlbum.albumName,
        albumDescription: galleryAlbum.albumDescription,
        updatedAt: galleryAlbum.updatedAt,
        memberId: galleryAlbum.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(galleryAlbum)
      .innerJoin(member, eq(galleryAlbum.memberId, member.id))
      .where(and(eq(member.familyId, familyId), eq(galleryAlbum.isShared, true)))
      .orderBy(desc(galleryAlbum.updatedAt));

    const sharedAlbums: SharedAlbumListItem[] = await Promise.all(
      albumRows.map(async (album) => {
        const [coverRow] = await db
          .select({ photoImageUrl: galleryPhoto.photoImageUrl })
          .from(galleryAlbumPhoto)
          .innerJoin(galleryPhoto, eq(galleryAlbumPhoto.photoId, galleryPhoto.id))
          .where(eq(galleryAlbumPhoto.albumId, album.id))
          .orderBy(asc(galleryAlbumPhoto.seqNo))
          .limit(1);

        const countRows = await db
          .select({ id: galleryAlbumPhoto.id })
          .from(galleryAlbumPhoto)
          .where(eq(galleryAlbumPhoto.albumId, album.id));

        const commentRows = await db
          .select({
            id: galleryAlbumComment.id,
            albumId: galleryAlbumComment.albumId,
            memberId: galleryAlbumComment.memberId,
            commentText: galleryAlbumComment.commentText,
            createdAt: galleryAlbumComment.createdAt,
            firstName: member.firstName,
            lastName: member.lastName,
          })
          .from(galleryAlbumComment)
          .innerJoin(member, eq(galleryAlbumComment.memberId, member.id))
          .where(eq(galleryAlbumComment.albumId, album.id))
          .orderBy(desc(galleryAlbumComment.createdAt));

        const comments = commentRows.map((comment) => ({
          id: comment.id,
          albumId: comment.albumId,
          memberId: comment.memberId,
          memberName: buildMemberName(comment.firstName, comment.lastName),
          commentText: comment.commentText,
          createdAt: comment.createdAt ?? new Date(),
        }));

        return {
          id: album.id,
          albumName: album.albumName,
          albumDescription: album.albumDescription,
          updatedAt: album.updatedAt ?? new Date(),
          memberId: album.memberId,
          memberName: buildMemberName(album.firstName, album.lastName),
          photoCount: countRows.length,
          commentCount: comments.length,
          comments,
          coverPhotoUrl: coverRow?.photoImageUrl ?? null,
        };
      })
    );

    return { success: true, sharedAlbums };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load family gallery",
    };
  }
}

export async function getAlbumPhotos(
  albumId: number,
  viewerMemberId?: number
): Promise<GetAlbumPhotosReturn> {
  try {
    const rows = await db
      .select({
        id: galleryAlbumPhoto.id,
        photoId: galleryAlbumPhoto.photoId,
        albumId: galleryAlbumPhoto.albumId,
        caption: galleryAlbumPhoto.caption,
        albumPhotoDescription: galleryAlbumPhoto.albumPhotoDescription,
        seqNo: galleryAlbumPhoto.seqNo,
        photoImageUrl: galleryPhoto.photoImageUrl,
        memberId: galleryAlbumPhoto.memberId,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(galleryAlbumPhoto)
      .innerJoin(galleryPhoto, eq(galleryAlbumPhoto.photoId, galleryPhoto.id))
      .innerJoin(member, eq(galleryAlbumPhoto.memberId, member.id))
      .where(eq(galleryAlbumPhoto.albumId, albumId))
      .orderBy(asc(galleryAlbumPhoto.seqNo));

    const albumPhotoIds = rows.map((row) => row.id);

    const reactionRows = albumPhotoIds.length > 0
      ? await db
        .select({
          albumPhotoId: galleryAlbumPhotoLike.albumPhotoId,
          likeType: galleryAlbumPhotoLike.likeType,
          count: count(),
        })
        .from(galleryAlbumPhotoLike)
        .where(inArray(galleryAlbumPhotoLike.albumPhotoId, albumPhotoIds))
        .groupBy(galleryAlbumPhotoLike.albumPhotoId, galleryAlbumPhotoLike.likeType)
      : [];

    const viewerRows = (viewerMemberId && albumPhotoIds.length > 0)
      ? await db
        .select({
          albumPhotoId: galleryAlbumPhotoLike.albumPhotoId,
          likeType: galleryAlbumPhotoLike.likeType,
        })
        .from(galleryAlbumPhotoLike)
        .where(
          and(
            eq(galleryAlbumPhotoLike.memberId, viewerMemberId),
            inArray(galleryAlbumPhotoLike.albumPhotoId, albumPhotoIds)
          )
        )
      : [];

    const reactionSummary = new Map<number, { likeCount: number; loveCount: number }>();
    for (const row of reactionRows) {
      const existing = reactionSummary.get(row.albumPhotoId) ?? { likeCount: 0, loveCount: 0 };
      if (row.likeType === 1) {
        existing.likeCount = Number(row.count);
      } else if (row.likeType === 2) {
        existing.loveCount = Number(row.count);
      }
      reactionSummary.set(row.albumPhotoId, existing);
    }

    const viewerReaction = new Map<number, "like" | "love">();
    for (const row of viewerRows) {
      if (row.likeType === 1) {
        viewerReaction.set(row.albumPhotoId, "like");
      } else if (row.likeType === 2) {
        viewerReaction.set(row.albumPhotoId, "love");
      }
    }

    const photos: GalleryPhotoItem[] = rows.map((row) => {
      const counts = reactionSummary.get(row.id) ?? { likeCount: 0, loveCount: 0 };
      return {
        id: row.id,
        photoId: row.photoId,
        albumId: row.albumId,
        caption: row.caption,
        albumPhotoDescription: row.albumPhotoDescription,
        photoImageUrl: row.photoImageUrl,
        seqNo: row.seqNo,
        memberId: row.memberId,
        memberName: buildMemberName(row.firstName, row.lastName),
        likeCount: counts.likeCount,
        loveCount: counts.loveCount,
        viewerReaction: viewerReaction.get(row.id) ?? null,
      };
    });

    return { success: true, photos };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load album photos",
    };
  }
}

export async function setGalleryPhotoReaction(
  input: SetGalleryPhotoReactionInput,
  ctx: MemberContext
): Promise<SetGalleryPhotoReactionReturn> {
  try {
    const [target] = await db
      .select({ id: galleryAlbumPhoto.id })
      .from(galleryAlbumPhoto)
      .innerJoin(member, eq(galleryAlbumPhoto.memberId, member.id))
      .where(
        and(
          eq(galleryAlbumPhoto.id, input.albumPhotoId),
          eq(member.familyId, ctx.familyId)
        )
      )
      .limit(1);

    if (!target) {
      return { success: false, message: "Photo not found in your family gallery." };
    }

    await db
      .delete(galleryAlbumPhotoLike)
      .where(
        and(
          eq(galleryAlbumPhotoLike.albumPhotoId, input.albumPhotoId),
          eq(galleryAlbumPhotoLike.memberId, ctx.memberId)
        )
      );

    await db.insert(galleryAlbumPhotoLike).values({
      albumPhotoId: input.albumPhotoId,
      memberId: ctx.memberId,
      likeType: input.reactionType === "love" ? 2 : 1,
    });

    const [likeRow] = await db
      .select({ count: count() })
      .from(galleryAlbumPhotoLike)
      .where(
        and(
          eq(galleryAlbumPhotoLike.albumPhotoId, input.albumPhotoId),
          eq(galleryAlbumPhotoLike.likeType, 1)
        )
      );

    const [loveRow] = await db
      .select({ count: count() })
      .from(galleryAlbumPhotoLike)
      .where(
        and(
          eq(galleryAlbumPhotoLike.albumPhotoId, input.albumPhotoId),
          eq(galleryAlbumPhotoLike.likeType, 2)
        )
      );

    return {
      success: true,
      likeCount: Number(likeRow?.count ?? 0),
      loveCount: Number(loveRow?.count ?? 0),
      viewerReaction: input.reactionType,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save reaction",
    };
  }
}

export async function addGalleryAlbumComment(
  input: AddGalleryAlbumCommentInput,
  ctx: MemberContext
): Promise<AddGalleryAlbumCommentReturn> {
  try {
    const normalizedComment = input.commentText.trim();
    if (!normalizedComment) {
      return { success: false, message: "Comment cannot be empty." };
    }

    const [targetAlbum] = await db
      .select({ id: galleryAlbum.id })
      .from(galleryAlbum)
      .innerJoin(member, eq(galleryAlbum.memberId, member.id))
      .where(
        and(
          eq(galleryAlbum.id, input.albumId),
          eq(galleryAlbum.isShared, true),
          eq(member.familyId, ctx.familyId)
        )
      )
      .limit(1);

    if (!targetAlbum) {
      return { success: false, message: "Album not found or not shared." };
    }

    await db.insert(galleryAlbumComment).values({
      albumId: input.albumId,
      memberId: ctx.memberId,
      commentText: normalizedComment,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save album comment",
    };
  }
}

// ── Member gallery ────────────────────────────────────────────────────────────

export async function getMemberGalleryData(memberId: number): Promise<GetMemberGalleryDataReturn> {
  try {
    const albumRows = await db
      .select({
        id: galleryAlbum.id,
        albumName: galleryAlbum.albumName,
        albumDescription: galleryAlbum.albumDescription,
        isShared: galleryAlbum.isShared,
        isLiked: galleryAlbum.isLiked,
        updatedAt: galleryAlbum.updatedAt,
      })
      .from(galleryAlbum)
      .where(eq(galleryAlbum.memberId, memberId))
      .orderBy(desc(galleryAlbum.updatedAt));

    const albums: MemberAlbumItem[] = await Promise.all(
      albumRows.map(async (album) => {
        const [coverRow] = await db
          .select({ photoImageUrl: galleryPhoto.photoImageUrl })
          .from(galleryAlbumPhoto)
          .innerJoin(galleryPhoto, eq(galleryAlbumPhoto.photoId, galleryPhoto.id))
          .where(eq(galleryAlbumPhoto.albumId, album.id))
          .orderBy(asc(galleryAlbumPhoto.seqNo))
          .limit(1);

        const countRows = await db
          .select({ id: galleryAlbumPhoto.id })
          .from(galleryAlbumPhoto)
          .where(eq(galleryAlbumPhoto.albumId, album.id));

        return {
          id: album.id,
          albumName: album.albumName,
          albumDescription: album.albumDescription,
          isShared: album.isShared,
          isLiked: album.isLiked,
          updatedAt: album.updatedAt ?? new Date(),
          photoCount: countRows.length,
          coverPhotoUrl: coverRow?.photoImageUrl ?? null,
        };
      })
    );

    // All member photos, newest first
    const photoRows = await db
      .select({
        id: galleryPhoto.id,
        caption: galleryPhoto.caption,
        photoYear: galleryPhoto.photoYear,
        photoImageUrl: galleryPhoto.photoImageUrl,
        fileName: galleryPhoto.fileName,
        createdAt: galleryPhoto.createdAt,
      })
      .from(galleryPhoto)
      .where(eq(galleryPhoto.memberId, memberId))
      .orderBy(desc(galleryPhoto.createdAt));

    // Collect photo IDs that belong to at least one album
    const albumPhotoRows = await db
      .select({ photoId: galleryAlbumPhoto.photoId })
      .from(galleryAlbumPhoto)
      .where(eq(galleryAlbumPhoto.memberId, memberId));

    const inAlbumIds = new Set(albumPhotoRows.map((r) => r.photoId));

    const unallocatedPhotos: MemberPhotoItem[] = photoRows.map((row) => ({
      id: row.id,
      caption: row.caption,
      photoYear: row.photoYear,
      photoImageUrl: row.photoImageUrl,
      fileName: row.fileName,
      createdAt: row.createdAt ?? new Date(),
      isInAlbum: inAlbumIds.has(row.id),
    }));

    return { success: true, albums, unallocatedPhotos };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load member gallery",
    };
  }
}

// ── Photo mutations ───────────────────────────────────────────────────────────

export async function saveGalleryPhoto(
  input: SaveGalleryPhotoInput,
  ctx: MemberContext
): Promise<SaveGalleryPhotoReturn> {
  try {
    const [photo] = await db
      .insert(galleryPhoto)
      .values({
        caption: input.caption,
        photoYear: input.photoYear,
        photoImageUrl: input.photoImageUrl,
        fileName: input.fileName,
        fileSizeBytes: input.fileSizeBytes,
        mimeType: input.mimeType,
        memberId: ctx.memberId,
      })
      .returning();

    if (!photo) {
      return { success: false, message: "Failed to save photo record" };
    }

    return { success: true, photo: photo as GalleryPhoto };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save photo",
    };
  }
}

export async function clearUnallocatedGalleryPhotos(
  ctx: MemberContext
): Promise<{ success: true; removedCount: number } | { success: false; message: string }> {
  try {
    const photoRows = await db
      .select({ id: galleryPhoto.id })
      .from(galleryPhoto)
      .where(eq(galleryPhoto.memberId, ctx.memberId));

    if (photoRows.length === 0) {
      return { success: true, removedCount: 0 };
    }

    const albumPhotoRows = await db
      .select({ photoId: galleryAlbumPhoto.photoId })
      .from(galleryAlbumPhoto)
      .where(eq(galleryAlbumPhoto.memberId, ctx.memberId));

    const inAlbumIds = new Set(albumPhotoRows.map((row) => row.photoId));
    const removablePhotoIds = photoRows
      .map((row) => row.id)
      .filter((photoId) => !inAlbumIds.has(photoId));

    if (removablePhotoIds.length === 0) {
      return { success: true, removedCount: 0 };
    }

    await db
      .delete(galleryPhoto)
      .where(
        and(
          eq(galleryPhoto.memberId, ctx.memberId),
          inArray(galleryPhoto.id, removablePhotoIds)
        )
      );

    return { success: true, removedCount: removablePhotoIds.length };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clear unallocated photos",
    };
  }
}

// ── Album mutations ───────────────────────────────────────────────────────────

export async function createGalleryAlbum(
  input: CreateAlbumInput,
  ctx: MemberContext
): Promise<CreateAlbumReturn> {
  try {
    const [album] = await db
      .insert(galleryAlbum)
      .values({
        albumName: input.albumName,
        albumDescription: input.albumDescription,
        isShared: input.isShared,
        memberId: ctx.memberId,
      })
      .returning();

    if (!album) {
      return { success: false, message: "Failed to create album" };
    }

    if (album.isShared) {
      await createFamilyActivityRecord({
        actionType: FAMILY_ACTIVITY_ACTION_TYPES.ALBUM_SHARED,
        featureName: "Family Gallery",
        postName: album.albumName,
        familyId: ctx.familyId,
        memberId: ctx.memberId,
      });
    }

    return {
      success: true,
      album: {
        id: album.id,
        albumName: album.albumName,
        albumDescription: album.albumDescription,
        isShared: album.isShared,
        isLiked: album.isLiked,
        updatedAt: album.updatedAt ?? new Date(),
        photoCount: 0,
        coverPhotoUrl: null,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create album",
    };
  }
}

export async function updateGalleryAlbum(
  input: UpdateAlbumInput,
  ctx: MemberContext
): Promise<UpdateAlbumReturn> {
  try {
    const [existingAlbum] = await db
      .select({ isShared: galleryAlbum.isShared })
      .from(galleryAlbum)
      .where(and(eq(galleryAlbum.id, input.id), eq(galleryAlbum.memberId, ctx.memberId)))
      .limit(1);

    await db
      .update(galleryAlbum)
      .set({
        albumName: input.albumName,
        albumDescription: input.albumDescription,
        isShared: input.isShared,
        updatedAt: new Date(),
      })
      .where(and(eq(galleryAlbum.id, input.id), eq(galleryAlbum.memberId, ctx.memberId)));

    if (existingAlbum && !existingAlbum.isShared && input.isShared) {
      await createFamilyActivityRecord({
        actionType: FAMILY_ACTIVITY_ACTION_TYPES.ALBUM_SHARED,
        featureName: "Family Gallery",
        postName: input.albumName,
        familyId: ctx.familyId,
        memberId: ctx.memberId,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update album",
    };
  }
}

export async function deleteGalleryAlbum(
  albumId: number,
  ctx: MemberContext
): Promise<DeleteAlbumReturn> {
  try {
    await db
      .delete(galleryAlbum)
      .where(and(eq(galleryAlbum.id, albumId), eq(galleryAlbum.memberId, ctx.memberId)));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete album",
    };
  }
}

// ── Album-photo link mutations ────────────────────────────────────────────────

export async function addPhotoToAlbum(
  input: AddPhotoToAlbumInput,
  ctx: MemberContext
): Promise<AddPhotoToAlbumReturn> {
  try {
    const [lastRow] = await db
      .select({ seqNo: galleryAlbumPhoto.seqNo })
      .from(galleryAlbumPhoto)
      .where(eq(galleryAlbumPhoto.albumId, input.albumId))
      .orderBy(desc(galleryAlbumPhoto.seqNo))
      .limit(1);

    const nextSeqNo = (lastRow?.seqNo ?? 0) + 1;

    const [albumPhoto] = await db
      .insert(galleryAlbumPhoto)
      .values({
        photoId: input.photoId,
        albumId: input.albumId,
        caption: input.caption,
        seqNo: nextSeqNo,
        memberId: ctx.memberId,
      })
      .returning();

    if (!albumPhoto) {
      return { success: false, message: "Failed to add photo to album" };
    }

    return { success: true, albumPhotoId: albumPhoto.id, seqNo: albumPhoto.seqNo };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add photo to album",
    };
  }
}

export async function updateGalleryAlbumPhoto(
  input: UpdateGalleryAlbumPhotoInput,
  ctx: MemberContext
): Promise<UpdateGalleryAlbumPhotoReturn> {
  try {
    await db
      .update(galleryAlbumPhoto)
      .set({
        caption: input.caption,
        albumPhotoDescription: input.albumPhotoDescription,
        seqNo: input.seqNo,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(galleryAlbumPhoto.id, input.id),
          eq(galleryAlbumPhoto.albumId, input.albumId),
          eq(galleryAlbumPhoto.memberId, ctx.memberId)
        )
      );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update album photo",
    };
  }
}

export async function removePhotoFromAlbum(
  albumPhotoId: number,
  ctx: MemberContext
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    await db
      .delete(galleryAlbumPhoto)
      .where(
        and(eq(galleryAlbumPhoto.id, albumPhotoId), eq(galleryAlbumPhoto.memberId, ctx.memberId))
      );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to remove photo from album",
    };
  }
}

export async function resequenceAlbumPhotos(
  input: ResequenceAlbumPhotosInput,
  ctx: MemberContext
): Promise<ResequenceAlbumPhotosReturn> {
  try {
    await Promise.all(
      input.orderedAlbumPhotoIds.map((albumPhotoId, index) =>
        db
          .update(galleryAlbumPhoto)
          .set({ seqNo: index + 1 })
          .where(
            and(
              eq(galleryAlbumPhoto.id, albumPhotoId),
              eq(galleryAlbumPhoto.albumId, input.albumId),
              eq(galleryAlbumPhoto.memberId, ctx.memberId)
            )
          )
      )
    );

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to resequence photos",
    };
  }
}
