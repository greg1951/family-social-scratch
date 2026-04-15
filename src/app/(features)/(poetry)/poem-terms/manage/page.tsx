import { redirect } from "next/navigation";

import { getPoemTermById } from "@/components/db/sql/queries-poetry-cafe";
import { PoemTermEditorPage } from "@/features/poetry/components/poem-term-editor-page";
import { getMemberPageDetails } from "@/features/family/services/family-services";

export default async function ManagePoemTermPage({
  searchParams,
}: {
  searchParams: Promise<{
    id?: string;
  }>;
}) {
  const memberKeyDetails = await getMemberPageDetails();

  if (!memberKeyDetails.isLoggedIn) {
    redirect("/");
  }

  if (!memberKeyDetails.isAdmin) {
    redirect("/poem-terms");
  }

  const { id } = await searchParams;
  const poemTermId = id ? Number(id) : undefined;

  if (id && (!poemTermId || Number.isNaN(poemTermId))) {
    redirect("/poem-terms");
  }

  const poemTermResult = poemTermId
    ? await getPoemTermById(poemTermId)
    : null;

  if (poemTermId && (!poemTermResult || !poemTermResult.success)) {
    redirect("/poem-terms");
  }

  return (
    <PoemTermEditorPage
      poemTerm={ poemTermResult?.success ? poemTermResult.poemTerm : null }
    />
  );
}