import { redirect } from "next/navigation";

import { getBookTerms } from "@/components/db/sql/queries-book-besties";
import { BookTermsHomePage } from "@/features/books/components/book-terms-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BookTermsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const bookTermsResult = await getBookTerms();
  const bookTerms = bookTermsResult.success ? bookTermsResult.bookTerms : [];

  return (
    <BookTermsHomePage
      bookTerms={ bookTerms }
      isAdmin={ memberKeyDetails.isAdmin ?? false }
    />
  );
}