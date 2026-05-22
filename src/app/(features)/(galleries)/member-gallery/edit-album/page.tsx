import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function EditAlbumPage() {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white font-app">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link
            href="/member-gallery"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-3.5" />
            Back to My Gallery
          </Link>
          <h1 className="text-base font-bold text-slate-800 sm:text-lg">Edit Album</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-500">This page is coming soon. You will be able to edit your album details and manage its photos here.</p>
      </main>
    </div>
  );
}
