import { redirect } from "next/navigation";

import { getFoodiesHomePageData } from "@/components/db/sql/queries-foodies";
import { FoodiesHomePage } from "@/features/foodies/components/foodies-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function FoodiesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const foodiesData = await getFoodiesHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const recipes = foodiesData.success ? foodiesData.recipes : [];

  return <FoodiesHomePage recipes={ recipes } member={ memberKeyDetails } />;
}