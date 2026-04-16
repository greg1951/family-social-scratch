import BooksHomePage from "@/features/books/components/books-home-page";

import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getBooksHomePageData } from "@/components/db/sql/queries-book-besties";

export default async function BooksPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const booksHomeData = await getBooksHomePageData(memberKeyDetails.familyId, memberKeyDetails.memberId);

  const books = booksHomeData.success ? booksHomeData.books : [];
  const bookTags = booksHomeData.success ? booksHomeData.bookTags : [];


  return (
    <BooksHomePage
      books={ books }
      bookTags={ bookTags }
      member={ memberKeyDetails }
    />
  );
}