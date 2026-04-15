import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getPoemTerms } from "@/components/db/sql/queries-poetry-cafe";
import { PoemTermsHomePage } from "@/features/poetry/components/poem-terms-home-page";

export default async function PoemTermsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const poemTermsResult = await getPoemTerms();

  const poemTerms = poemTermsResult.success ? poemTermsResult.poemTerms : [];

  return (
    <PoemTermsHomePage
      poemTerms={ poemTerms }
      isAdmin={ memberKeyDetails.isAdmin ?? false }
    />
  );
}