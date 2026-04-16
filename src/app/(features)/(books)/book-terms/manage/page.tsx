import { redirect } from "next/navigation";

import { getBookTermById } from "@/components/db/sql/queries-book-besties";
import { BookTermEditorPage } from "@/features/books/components/book-term-editor-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ManageBookTermPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
  }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  if (!memberKeyDetails.isAdmin) {
    redirect("/book-terms");
  }

  const { id } = await searchParams;
  const bookTermId = id ? Number(id) : undefined;

  if (id && (!bookTermId || Number.isNaN(bookTermId))) {
    redirect("/book-terms");
  }

  const bookTermResult = bookTermId
    ? await getBookTermById(bookTermId)
    : null;

  if (bookTermId && (!bookTermResult || !bookTermResult.success)) {
    redirect("/book-terms");
  }

  return (
    <BookTermEditorPage
      bookTerm={ bookTermResult?.success ? bookTermResult.bookTerm : null }
    />
  );
}
