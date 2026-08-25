'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { auth } from '@/auth';
import {
  createSpotifyConnectionContext,
  SPOTIFY_CONNECTION_COOKIE,
  SPOTIFY_CONNECTION_TTL_SECONDS,
} from '@/auth/spotify-connection-context';
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

export async function prepareSpotifyConnectionAction() {
  const session = await auth();
  const userId = Number(session?.user?.id);
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';

  if (!Number.isInteger(userId) || userId <= 0) {
    return { success: false as const, message: 'You must be signed in to connect Spotify.' };
  }

  if (!authSecret) {
    return { success: false as const, message: 'Spotify connection is not configured for this environment.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SPOTIFY_CONNECTION_COOKIE,
    createSpotifyConnectionContext(userId, authSecret),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SPOTIFY_CONNECTION_TTL_SECONDS,
    },
  );

  return { success: true as const };
}

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
  | `/me/player/play?device_id=${ string }`
  | '/me/player/pause'
  | '/me/player/previous'
  | '/me/player/next'
  | '/me/player/seek?position_ms=0';

async function callSpotifyPlaybackEndpoint(method: 'PUT' | 'POST', path: SpotifyPlaybackPath, body?: Record<string, unknown>) {
  const token = await getSpotifyPlaybackToken();

  if (!token) {
    return {
      success: false as const,
      code: 'reconnect_required' as const,
      message: 'Connect Spotify to your My Family Social account to use playback controls.',
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
  }

  if (response.status === 401) {
    return {
      success: false as const,
      code: 'reconnect_required' as const,
      message: 'Your Spotify connection has expired. Reconnect Spotify and try again.',
    };
  }

  if (response.status === 403) {
    return {
      success: false as const,
      code: 'spotify_restricted' as const,
      message: 'Spotify denied playback. Confirm this account has Premium access and is allowed to use this Spotify app.',
    };
  }

  return {
    success: false as const,
    code: response.status === 404 ? 'device_required' as const : 'playback_failed' as const,
    message: detail,
  };
}

async function getSpotifyPlaybackDeviceId() {
  const token = await getSpotifyPlaybackToken();
  if (!token) {
    return { success: false as const, code: 'reconnect_required' as const, message: 'Connect Spotify to your My Family Social account to use playback controls.' };
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${ token }` },
  });

  if (response.status === 401) {
    return { success: false as const, code: 'reconnect_required' as const, message: 'Your Spotify connection has expired. Reconnect Spotify and try again.' };
  }

  if (response.status === 403) {
    return { success: false as const, code: 'spotify_restricted' as const, message: 'Spotify denied device access. Confirm this account has Premium access and is allowed to use this Spotify app.' };
  }

  if (!response.ok) {
    return { success: false as const, code: 'playback_failed' as const, message: 'Spotify devices could not be loaded.' };
  }

  const data = await response.json() as { devices?: Array<{ id?: string | null; is_active?: boolean }> };
  const devices = data.devices ?? [];
  const device = devices.find((item) => item.is_active && item.id) ?? devices.find((item) => item.id);

  if (!device?.id) {
    return { success: false as const, code: 'device_required' as const, message: 'No Spotify device is available. Open Spotify on a device or web player and try again.' };
  }

  return { success: true as const, deviceId: device.id, isActive: Boolean(device.is_active) };
}

export async function playSpotifyPlaylistAction(input: { uris: string[] }) {
  if (!input.uris.length) {
    return {
      success: false as const,
      message: 'No Spotify track URIs were provided for playback.',
    };
  }

  const deviceResult = await getSpotifyPlaybackDeviceId();
  if (!deviceResult.success) {
    return deviceResult;
  }

  const path = deviceResult.isActive
    ? '/me/player/play' as const
    : `/me/player/play?device_id=${ encodeURIComponent(deviceResult.deviceId) }` as const;
  return callSpotifyPlaybackEndpoint('PUT', path, { uris: input.uris });
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
