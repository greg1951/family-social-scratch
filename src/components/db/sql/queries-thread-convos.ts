'use server';

import db from '@/components/db/drizzle';
import { eq, and, desc, or, isNotNull, isNull, asc, inArray, count, sql } from 'drizzle-orm';
import { family, member, threadConversation, threadConversationTag, threadPostAttachment, threadPostReply, threadRecipientState, threadTagReference } from '../schema/family-social-schema-tables';
import {
  addThreadReplyReturn,
  AddThreadReplyInput,
  archiveAllReadThreadsReturn,
  CreateThreadConversationInput,
  createThreadConversationReturn,
  getConvoPostRepliesReturn,
  getConvoRecipientStateReturn,
  getConvosReturn,
  getConvoSummariesReturn,
  getThreadConversationDetailReturn,
  getThreadRecipientOptionsReturn,
  updateThreadRecipientStateReturn,
} from '../types/thread-convos';
import { createFamilyActivityRecord, FAMILY_ACTIVITY_ACTION_TYPES } from './queries-family-activity';

function isMissingContentJsonColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as { code?: string; message?: string };
  const code = maybeError.code ?? '';
  const message = (maybeError.message ?? '').toLowerCase();

  if (code === '42703' && message.includes('content_json')) {
    return true;
  }

  return message.includes('thread_post_reply.content_json') || message.includes('"content_json"');
}

export async function canMemberAccessThreadConversation(params: {
  senderMemberId: number | null;
  memberId: number;
  visibility: string;
  recipientStateId: number | null;
}): Promise<boolean> {
  return params.senderMemberId === params.memberId
    || params.visibility === 'public'
    || Boolean(params.recipientStateId);
}

/*------------------ getConvosBySenderMemberId ------------------ */
export async function getConvosBySenderMemberId(familyId:number, senderMemberId?:number)
  :(Promise<getConvosReturn>) {

  const selectResult = await db.select(
    {
      id: threadConversation.id,
      title: threadConversation.title,
      threadVisibility: threadConversation.visibility,
      status: threadConversation.status,
      createdAt: threadConversation.createdAt,
      updatedAt: threadConversation.updatedAt,
      subject: threadConversation.subject,
      primaryCategory: threadConversation.primaryCategory,
      closedAt: threadConversation.closedAt,
      archivedAt: threadConversation.archivedAt,
      archiveBatchId: threadConversation.archiveBatchId,
      archiveObjectKey: threadConversation.archiveObjectKey,
      senderMemberId: threadConversation.senderMemberId,
      familyId: threadConversation.familyId,
    }
  )
    .from(threadConversation) 
      .innerJoin(family, eq(family.id, threadConversation.familyId))
        .where(eq(threadConversation.senderMemberId, senderMemberId!));

  if (!selectResult) {
    return {
      success: false,
      message: `threadConversations NOT FOUND for familyId ${familyId} and senderMemberId ${senderMemberId}`,
    }
  }
  else {
    const conversationsReturn:getConvosReturn = {
      success: true,
      conversations: selectResult.map(row => ({
        id: row.id,
        title: row.title,
        visibility: row.threadVisibility,
        status: row.status,
        createdAt: row.createdAt!,
        updatedAt: row.updatedAt!,
        subject: row.subject!,
        primaryCategory: row.primaryCategory!,
        closedAt: row.closedAt!,
        archivedAt: row.archivedAt!,
        archiveBatchId: row.archiveBatchId!,
        archiveObjectKey: row.archiveObjectKey!,
        senderMemberId: row.senderMemberId!,
        familyId: row.familyId!,
      }))
    };
    return conversationsReturn;
  }
}

