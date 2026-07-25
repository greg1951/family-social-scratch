import { redirect } from "next/navigation";

import { getBlogPostDetail, getBlogsHomePageData } from "@/components/db/sql/queries-blogs";
import { BlogPostDetailPage } from "@/features/blogs/components/blog-post-detail-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const blogsData = await getBlogsHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const postSummary = blogsData.success
    ? blogsData.posts.find((post) => post.slug === slug)
    : null;

  if (!postSummary) {
    redirect("/blogs");
  }

  const postDetailResult = await getBlogPostDetail(
    memberKeyDetails.familyId,
    postSummary.id,
    memberKeyDetails.memberId,
  );

  if (!postDetailResult.success) {
    redirect("/blogs");
  }

  return (
    <BlogPostDetailPage
      initialPost={ postDetailResult.post }
      memberId={ memberKeyDetails.memberId }
      isFounder={ memberKeyDetails.isFounder }
    />
  );
}
