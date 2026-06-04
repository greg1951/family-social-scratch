import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMemberPageDetails } from "@/features/family/services/family-services";
import AddVideosForm from "@/features/support/components/add-video-form";

export default async function AddVideosPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const memberKeyDetails = await getMemberPageDetails();
  if (memberKeyDetails.isLoggedIn === false || memberKeyDetails.isAdmin === false) {
    console.warn('Unauthorized access attempt to support admin account page. Redirecting to home page.');
    redirect("/");
  }


  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(138,187,206,0.24),transparent_34%),linear-gradient(180deg,#f5fbfd_0%,#edf5f8_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AddVideosForm />
      </div>
    </main>
  );
}