/*------------------ getConvosByTagName ------------------ */
export async function getConvosByTagName(familyId:number, tagName?:string)
  :(Promise<getConvosReturn>) {

  const selectResult = await db.select(
    {
      id: threadConversation.id,
      title: threadConversation.title,
      threadVisibility: threadConversation.visibility,
      status: threadConversation.status,
      createdAt: threadConversation.createdAt,
      updatedAt: threadConversation.updatedAt,
      subject: threadConversation.subject,
      primaryCategory: threadConversation.primaryCategory,
      closedAt: threadConversation.closedAt,
      archivedAt: threadConversation.archivedAt,
      archiveBatchId: threadConversation.archiveBatchId,
      archiveObjectKey: threadConversation.archiveObjectKey,
      senderMemberId: threadConversation.senderMemberId,
      familyId: threadConversation.familyId,
    }
  )
    .from(threadConversation) 
      .innerJoin(family, eq(family.id, threadConversation.familyId))
      .leftJoin(threadConversationTag, eq(threadConversationTag.conversationId, threadConversation.id))
      .leftJoin(threadTagReference, eq(threadTagReference.id, threadConversationTag.tagId))
        .where(and(
          eq(threadConversation.familyId, familyId),
          eq(threadTagReference.tagName, tagName!)
        ));

  if (!selectResult) {
    return {
      success: false,
      message: `threadConversations NOT FOUND for familyId ${familyId} and tagName ${tagName}`,
    }
  }
  else {
    const conversationsReturn:getConvosReturn = {
      success: true,
      conversations: selectResult.map(row => ({
        id: row.id,
        title: row.title,
        visibility: row.threadVisibility,
        status: row.status,
        createdAt: row.createdAt!,
        updatedAt: row.updatedAt!,
        subject: row.subject!,
        primaryCategory: row.primaryCategory!,
        closedAt: row.closedAt!,
        archivedAt: row.archivedAt!,
        archiveBatchId: row.archiveBatchId!,
        archiveObjectKey: row.archiveObjectKey!,
        senderMemberId: row.senderMemberId!,
        familyId: row.familyId!,
      }))
    };
    return conversationsReturn;
  }
}

/*------------------ getConvoPostReplies ------------------ */
export async function getConvoPostReplies(conversationId:number)
  :(Promise<getConvoPostRepliesReturn>) {

  let selectResult: Array<{
    id: number;
    conversationId: number;
    authorMemberId: number;
    type: string;
    content: string;
    contentJson: string;
    seqNo: number;
    createdAt: Date | null;
    softDeletedAt: Date | null;
    parentPostId: number | null;
    rootPostId: number | null;
  }> = [];

  try {
    selectResult = await db.select(
      {
        id: threadPostReply.id,
        conversationId: threadPostReply.conversationId,
        authorMemberId: threadPostReply.authorMemberId,
        type: threadPostReply.type,
        content: threadPostReply.content,
        contentJson: threadPostReply.contentJson,
        seqNo: threadPostReply.seqNo,
        createdAt: threadPostReply.createdAt,
        softDeletedAt: threadPostReply.softDeletedAt,
        parentPostId: threadPostReply.parentPostId,
        rootPostId: threadPostReply.rootPostId,
      }
    )
      .from(threadPostReply) 
      .where(eq(threadPostReply.conversationId, conversationId!));
  } catch (error) {
    if (!isMissingContentJsonColumnError(error)) {
      throw error;
    }

    const legacyRows = await db.select(
      {
        id: threadPostReply.id,
        conversationId: threadPostReply.conversationId,
        authorMemberId: threadPostReply.authorMemberId,
        type: threadPostReply.type,
        content: threadPostReply.content,
        seqNo: threadPostReply.seqNo,
        createdAt: threadPostReply.createdAt,
        softDeletedAt: threadPostReply.softDeletedAt,
        parentPostId: threadPostReply.parentPostId,
        rootPostId: threadPostReply.rootPostId,
      }
    )
      .from(threadPostReply)
      .where(eq(threadPostReply.conversationId, conversationId!));

    selectResult = legacyRows.map((row) => ({
      ...row,
      contentJson: '{}',
    }));
  }

  if (!selectResult) {
    return {
      success: false,
      message: `threadPostReply NOT FOUND for conversationId ${conversationId}`,
    }
  }
  else {
    const postRepliesReturn:getConvoPostRepliesReturn = {
      success: true,
      postReplies: selectResult.map(row => ({
        id: row.id,
        conversationId: row.conversationId,
        authorMemberId: row.authorMemberId,
        type: row.type,
        content: row.content,
        contentJson: row.contentJson,
        seqNo: row.seqNo,
        createdAt: row.createdAt!,
        softDeletedAt: row.softDeletedAt!,
        parentPostId: row.parentPostId!,
        rootPostId: row.rootPostId!,
      }))
    };
    return postRepliesReturn;
  }
}

