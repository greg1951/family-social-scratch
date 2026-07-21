import { redirect } from "next/navigation";

import { resolveGuidedTourLaunch, type GuidedTourLaunchPayload } from "@/components/db/sql/queries-guided-runtime";
import { getMoviesHomePageData } from "@/components/db/sql/queries-movies";
import { MovieHomePage } from "@/features/movies/components/movie-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MoviePage() {
  const memberKeyDetails = await getMemberPageDetails();
  let initialGuidedLaunchPayload: GuidedTourLaunchPayload | null = null;

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const movieData = await getMoviesHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const movies = movieData.success ? movieData.movies : [];

  const guidedLaunchResult = await resolveGuidedTourLaunch({
    memberId: memberKeyDetails.memberId,
    familyId: memberKeyDetails.familyId,
    isFounder: memberKeyDetails.isFounder,
    audienceType: "member",
    tourKey: "movie_tour",
  });

  if (guidedLaunchResult.success && guidedLaunchResult.launch) {
    initialGuidedLaunchPayload = guidedLaunchResult.payload;
  }

  return <MovieHomePage movies={ movies } member={ memberKeyDetails } initialGuidedLaunchPayload={ initialGuidedLaunchPayload } />;
}