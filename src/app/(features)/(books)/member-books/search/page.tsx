import { redirect } from "next/navigation";

import { searchFamilyBiblios } from "@/components/db/sql/queries-book-biblio";
import MemberBooksPage from "@/features/books/components/member-books-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BiblioSearchRoute({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { q } = await searchParams;
  const searchText = (q ?? "").trim();

  const searchData = await searchFamilyBiblios(
    memberKeyDetails.familyId,
    searchText,
    memberKeyDetails.memberId
  );

  return (
    <MemberBooksPage
      entries={ searchData.success ? searchData.entries : [] }
      bookTags={ searchData.success ? searchData.bookTags : [] }
      isOwner={ false }
      showOwnerNames
      heading="Family Bibliographies"
      subheading="Search every public bibliography in your family by book title or author."
      initialSearch={ searchText }
      loadError={ searchData.success ? null : searchData.message }
    />
  );
}
