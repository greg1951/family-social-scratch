import db from "@/components/db/drizzle";
import { threadTemplate } from "@/components/db/schema/family-social-schema-tables";
import { eq, asc } from "drizzle-orm";
import {
  ThreadTemplate,
  ThreadTemplateInput,
  SaveThreadTemplateReturn,
  GetThreadTemplatesReturn,
  GetThreadTemplateReturn,
  DeleteThreadTemplateReturn,
} from "@/components/db/types/thread-templates";

export async function getThreadTemplates(
  category?: "global" | "thread",
): Promise<GetThreadTemplatesReturn> {
  try {
    const result = category
      ? await db
        .select()
        .from(threadTemplate)
        .where(eq(threadTemplate.templateCategory, category))
        .orderBy(asc(threadTemplate.seqNo), asc(threadTemplate.templateName))
      : await db
        .select()
        .from(threadTemplate)
        .orderBy(asc(threadTemplate.seqNo), asc(threadTemplate.templateName));

    return {
      success: true,
      templates: result as ThreadTemplate[],
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error fetching thread templates",
    };
  }
}

export async function getThreadTemplate(templateId: number): Promise<GetThreadTemplateReturn> {
  try {
    const result = await db
      .select()
      .from(threadTemplate)
      .where(eq(threadTemplate.id, templateId))
      .limit(1);

    if (!result.length) {
      return {
        success: false,
        message: `Thread template with id ${templateId} not found`,
      };
    }

    return {
      success: true,
      template: result[0] as ThreadTemplate,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error fetching thread template",
    };
  }
}

export async function saveThreadTemplate(
  input: ThreadTemplateInput,
): Promise<SaveThreadTemplateReturn> {
  try {
    const normalizedName = input.templateName.trim();
    const normalizedJson = input.templateJson.trim();

    if (!normalizedName) {
      return {
        success: false,
        message: "Template name is required",
      };
    }

    if (!normalizedJson || normalizedJson === "{}") {
      return {
        success: false,
        message: "Template content is required",
      };
    }

    // Validate JSON
    try {
      JSON.parse(normalizedJson);
    } catch {
      return {
        success: false,
        message: "Template content must be valid JSON",
      };
    }

    let result;

    if (input.id) {
      // Update existing template
      const updated = await db
        .update(threadTemplate)
        .set({
          templateName: normalizedName,
          templateCategory: input.templateCategory,
          templateJson: normalizedJson,
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(threadTemplate.id, input.id))
        .returning();

      if (!updated.length) {
        return {
          success: false,
          message: `Thread template with id ${input.id} not found`,
        };
      }

      result = updated[0] as ThreadTemplate;
    } else {
      // Create new template
      const created = await db
        .insert(threadTemplate)
        .values({
          templateName: normalizedName,
          templateCategory: input.templateCategory,
          templateJson: normalizedJson,
          status: input.status,
          updatedAt: new Date(),
        })
        .returning();

      result = created[0] as ThreadTemplate;
    }

    return {
      success: true,
      template: result,
      message: input.id ? "Template updated successfully" : "Template created successfully",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("duplicate key") &&
      error.message.includes("template_name")
    ) {
      return {
        success: false,
        message: "A template with this name already exists",
      };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Error saving thread template",
    };
  }
}

export async function deleteThreadTemplate(templateId: number): Promise<DeleteThreadTemplateReturn> {
  try {
    const deleted = await db
      .delete(threadTemplate)
      .where(eq(threadTemplate.id, templateId))
      .returning();

    if (!deleted.length) {
      return {
        success: false,
        message: `Thread template with id ${templateId} not found`,
      };
    }

    return {
      success: true,
      message: "Template deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error deleting thread template",
    };
  }
}
