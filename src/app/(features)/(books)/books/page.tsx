import BooksHomePage from "@/features/books/components/books-home-page";

import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getBooksHomePageData } from "@/components/db/sql/queries-book-besties";
import { getFamilyBiblioMembers, getBookReviewPrefill } from "@/components/db/sql/queries-book-biblio";

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ biblioId?: string }> }) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const { biblioId } = await searchParams;
  const requestedBiblioId = Number(biblioId);

  const [booksHomeData, biblioMembersData, reviewPrefill] = await Promise.all([
    getBooksHomePageData(memberKeyDetails.familyId, memberKeyDetails.memberId),
    getFamilyBiblioMembers(memberKeyDetails.familyId, memberKeyDetails.memberId),
    Number.isInteger(requestedBiblioId) && requestedBiblioId > 0
      ? getBookReviewPrefill(requestedBiblioId, {
        familyId: memberKeyDetails.familyId,
        memberId: memberKeyDetails.memberId,
      })
      : Promise.resolve(null),
  ]);

  const books = booksHomeData.success ? booksHomeData.books : [];
  const bookTags = booksHomeData.success ? booksHomeData.bookTags : [];


  return (
    <BooksHomePage
      books={ books }
      bookTags={ bookTags }
      biblioMembers={ biblioMembersData.success ? biblioMembersData.members : [] }
      reviewPrefill={ reviewPrefill }
      loadError={ booksHomeData.success ? null : booksHomeData.message }
      member={ memberKeyDetails }
    />
  );
}