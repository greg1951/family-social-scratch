import { redirect } from 'next/navigation';

import ClubsHomePage from '@/components/features/clubs/clubs-home-page';
import { getFamilyClubs } from '@/components/db/sql/queries-clubs';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export default async function AddClubPage({
  searchParams,
}: {
  searchParams?: Promise<{ from?: string }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();
  const resolvedSearchParams = await searchParams;

  if (!memberKeyDetails.isLoggedIn) {
    redirect('/');
  }

  const clubs = await getFamilyClubs(memberKeyDetails.familyId);
  const initialReturnTo = resolvedSearchParams?.from === 'poetry'
    ? 'poetry'
    : resolvedSearchParams?.from === 'books'
      ? 'books'
      : null;

  return (
    <ClubsHomePage
      clubs={ clubs }
      member={ memberKeyDetails }
      initialReturnTo={ initialReturnTo }
    />
  );
}