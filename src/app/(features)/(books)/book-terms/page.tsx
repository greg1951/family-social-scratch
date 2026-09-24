import { redirect } from "next/navigation";

import { getBookCategoryWithTags } from "@/components/db/sql/queries-book-besties";
import { BookTermsHomePage } from "@/features/books/components/book-terms-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BookTermsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const bookCategoryWithTagsResult = await getBookCategoryWithTags();
  const bookCategories = bookCategoryWithTagsResult.success ? bookCategoryWithTagsResult.categories : [];
  const canManageTerms = (memberKeyDetails.isAdmin ?? false) && memberKeyDetails.familyId === 1;

  return (
    <BookTermsHomePage
      bookCategories={ bookCategories }
      isAdmin={ canManageTerms }
    />
  );
}