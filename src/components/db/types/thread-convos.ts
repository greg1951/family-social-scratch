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
