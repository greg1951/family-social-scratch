'use server';

import db from '@/components/db/drizzle';
import { count, eq, and } from 'drizzle-orm';
import { family, threadConversation, threadConversationTag, threadPostReply, threadRecipientState, threadTagReference } from '../schema/family-social-schema-tables';
import { getConvoPostRepliesReturn, getConvoRecipientStateReturn, getConvosReturn } from '../types/thread-convos';

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
