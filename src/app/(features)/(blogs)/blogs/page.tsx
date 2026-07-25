import { redirect } from "next/navigation";

import { getBlogsHomePageData } from "@/components/db/sql/queries-blogs";
import { getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { BlogsHomePage } from "@/features/blogs/components/blogs-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function BlogsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const blogsData = await getBlogsHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const [memberImageResult, unreadThreadCount] = await Promise.all([
    getMemberImageDetailsByMemberId(memberKeyDetails.memberId),
    getUnreadThreadCountForRecipient(memberKeyDetails.memberId),
  ]);

  const posts = blogsData.success ? blogsData.posts : [];
  const memberImageUrl = memberImageResult.success ? (memberImageResult.memberImageUrl ?? null) : null;

  return (
    <BlogsHomePage
      posts={ posts }
      memberId={ memberKeyDetails.memberId }
      isFounder={ memberKeyDetails.isFounder }
      isAdmin={ Boolean(memberKeyDetails.isAdmin) }
      firstName={ memberKeyDetails.firstName }
      email={ memberKeyDetails.email }
      memberImageUrl={ memberImageUrl }
      unreadThreadCount={ unreadThreadCount }
    />
  );
}
