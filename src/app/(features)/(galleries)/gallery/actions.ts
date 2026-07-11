'use server';

import { revalidatePath } from 'next/cache';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import {
  getFamilyGalleryData,
  getAlbumPhotos,
  getMemberGalleryData,
  saveGalleryPhoto,
  updateGalleryPhoto,
  clearUnallocatedGalleryPhotos,
  createGalleryAlbum,
  updateGalleryAlbum,
  deleteGalleryAlbum,
  addPhotoToAlbum,
  updateGalleryAlbumPhoto,
  removePhotoFromAlbum,
  resequenceAlbumPhotos,
  setGalleryPhotoReaction,
  addGalleryAlbumComment,
} from '@/components/db/sql/queries-gallery';
import type {
  SaveGalleryPhotoInput,
  UpdateGalleryPhotoInput,
  CreateAlbumInput,
  UpdateAlbumInput,
  AddPhotoToAlbumInput,
  UpdateGalleryAlbumPhotoInput,
  ResequenceAlbumPhotosInput,
  SetGalleryPhotoReactionInput,
  AddGalleryAlbumCommentInput,
} from '@/components/db/types/gallery';

export async function getFamilyGalleryDataAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in.' };
  }

  return getFamilyGalleryData(memberDetails.familyId);
}

export async function getAlbumPhotosAction(albumId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in.' };
  }

  return getAlbumPhotos(albumId, memberDetails.memberId);
}

export async function setGalleryPhotoReactionAction(input: SetGalleryPhotoReactionInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to react to photos.' };
  }

  const result = await setGalleryPhotoReaction(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function addGalleryAlbumCommentAction(input: AddGalleryAlbumCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to comment on albums.' };
  }

  const result = await addGalleryAlbumComment(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function getMemberGalleryDataAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in.' };
  }

  return getMemberGalleryData(memberDetails.memberId);
}

export async function saveGalleryPhotoAction(input: SaveGalleryPhotoInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to upload photos.' };
  }

  const result = await saveGalleryPhoto(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
  }

  return result;
}

export async function updateGalleryPhotoAction(input: UpdateGalleryPhotoInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to edit photos.' };
  }

  const result = await updateGalleryPhoto(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function clearUnallocatedGalleryPhotosAction() {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to clear photos.' };
  }

  const result = await clearUnallocatedGalleryPhotos({
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
  }

  return result;
}

export async function createGalleryAlbumAction(input: CreateAlbumInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to create albums.' };
  }

  const result = await createGalleryAlbum(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function updateGalleryAlbumAction(input: UpdateAlbumInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to update albums.' };
  }

  const result = await updateGalleryAlbum(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function deleteGalleryAlbumAction(albumId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to delete albums.' };
  }

  const result = await deleteGalleryAlbum(albumId, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
    revalidatePath('/family-gallery');
  }

  return result;
}

export async function addPhotoToAlbumAction(input: AddPhotoToAlbumInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to add photos to albums.' };
  }

  const result = await addPhotoToAlbum(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
  }

  return result;
}

export async function updateGalleryAlbumPhotoAction(input: UpdateGalleryAlbumPhotoInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to update album photos.' };
  }

  const result = await updateGalleryAlbumPhoto(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    const latestPhotos = await getAlbumPhotos(input.albumId, memberDetails.memberId);

    if (latestPhotos.success) {
      await resequenceAlbumPhotos(
        {
          albumId: input.albumId,
          orderedAlbumPhotoIds: latestPhotos.photos.map((photo) => photo.id),
        },
        {
          memberId: memberDetails.memberId,
          familyId: memberDetails.familyId,
        }
      );
    }

    revalidatePath('/member-gallery');
  }

  return result;
}

export async function removePhotoFromAlbumAction(albumPhotoId: number) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to remove photos from albums.' };
  }

  const result = await removePhotoFromAlbum(albumPhotoId, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
  }

  return result;
}

export async function resequenceAlbumPhotosAction(input: ResequenceAlbumPhotosInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return { success: false as const, message: 'You must be signed in to resequence photos.' };
  }

  const result = await resequenceAlbumPhotos(input, {
    memberId: memberDetails.memberId,
    familyId: memberDetails.familyId,
  });

  if (result.success) {
    revalidatePath('/member-gallery');
  }

  return result;
}
