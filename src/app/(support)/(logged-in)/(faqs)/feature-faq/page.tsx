import { FeaturesFaqHomePage } from "@/features/support/components/features-faq-home-page";
import { getPublishedFaqVideos } from "@/components/db/sql/queries-videos";

export default async function FeaturesFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const defaultCategory = Array.isArray(category) ? category[0] : category;
  const faqVideos = await getPublishedFaqVideos();

  return (
    <FeaturesFaqHomePage defaultCategory={ defaultCategory } faqVideos={ faqVideos } />
  );
}