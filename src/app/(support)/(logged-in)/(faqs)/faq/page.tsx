import { GeneralFaqHomePage } from "@/features/support/components/general-faq-home-page";
import { getPublishedFaqVideos } from "@/components/db/sql/queries-videos";

export default async function FAQPage() {
  const faqVideos = await getPublishedFaqVideos();

  return (
    <GeneralFaqHomePage faqVideos={faqVideos} />
  );
}