/*------------------ getConvoRecipientState ------------------ */
export async function getConvoRecipientState(conversationId:number, recipientMemberId:number)
  :(Promise<getConvoRecipientStateReturn>) {

  const selectResult = await db
    .select(
    {
      id: threadRecipientState.id,
      conversationId: threadRecipientState.conversationId,
      recipientMemberId: threadRecipientState.recipientMemberId,
      deliveryType: threadRecipientState.deliveryType,
      readAt: threadRecipientState.readAt,
      answeredAt: threadRecipientState.answeredAt,
      archivedAt: threadRecipientState.archivedAt,
      archiveBatchId: threadRecipientState.archiveBatchId,
      archiveObjectKey: threadRecipientState.archiveObjectKey,
    }
  )
    .from(threadRecipientState) 
      .where(and(
        eq(threadRecipientState.conversationId, conversationId!), 
        eq(threadRecipientState.recipientMemberId, recipientMemberId!)
      ));

  if (!selectResult) {
    return {
      success: false,
      message: `threadRecipientState NOT FOUND for conversationId ${conversationId}`,
    }
  }
  else {
    const recipientStateReturn:getConvoRecipientStateReturn = {
      success: true,
      recipientStates: selectResult.map(row => ({
        id: row.id,
        conversationId: row.conversationId,
        recipientMemberId: row.recipientMemberId,
        deliveryType: row.deliveryType,
        readAt: row.readAt!,
        answeredAt: row.answeredAt!,
        archivedAt: row.archivedAt!,
        archiveBatchId: row.archiveBatchId!,
        archiveObjectKey: row.archiveObjectKey!,
      }))
    };
    return recipientStateReturn;
  }
}

/*------------------ getConvoSummaries ------------------ */
// Returns one row per conversation enriched with sender name, first post body/type,
// and the requesting member's recipient state (read/archived timestamps).
export async function getConvoSummaries(familyId: number, memberId: number)
  : Promise<getConvoSummariesReturn> {

  const senderMember = db.$with('sender_member').as(
    db.select({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
    }).from(member)
  );

  const recipientMember = db.$with('recipient_member').as(
    db.select({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
    }).from(member)
  );

  const rows = await db
    .with(senderMember, recipientMember)
    .select({
      id: threadConversation.id,
      title: threadConversation.title,
      visibility: threadConversation.visibility,
      status: threadConversation.status,
      createdAt: threadConversation.createdAt,
      senderMemberId: threadConversation.senderMemberId,
      senderFirstName: senderMember.firstName,
      senderLastName: senderMember.lastName,
      recipientStateId: threadRecipientState.id,
      recipientMemberId: threadRecipientState.recipientMemberId,
      recipientFirstName: recipientMember.firstName,
      recipientLastName: recipientMember.lastName,
      deliveryType: threadRecipientState.deliveryType,
      readAt: threadRecipientState.readAt,
      archivedAt: threadRecipientState.archivedAt,
      postContent: threadPostReply.content,
      postType: threadPostReply.type,
    })
    .from(threadConversation)
    .leftJoin(senderMember, eq(senderMember.id, threadConversation.senderMemberId))
    .leftJoin(
      threadRecipientState,
      and(
        eq(threadRecipientState.conversationId, threadConversation.id),
        eq(threadRecipientState.recipientMemberId, memberId),
      )
    )
    .leftJoin(recipientMember, eq(recipientMember.id, threadRecipientState.recipientMemberId))
    .leftJoin(
      threadPostReply,
      and(
        eq(threadPostReply.conversationId, threadConversation.id),
        eq(threadPostReply.seqNo, 1),
      )
    )
    .where(and(
      eq(threadConversation.familyId, familyId),
      or(
        eq(threadConversation.senderMemberId, memberId),
        eq(threadConversation.visibility, 'public'),
        isNotNull(threadRecipientState.id),
      ),
    ))
    .orderBy(desc(threadConversation.createdAt));

  return {
    success: true,
    summaries: rows.map(row => ({
      id: row.id,
      title: row.title,
      visibility: row.visibility,
      status: row.status,
      createdAt: row.createdAt!,
      senderMemberId: row.senderMemberId,
      senderFirstName: row.senderFirstName,
      senderLastName: row.senderLastName,
      recipientStateId: row.recipientStateId,
      recipientMemberId: row.recipientMemberId,
      recipientFirstName: row.recipientFirstName,
      recipientLastName: row.recipientLastName,
      deliveryType: row.deliveryType,
      readAt: row.readAt,
      archivedAt: row.archivedAt,
      postContent: row.postContent,
      postType: row.postType,
    })),
  };
}

