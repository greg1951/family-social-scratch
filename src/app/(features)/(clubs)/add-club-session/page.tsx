import { redirect } from 'next/navigation';

import AddClubSessionPage from '@/components/features/clubs/add-club-session-page';
import { getActiveClubSessionForTarget, getClubSessionById, getClubTargetTitle, getFamilyClubs } from '@/components/db/sql/queries-clubs';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export default async function AddClubSessionRoute({
  searchParams,
}: {
  searchParams?: Promise<{
    sessionId?: string;
    targetType?: string;
    targetId?: string;
  }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();
  const resolvedSearchParams = await searchParams;

  if (!memberKeyDetails.isLoggedIn) {
    redirect('/');
  }

  const sessionId = Number(resolvedSearchParams?.sessionId);
  const hasSessionId = Number.isInteger(sessionId) && sessionId > 0;

  if (hasSessionId) {
    const existingSession = await getClubSessionById(memberKeyDetails.familyId, sessionId);

    if (!existingSession) {
      redirect('/add-club');
    }

    const [clubs, targetTitle] = await Promise.all([
      getFamilyClubs(memberKeyDetails.familyId),
      existingSession.targetTitle
        ? Promise.resolve(existingSession.targetTitle)
        : getClubTargetTitle(memberKeyDetails.familyId, existingSession.targetType as 'book' | 'poem', existingSession.targetId),
    ]);

    if (!targetTitle) {
      redirect(existingSession.targetType === 'book' ? '/books' : '/poetry');
    }

    return (
      <AddClubSessionPage
        mode="edit"
        sessionId={ sessionId }
        targetType={ existingSession.targetType as 'book' | 'poem' }
        targetId={ existingSession.targetId }
        targetTitle={ targetTitle }
        clubs={ clubs }
        existingSession={ existingSession }
        member={ memberKeyDetails }
      />
    );
  }

  const targetType = resolvedSearchParams?.targetType === 'poem' ? 'poem' : resolvedSearchParams?.targetType === 'book' ? 'book' : null;
  const targetId = Number(resolvedSearchParams?.targetId);

  if (!targetType || !Number.isInteger(targetId) || targetId <= 0) {
    redirect('/add-club');
  }

  const [clubs, targetTitle, existingSession] = await Promise.all([
    getFamilyClubs(memberKeyDetails.familyId),
    getClubTargetTitle(memberKeyDetails.familyId, targetType, targetId),
    getActiveClubSessionForTarget(memberKeyDetails.familyId, targetType, targetId),
  ]);

  if (!targetTitle) {
    redirect(targetType === 'book' ? '/books' : '/poetry');
  }

  return (
    <AddClubSessionPage
      mode="create"
      targetType={ targetType }
      targetId={ targetId }
      targetTitle={ targetTitle }
      clubs={ clubs }
      existingSession={ existingSession }
      member={ memberKeyDetails }
    />
  );
}