'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { getMemberPageDetails } from '@/features/family/services/family-services';
import {
  addMusicComment,
  deleteMusic,
  getMusicDetail,
  saveMusic,
  saveMusicLyrics,
  saveMusicTemplate,
  toggleMusicLike,
} from '@/components/db/sql/queries-music';
import {
  AddMusicCommentInput,
  SaveMusicInput,
  SaveMusicLyricsInput,
  SaveMusicTemplateInput,
  ToggleMusicLikeInput,
} from '@/components/db/types/music';

export async function saveMusicAction(input: SaveMusicInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to add music.',
    };
  }

  const result = await saveMusic(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isFounder: memberDetails.isFounder ?? false,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/add-music');
  }

  return result;
}

export async function saveMusicTemplateAction(input: SaveMusicTemplateInput) {
  try {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to manage music templates.',
      };
    }

    const result = await saveMusicTemplate(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isAdmin: memberDetails.isAdmin ?? false,
    });

    if (result.success) {
      revalidatePath('/music');
      revalidatePath('/music/add-music');
      revalidatePath('/music/templates');
    }

    return result;
  } catch (error) {
    return {
      success: false as const,
      message: error instanceof Error ? error.message : 'Error saving music template',
    };
  }
}

export async function saveMusicLyricsAction(input: SaveMusicLyricsInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to save lyrics.',
    };
  }

  const result = await saveMusicLyrics(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/lyrics');
  }

  return result;
}

export async function toggleMusicLikeAction(input: ToggleMusicLikeInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to react to a music post.',
    };
  }

  const result = await toggleMusicLike(input.musicId, input.likenessDegree, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
  }

  return result;
}

export async function addMusicCommentAction(input: AddMusicCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on music.',
    };
  }

  const result = await addMusicComment(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/music');
  }

  return result;
}

export async function deleteMusicAction(input: { musicId: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to delete music.',
    };
  }

  const result = await deleteMusic(input.musicId, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isFounder: memberDetails.isFounder ?? false,
  });

  if (result.success) {
    revalidatePath('/music');
    revalidatePath('/music/add-music');
  }

  return result;
}

async function getSpotifyPlaybackToken(): Promise<string | null> {
  const session = await auth();
  const token = (session as { spotifyAccessToken?: string | null } | null)?.spotifyAccessToken ?? null;

  return token?.trim() || null;
}

type SpotifyPlaybackPath =
  | '/me/player/play'
  | '/me/player/pause'
  | '/me/player/previous'
  | '/me/player/next'
  | '/me/player/seek?position_ms=0';

async function callSpotifyPlaybackEndpoint(method: 'PUT' | 'POST', path: SpotifyPlaybackPath, body?: Record<string, unknown>) {
  const token = await getSpotifyPlaybackToken();

  if (!token) {
    return {
      success: false as const,
      message: 'Spotify playback is not configured for this environment. Sign in with Spotify and grant playback permissions.',
    };
  }

  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ token }`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.ok) {
    return { success: true as const };
  }

  let detail = 'Spotify playback request failed.';

  try {
    const errorJson = await response.json();
    detail = typeof errorJson?.error?.message === 'string' ? errorJson.error.message : detail;
  } catch {
    // Ignore JSON parsing issues and keep the fallback message.
  }

  if (response.status === 404 && /no active device/i.test(detail)) {
    detail = 'No active Spotify device found. Open Spotify on a device (app or web player) and try again.';
  } else if (response.status === 401) {
    detail = 'Your Spotify connection has expired or is invalid. Sign out, then sign back in with Spotify to reconnect it.';
  } else if (response.status === 403) {
    detail = 'Spotify denied playback. Confirm this is a Premium account and, while the Spotify app is in Development Mode, that this user is on its allowlist.';
  }

  return {
    success: false as const,
    message: detail,
  };
}

export async function playSpotifyPlaylistAction(input: { uris: string[] }) {
  if (!input.uris.length) {
    return {
      success: false as const,
      message: 'No Spotify track URIs were provided for playback.',
    };
  }

  return callSpotifyPlaybackEndpoint('PUT', '/me/player/play', { uris: input.uris });
}

export async function pauseSpotifyPlaylistAction() {
  return callSpotifyPlaybackEndpoint('PUT', '/me/player/pause');
}

export async function resumeSpotifyPlaylistAction() {
  return callSpotifyPlaybackEndpoint('PUT', '/me/player/play');
}

export async function stopSpotifyPlaylistAction() {
  const pauseResult = await callSpotifyPlaybackEndpoint('PUT', '/me/player/pause');

  if (!pauseResult.success) {
    return pauseResult;
  }

  return callSpotifyPlaybackEndpoint('PUT', '/me/player/seek?position_ms=0');
}

export async function skipToPreviousSpotifyTrackAction() {
  return callSpotifyPlaybackEndpoint('POST', '/me/player/previous');
}

export async function skipToNextSpotifyTrackAction() {
  return callSpotifyPlaybackEndpoint('POST', '/me/player/next');
}

export async function getMusicDetailAction(input: { musicId: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to view music details.',
    };
  }

  return getMusicDetail(
    memberDetails.familyId,
    input.musicId,
    memberDetails.memberId
  );
}
