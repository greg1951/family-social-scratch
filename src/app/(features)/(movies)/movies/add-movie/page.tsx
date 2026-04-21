import { redirect } from "next/navigation";

import { getMovieById, getMoviesHomePageData } from "@/components/db/sql/queries-movies";
import { MovieAddPage } from "@/features/movies/components/movie-add-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function AddMoviePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { id } = await searchParams;
  const movieId = id ? parseInt(id, 10) : null;

  const [movieData, editMovieResult] = await Promise.all([
    getMoviesHomePageData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
      memberKeyDetails.isAdmin ?? false
    ),
    movieId && !isNaN(movieId)
      ? getMovieById(memberKeyDetails.familyId, movieId, memberKeyDetails.memberId)
      : Promise.resolve(null),
  ]);

  const movieTags = movieData.success ? movieData.movieTags : [];
  const movieTemplates = movieData.success ? movieData.movieTemplates : [];

  // Only allow editing if the logged-in member is the submitter
  const initialMovie =
    editMovieResult?.success && editMovieResult.movie.memberId === memberKeyDetails.memberId
      ? editMovieResult.movie
      : null;

  const mode = initialMovie ? "edit" : "add";

  return (
    <MovieAddPage
      movieTags={ movieTags }
      movieTemplates={ movieTemplates }
      member={ memberKeyDetails }
      initialMovie={ initialMovie }
      mode={ mode }
    />
  );
}