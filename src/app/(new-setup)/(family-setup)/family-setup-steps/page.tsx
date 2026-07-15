import { getAllFamilies } from "@/components/db/sql/queries-family-member";
import CreateFamilyAccountSteps from "./index";

export const dynamic = "force-dynamic";

export default async function FamilySetup() {
  const familyNamesResult = await getAllFamilies();
  if (!familyNamesResult.success) {
    throw new Error("Failed to retrieve family names: " + familyNamesResult.message);
  }
  const families = familyNamesResult.familyNames as string[];
  return (
    // <p>Made it here</p>
    <CreateFamilyAccountSteps familyNames={ families } />
  );
}