export interface DiscussionThreadSummary {
  id: number;
  discussTopic: string;
  createdAt: Date;
  memberFirstName: string;
  dislikeCount: number;
  likeCount: number;
  loveCount: number;
}

export interface DiscussionPostReplyRecord {
  id: number;
  postReplyType: string;
  summary: string;
  contentJson: string;
  createdAt: Date;
  seqNo: number;
  parentPostId: number | null;
  rootPostId: number | null;
  authorMemberId: number;
  authorName: string;
  dislikeCount?: number;
  likeCount?: number;
  loveCount?: number;
  userReactionType?: number | null;
}

export interface DiscussionThreadDetail {
  id: number;
  discussTopic: string;
  status: string;
  createdAt: Date;
  updatedAt: Date | null;
  targetType: string;
  targetId: number;
  postMemberId: number | null;
  postMemberFirstName: string;
  familyId: number;
  postsAndReplies: DiscussionPostReplyRecord[];
}

export interface CreateDiscussionThreadInput {
  targetType: string;
  targetId: number;
  discussTopic: string;
  initialSummary?: string;
  initialContentJson?: string;
}

export type CreateDiscussionThreadReturn =
  | { success: false; message: string }
  | {
      success: true;
      threadId: number;
      message: string;
    };

export interface AddDiscussionReplyInput {
  threadId: number;
  replyToEntryId: number;
  summary: string;
  contentJson: string;
}

export type AddDiscussionReplyReturn =
  | { success: false; message: string }
  | {
      success: true;
      replyId: number;
      message: string;
    };

export interface AddInitialPostInput {
	threadId: number;
	summary: string;
	contentJson: string;
}

export type AddInitialPostReturn =
	| { success: false; message: string }
	| {
		success: true;
		postId: number;
		message: string;
	};

export interface UpdateDiscussionEntryInput {
  entryId: number;
  summary: string;
  contentJson: string;
}

export type UpdateDiscussionEntryReturn =
  | { success: false; message: string }
  | {
    success: true;
    message: string;
  };

export interface PostReactionCounts {
  dislikeCount: number;
	likeCount: number;
	loveCount: number;
  userReactionType?: number | null; // -1 = dislike, 1 = like, 2 = love
}

export interface ToggleDiscussionReactionInput {
	postId: number;
  reactionType: number; // -1 = dislike, 1 = like, 2 = love
}

export type ToggleDiscussionReactionReturn =
	| { success: false; message: string }
	| {
		success: true;
		message: string;
	};