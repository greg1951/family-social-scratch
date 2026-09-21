import { redirect } from "next/navigation";

import { getMemberNotifications } from "@/components/db/sql/queries-family-notifications";
import { getMemberBlogsHomePageData } from "@/components/db/sql/queries-blogs";
import { getMemberImageDetailsByMemberId } from "@/components/db/sql/queries-family-member";
import { getUnreadThreadCountForRecipient } from "@/components/db/sql/queries-thread-convos";
import { BlogsHomePage } from "@/features/blogs/components/blogs-home-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function MemberBlogsPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  const blogsData = await getMemberBlogsHomePageData(
    memberKeyDetails.familyId,
    memberKeyDetails.memberId,
  );

  const [memberImageResult, unreadThreadCount, memberNotificationsResult] = await Promise.all([
    getMemberImageDetailsByMemberId(memberKeyDetails.memberId),
    getUnreadThreadCountForRecipient(memberKeyDetails.memberId),
    getMemberNotifications(memberKeyDetails.memberId),
  ]);

  const posts = blogsData.success ? blogsData.posts : [];
  const memberImageUrl = memberImageResult.success ? (memberImageResult.memberImageUrl ?? null) : null;
  const initialPrivateOnly = memberNotificationsResult.success
    && memberNotificationsResult.notifications.some((notification) => (
      notification.optionName.trim().toLowerCase() === "prefer private blogs"
      && notification.isSelected
    ));

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
      initialPrivateOnly={ initialPrivateOnly }
      showManagementActions
    />
  );
}
