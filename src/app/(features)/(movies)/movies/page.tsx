import { redirect } from "next/navigation";

import { getMoviesHomePageData } from "@/components/db/sql/queries-movies";
import { MovieHomePage } from "@/features/movies/components/movie-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MoviePage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const movieData = await getMoviesHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.isAdmin ?? false
  );

  const movies = movieData.success ? movieData.movies : [];

  return <MovieHomePage movies={ movies } member={ memberKeyDetails } />;
}