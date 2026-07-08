import FamilyGalleryHomePage from "@/features/galleries/components/family-gallery-home-page";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getFamilyGalleryData } from "@/components/db/sql/queries-gallery";
import FeatureProfileMenu from "@/components/common/feature-profile-menu";


export default async function FamilyGalleryPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const galleryData = await getFamilyGalleryData(memberKeyDetails.familyId);
  const sharedAlbums = galleryData.success ? galleryData.sharedAlbums : [];

  return (
    <div className="relative">
      <FeatureProfileMenu mobileVariant="feature-hero" />
      <FamilyGalleryHomePage
        sharedAlbums={ sharedAlbums }
        member={ memberKeyDetails }
      />
    </div>
  );
}