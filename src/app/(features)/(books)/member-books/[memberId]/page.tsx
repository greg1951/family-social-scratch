import { notFound, redirect } from "next/navigation";

import { getMemberBiblioPageData } from "@/components/db/sql/queries-book-biblio";
import MemberBooksPage from "@/features/books/components/member-books-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MemberBiblioRoute({ params }: { params: Promise<{ memberId: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { memberId } = await params;
  const ownerMemberId = Number(memberId);

  if (!Number.isInteger(ownerMemberId) || ownerMemberId < 1) {
    notFound();
  }

  if (ownerMemberId === memberKeyDetails.memberId) {
    redirect("/member-books");
  }

  const biblioData = await getMemberBiblioPageData(
    memberKeyDetails.familyId,
    ownerMemberId,
    memberKeyDetails.memberId
  );

  if (!biblioData.success) {
    return (
      <MemberBooksPage
        entries={ [] }
        bookTags={ [] }
        isOwner={ false }
        heading="Family Bibliography"
        subheading="Books a family member has read."
        loadError={ biblioData.message }
      />
    );
  }

  return (
    <MemberBooksPage
      entries={ biblioData.entries }
      bookTags={ biblioData.bookTags }
      isOwner={ false }
      heading={ `${ biblioData.ownerFirstName } ${ biblioData.ownerLastName }'s Books` }
      subheading="Public books this family member has recorded in their bibliography."
    />
  );
}
