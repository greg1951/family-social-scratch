import db from '@/components/db/drizzle';
import { and, asc, eq } from 'drizzle-orm';

import {
  book,
  club,
  club_session,
  discussPostReply,
  discussThread,
  member,
  poem,
} from '@/components/db/schema/family-social-schema-tables';
import type {
  Club,
  ClubSession,
  CreateClubSessionInput,
  CreateClubSessionReturn,
  DeleteClubInput,
  DeleteClubReturn,
  DeleteClubSessionInput,
  DeleteClubSessionReturn,
  SaveClubInput,
  SaveClubReturn,
  UpdateClubSessionInput,
  UpdateClubSessionReturn,
} from '@/components/db/types/clubs';
import { isSerializedTipTapDocumentEmpty, parseSerializedTipTapDocument, serializeTipTapDocument } from '@/components/db/types/poem-term-validation';

function createMemberName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(' ');
  }

  return 'Unknown Member';
}

function parseDateInput(dateValue?: string): Date | null {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(`${ dateValue }T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

async function resolveTargetTitle(familyId: number, targetType: 'book' | 'poem', targetId: number): Promise<string | null> {
  if (targetType === 'book') {
    const rows = await db
      .select({ bookTitle: book.bookTitle })
      .from(book)
      .where(and(eq(book.id, targetId), eq(book.familyId, familyId)))
      .limit(1);

    return rows[0]?.bookTitle ?? null;
  }

  const rows = await db
    .select({ poemTitle: poem.poemTitle })
    .from(poem)
    .where(and(eq(poem.id, targetId), eq(poem.familyId, familyId)))
    .limit(1);

  return rows[0]?.poemTitle ?? null;
}

async function resolveClubSessionRows(
  familyId: number,
  sessionRows: Array<{
    id: number;
    status: string;
    startedAt: Date | null;
    finishesAt: Date | null;
    targetType: string;
    targetId: number;
    clubId: number;
    moderatorId: number | null;
    clubName: string;
    moderatorFirstName: string | null;
    moderatorLastName: string | null;
    discussThreadId: number | null;
    discussTopic: string | null;
    topicJson: string | null;
    contentJson: string | null;
  }>,
): Promise<ClubSession[]> {
  const resolvedSessions = await Promise.all(sessionRows.map(async (row) => ({
    id: row.id,
    status: row.status,
    startedAt: row.startedAt as Date,
    finishesAt: row.finishesAt as Date | null,
    targetType: row.targetType,
    targetId: row.targetId,
    clubId: row.clubId,
    moderatorId: row.moderatorId,
    discussThreadId: row.discussThreadId ?? undefined,
    clubName: row.clubName,
    targetTitle: await resolveTargetTitle(familyId, row.targetType as 'book' | 'poem', row.targetId) ?? undefined,
    moderatorName: createMemberName(row.moderatorFirstName, row.moderatorLastName),
    discussTopic: row.discussTopic ?? undefined,
    topicJson: row.topicJson ?? undefined,
    contentJson: row.contentJson ?? undefined,
  })));

  return resolvedSessions;
}

export async function getClubTargetTitle(
  familyId: number,
  targetType: 'book' | 'poem',
  targetId: number,
): Promise<string | null> {
  return resolveTargetTitle(familyId, targetType, targetId);
}

export async function getFamilyClubs(familyId: number): Promise<Club[]> {
  const clubRows = await db
    .select({
      id: club.id,
      status: club.status,
      clubName: club.clubName,
      createdAt: club.createdAt,
      clubFounderId: club.clubFounderId,
      familyId: club.familyId,
      founderFirstName: member.firstName,
      founderLastName: member.lastName,
    })
    .from(club)
    .leftJoin(member, eq(club.clubFounderId, member.id))
    .where(eq(club.familyId, familyId))
    .orderBy(asc(club.clubName), asc(club.createdAt));

  if (clubRows.length === 0) {
    return [];
  }

  const sessionRows = await db
    .select({
      id: club_session.id,
      status: club_session.status,
      startedAt: club_session.startedAt,
      finishesAt: club_session.finishesAt,
      targetType: club_session.targetType,
      targetId: club_session.targetId,
      clubId: club_session.clubId,
      moderatorId: club_session.moderatorId,
      clubName: club.clubName,
      moderatorFirstName: member.firstName,
      moderatorLastName: member.lastName,
      discussThreadId: discussThread.id,
      discussTopic: discussThread.discussTopic,
      topicJson: discussThread.topicJson,
      contentJson: discussPostReply.contentJson,
    })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .leftJoin(member, eq(club_session.moderatorId, member.id))
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, familyId),
        eq(discussThread.targetType, club_session.targetType),
        eq(discussThread.targetId, club_session.targetId),
      ),
    )
    .leftJoin(
      discussPostReply,
      and(
        eq(discussPostReply.discussThreadId, discussThread.id),
        eq(discussPostReply.postReplyType, 'post'),
        eq(discussPostReply.seqNo, 1),
      ),
    )
    .where(eq(club.familyId, familyId))
    .orderBy(asc(club.clubName), asc(club_session.startedAt), asc(club_session.id));

  const sessionByClubId = new Map<number, ClubSession[]>();
  for (const resolvedSession of await resolveClubSessionRows(familyId, sessionRows)) {
    const existingSessions = sessionByClubId.get(resolvedSession.clubId) ?? [];
    existingSessions.push(resolvedSession);
    sessionByClubId.set(resolvedSession.clubId, existingSessions);
  }

  return clubRows.map((row) => ({
    id: row.id,
    status: row.status,
    clubName: row.clubName,
    createdAt: row.createdAt as Date,
    clubFounderId: row.clubFounderId,
    familyId: row.familyId,
    founderName: createMemberName(row.founderFirstName, row.founderLastName),
    sessionCount: sessionByClubId.get(row.id)?.length ?? 0,
    sessions: sessionByClubId.get(row.id) ?? [],
  }));
}

export async function getClubSessionById(
  familyId: number,
  clubSessionId: number,
): Promise<ClubSession | null> {
  const rows = await db
    .select({
      id: club_session.id,
      status: club_session.status,
      startedAt: club_session.startedAt,
      finishesAt: club_session.finishesAt,
      targetType: club_session.targetType,
      targetId: club_session.targetId,
      clubId: club_session.clubId,
      moderatorId: club_session.moderatorId,
      clubName: club.clubName,
      moderatorFirstName: member.firstName,
      moderatorLastName: member.lastName,
      discussThreadId: discussThread.id,
      discussTopic: discussThread.discussTopic,
      topicJson: discussThread.topicJson,
      contentJson: discussPostReply.contentJson,
    })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .leftJoin(member, eq(club_session.moderatorId, member.id))
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, familyId),
        eq(discussThread.targetType, club_session.targetType),
        eq(discussThread.targetId, club_session.targetId),
      ),
    )
    .leftJoin(
      discussPostReply,
      and(
        eq(discussPostReply.discussThreadId, discussThread.id),
        eq(discussPostReply.postReplyType, 'post'),
        eq(discussPostReply.seqNo, 1),
      ),
    )
    .where(and(eq(club_session.id, clubSessionId), eq(club.familyId, familyId)))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    startedAt: row.startedAt as Date,
    finishesAt: row.finishesAt as Date | null,
    targetType: row.targetType,
    targetId: row.targetId,
    clubId: row.clubId,
    moderatorId: row.moderatorId,
    discussThreadId: row.discussThreadId ?? undefined,
    clubName: row.clubName,
    targetTitle: await resolveTargetTitle(familyId, row.targetType as 'book' | 'poem', row.targetId) ?? undefined,
    moderatorName: createMemberName(row.moderatorFirstName, row.moderatorLastName),
    discussTopic: row.discussTopic ?? undefined,
    topicJson: row.topicJson ?? undefined,
    contentJson: row.contentJson ?? undefined,
  };
}

export async function getActiveClubSessionTargetIds(
  familyId: number,
  targetType: 'book' | 'poem',
): Promise<number[]> {
  const rows = await db
    .select({ targetId: club_session.targetId })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .where(
      and(
        eq(club.familyId, familyId),
        eq(club_session.targetType, targetType),
        eq(club_session.status, 'active'),
      ),
    );

  return rows.map((row) => row.targetId);
}

export async function getActiveClubSessionForTarget(
  familyId: number,
  targetType: 'book' | 'poem',
  targetId: number,
): Promise<ClubSession | null> {
  const rows = await db
    .select({
      id: club_session.id,
      status: club_session.status,
      startedAt: club_session.startedAt,
      finishesAt: club_session.finishesAt,
      targetType: club_session.targetType,
      targetId: club_session.targetId,
      clubId: club_session.clubId,
      moderatorId: club_session.moderatorId,
      clubName: club.clubName,
      moderatorFirstName: member.firstName,
      moderatorLastName: member.lastName,
      discussThreadId: discussThread.id,
      discussTopic: discussThread.discussTopic,
      topicJson: discussThread.topicJson,
    })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .leftJoin(member, eq(club_session.moderatorId, member.id))
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, familyId),
        eq(discussThread.targetType, targetType),
        eq(discussThread.targetId, targetId),
      ),
    )
    .where(
      and(
        eq(club.familyId, familyId),
        eq(club_session.targetType, targetType),
        eq(club_session.targetId, targetId),
        eq(club_session.status, 'active'),
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    status: row.status,
    startedAt: row.startedAt as Date,
    finishesAt: row.finishesAt as Date | null,
    targetType: row.targetType,
    targetId: row.targetId,
    clubId: row.clubId,
    moderatorId: row.moderatorId,
    discussThreadId: row.discussThreadId ?? undefined,
    clubName: row.clubName,
    moderatorName: createMemberName(row.moderatorFirstName, row.moderatorLastName),
    discussTopic: row.discussTopic ?? undefined,
    topicJson: row.topicJson ?? undefined,
  };
}

export async function saveClub(
  input: SaveClubInput,
  actor: { familyId: number; memberId: number; firstName?: string | null; lastName?: string | null },
): Promise<SaveClubReturn> {
  const clubName = input.clubName.trim();

  if (!clubName) {
    return { success: false, message: 'Club name is required.' };
  }

  if (input.id) {
    const existingRows = await db
      .select({ id: club.id })
      .from(club)
      .where(and(eq(club.id, input.id), eq(club.familyId, actor.familyId)))
      .limit(1);

    const existingClub = existingRows[0];

    if (!existingClub) {
      return { success: false, message: 'Club not found.' };
    }

    await db
      .update(club)
      .set({ clubName })
      .where(eq(club.id, existingClub.id));

    const updatedRows = await db
      .select({
        id: club.id,
        status: club.status,
        clubName: club.clubName,
        createdAt: club.createdAt,
        clubFounderId: club.clubFounderId,
        familyId: club.familyId,
      })
      .from(club)
      .where(eq(club.id, existingClub.id))
      .limit(1);

    const updatedClub = updatedRows[0];

    if (!updatedClub) {
      return { success: false, message: 'Club was updated but could not be reloaded.' };
    }

    return {
      success: true,
      message: 'Club updated.',
      club: {
        ...updatedClub,
        createdAt: updatedClub.createdAt as Date,
        founderName: createMemberName(actor.firstName, actor.lastName),
        sessionCount: 0,
      },
    };
  }

  const insertedRows = await db
    .insert(club)
    .values({
      status: 'active',
      clubName,
      clubFounderId: actor.memberId,
      familyId: actor.familyId,
    })
    .returning({ id: club.id });

  const insertedClubId = insertedRows[0]?.id;

  if (!insertedClubId) {
    return { success: false, message: 'Unable to create club.' };
  }

  const createdRows = await db
    .select({
      id: club.id,
      status: club.status,
      clubName: club.clubName,
      createdAt: club.createdAt,
      clubFounderId: club.clubFounderId,
      familyId: club.familyId,
    })
    .from(club)
    .where(eq(club.id, insertedClubId))
    .limit(1);

  const createdClub = createdRows[0];

  if (!createdClub) {
    return { success: false, message: 'Club was created but could not be reloaded.' };
  }

  return {
    success: true,
    message: 'Club created.',
    club: {
      ...createdClub,
      createdAt: createdClub.createdAt as Date,
      founderName: createMemberName(actor.firstName, actor.lastName),
      sessionCount: 0,
    },
  };
}

export async function deleteClub(
  input: DeleteClubInput,
  actor: { familyId: number; memberId: number },
): Promise<DeleteClubReturn> {
  if (!Number.isInteger(input.clubId) || input.clubId <= 0) {
    return { success: false, message: 'A valid club is required.' };
  }

  const clubRows = await db
    .select({ id: club.id })
    .from(club)
    .where(and(eq(club.id, input.clubId), eq(club.familyId, actor.familyId)))
    .limit(1);

  const selectedClub = clubRows[0];

  if (!selectedClub) {
    return { success: false, message: 'Club not found.' };
  }

  const sessionRows = await db
    .select({
      discussThreadId: discussThread.id,
    })
    .from(club_session)
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, actor.familyId),
        eq(discussThread.targetType, club_session.targetType),
        eq(discussThread.targetId, club_session.targetId),
      ),
    )
    .where(eq(club_session.clubId, selectedClub.id));

  for (const sessionRow of sessionRows) {
    if (sessionRow.discussThreadId) {
      await db.delete(discussThread).where(eq(discussThread.id, sessionRow.discussThreadId));
    }
  }

  await db.delete(club).where(eq(club.id, selectedClub.id));

  return {
    success: true,
    message: 'Club deleted.',
  };
}

export async function createClubSession(
  input: CreateClubSessionInput,
  actor: { familyId: number; memberId: number },
): Promise<CreateClubSessionReturn> {
  if (!['book', 'poem'].includes(input.targetType)) {
    return { success: false, message: 'Target type must be book or poem.' };
  }

  if (!Number.isInteger(input.clubId) || input.clubId <= 0) {
    return { success: false, message: 'Select a club before creating the session.' };
  }

  if (!Number.isInteger(input.targetId) || input.targetId <= 0) {
    return { success: false, message: 'A valid target is required.' };
  }

  const clubRows = await db
    .select({ id: club.id, clubName: club.clubName })
    .from(club)
    .where(and(eq(club.id, input.clubId), eq(club.familyId, actor.familyId)))
    .limit(1);

  const selectedClub = clubRows[0];

  if (!selectedClub) {
    return { success: false, message: 'Selected club was not found.' };
  }

  const existingSessionRows = await db
    .select({ id: club_session.id })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .where(
      and(
        eq(club.familyId, actor.familyId),
        eq(club_session.targetType, input.targetType),
        eq(club_session.targetId, input.targetId),
        eq(club_session.status, 'active'),
      ),
    )
    .limit(1);

  if (existingSessionRows.length > 0) {
    return { success: false, message: 'This book or poem already has an active club session.' };
  }

  const targetTitle = await resolveTargetTitle(actor.familyId, input.targetType, input.targetId);

  if (!targetTitle) {
    return { success: false, message: 'The selected book or poem was not found.' };
  }

  const parsedTopic = parseSerializedTipTapDocument(input.topicJson);

  if (!parsedTopic.success) {
    return { success: false, message: 'Club session topic must be valid TipTap JSON.' };
  }

  const normalizedTopicJson = serializeTipTapDocument(parsedTopic.content);

  if (isSerializedTipTapDocumentEmpty(normalizedTopicJson)) {
    return { success: false, message: 'Enter a club session topic before saving.' };
  }

  const startedAt = parseDateInput(input.startedAt) ?? new Date();
  const finishesAt = parseDateInput(input.finishesAt);

  const [insertedClubSession] = await db
    .insert(club_session)
    .values({
      status: 'active',
      startedAt,
      finishesAt,
      targetType: input.targetType,
      targetId: input.targetId,
      clubId: selectedClub.id,
      moderatorId: actor.memberId,
    })
    .returning({ id: club_session.id });

  if (!insertedClubSession) {
    return { success: false, message: 'Unable to create the club session.' };
  }

  try {
    const [insertedThread] = await db
      .insert(discussThread)
      .values({
        discussTopic: targetTitle,
        status: 'active',
        topicJson: normalizedTopicJson,
        targetType: input.targetType,
        targetId: input.targetId,
        postMemberId: actor.memberId,
        familyId: actor.familyId,
      })
      .returning({ id: discussThread.id });

    if (!insertedThread) {
      await db.delete(club_session).where(eq(club_session.id, insertedClubSession.id));
      return { success: false, message: 'Unable to create the club discussion thread.' };
    }

    const [insertedPost] = await db
      .insert(discussPostReply)
      .values({
        postReplyType: 'post',
        summary: targetTitle,
        contentJson: normalizedTopicJson,
        seqNo: 1,
        parentPostId: null,
        rootPostId: null,
        discussThreadId: insertedThread.id,
        authorMemberId: actor.memberId,
      })
      .returning({ id: discussPostReply.id });

    if (!insertedPost) {
      await db.delete(discussThread).where(eq(discussThread.id, insertedThread.id));
      await db.delete(club_session).where(eq(club_session.id, insertedClubSession.id));
      return { success: false, message: 'Unable to create the club discussion post.' };
    }

    return {
      success: true,
      clubSessionId: insertedClubSession.id,
      threadId: insertedThread.id,
      message: 'Club session created.',
    };
  } catch {
    await db.delete(club_session).where(eq(club_session.id, insertedClubSession.id));
    return { success: false, message: 'Unable to create the club discussion thread.' };
  }
}

export async function updateClubSession(
  input: UpdateClubSessionInput,
  actor: { familyId: number; memberId: number },
): Promise<UpdateClubSessionReturn> {
  if (!Number.isInteger(input.clubSessionId) || input.clubSessionId <= 0) {
    return { success: false, message: 'A valid club session is required.' };
  }

  if (!Number.isInteger(input.clubId) || input.clubId <= 0) {
    return { success: false, message: 'Select a club before saving.' };
  }

  const parsedTopic = parseSerializedTipTapDocument(input.topicJson);

  if (!parsedTopic.success) {
    return { success: false, message: 'Club session topic must be valid TipTap JSON.' };
  }

  const normalizedTopicJson = serializeTipTapDocument(parsedTopic.content);

  if (isSerializedTipTapDocumentEmpty(normalizedTopicJson)) {
    return { success: false, message: 'Enter a club session topic before saving.' };
  }

  const sessionRows = await db
    .select({
      id: club_session.id,
      targetType: club_session.targetType,
      targetId: club_session.targetId,
      clubId: club_session.clubId,
      discussThreadId: discussThread.id,
    })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, actor.familyId),
        eq(discussThread.targetType, club_session.targetType),
        eq(discussThread.targetId, club_session.targetId),
      ),
    )
    .where(and(eq(club_session.id, input.clubSessionId), eq(club.familyId, actor.familyId)))
    .limit(1);

  const sessionRow = sessionRows[0];

  if (!sessionRow) {
    return { success: false, message: 'Club session not found.' };
  }

  const selectedClubRows = await db
    .select({ id: club.id })
    .from(club)
    .where(and(eq(club.id, input.clubId), eq(club.familyId, actor.familyId)))
    .limit(1);

  if (selectedClubRows.length === 0) {
    return { success: false, message: 'Selected club was not found.' };
  }

  const startedAt = parseDateInput(input.startedAt) ?? new Date();
  const finishesAt = parseDateInput(input.finishesAt);
  const targetTitle = await resolveTargetTitle(actor.familyId, sessionRow.targetType as 'book' | 'poem', sessionRow.targetId);

  if (!targetTitle) {
    return { success: false, message: 'The selected book or poem was not found.' };
  }

  await db
    .update(club_session)
    .set({
      clubId: input.clubId,
      startedAt,
      finishesAt,
    })
    .where(eq(club_session.id, input.clubSessionId));

  if (sessionRow.discussThreadId) {
    await db
      .update(discussThread)
      .set({
        discussTopic: targetTitle,
        topicJson: normalizedTopicJson,
        updatedAt: new Date(),
      })
      .where(eq(discussThread.id, sessionRow.discussThreadId));

    await db
      .update(discussPostReply)
      .set({
        summary: targetTitle,
        contentJson: normalizedTopicJson,
      })
      .where(
        and(
          eq(discussPostReply.discussThreadId, sessionRow.discussThreadId),
          eq(discussPostReply.postReplyType, 'post'),
          eq(discussPostReply.seqNo, 1),
        ),
      );
  }

  return {
    success: true,
    clubSessionId: input.clubSessionId,
    threadId: sessionRow.discussThreadId ?? 0,
    targetType: sessionRow.targetType as 'book' | 'poem',
    targetId: sessionRow.targetId,
    message: 'Club session updated.',
  };
}

export async function deleteClubSession(
  input: DeleteClubSessionInput,
  actor: { familyId: number; memberId: number },
): Promise<DeleteClubSessionReturn> {
  if (!Number.isInteger(input.clubSessionId) || input.clubSessionId <= 0) {
    return { success: false, message: 'A valid club session is required.' };
  }

  const sessionRows = await db
    .select({
      id: club_session.id,
      targetType: club_session.targetType,
      targetId: club_session.targetId,
      discussThreadId: discussThread.id,
    })
    .from(club_session)
    .innerJoin(club, eq(club_session.clubId, club.id))
    .leftJoin(
      discussThread,
      and(
        eq(discussThread.familyId, actor.familyId),
        eq(discussThread.targetType, club_session.targetType),
        eq(discussThread.targetId, club_session.targetId),
      ),
    )
    .where(and(eq(club_session.id, input.clubSessionId), eq(club.familyId, actor.familyId)))
    .limit(1);

  const sessionRow = sessionRows[0];

  if (!sessionRow) {
    return { success: false, message: 'Club session not found.' };
  }

  if (sessionRow.discussThreadId) {
    await db.delete(discussThread).where(eq(discussThread.id, sessionRow.discussThreadId));
  }

  await db.delete(club_session).where(eq(club_session.id, input.clubSessionId));

  return {
    success: true,
    targetType: sessionRow.targetType as 'book' | 'poem',
    targetId: sessionRow.targetId,
    message: 'Club session deleted.',
  };
}