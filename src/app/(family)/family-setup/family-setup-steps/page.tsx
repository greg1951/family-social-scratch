import { getAllFamilies } from "@/components/db/sql/queries-family-member";
import CreateFamilyAccountSteps from "./index";

export default async function FamilySetup() {
  const familyNamesResult = await getAllFamilies();
  if (!familyNamesResult.success) {
    throw new Error("Failed to retrieve family names: " + familyNamesResult.message);
  }
  const families = familyNamesResult.familyNames as string[];
  return (
    <CreateFamilyAccountSteps familyNames={ families } />
  );
}