'use server';

import db from '@/components/db/drizzle';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { parseSerializedTipTapDocument } from '../types/poem-term-validation';

import { discussPostReply, discussThread, discussLike, member } from '../schema/family-social-schema-tables';
import {
	AddDiscussionReplyInput,
	AddDiscussionReplyReturn,
	CreateDiscussionThreadInput,
	CreateDiscussionThreadReturn,
	DiscussionPostReplyRecord,
	DiscussionThreadDetail,
	DiscussionThreadSummary,
	PostReactionCounts,
	ToggleDiscussionReactionInput,
	ToggleDiscussionReactionReturn,
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

	// Get all thread IDs to fetch reaction counts
	const threadIds = rows.map((r) => r.id);
	const reactionCountsByThreadId = new Map<number, { likeCount: number; loveCount: number }>();

	if (threadIds.length > 0) {
		// Fetch reaction counts for all posts in these threads
		const reactionRows = await db
			.select({
				threadId: discussPostReply.discussThreadId,
				reactionType: discussLike.reactionType,
				reactionCount: count().mapWith(Number),
			})
			.from(discussPostReply)
			.innerJoin(discussLike, eq(discussLike.discussPostId, discussPostReply.id))
			.where(inArray(discussPostReply.discussThreadId, threadIds))
			.groupBy(discussPostReply.discussThreadId, discussLike.reactionType);

		// Aggregate counts by thread
		for (const reaction of reactionRows) {
			const current = reactionCountsByThreadId.get(reaction.threadId) ?? { likeCount: 0, loveCount: 0 };
			if (reaction.reactionType === 1) {
				current.likeCount += reaction.reactionCount;
			} else if (reaction.reactionType === 2) {
				current.loveCount += reaction.reactionCount;
			}
			reactionCountsByThreadId.set(reaction.threadId, current);
		}
	}

	const summariesByTargetId = new Map<number, DiscussionThreadSummary[]>();

	for (const row of rows) {
		const summaries = summariesByTargetId.get(row.targetId) ?? [];
		const counts = reactionCountsByThreadId.get(row.id) ?? { likeCount: 0, loveCount: 0 };

		summaries.push({
			id: row.id,
			discussTopic: row.discussTopic,
			createdAt: row.createdAt ?? new Date(),
			memberFirstName: createDiscussionMemberFirstName(row.memberFirstName),
			likeCount: counts.likeCount,
			loveCount: counts.loveCount,
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
		currentMemberId?: number;
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

	// Load reaction counts for all posts
	const postIds = postReplyRows.map((row) => row.id);
	const reactionCountsByPostId = new Map<number, { likeCount: number; loveCount: number; userReactionType?: number | null }>();

	if (postIds.length > 0) {
		// Get reaction counts
		const reactionRows = await db
			.select({
				postId: discussLike.discussPostId,
				reactionType: discussLike.reactionType,
				reactionCount: count().mapWith(Number),
			})
			.from(discussLike)
			.where(inArray(discussLike.discussPostId, postIds))
			.groupBy(discussLike.discussPostId, discussLike.reactionType);

		for (const reaction of reactionRows) {
			const current = reactionCountsByPostId.get(reaction.postId) ?? { likeCount: 0, loveCount: 0 };
			if (reaction.reactionType === 1) {
				current.likeCount = reaction.reactionCount;
			} else if (reaction.reactionType === 2) {
				current.loveCount = reaction.reactionCount;
			}
			reactionCountsByPostId.set(reaction.postId, current);
		}

		// Get user's reactions if currentMemberId is provided
		if (options?.currentMemberId) {
			const userReactionRows = await db
				.select({
					postId: discussLike.discussPostId,
					reactionType: discussLike.reactionType,
				})
				.from(discussLike)
				.where(
					and(
						inArray(discussLike.discussPostId, postIds),
						eq(discussLike.memberId, options.currentMemberId)
					)
				);

			for (const reaction of userReactionRows) {
				const current = reactionCountsByPostId.get(reaction.postId) ?? { likeCount: 0, loveCount: 0 };
				current.userReactionType = reaction.reactionType;
				reactionCountsByPostId.set(reaction.postId, current);
			}
		}
	}

	const postsAndReplies: DiscussionPostReplyRecord[] = postReplyRows.map((row) => {
		const reactionCounts = reactionCountsByPostId.get(row.id) ?? { likeCount: 0, loveCount: 0 };
		return {
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
			likeCount: reactionCounts.likeCount,
			loveCount: reactionCounts.loveCount,
			userReactionType: reactionCounts.userReactionType,
		};
	});

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
	const normalizedInitialSummary = input.initialSummary?.trim() ?? '';
	const hasInitialSummary = normalizedInitialSummary.length > 0;
	const hasInitialContentJson = Boolean(input.initialContentJson?.trim());

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

	if (hasInitialSummary !== hasInitialContentJson) {
		return {
			success: false,
			message: 'Both an initial caption and content are required when creating the first post.',
		};
	}

	if (hasInitialContentJson && input.initialContentJson) {
		const parsedInitialContent = parseSerializedTipTapDocument(input.initialContentJson);

		if (!parsedInitialContent.success) {
			return {
				success: false,
				message: 'Initial post content must be valid TipTap JSON.',
			};
		}
	}

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

	if (hasInitialSummary && input.initialContentJson) {
		try {
			await db.insert(discussPostReply).values({
				postReplyType: 'post',
				summary: normalizedInitialSummary,
				contentJson: input.initialContentJson,
				seqNo: 1,
				parentPostId: null,
				rootPostId: null,
				discussThreadId: insertedThread.id,
				authorMemberId: actor.memberId,
			});
		} catch {
			// Neon HTTP driver doesn't support transactions here; remove the orphaned thread on failure.
			await db.delete(discussThread).where(eq(discussThread.id, insertedThread.id));
			return {
				success: false,
				message: 'Unable to create the initial discussion post. Please try again.',
			};
		}
	}

	return {
		success: true,
		threadId: insertedThread.id,
		message: hasInitialSummary ? 'Discussion and initial post created.' : 'Discussion created.',
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

export async function getPostReactionCounts(
	postId: number,
	memberId?: number
): Promise<PostReactionCounts> {
	const reactionRows = await db
		.select({
			reactionType: discussLike.reactionType,
			reactionCount: count().mapWith(Number),
		})
		.from(discussLike)
		.where(eq(discussLike.discussPostId, postId))
		.groupBy(discussLike.reactionType);

	let likeCount = 0;
	let loveCount = 0;

	for (const row of reactionRows) {
		if (row.reactionType === 1) {
			likeCount = row.reactionCount;
		} else if (row.reactionType === 2) {
			loveCount = row.reactionCount;
		}
	}

	let userReactionType: number | null = null;

	if (memberId) {
		const userReactionRows = await db
			.select({ reactionType: discussLike.reactionType })
			.from(discussLike)
			.where(
				and(
					eq(discussLike.discussPostId, postId),
					eq(discussLike.memberId, memberId)
				)
			)
			.limit(1);

		userReactionType = userReactionRows[0]?.reactionType ?? null;
	}

	return {
		likeCount,
		loveCount,
		userReactionType,
	};
}

export async function toggleDiscussionReaction(
	input: ToggleDiscussionReactionInput,
	actor: {
		familyId: number;
		memberId: number;
	}
): Promise<ToggleDiscussionReactionReturn> {
	// Validate reaction type
	if (![1, 2].includes(input.reactionType)) {
		return {
			success: false,
			message: 'Invalid reaction type. Must be 1 (like) or 2 (love).',
		};
	}

	// Check if post exists and get its author
	const postRows = await db
		.select({
			id: discussPostReply.id,
			authorMemberId: discussPostReply.authorMemberId,
		})
		.from(discussPostReply)
		.where(eq(discussPostReply.id, input.postId))
		.limit(1);

	if (postRows.length === 0) {
		return {
			success: false,
			message: 'Post not found.',
		};
	}

	const post = postRows[0];

	// Prevent self-reactions
	if (post.authorMemberId === actor.memberId) {
		return {
			success: false,
			message: 'You cannot like or love your own post or reply.',
		};
	}

	// Check if user already has a reaction
	const existingReactionRows = await db
		.select({
			id: discussLike.id,
			reactionType: discussLike.reactionType,
		})
		.from(discussLike)
		.where(
			and(
				eq(discussLike.discussPostId, input.postId),
				eq(discussLike.memberId, actor.memberId)
			)
		)
		.limit(1);

	const existingReaction = existingReactionRows[0];

	if (existingReaction) {
		// If toggling to the same type, remove the reaction
		if (existingReaction.reactionType === input.reactionType) {
			await db
				.delete(discussLike)
				.where(eq(discussLike.id, existingReaction.id));

			return {
				success: true,
				message: `Reaction removed.`,
			};
		}

		// Otherwise, update to the new reaction type
		await db
			.update(discussLike)
			.set({ reactionType: input.reactionType })
			.where(eq(discussLike.id, existingReaction.id));

		return {
			success: true,
			message: `Reaction updated.`,
		};
	}

	// Create new reaction
	await db.insert(discussLike).values({
		discussPostId: input.postId,
		memberId: actor.memberId,
		reactionType: input.reactionType,
	});

	return {
		success: true,
		message: `Reaction added.`,
	};
}


