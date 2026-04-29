import { getPublishedSupportFaqItems } from "@/components/db/sql/queries-support";
import { SupportFaqHomePage } from "@/features/support/components/support-faq-home-page";

export default async function FAQPage() {

  return (
    <SupportFaqHomePage />
  );
}