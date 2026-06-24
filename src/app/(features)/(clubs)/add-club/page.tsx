import { redirect } from 'next/navigation';

import ClubsHomePage from '@/components/features/clubs/clubs-home-page';
import { getFamilyClubs } from '@/components/db/sql/queries-clubs';
import { getMemberPageDetails } from '@/features/family/services/family-services';

export default async function AddClubPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect('/');
  }

  const clubs = await getFamilyClubs(memberKeyDetails.familyId);

  return (
    <ClubsHomePage
      clubs={ clubs }
      member={ memberKeyDetails }
    />
  );
}