import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function IssuesList() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const email = session.user?.email as string;
  const userId = Number(session.user?.id);

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isAdmin === false) {
    console.warn('Unauthorized access attempt to support admin account page. Redirecting to home page.');
    redirect("/");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Issues List</h1>
      <p className="text-lg text-gray-600">We are currently performing maintenance on our Issues section. Please check back later.</p>
    </div>
  );
}