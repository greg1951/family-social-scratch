import { redirect } from "next/navigation";

import { getBlogsHomePageData } from "@/components/db/sql/queries-blogs";
import { BlogPostEditorPage } from "@/features/blogs/components/blog-post-editor-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function NewBlogPostPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const blogsData = await getBlogsHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const blogTags = blogsData.success ? blogsData.blogTags : [];

  return (
    <BlogPostEditorPage
      blogTags={ blogTags }
      memberId={ memberKeyDetails.memberId }
      mode="add"
    />
  );
}