/*------------------ archiveAllReadConversationsForRecipient ------------------ */
export async function archiveAllReadConversationsForRecipient(memberId: number)
  : Promise<archiveAllReadThreadsReturn> {

  const rows = await db
    .update(threadRecipientState)
    .set({
      archivedAt: new Date(),
    })
    .where(and(
      eq(threadRecipientState.recipientMemberId, memberId),
      isNotNull(threadRecipientState.readAt),
      isNull(threadRecipientState.archivedAt),
    ))
    .returning({ id: threadRecipientState.id });

  return {
    success: true,
    archivedCount: rows.length,
    message: rows.length > 0
      ? `Archived ${rows.length} read thread${rows.length === 1 ? '' : 's'}.`
      : 'No read threads were available to archive.',
  };
}

/*------------------ getThreadRecipientOptions ------------------ */
export async function getThreadRecipientOptions(
  familyId: number,
  senderMemberId: number,
): Promise<getThreadRecipientOptionsReturn> {
  const rows = await db
    .select({
      memberId: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      isFounder: member.isFounder,
    })
    .from(member)
    .where(and(
      eq(member.familyId, familyId),
      eq(member.status, 'active'),
      eq(member.isGuest, false),
    ))
    .orderBy(asc(member.firstName), asc(member.lastName));

  const recipients = rows.filter((row) => row.memberId !== senderMemberId);

  return {
    success: true,
    recipients,
  };
}

