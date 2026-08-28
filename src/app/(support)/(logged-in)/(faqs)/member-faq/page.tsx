import { MemberFaqHomePage } from "@/features/support/components/member-faq-home-page";
import { getPublishedAccountFaqVideos } from "@/components/db/sql/queries-videos";

export default async function MemberFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const defaultCategory = Array.isArray(category) ? category[0] : category;
  const faqVideos = await getPublishedAccountFaqVideos("member", defaultCategory ?? "Member Profile", "Detailed");

  return (
    <MemberFaqHomePage defaultCategory={ defaultCategory } faqVideos={ faqVideos } />
  );
}
