export type GenericThreadsReturn = {
  success: boolean;
  message?: string;
};

export type Conversation = {
  id: number,
  title: string,
  visibility: string,
  status: string,
  createdAt: Date,
  updatedAt?: Date,
  subject?: string,
  primaryCategory?: string,
  closedAt?: Date,
  archivedAt?: Date,
  archiveBatchId?: number,
  archiveObjectKey?: string,
  senderMemberId: number,
  familyId: number,
};

export type getConvosReturn =
  | { success: false; message: string }
  | {
      success: true;
      conversations: Conversation[];
    };

export type PostReply = {
  id: number,
  conversationId: number,
  authorMemberId: number,
  type: string,
  content: string,
  contentJson: string,
  seqNo: number,
  createdAt: Date,
  softDeletedAt?: Date,
  parentPostId?: number,
  rootPostId?: number,
};

export type getConvoPostRepliesReturn =
  | { success: false; message: string }
  | {
      success: true;
      postReplies: PostReply[];
    };

export type RecipientState = {
  id: number,
  conversationId: number,
  recipientMemberId: number,
  deliveryType: string,
  readAt?: Date,
  answeredAt?: Date,
  archivedAt?: Date,
  archiveBatchId?: number,
  archiveObjectKey?: string,
};

export type getConvoRecipientStateReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipientStates: RecipientState[];
    };

export type ConvoSummary = {
  id: number;
  title: string;
  visibility: string;
  status: string;
  createdAt: Date;
  senderMemberId: number | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  recipientStateId: number | null;
  recipientMemberId: number | null;
  recipientFirstName: string | null;
  recipientLastName: string | null;
  deliveryType: string | null;
  readAt: Date | null;
  archivedAt: Date | null;
  postContent: string | null;
  postType: string | null;
};

export type getConvoSummariesReturn =
  | { success: false; message: string }
  | {
      success: true;
      summaries: ConvoSummary[];
    };

export type ThreadPostAttachment = {
  id: number;
  postId: number;
  attachmentType: string;
  s3ObjectKey: string;
  displayUrl: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: Date | null;
};

export type archiveAllReadThreadsReturn =
  | { success: false; message: string }
  | {
      success: true;
      archivedCount: number;
      message: string;
    };

export type ThreadRecipientOption = {
  memberId: number;
  firstName: string;
  lastName: string;
  isFounder: boolean;
};

export type getThreadRecipientOptionsReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipients: ThreadRecipientOption[];
    };

export type CreateThreadAttachmentInput = {
  attachmentType: string;
  s3ObjectKey: string;
  displayUrl?: string | null;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
};

export type CreateThreadConversationInput = {
  title: string;
  subject?: string;
  visibility: "public" | "private";
  primaryCategory?: "family_broadcast" | null;
  recipientMemberIds: number[];
  content: string;
  contentJson: string;
  attachments?: CreateThreadAttachmentInput[];
};

export type createThreadConversationReturn =
  | { success: false; message: string }
  | {
      success: true;
      conversationId: number;
      message: string;
    };

export type ThreadConversationDetailPost = {
  id: number;
  conversationId: number;
  authorMemberId: number;
  authorFirstName: string | null;
  authorLastName: string | null;
  type: string;
  content: string;
  contentJson: string;
  seqNo: number;
  createdAt: Date | null;
  attachments: ThreadPostAttachment[];
};

export type ThreadConversationDetail = {
  id: number;
  title: string;
  subject: string | null;
  visibility: string;
  status: string;
  createdAt: Date | null;
  senderMemberId: number | null;
  recipientStateId: number | null;
  readAt: Date | null;
  archivedAt: Date | null;
  posts: ThreadConversationDetailPost[];
};

export type getThreadConversationDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      conversation: ThreadConversationDetail;
    };

export type updateThreadRecipientStateReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };

export type AddThreadReplyInput = {
  conversationId: number;
  content: string;
  contentJson: string;
};

export type addThreadReplyReturn =
  | { success: false; message: string }
  | {
      success: true;
      postId: number;
      message: string;
    };
