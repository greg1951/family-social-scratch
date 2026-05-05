import { FeaturesFaqHomePage } from "@/features/support/components/features-faq-home-page";

export default async function FeaturesFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;
  const defaultCategory = Array.isArray(category) ? category[0] : category;

  return (
    <FeaturesFaqHomePage defaultCategory={ defaultCategory } />
  );
}