/*------------------ createThreadConversationWithInitialPost ------------------ */
export async function createThreadConversationWithInitialPost(
  input: CreateThreadConversationInput,
  context: { familyId: number; senderMemberId: number; isFounder: boolean },
): Promise<createThreadConversationReturn> {
  const normalizedTitle = input.title.trim();
  const normalizedContent = input.content.trim();
  const normalizedSubject = input.subject?.trim() || null;

  if (!normalizedTitle) {
    return {
      success: false,
      message: 'Thread title is required.',
    };
  }

  if (!normalizedContent) {
    return {
      success: false,
      message: 'Thread message cannot be empty.',
    };
  }

  const [familyRecord] = await db
    .select({
      status: family.status,
    })
    .from(family)
    .where(eq(family.id, context.familyId));

  if (!familyRecord) {
    return {
      success: false,
      message: 'Family context was not found.',
    };
  }

  if (familyRecord.status === 'expired') {
    return {
      success: false,
      message: 'Your family account is expired and is currently read-only for threads.',
    };
  }

  const [senderRecord] = await db
    .select({
      firstName: member.firstName,
      lastName: member.lastName,
    })
    .from(member)
    .where(and(
      eq(member.id, context.senderMemberId),
      eq(member.familyId, context.familyId),
    ));

  if (!senderRecord) {
    return {
      success: false,
      message: 'Thread sender could not be found.',
    };
  }

  const senderFullName = `${senderRecord.firstName} ${senderRecord.lastName}`.trim();

  const dedupedRecipientIds = Array.from(new Set(
    input.recipientMemberIds.filter((recipientId) => recipientId !== context.senderMemberId),
  ));
  const isFamilyBroadcast = input.primaryCategory === 'family_broadcast';

  if (isFamilyBroadcast && !context.isFounder) {
    return {
      success: false,
      message: 'Only the family founder can send Family Broadcast threads.',
    };
  }

  let recipientIdsToInsert: number[] = [];

  if (input.visibility === 'public') {
    const audienceRows = await db
      .select({ memberId: member.id })
      .from(member)
      .where(and(
        eq(member.familyId, context.familyId),
        eq(member.status, 'active'),
        eq(member.isGuest, false),
      ));

    recipientIdsToInsert = audienceRows
      .map((row) => row.memberId)
      .filter((recipientId) => recipientId !== context.senderMemberId);
  } else {
    if (dedupedRecipientIds.length === 0) {
      return {
        success: false,
        message: 'Select at least one recipient for a private thread.',
      };
    }

    const validRecipientRows = await db
      .select({ memberId: member.id })
      .from(member)
      .where(and(
        eq(member.familyId, context.familyId),
        eq(member.status, 'active'),
        eq(member.isGuest, false),
        inArray(member.id, dedupedRecipientIds),
      ));

    recipientIdsToInsert = validRecipientRows.map((row) => row.memberId);

    if (recipientIdsToInsert.length === 0) {
      return {
        success: false,
        message: 'No valid active recipients were selected for this thread.',
      };
    }
  }

  const [conversationRow] = await db
    .insert(threadConversation)
    .values({
      title: normalizedTitle,
      subject: normalizedSubject,
      primaryCategory: input.primaryCategory ?? null,
      visibility: input.visibility,
      status: 'active',
      senderMemberId: context.senderMemberId,
      familyId: context.familyId,
      createdAt: new Date(),
    })
    .returning({
      id: threadConversation.id,
    });

  if (!conversationRow) {
    return {
      success: false,
      message: 'Unable to create thread conversation.',
    };
  }

  let postRow: { id: number } | undefined;

  try {
    [postRow] = await db
      .insert(threadPostReply)
      .values({
        conversationId: conversationRow.id,
        authorMemberId: context.senderMemberId,
        type: 'post',
        content: normalizedContent,
        contentJson: input.contentJson,
        seqNo: 1,
        createdAt: new Date(),
      })
      .returning({
        id: threadPostReply.id,
      });
  } catch (error) {
    if (!isMissingContentJsonColumnError(error)) {
      throw error;
    }

    [postRow] = await db
      .insert(threadPostReply)
      .values({
        conversationId: conversationRow.id,
        authorMemberId: context.senderMemberId,
        type: 'post',
        content: normalizedContent,
        seqNo: 1,
        createdAt: new Date(),
      })
      .returning({
        id: threadPostReply.id,
      });
  }

  if (!postRow) {
    return {
      success: false,
      message: 'Thread was created but initial message could not be saved.',
    };
  }

  if (recipientIdsToInsert.length > 0) {
    await db.insert(threadRecipientState).values(
      recipientIdsToInsert.map((recipientId) => ({
        conversationId: conversationRow.id,
        recipientMemberId: recipientId,
        deliveryType: 'threads',
        createdAt: new Date(),
      })),
    );
  }

  const attachmentRows = (input.attachments ?? [])
    .filter((attachment) => attachment.s3ObjectKey.trim().length > 0)
    .map((attachment) => ({
      postId: postRow.id,
      attachmentType: attachment.attachmentType || 'image',
      s3ObjectKey: attachment.s3ObjectKey,
      displayUrl: attachment.displayUrl ?? null,
      fileName: attachment.fileName ?? null,
      fileSizeBytes: attachment.fileSizeBytes ?? null,
      mimeType: attachment.mimeType ?? null,
      createdAt: new Date(),
    }));

  if (attachmentRows.length > 0) {
    await db.insert(threadPostAttachment).values(attachmentRows);
  }

  await createFamilyActivityRecord({
    actionType: FAMILY_ACTIVITY_ACTION_TYPES.THREAD_CREATED,
    featureName: 'Family Threads',
    postName: senderFullName,
    familyId: context.familyId,
    memberId: context.senderMemberId,
  });

  return {
    success: true,
    conversationId: conversationRow.id,
    message: 'Thread sent successfully.',
  };
}

