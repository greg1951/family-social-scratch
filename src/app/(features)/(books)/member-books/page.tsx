import { redirect } from "next/navigation";

import { getMemberBiblioPageData } from "@/components/db/sql/queries-book-biblio";
import MemberBooksPage from "@/features/books/components/member-books-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MemberBooksRoute() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const biblioData = await getMemberBiblioPageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    memberKeyDetails.memberId
  );

  return (
    <MemberBooksPage
      entries={ biblioData.success ? biblioData.entries : [] }
      bookTags={ biblioData.success ? biblioData.bookTags : [] }
      isOwner
      heading="My Books"
      subheading="Track every book you have read. Mark an entry public so the rest of the family can see it, then turn any entry into a book review."
      loadError={ biblioData.success ? null : biblioData.message }
    />
  );
}
