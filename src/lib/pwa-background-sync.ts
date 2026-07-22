import type { AddBookCommentInput } from "@/components/db/types/books";
import type { AddInitialPostInput } from "@/components/db/types/discuss-threads";
import type { AddGalleryAlbumCommentInput, UpdateAlbumInput } from "@/components/db/types/gallery";
import type { AddMovieCommentInput } from "@/components/db/types/movies";
import type { AddMusicCommentInput } from "@/components/db/types/music";
import type { AddPoemCommentInput } from "@/components/db/types/poem-verses";
import type { AddRecipeCommentInput, SaveFoodiesRecipeInput } from "@/components/db/types/recipes";
import type { AddShowCommentInput } from "@/components/db/types/shows";

type QueuedFoodiesRecipeSave = {
  payload: SaveFoodiesRecipeInput;
  successMessage: string;
  redirectTo: string | null;
  queuedAt: string;
};

type QueuedFoodiesRecipeComment = {
  payload: AddRecipeCommentInput;
  recipeTitle: string;
  commenterName: string;
  queuedAt: string;
};

type PendingMemberPhotoSnapshot = {
  id: number;
  caption: string | null;
  photoYear: number;
  photoPosition: "portrait" | "landscape";
  photoImageUrl: string;
  fileName: string | null;
  createdAt: string;
  isInAlbum: boolean;
};

type PendingAlbumPhotoSnapshot = {
  id: number;
  photoId: number;
  caption: string | null;
  photoImageUrl: string;
  albumPhotoDescription: string | null;
  seqNo: number;
};

type QueuedGallerySelectedAlbumSync = {
  albumId: number;
  pendingAddPhotos: PendingMemberPhotoSnapshot[];
  pendingRemoveAlbumPhotos: PendingAlbumPhotoSnapshot[];
  queuedAt: string;
};

type QueuedGalleryAlbumComment = {
  payload: AddGalleryAlbumCommentInput;
  albumName: string;
  commenterName: string;
  queuedAt: string;
};

type QueuedGalleryAlbumUpdate = {
  payload: UpdateAlbumInput;
  albumName: string;
  queuedAt: string;
};

type QueuedFeatureComment =
  | {
      kind: "book";
      payload: AddBookCommentInput;
      itemTitle: string;
      commenterName: string;
      queuedAt: string;
    }
  | {
      kind: "movie";
      payload: AddMovieCommentInput;
      itemTitle: string;
      commenterName: string;
      queuedAt: string;
    }
  | {
      kind: "music";
      payload: AddMusicCommentInput;
      itemTitle: string;
      commenterName: string;
      queuedAt: string;
    }
  | {
      kind: "poem";
      payload: AddPoemCommentInput;
      itemTitle: string;
      commenterName: string;
      queuedAt: string;
    }
  | {
      kind: "show";
      payload: AddShowCommentInput;
      itemTitle: string;
      commenterName: string;
      queuedAt: string;
    };

type QueuedDiscussionInitialPost = {
  payload: AddInitialPostInput & { revalidatePaths?: string[] };
  threadTopic: string;
  queuedAt: string;
};

const FOODIES_RECIPE_QUEUE_KEY = "pwa:queued-foodies-recipe-save";
const FOODIES_RECIPE_COMMENT_QUEUE_KEY = "pwa:queued-foodies-recipe-comments";
const GALLERY_SELECTED_ALBUM_QUEUE_KEY = "pwa:queued-gallery-selected-album-sync";
const GALLERY_ALBUM_COMMENT_QUEUE_KEY = "pwa:queued-gallery-album-comments";
const GALLERY_ALBUM_UPDATE_QUEUE_KEY = "pwa:queued-gallery-album-updates";
const FEATURE_COMMENT_QUEUE_KEY = "pwa:queued-feature-comments";
const DISCUSSION_INITIAL_POST_QUEUE_KEY = "pwa:queued-discussion-initial-posts";
const PWA_QUEUE_UPDATED_EVENT = "pwa-queue-updated";
const PWA_SYNC_NOW_EVENT = "pwa-sync-now";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(PWA_QUEUE_UPDATED_EVENT));
}

function removeJson(key: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(PWA_QUEUE_UPDATED_EVENT));
}

function appendJsonItem<T>(key: string, value: T) {
  const currentItems = readJson<T[]>(key) ?? [];
  writeJson(key, [...currentItems, value]);
}

function upsertJsonItem<T extends { payload: { clientRequestId?: string } }>(key: string, value: T) {
  const currentItems = readJson<T[]>(key) ?? [];
  const nextItems = value.payload.clientRequestId
    ? [
        ...currentItems.filter((item) => item.payload.clientRequestId !== value.payload.clientRequestId),
        value,
      ]
    : [...currentItems, value];
  writeJson(key, nextItems);
}

function removeJsonItemByRequestId<T extends { payload: { clientRequestId?: string } }>(key: string, clientRequestId: string) {
  const currentItems = readJson<T[]>(key) ?? [];
  const nextItems = currentItems.filter((item) => item.payload.clientRequestId !== clientRequestId);

  if (nextItems.length === 0) {
    removeJson(key);
    return;
  }

  writeJson(key, nextItems);
}

export function isBrowserOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }

  return navigator.onLine;
}

