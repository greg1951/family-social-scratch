import { redirect } from 'next/navigation';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import { getFoodiesHomePageData } from '@/components/db/sql/queries-foodies';
import { FoodiesAddRecipePage } from '@/features/foodies/components/foodies-add-recipe-page';

export default async function AddRecipePage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect('/');
  }

  const foodiesData = await getFoodiesHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const recipeTags = foodiesData.success ? foodiesData.recipeTags : [];
  const recipeTemplates = foodiesData.success ? foodiesData.recipeTemplates : [];

  return (
    <FoodiesAddRecipePage
      recipeTags={ recipeTags }
      recipeTemplates={ recipeTemplates }
      member={ memberKeyDetails }
    />
  );
}
