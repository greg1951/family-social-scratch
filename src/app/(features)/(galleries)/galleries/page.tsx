import GalleriesHomePage from "@/features/galleries/components/galleries-home-page";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";


export default async function FoodiesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }


  return (
    <GalleriesHomePage />
  )
}