export function createClientRequestId(prefix: string) {
  const randomPart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${ Date.now() }-${ Math.random().toString(36).slice(2, 10) }`;

  return `${ prefix }-${ randomPart }`;
}

export function readQueuedFoodiesRecipeSave(): QueuedFoodiesRecipeSave | null {
  return readJson<QueuedFoodiesRecipeSave>(FOODIES_RECIPE_QUEUE_KEY);
}

export function queueFoodiesRecipeSave(value: QueuedFoodiesRecipeSave) {
  writeJson(FOODIES_RECIPE_QUEUE_KEY, value);
}

export function clearQueuedFoodiesRecipeSave() {
  removeJson(FOODIES_RECIPE_QUEUE_KEY);
}

export function readQueuedGallerySelectedAlbumSync(): QueuedGallerySelectedAlbumSync | null {
  return readJson<QueuedGallerySelectedAlbumSync>(GALLERY_SELECTED_ALBUM_QUEUE_KEY);
}

export function queueGallerySelectedAlbumSync(value: QueuedGallerySelectedAlbumSync) {
  writeJson(GALLERY_SELECTED_ALBUM_QUEUE_KEY, value);
}

export function clearQueuedGallerySelectedAlbumSync() {
  removeJson(GALLERY_SELECTED_ALBUM_QUEUE_KEY);
}

export function readQueuedFoodiesRecipeComments(): QueuedFoodiesRecipeComment[] {
  return readJson<QueuedFoodiesRecipeComment[]>(FOODIES_RECIPE_COMMENT_QUEUE_KEY) ?? [];
}

export function queueFoodiesRecipeComment(value: QueuedFoodiesRecipeComment) {
  appendJsonItem(FOODIES_RECIPE_COMMENT_QUEUE_KEY, value);
}

export function clearQueuedFoodiesRecipeComment(clientRequestId: string) {
  removeJsonItemByRequestId<QueuedFoodiesRecipeComment>(FOODIES_RECIPE_COMMENT_QUEUE_KEY, clientRequestId);
}

export function readQueuedGalleryAlbumComments(): QueuedGalleryAlbumComment[] {
  return readJson<QueuedGalleryAlbumComment[]>(GALLERY_ALBUM_COMMENT_QUEUE_KEY) ?? [];
}

export function queueGalleryAlbumComment(value: QueuedGalleryAlbumComment) {
  appendJsonItem(GALLERY_ALBUM_COMMENT_QUEUE_KEY, value);
}

export function clearQueuedGalleryAlbumComment(clientRequestId: string) {
  removeJsonItemByRequestId<QueuedGalleryAlbumComment>(GALLERY_ALBUM_COMMENT_QUEUE_KEY, clientRequestId);
}

export function readQueuedGalleryAlbumUpdates(): QueuedGalleryAlbumUpdate[] {
  return readJson<QueuedGalleryAlbumUpdate[]>(GALLERY_ALBUM_UPDATE_QUEUE_KEY) ?? [];
}

export function queueGalleryAlbumUpdate(value: QueuedGalleryAlbumUpdate) {
  upsertJsonItem(GALLERY_ALBUM_UPDATE_QUEUE_KEY, value);
}

export function clearQueuedGalleryAlbumUpdate(clientRequestId: string) {
  removeJsonItemByRequestId<QueuedGalleryAlbumUpdate>(GALLERY_ALBUM_UPDATE_QUEUE_KEY, clientRequestId);
}

export function readQueuedFeatureComments(): QueuedFeatureComment[] {
  return readJson<QueuedFeatureComment[]>(FEATURE_COMMENT_QUEUE_KEY) ?? [];
}

export function queueFeatureComment(value: QueuedFeatureComment) {
  appendJsonItem(FEATURE_COMMENT_QUEUE_KEY, value);
}

export function clearQueuedFeatureComment(clientRequestId: string) {
  removeJsonItemByRequestId<QueuedFeatureComment>(FEATURE_COMMENT_QUEUE_KEY, clientRequestId);
}

export function readQueuedDiscussionInitialPosts(): QueuedDiscussionInitialPost[] {
  return readJson<QueuedDiscussionInitialPost[]>(DISCUSSION_INITIAL_POST_QUEUE_KEY) ?? [];
}

export function queueDiscussionInitialPost(value: QueuedDiscussionInitialPost) {
  appendJsonItem(DISCUSSION_INITIAL_POST_QUEUE_KEY, value);
}

export function clearQueuedDiscussionInitialPost(clientRequestId: string) {
  removeJsonItemByRequestId<QueuedDiscussionInitialPost>(DISCUSSION_INITIAL_POST_QUEUE_KEY, clientRequestId);
}

export function getQueuedMutationCount() {
  return [
    readQueuedFoodiesRecipeSave() ? 1 : 0,
    readQueuedGallerySelectedAlbumSync() ? 1 : 0,
    readQueuedFoodiesRecipeComments().length,
    readQueuedGalleryAlbumComments().length,
    readQueuedGalleryAlbumUpdates().length,
    readQueuedFeatureComments().length,
    readQueuedDiscussionInitialPosts().length,
  ].reduce((sum, count) => sum + count, 0);
}

export function getPwaQueueUpdatedEventName() {
  return PWA_QUEUE_UPDATED_EVENT;
}

export function getPwaSyncNowEventName() {
  return PWA_SYNC_NOW_EVENT;
}

export function requestPwaSyncNow() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(PWA_SYNC_NOW_EVENT));
}

export type {
  QueuedFeatureComment,
  QueuedFoodiesRecipeSave,
  QueuedFoodiesRecipeComment,
  QueuedGallerySelectedAlbumSync,
  QueuedGalleryAlbumComment,
  QueuedGalleryAlbumUpdate,
  QueuedDiscussionInitialPost,
  PendingMemberPhotoSnapshot,
  PendingAlbumPhotoSnapshot,
};