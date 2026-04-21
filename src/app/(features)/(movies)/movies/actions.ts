'use server';

import { revalidatePath } from 'next/cache';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import { addMovieComment, getMovieDetail, saveMovie, saveMovieTemplate, toggleMovieLike } from '@/components/db/sql/queries-movies';
import { AddMovieCommentInput, SaveMovieInput, SaveMovieTemplateInput, ToggleMovieLikeInput } from '@/components/db/types/movies';

export async function saveMovieAction(input: SaveMovieInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to add a movie.',
    };
  }

  const result = await saveMovie(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/movies');
    revalidatePath('/movies/add-movie');
  }

  return result;
}

export async function saveMovieTemplateAction(input: SaveMovieTemplateInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to manage movie templates.',
    };
  }

  const result = await saveMovieTemplate(input, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
    isAdmin: memberDetails.isAdmin ?? false,
  });

  if (result.success) {
    revalidatePath('/movies');
    revalidatePath('/movies/add-movie');
    revalidatePath('/movies/templates');
  }

  return result;
}

export async function toggleMovieLikeAction(input: ToggleMovieLikeInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to react to a movie.',
    };
  }

  const result = await toggleMovieLike(input.movieId, input.likenessDegree, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/movies');
  }

  return result;
}

export async function addMovieCommentAction(input: AddMovieCommentInput) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to comment on a movie.',
    };
  }

  const result = await addMovieComment(input.movieId, input.commentText, {
    familyId: memberDetails.familyId,
    memberId: memberDetails.memberId,
  });

  if (result.success) {
    revalidatePath('/movies');
  }

  return result;
}

export async function getMovieDetailAction(input: { movieId: number }) {
  const memberDetails = await getMemberPageDetails();

  if (!memberDetails.isLoggedIn) {
    return {
      success: false as const,
      message: 'You must be signed in to view movie details.',
    };
  }

  return getMovieDetail(
    memberDetails.familyId,
    input.movieId,
    memberDetails.memberId
  );
}