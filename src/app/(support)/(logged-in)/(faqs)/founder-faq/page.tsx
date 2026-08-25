import { FounderFaqHomePage } from "@/features/support/components/founder-faq-home-page";
import { getPublishedFaqVideos } from "@/components/db/sql/queries-videos";

export default async function FounderFaqPage() {
  const faqVideos = await getPublishedFaqVideos();

  return (
    <FounderFaqHomePage faqVideos={ faqVideos } />
  );
}