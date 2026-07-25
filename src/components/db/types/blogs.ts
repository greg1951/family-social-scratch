export type BlogPostStatus = 'draft' | 'published' | 'archived';

import type { DiscussionThreadSummary } from './discuss-threads';

export interface BlogTagOption {
  id: number;
  tagName: string;
  category: string;
  seqNo: number;
}

export interface BlogCommentRecord {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  commenterName: string;
  memberId: number;
  contentJson: string;
}

export interface BlogMediaRecord {
  id: number;
  s3ObjectKey: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  createdAt: Date;
  blogPostId: number | null;
  uploadMemberId: number;
  familyId: number;
}

export interface BlogHomePost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  contentJson: string;
  status: BlogPostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coverImageS3Key: string | null;
  coverImageAlt: string | null;
  allowComments: boolean;
  authorMemberId: number;
  familyId: number;
  authorName: string;
  dislikeCount: number;
  likeCount: number;
  loveCount: number;
  userLikenessDegree: number | null;
  commentCount: number;
  hasDiscussionThread: boolean;
  selectedTagIds: number[];
  selectedTagNames: string[];
  dislikeMemberNames: string[];
  likeMemberNames: string[];
  loveMemberNames: string[];
  comments: BlogCommentRecord[];
}

export interface BlogPostDetail extends BlogHomePost {
  media: BlogMediaRecord[];
  discussionThreads: DiscussionThreadSummary[];
}

export type BlogsHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      posts: BlogHomePost[];
      blogTags: BlogTagOption[];
    };

export type GetBlogPostDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      post: BlogPostDetail;
    };

export interface SaveBlogPostInput {
  id?: number;
  title: string;
  slug?: string;
  excerpt?: string;
  contentJson: string;
  status: BlogPostStatus;
  publishedAt?: string | null;
  coverImageS3Key?: string | null;
  coverImageAlt?: string | null;
  allowComments: boolean;
  selectedTagIds: number[];
}

export type SaveBlogPostReturn =
  | { success: false; message: string }
  | {
      success: true;
      post: BlogHomePost;
      message: string;
    };

export interface ToggleBlogLikenessInput {
  blogPostId: number;
  likenessDegree: number;
}

export type ToggleBlogLikenessReturn =
  | { success: false; message: string }
  | {
      success: true;
      post: BlogPostDetail;
      message: string;
    };

export interface AddBlogCommentInput {
  blogPostId: number;
  commentText: string;
  clientRequestId?: string;
}

export type AddBlogCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      post: BlogPostDetail;
      message: string;
    };

export interface SaveBlogMediaInput {
  blogPostId?: number | null;
  s3ObjectKey: string;
  mimeType: string;
  fileSizeBytes?: number;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  caption?: string | null;
}

export type SaveBlogMediaReturn =
  | { success: false; message: string }
  | {
      success: true;
      media: BlogMediaRecord;
      message: string;
    };

export type DeleteBlogPostReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };
