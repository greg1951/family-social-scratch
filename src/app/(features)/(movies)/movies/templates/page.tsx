import { redirect } from "next/navigation";

import { getMovieTemplateManagementData } from "@/components/db/sql/queries-movies";
import { MovieTemplatePage } from "@/features/movies/components/movie-template-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MovieTemplatesPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const templateData = await getMovieTemplateManagementData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const templates = templateData.success ? templateData.templates : [];

  return <MovieTemplatePage templates={ templates } />;
}