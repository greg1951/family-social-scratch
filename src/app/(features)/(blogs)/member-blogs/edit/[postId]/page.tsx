import { redirect } from "next/navigation";

import { getBlogPostDetail, getMemberBlogsHomePageData } from "@/components/db/sql/queries-blogs";
import { BlogPostEditorPage } from "@/features/blogs/components/blog-post-editor-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function EditMemberBlogPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const parsedPostId = Number(postId);
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  if (!Number.isInteger(parsedPostId) || parsedPostId <= 0) {
    redirect("/member-blogs");
  }

  const [blogsData, postDetailResult] = await Promise.all([
    getMemberBlogsHomePageData(memberKeyDetails.familyId, memberKeyDetails.memberId),
    getBlogPostDetail(memberKeyDetails.familyId, parsedPostId, memberKeyDetails.memberId),
  ]);

  if (!postDetailResult.success) {
    redirect("/member-blogs");
  }

  const canEdit = postDetailResult.post.authorMemberId === memberKeyDetails.memberId || memberKeyDetails.isFounder;

  if (!canEdit) {
    redirect("/member-blogs");
  }

  const blogTags = blogsData.success ? blogsData.blogTags : [];

  return (
    <BlogPostEditorPage
      blogTags={ blogTags }
      initialPost={ postDetailResult.post }
      memberId={ memberKeyDetails.memberId }
      mode="edit"
    />
  );
}
