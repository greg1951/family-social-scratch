'use server';

import db from '@/components/db/drizzle';
import { count, eq, and, asc } from 'drizzle-orm';
import { family, member, threadConversation, threadConversationTag, threadPostReply, threadRecipientState, threadTagReference } from '../schema/family-social-schema-tables';
import { getConvoPostRepliesReturn, getConvoRecipientStateReturn, getConvosReturn, getConvoSummariesReturn } from '../types/thread-convos';

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

  const selectResult = await db.select(
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
    .where(eq(threadConversation.familyId, familyId))
    .orderBy(asc(threadConversation.createdAt));

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
