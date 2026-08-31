import { redirect } from 'next/navigation';

import AddClubSessionPage from '@/components/features/clubs/add-club-session-page';
import { getActiveClubSessionForTarget, getClubSessionById, getClubTargetTitle, getEligibleClubSessionTargets, getFamilyClubs } from '@/components/db/sql/queries-clubs';
import { getThreadTemplates } from '@/components/db/sql/queries-thread-templates';
import { getMemberPageDetails } from '@/features/family/services/family-services';

async function getClubSessionTemplates() {
  const templatesResult = await getThreadTemplates('thread');
  const templates = templatesResult.success ? templatesResult.templates : [];

  return {
    book: templates.find((template) => template.templateName === 'Book Club Session')?.templateJson ?? null,
    poem: templates.find((template) => template.templateName === 'Poetry Club Session')?.templateJson ?? null,
  };
}

export default async function AddClubSessionRoute({
  searchParams,
}: {
  searchParams?: Promise<{
    sessionId?: string;
    targetType?: string;
    targetId?: string;
    clubId?: string;
    from?: string;
  }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();
  const resolvedSearchParams = await searchParams;

  if (!memberKeyDetails.isLoggedIn) {
    redirect('/');
  }

  const sessionId = Number(resolvedSearchParams?.sessionId);
  const hasSessionId = Number.isInteger(sessionId) && sessionId > 0;
  const returnTo = resolvedSearchParams?.from === 'poetry'
    ? 'poetry'
    : resolvedSearchParams?.from === 'books'
      ? 'books'
      : null;
  const clubsBackHref = returnTo ? `/add-club?from=${returnTo}` : '/add-club';

  if (hasSessionId) {
    const existingSession = await getClubSessionById(memberKeyDetails.familyId, sessionId);

    if (!existingSession) {
      redirect(clubsBackHref);
    }

    if (existingSession.moderatorId !== memberKeyDetails.memberId) {
      redirect(clubsBackHref);
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
        returnTo={ returnTo }
      />
    );
  }

  const targetType = resolvedSearchParams?.targetType === 'poem' ? 'poem' : resolvedSearchParams?.targetType === 'book' ? 'book' : null;
  const targetId = Number(resolvedSearchParams?.targetId);
  const clubId = Number(resolvedSearchParams?.clubId);
  const preselectedClubId = Number.isInteger(clubId) && clubId > 0 ? clubId : undefined;
  const hasTarget = Boolean(targetType) && Number.isInteger(targetId) && targetId > 0;

  if (!hasTarget) {
    if (!preselectedClubId) {
      redirect(clubsBackHref);
    }

    const [clubs, availableTargets, sessionTemplates] = await Promise.all([
      getFamilyClubs(memberKeyDetails.familyId),
      getEligibleClubSessionTargets(memberKeyDetails.familyId),
      getClubSessionTemplates(),
    ]);

    return (
      <AddClubSessionPage
        mode="create"
        targetType={ null }
        targetId={ null }
        targetTitle={ null }
        availableTargets={ availableTargets }
        sessionTemplates={ sessionTemplates }
        clubs={ clubs }
        preselectedClubId={ preselectedClubId }
        existingSession={ null }
        member={ memberKeyDetails }
        returnTo={ returnTo }
      />
    );
  }

  const [clubs, targetTitle, existingSession, sessionTemplates] = await Promise.all([
    getFamilyClubs(memberKeyDetails.familyId),
    getClubTargetTitle(memberKeyDetails.familyId, targetType!, targetId),
    getActiveClubSessionForTarget(memberKeyDetails.familyId, targetType!, targetId),
    getClubSessionTemplates(),
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
      sessionTemplates={ sessionTemplates }
      clubs={ clubs }
      preselectedClubId={ preselectedClubId }
      existingSession={ existingSession }
      member={ memberKeyDetails }
      returnTo={ returnTo }
    />
  );
}