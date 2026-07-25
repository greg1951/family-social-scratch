'use server';

import { revalidatePath } from 'next/cache';

import { withRequestCorrelation } from '@/components/db/sql/request-correlation';
import {
  addBlogComment,
  deleteBlogPost,
  getBlogPostDetail,
  saveBlogMedia,
  saveBlogPost,
  toggleBlogLikeness,
} from '@/components/db/sql/queries-blogs';
import {
  AddBlogCommentInput,
  SaveBlogMediaInput,
  SaveBlogPostInput,
  ToggleBlogLikenessInput,
} from '@/components/db/types/blogs';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export async function saveBlogPostAction(input: SaveBlogPostInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to save a blog post.',
      };
    }

    const result = await saveBlogPost(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/blogs');
      revalidatePath('/blogs/new');
      revalidatePath(`/blogs/edit/${ result.post.id }`);
      revalidatePath(`/blogs/${ result.post.slug }`);
    }

    return result;
  });
}

export async function toggleBlogLikenessAction(input: ToggleBlogLikenessInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to react to a blog post.',
      };
    }

    const result = await toggleBlogLikeness(input.blogPostId, input.likenessDegree, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${ result.post.slug }`);
    }

    return result;
  });
}

export async function addBlogCommentAction(input: AddBlogCommentInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to comment on a blog post.',
      };
    }

    const result = await addBlogComment(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${ result.post.slug }`);
    }

    return result;
  }, input.clientRequestId);
}

export async function saveBlogMediaAction(input: SaveBlogMediaInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to upload blog media.',
      };
    }

    const result = await saveBlogMedia(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/blogs');
      if (input.blogPostId) {
        revalidatePath(`/blogs/edit/${ input.blogPostId }`);
      }
    }

    return result;
  });
}

export async function deleteBlogPostAction(input: { blogPostId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to delete a blog post.',
      };
    }

    const result = await deleteBlogPost(input.blogPostId, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder,
    });

    if (result.success) {
      revalidatePath('/blogs');
    }

    return result;
  });
}

export async function getBlogPostDetailAction(input: { blogPostId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to view blog post details.',
      };
    }

    return getBlogPostDetail(memberDetails.familyId, input.blogPostId, memberDetails.memberId);
  });
}
