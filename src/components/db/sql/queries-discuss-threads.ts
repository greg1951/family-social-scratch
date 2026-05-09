'use server';

import db from '@/components/db/drizzle';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { createTextTipTapDocument, parseSerializedTipTapDocument, serializeTipTapDocument } from '../types/poem-term-validation';

import { discussPostReply, discussThread, member } from '../schema/family-social-schema-tables';
import {
	AddDiscussionReplyInput,
	AddDiscussionReplyReturn,
	CreateDiscussionThreadInput,
	CreateDiscussionThreadReturn,
	DiscussionPostReplyRecord,
	DiscussionThreadDetail,
	DiscussionThreadSummary,
} from '../types/discuss-threads';

function createDiscussionMemberFirstName(firstName?: string | null): string {
	return firstName?.trim() || 'Unknown Member';
}

function createDiscussionMemberName(firstName?: string | null, lastName?: string | null): string {
	const names = [firstName, lastName].filter(Boolean);

	if (names.length > 0) {
		return names.join(' ');
	}

	return 'Unknown Member';
}

function createDefaultThreadContent(summary: string): string {
	return serializeTipTapDocument(createTextTipTapDocument(summary));
}

async function getNextDiscussionSeqNo(threadId: number): Promise<number> {
	const rows = await db
		.select({ seqNo: discussPostReply.seqNo })
		.from(discussPostReply)
		.where(eq(discussPostReply.discussThreadId, threadId))
		.orderBy(desc(discussPostReply.seqNo))
		.limit(1);

	return (rows[0]?.seqNo ?? 0) + 1;
}

export async function loadDiscussionThreadSummariesByTargetIds(
	familyId: number,
	targetType: string,
	targetIds: number[]
): Promise<Map<number, DiscussionThreadSummary[]>> {
	if (targetIds.length === 0) {
		return new Map();
	}

	const rows = await db
		.select({
			id: discussThread.id,
			targetId: discussThread.targetId,
			discussTopic: discussThread.discussTopic,
			createdAt: discussThread.createdAt,
			memberFirstName: member.firstName,
		})
		.from(discussThread)
		.leftJoin(member, eq(member.id, discussThread.postMemberId))
		.where(
			and(
				eq(discussThread.familyId, familyId),
				eq(discussThread.targetType, targetType),
				inArray(discussThread.targetId, targetIds),
			),
		)
		.orderBy(desc(discussThread.createdAt), asc(discussThread.id));

	const summariesByTargetId = new Map<number, DiscussionThreadSummary[]>();

	for (const row of rows) {
		const summaries = summariesByTargetId.get(row.targetId) ?? [];

		summaries.push({
			id: row.id,
			discussTopic: row.discussTopic,
			createdAt: row.createdAt ?? new Date(),
			memberFirstName: createDiscussionMemberFirstName(row.memberFirstName),
		});

		summariesByTargetId.set(row.targetId, summaries);
	}

	return summariesByTargetId;
}

export async function loadDiscussionThreadSummariesForTargetId(
	familyId: number,
	targetType: string,
	targetId: number
): Promise<DiscussionThreadSummary[]> {
	const summariesByTargetId = await loadDiscussionThreadSummariesByTargetIds(familyId, targetType, [targetId]);

	return summariesByTargetId.get(targetId) ?? [];
}

