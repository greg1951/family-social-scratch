import { getAllFamilies } from "@/components/db/sql/queries-family-member";
import CreateTrialAccountSteps from "./index";

export default async function TrialSetup() {
  const familyNamesResult = await getAllFamilies();
  if (!familyNamesResult.success) {
    throw new Error("Failed to retrieve family names: " + familyNamesResult.message);
  }
  const families = familyNamesResult.familyNames as string[];
  return (
    <CreateTrialAccountSteps familyNames={ families } />
  );
}