/*------------------ getUnreadThreadCountForRecipient ------------------ */
export async function getUnreadThreadCountForRecipient(memberId: number): Promise<number> {
  const [row] = await db
    .select({ unreadCount: count() })
    .from(threadRecipientState)
    .where(and(
      eq(threadRecipientState.recipientMemberId, memberId),
      isNull(threadRecipientState.readAt),
      isNull(threadRecipientState.archivedAt),
    ));

  return Number(row?.unreadCount ?? 0);
}

/*------------------ getThreadConversationDetail ------------------ */
export async function getThreadConversationDetail(
  conversationId: number,
  familyId: number,
  memberId: number,
): Promise<getThreadConversationDetailReturn> {
  const [conversationRow] = await db
    .select({
      id: threadConversation.id,
      title: threadConversation.title,
      subject: threadConversation.subject,
      visibility: threadConversation.visibility,
      status: threadConversation.status,
      createdAt: threadConversation.createdAt,
      senderMemberId: threadConversation.senderMemberId,
      recipientStateId: threadRecipientState.id,
      readAt: threadRecipientState.readAt,
      archivedAt: threadRecipientState.archivedAt,
    })
    .from(threadConversation)
    .leftJoin(
      threadRecipientState,
      and(
        eq(threadRecipientState.conversationId, threadConversation.id),
        eq(threadRecipientState.recipientMemberId, memberId),
      ),
    )
    .where(and(
      eq(threadConversation.id, conversationId),
      eq(threadConversation.familyId, familyId),
    ));

  if (!conversationRow) {
    return {
      success: false,
      message: 'Thread conversation not found.',
    };
  }

  const canView = await canMemberAccessThreadConversation({
    senderMemberId: conversationRow.senderMemberId,
    memberId,
    visibility: conversationRow.visibility,
    recipientStateId: conversationRow.recipientStateId,
  });

  if (!canView) {
    return {
      success: false,
      message: 'You are not allowed to view this thread.',
    };
  }

  if (conversationRow.recipientStateId && !conversationRow.readAt) {
    await db
      .update(threadRecipientState)
      .set({ readAt: new Date() })
      .where(eq(threadRecipientState.id, conversationRow.recipientStateId));
  }

  let postRows: Array<{
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
  }> = [];

  try {
    postRows = await db
      .select({
        id: threadPostReply.id,
        conversationId: threadPostReply.conversationId,
        authorMemberId: threadPostReply.authorMemberId,
        authorFirstName: member.firstName,
        authorLastName: member.lastName,
        type: threadPostReply.type,
        content: threadPostReply.content,
        contentJson: threadPostReply.contentJson,
        seqNo: threadPostReply.seqNo,
        createdAt: threadPostReply.createdAt,
      })
      .from(threadPostReply)
      .leftJoin(member, eq(member.id, threadPostReply.authorMemberId))
      .where(eq(threadPostReply.conversationId, conversationId))
      .orderBy(asc(threadPostReply.seqNo), asc(threadPostReply.createdAt));
  } catch (error) {
    if (!isMissingContentJsonColumnError(error)) {
      throw error;
    }

    const legacyPostRows = await db
      .select({
        id: threadPostReply.id,
        conversationId: threadPostReply.conversationId,
        authorMemberId: threadPostReply.authorMemberId,
        authorFirstName: member.firstName,
        authorLastName: member.lastName,
        type: threadPostReply.type,
        content: threadPostReply.content,
        seqNo: threadPostReply.seqNo,
        createdAt: threadPostReply.createdAt,
      })
      .from(threadPostReply)
      .leftJoin(member, eq(member.id, threadPostReply.authorMemberId))
      .where(eq(threadPostReply.conversationId, conversationId))
      .orderBy(asc(threadPostReply.seqNo), asc(threadPostReply.createdAt));

    postRows = legacyPostRows.map((row) => ({
      ...row,
      contentJson: '{}',
    }));
  }

  const postIds = postRows.map((postRow) => postRow.id);
  const attachmentRows = postIds.length > 0
    ? await db
      .select({
        id: threadPostAttachment.id,
        postId: threadPostAttachment.postId,
        attachmentType: threadPostAttachment.attachmentType,
        s3ObjectKey: threadPostAttachment.s3ObjectKey,
        displayUrl: threadPostAttachment.displayUrl,
        fileName: threadPostAttachment.fileName,
        fileSizeBytes: threadPostAttachment.fileSizeBytes,
        mimeType: threadPostAttachment.mimeType,
        createdAt: threadPostAttachment.createdAt,
      })
      .from(threadPostAttachment)
      .where(inArray(threadPostAttachment.postId, postIds))
      .orderBy(asc(threadPostAttachment.createdAt))
    : [];

  return {
    success: true,
    conversation: {
      id: conversationRow.id,
      title: conversationRow.title,
      subject: conversationRow.subject,
      visibility: conversationRow.visibility,
      status: conversationRow.status,
      createdAt: conversationRow.createdAt,
      senderMemberId: conversationRow.senderMemberId,
      recipientStateId: conversationRow.recipientStateId,
      readAt: conversationRow.readAt,
      archivedAt: conversationRow.archivedAt,
      posts: postRows.map((postRow) => ({
        id: postRow.id,
        conversationId: postRow.conversationId,
        authorMemberId: postRow.authorMemberId,
        authorFirstName: postRow.authorFirstName,
        authorLastName: postRow.authorLastName,
        type: postRow.type,
        content: postRow.content,
        contentJson: postRow.contentJson,
        seqNo: postRow.seqNo,
        createdAt: postRow.createdAt,
        attachments: attachmentRows.filter((attachment) => attachment.postId === postRow.id),
      })),
    },
  };
}