export async function getDiscussionThreadDetail(
	threadId: number,
	familyId: number,
	options?: {
		targetType?: string;
	}
): Promise<{ success: true; thread: DiscussionThreadDetail } | { success: false; message: string }> {
	const rows = await db
		.select({
			id: discussThread.id,
			discussTopic: discussThread.discussTopic,
			status: discussThread.status,
			createdAt: discussThread.createdAt,
			updatedAt: discussThread.updatedAt,
			targetType: discussThread.targetType,
			targetId: discussThread.targetId,
			postMemberId: discussThread.postMemberId,
			familyId: discussThread.familyId,
			postMemberFirstName: member.firstName,
		})
		.from(discussThread)
		.leftJoin(member, eq(member.id, discussThread.postMemberId))
		.where(
			and(
				eq(discussThread.id, threadId),
				eq(discussThread.familyId, familyId),
				options?.targetType ? eq(discussThread.targetType, options.targetType) : undefined,
			),
		);

	const threadRow = rows[0];

	if (!threadRow) {
		return {
			success: false,
			message: 'Discussion thread not found.',
		};
	}

	const postReplyRows = await db
		.select({
			id: discussPostReply.id,
			postReplyType: discussPostReply.postReplyType,
			summary: discussPostReply.summary,
			contentJson: discussPostReply.contentJson,
			createdAt: discussPostReply.createdAt,
			seqNo: discussPostReply.seqNo,
			parentPostId: discussPostReply.parentPostId,
			rootPostId: discussPostReply.rootPostId,
			authorMemberId: discussPostReply.authorMemberId,
			authorFirstName: member.firstName,
			authorLastName: member.lastName,
		})
		.from(discussPostReply)
		.innerJoin(member, eq(member.id, discussPostReply.authorMemberId))
		.where(eq(discussPostReply.discussThreadId, threadId))
		.orderBy(asc(discussPostReply.seqNo), asc(discussPostReply.createdAt), asc(discussPostReply.id));

	const postsAndReplies: DiscussionPostReplyRecord[] = postReplyRows.map((row) => ({
		id: row.id,
		postReplyType: row.postReplyType,
		summary: row.summary,
		contentJson: row.contentJson,
		createdAt: row.createdAt ?? new Date(),
		seqNo: row.seqNo,
		parentPostId: row.parentPostId,
		rootPostId: row.rootPostId,
		authorMemberId: row.authorMemberId,
		authorName: createDiscussionMemberName(row.authorFirstName, row.authorLastName),
	}));

	return {
		success: true,
		thread: {
			id: threadRow.id,
			discussTopic: threadRow.discussTopic,
			status: threadRow.status,
			createdAt: threadRow.createdAt ?? new Date(),
			updatedAt: threadRow.updatedAt,
			targetType: threadRow.targetType,
			targetId: threadRow.targetId,
			postMemberId: threadRow.postMemberId,
			postMemberFirstName: createDiscussionMemberFirstName(threadRow.postMemberFirstName),
			familyId: threadRow.familyId,
			postsAndReplies,
		},
	};
}

export async function createDiscussionThreadWithInitialPost(
	input: CreateDiscussionThreadInput,
	actor: {
		familyId: number;
		memberId: number;
	}
): Promise<CreateDiscussionThreadReturn> {
	const normalizedTopic = input.discussTopic.trim();

	if (!normalizedTopic) {
		return {
			success: false,
			message: 'Discussion topic is required.',
		};
	}

	if (!Number.isInteger(input.targetId) || input.targetId <= 0) {
		return {
			success: false,
			message: 'A valid discussion target is required.',
		};
	}

	const existingThreadRows = await db
		.select({
			id: discussThread.id,
		})
		.from(discussThread)
		.where(
			and(
				eq(discussThread.familyId, actor.familyId),
				eq(discussThread.targetType, input.targetType),
				eq(discussThread.targetId, input.targetId),
				eq(discussThread.status, 'active')
			)
		)
		.orderBy(desc(discussThread.createdAt), desc(discussThread.id))
		.limit(1);

	const existingThread = existingThreadRows[0];

	if (existingThread) {
		return {
			success: true,
			threadId: existingThread.id,
			message: 'An active discussion already exists for this item.',
		};
	}

	const defaultSummary = input.initialSummary?.trim() || `Discussion started: ${normalizedTopic}`;
	const normalizedContentJson = input.initialContentJson?.trim()
		? input.initialContentJson
		: createDefaultThreadContent(defaultSummary);

	const [insertedThread] = await db
		.insert(discussThread)
		.values({
			discussTopic: normalizedTopic,
			status: 'active',
			targetType: input.targetType,
			targetId: input.targetId,
			postMemberId: actor.memberId,
			familyId: actor.familyId,
		})
		.returning({ id: discussThread.id });

	// Don't create an initial post - let the user compose it when they arrive at the thread page
	// if (input.initialSummary || input.initialContentJson) {
	//   await db.insert(discussPostReply).values({...});
	// }

	return {
		success: true,
		threadId: insertedThread.id,
		message: 'Discussion created.',
	};
}

