import { FounderFaqHomePage } from "@/features/support/components/founder-faq-home-page";
import { getPublishedAccountFaqVideos } from "@/components/db/sql/queries-videos";

export default async function FounderFaqPage() {
  const faqVideos = await getPublishedAccountFaqVideos("founder", "Founder Profile", "Detailed");

  return (
    <FounderFaqHomePage faqVideos={ faqVideos } />
  );
}