/*------------------ addThreadReply ------------------ */
export async function addThreadReply(
  input: AddThreadReplyInput,
  context: { familyId: number; memberId: number },
): Promise<addThreadReplyReturn> {
  const normalizedContent = input.content.trim();

  if (!normalizedContent) {
    return {
      success: false,
      message: 'Reply text is required.',
    };
  }

  const [familyRecord] = await db
    .select({ status: family.status })
    .from(family)
    .where(eq(family.id, context.familyId));

  if (!familyRecord) {
    return {
      success: false,
      message: 'Family context was not found.',
    };
  }

  if (familyRecord.status === 'expired') {
    return {
      success: false,
      message: 'Your family account is expired and is currently read-only for threads.',
    };
  }

  const [conversationRow] = await db
    .select({
      id: threadConversation.id,
      senderMemberId: threadConversation.senderMemberId,
      visibility: threadConversation.visibility,
      status: threadConversation.status,
      recipientStateId: threadRecipientState.id,
    })
    .from(threadConversation)
    .leftJoin(
      threadRecipientState,
      and(
        eq(threadRecipientState.conversationId, threadConversation.id),
        eq(threadRecipientState.recipientMemberId, context.memberId),
      ),
    )
    .where(and(
      eq(threadConversation.id, input.conversationId),
      eq(threadConversation.familyId, context.familyId),
    ));

  if (!conversationRow) {
    return {
      success: false,
      message: 'Thread conversation was not found.',
    };
  }

  if (conversationRow.status !== 'active') {
    return {
      success: false,
      message: 'Replies can only be added to active threads.',
    };
  }

  const canReply = await canMemberAccessThreadConversation({
    senderMemberId: conversationRow.senderMemberId,
    memberId: context.memberId,
    visibility: conversationRow.visibility,
    recipientStateId: conversationRow.recipientStateId,
  });

  if (!canReply) {
    return {
      success: false,
      message: 'You are not allowed to reply to this thread.',
    };
  }

  const [sequenceRow] = await db
    .select({
      nextSeqNo: sql<number>`coalesce(max(${threadPostReply.seqNo}), 0) + 1`,
    })
    .from(threadPostReply)
    .where(eq(threadPostReply.conversationId, input.conversationId));

  const nextSeqNo = Number(sequenceRow?.nextSeqNo ?? 1);

  let insertedPost: { id: number } | undefined;

  try {
    [insertedPost] = await db
      .insert(threadPostReply)
      .values({
        conversationId: input.conversationId,
        authorMemberId: context.memberId,
        type: 'reply',
        content: normalizedContent,
        contentJson: input.contentJson,
        seqNo: nextSeqNo,
        createdAt: new Date(),
      })
      .returning({
        id: threadPostReply.id,
      });
  } catch (error) {
    if (!isMissingContentJsonColumnError(error)) {
      throw error;
    }

    [insertedPost] = await db
      .insert(threadPostReply)
      .values({
        conversationId: input.conversationId,
        authorMemberId: context.memberId,
        type: 'reply',
        content: normalizedContent,
        seqNo: nextSeqNo,
        createdAt: new Date(),
      })
      .returning({
        id: threadPostReply.id,
      });
  }

  if (!insertedPost) {
    return {
      success: false,
      message: 'Unable to save your reply.',
    };
  }

  if (conversationRow.recipientStateId) {
    await db
      .update(threadRecipientState)
      .set({
        readAt: new Date(),
        answeredAt: new Date(),
      })
      .where(eq(threadRecipientState.id, conversationRow.recipientStateId));
  }

  return {
    success: true,
    postId: insertedPost.id,
    message: 'Reply posted.',
  };
}

