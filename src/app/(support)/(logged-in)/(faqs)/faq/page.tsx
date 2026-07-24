import { GeneralFaqHomePage } from "@/features/support/components/general-faq-home-page";
import { getPublishedFaqVideos } from "@/components/db/sql/queries-videos";

export default async function FAQPage() {
  const faqVideos = await getPublishedFaqVideos();
  const setupStartUrl = process.env.AUTH_URL
    ? new URL("/family-setup-home", process.env.AUTH_URL).toString()
    : "/family-setup-home";

  return (
    <GeneralFaqHomePage faqVideos={faqVideos} setupStartUrl={setupStartUrl} />
  );
}