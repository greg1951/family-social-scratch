import { redirect } from "next/navigation";

import {
  getBlogPostDetail,
  getBlogsHomePageData,
  getMemberBlogsHomePageData,
} from "@/components/db/sql/queries-blogs";
import { BlogPostDetailPage } from "@/features/blogs/components/blog-post-detail-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const blogsData = await (from === "member-blogs"
    ? getMemberBlogsHomePageData(
      memberKeyDetails.familyId,
      memberKeyDetails.memberId,
    )
    : getBlogsHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
    ));

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
      backHref={ from === "member-blogs" ? "/member-blogs" : "/blogs" }
      backLabel={ from === "member-blogs" ? "Back to My Blogs" : "Back to Living Room" }
    />
  );
}