export async function addDiscussionReply(
	input: AddDiscussionReplyInput,
	actor: {
		familyId: number;
		memberId: number;
	}
): Promise<AddDiscussionReplyReturn> {
	const normalizedSummary = input.summary.trim();

	if (!normalizedSummary) {
		return {
			success: false,
			message: 'Reply text is required.',
		};
	}

	const parsedContent = parseSerializedTipTapDocument(input.contentJson);

	if (!parsedContent.success) {
		return {
			success: false,
			message: 'Reply content must be valid TipTap JSON.',
		};
	}

	const threadRows = await db
		.select({
			id: discussThread.id,
			status: discussThread.status,
		})
		.from(discussThread)
		.where(and(eq(discussThread.id, input.threadId), eq(discussThread.familyId, actor.familyId)))
		.limit(1);

	const threadRow = threadRows[0];

	if (!threadRow) {
		return {
			success: false,
			message: 'Discussion thread not found.',
		};
	}

	if (threadRow.status !== 'active') {
		return {
			success: false,
			message: 'Replies can only be added to active discussions.',
		};
	}

	const replyTargetRows = await db
		.select({
			id: discussPostReply.id,
			postReplyType: discussPostReply.postReplyType,
			parentPostId: discussPostReply.parentPostId,
			rootPostId: discussPostReply.rootPostId,
			authorMemberId: discussPostReply.authorMemberId,
		})
		.from(discussPostReply)
		.where(and(eq(discussPostReply.id, input.replyToEntryId), eq(discussPostReply.discussThreadId, input.threadId)))
		.limit(1);

	const replyTarget = replyTargetRows[0];

	if (!replyTarget) {
		return {
			success: false,
			message: 'Reply target was not found.',
		};
	}

	if (replyTarget.authorMemberId === actor.memberId) {
		return {
			success: false,
			message: 'You cannot reply to your own post or reply.',
		};
	}

	const parentPostId = replyTarget.id;
	const rootPostId = replyTarget.postReplyType.toLowerCase() === 'post'
		? replyTarget.id
		: replyTarget.rootPostId ?? replyTarget.parentPostId ?? replyTarget.id;

	const nextSeqNo = await getNextDiscussionSeqNo(input.threadId);

	const insertedRows = await db.insert(discussPostReply).values({
		postReplyType: 'reply',
		summary: normalizedSummary,
		contentJson: input.contentJson,
		seqNo: nextSeqNo,
		parentPostId,
		rootPostId,
		discussThreadId: input.threadId,
		authorMemberId: actor.memberId,
	}).returning({ id: discussPostReply.id });

	return {
		success: true,
		replyId: insertedRows[0].id,
		message: 'Reply posted.',
	};
}

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

export async function addInitialDiscussionPost(
	input: AddInitialPostInput,
	actor: {
		familyId: number;
		memberId: number;
	}
): Promise<AddInitialPostReturn> {
	const normalizedSummary = input.summary.trim();

	if (!normalizedSummary) {
		return {
			success: false,
			message: 'Post text is required.',
		};
	}

	const parsedContent = parseSerializedTipTapDocument(input.contentJson);

	if (!parsedContent.success) {
		return {
			success: false,
			message: 'Post content must be valid TipTap JSON.',
		};
	}

	const threadRows = await db
		.select({
			id: discussThread.id,
			status: discussThread.status,
		})
		.from(discussThread)
		.where(and(eq(discussThread.id, input.threadId), eq(discussThread.familyId, actor.familyId)))
		.limit(1);

	const threadRow = threadRows[0];

	if (!threadRow) {
		return {
			success: false,
			message: 'Discussion thread not found.',
		};
	}

	if (threadRow.status !== 'active') {
		return {
			success: false,
			message: 'Posts can only be added to active discussions.',
		};
	}

	// Check if thread already has posts
	const existingPostsRows = await db
		.select({ id: discussPostReply.id })
		.from(discussPostReply)
		.where(
			and(
				eq(discussPostReply.discussThreadId, input.threadId),
				eq(discussPostReply.postReplyType, 'post')
			)
		)
		.limit(1);

	if (existingPostsRows.length > 0) {
		return {
			success: false,
			message: 'This thread already has an initial post.',
		};
	}

	const nextSeqNo = await getNextDiscussionSeqNo(input.threadId);

	const insertedRows = await db.insert(discussPostReply).values({
		postReplyType: 'post',
		summary: normalizedSummary,
		contentJson: input.contentJson,
		seqNo: nextSeqNo,
		parentPostId: null,
		rootPostId: null,
		discussThreadId: input.threadId,
		authorMemberId: actor.memberId,
	}).returning({ id: discussPostReply.id });

	return {
		success: true,
		postId: insertedRows[0].id,
		message: 'Discussion post created.',
	};
}

