import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import { getSupportFaqItems, getSupportFaqTypeOptions } from "@/components/db/sql/queries-support";
import { SupportFaqUpdateHomePage } from "@/features/support/components/support-faq-update-home-page";

export default async function FAQMaintenance() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isAdmin === false) {
    console.warn('Unauthorized access attempt to support admin account page. Redirecting to home page.');
    redirect("/");
  }

  const faqItemsResult = await getSupportFaqItems();
  const faqTypesResult = await getSupportFaqTypeOptions();
  const faqItems = faqItemsResult.success ? faqItemsResult.faqItems : [];
  const faqTypes = faqTypesResult.success ? faqTypesResult.faqTypes : ["global"];


  return (
    <SupportFaqUpdateHomePage
      faqItems={ faqItems }
      faqTypes={ faqTypes }
      loadError={ faqItemsResult.success ? undefined : faqItemsResult.message }
    />
  );
}