import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getPoemCategoryWithTags } from "@/components/db/sql/queries-poetry-cafe";
import { PoemTagCategoriesAdminPage } from "@/components/features/support/components/poem-tag-categories-admin-page";

export default async function AddPoemTagsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isAdmin === false) {
    console.warn('Unauthorized access attempt to support poetry terms page. Redirecting to home page.');
    redirect("/");
  }

  const poemCategoryWithTagsResult = await getPoemCategoryWithTags();
  const categories = poemCategoryWithTagsResult.success ? poemCategoryWithTagsResult.categories : [];

  return <PoemTagCategoriesAdminPage categories={ categories } />;
}
