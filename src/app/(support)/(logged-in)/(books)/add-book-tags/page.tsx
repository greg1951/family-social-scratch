import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BookTagCategoriesAdminPage } from "@/features/support/components/book-tag-categories-admin-page";
import { getBookCategoryWithTags } from "@/components/db/sql/queries-book-besties";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function AddBookTagsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isAdmin === false) {
    console.warn('Unauthorized access attempt to support add book tags page. Redirecting to home page.');
    redirect("/");
  }

  const categoriesResult = await getBookCategoryWithTags();

  if (!categoriesResult.success) {
    return (
      <div className="px-4 py-6 text-sm text-red-600">
        { categoriesResult.message }
      </div>
    );
  }

  return (
    <BookTagCategoriesAdminPage categories={ categoriesResult.categories } />
  )
}
