export interface DiscussionThreadSummary {
  id: number;
  discussTopic: string;
  createdAt: Date;
  memberFirstName: string;
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