/*------------------ updateRecipientThreadArchiveState ------------------ */
export async function updateRecipientThreadArchiveState(
  conversationId: number,
  memberId: number,
  shouldArchive: boolean,
): Promise<updateThreadRecipientStateReturn> {
  const [recipientRow] = await db
    .select({ id: threadRecipientState.id })
    .from(threadRecipientState)
    .where(and(
      eq(threadRecipientState.conversationId, conversationId),
      eq(threadRecipientState.recipientMemberId, memberId),
    ));

  if (!recipientRow) {
    return {
      success: false,
      message: 'Only recipients can archive or unarchive this thread.',
    };
  }

  await db
    .update(threadRecipientState)
    .set({
      archivedAt: shouldArchive ? new Date() : null,
    })
    .where(eq(threadRecipientState.id, recipientRow.id));

  return {
    success: true,
    message: shouldArchive ? 'Thread archived.' : 'Thread restored to inbox.',
  };
}

/*------------------ updateRecipientThreadReadState ------------------ */
export async function updateRecipientThreadReadState(
  conversationId: number,
  memberId: number,
  shouldMarkUnread: boolean,
): Promise<updateThreadRecipientStateReturn> {
  const [recipientRow] = await db
    .select({ id: threadRecipientState.id })
    .from(threadRecipientState)
    .where(and(
      eq(threadRecipientState.conversationId, conversationId),
      eq(threadRecipientState.recipientMemberId, memberId),
    ));

  if (!recipientRow) {
    return {
      success: false,
      message: 'Only recipients can change read status on this thread.',
    };
  }

  await db
    .update(threadRecipientState)
    .set({
      readAt: shouldMarkUnread ? null : new Date(),
    })
    .where(eq(threadRecipientState.id, recipientRow.id));

  return {
    success: true,
    message: shouldMarkUnread ? 'Marked as unread.' : 'Marked as read.',
  };
}
