import MemberGalleryHomePage from "@/features/galleries/components/member-gallery-home-page";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getMemberGalleryData } from "@/components/db/sql/queries-gallery";


export default async function MemberGalleryPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const galleryData = await getMemberGalleryData(memberKeyDetails.memberId);
  const albums = galleryData.success ? galleryData.albums : [];
  const unallocatedPhotos = galleryData.success ? galleryData.unallocatedPhotos : [];

  return (
    <MemberGalleryHomePage
      albums={ albums }
      unallocatedPhotos={ unallocatedPhotos }
      member={ memberKeyDetails }
    />
  );
}