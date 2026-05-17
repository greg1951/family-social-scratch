import { auth } from "@/auth";
import { deleteThreadTemplate } from "@/components/db/sql/queries-thread-templates";
import { NextRequest } from "next/server";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const session = await auth();

  if (!session) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const templateId = parseInt(params.id, 10);

  if (isNaN(templateId)) {
    return Response.json(
      { success: false, message: "Invalid template ID" },
      { status: 400 },
    );
  }

  const result = await deleteThreadTemplate(templateId);

  if (!result.success) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
