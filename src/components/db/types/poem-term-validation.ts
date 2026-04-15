import type { JSONContent } from "@tiptap/core";
import { z } from "zod";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
);

const tipTapMarkSchema = z
  .object({
    type: z.string().min(1),
    attrs: z.record(z.string(), jsonValueSchema).optional(),
  })
  .passthrough();

export const tipTapJsonContentSchema: z.ZodType<JSONContent> = z.lazy(() =>
  z
    .object({
      type: z.string().optional(),
      attrs: z.record(z.string(), jsonValueSchema).optional(),
      content: z.array(tipTapJsonContentSchema).optional(),
      marks: z.array(tipTapMarkSchema).optional(),
      text: z.string().optional(),
    })
    .passthrough()
) as z.ZodType<JSONContent>;

export const tipTapDocumentSchema = tipTapJsonContentSchema.refine(
  (value) => value.type === "doc" && Array.isArray(value.content),
  {
    message: "Term content must be a valid TipTap document.",
  }
);

export const serializedTipTapDocumentSchema = z.string().trim().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Term content is required.",
    });
    return;
  }

  try {
    const parsed = JSON.parse(value);
    const result = tipTapDocumentSchema.safeParse(parsed);

    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Term content must be valid TipTap JSON.",
      });
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Term content must be valid TipTap JSON.",
    });
  }
});

export function createEmptyTipTapDocument(): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
      },
    ],
  };
}

export function createTextTipTapDocument(text: string): JSONContent {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: text
          ? [
              {
                type: "text",
                text,
              },
            ]
          : undefined,
      },
    ],
  };
}

export function parseSerializedTipTapDocument(value?: string):
  | { success: true; content: JSONContent }
  | { success: false; message: string } {
  if (!value) {
    return {
      success: true,
      content: createEmptyTipTapDocument(),
    };
  }

  try {
    const parsed = JSON.parse(value);
    const result = tipTapDocumentSchema.safeParse(parsed);

    if (!result.success) {
      return {
        success: false,
        message: "Stored term content is not valid TipTap JSON.",
      };
    }

    return {
      success: true,
      content: result.data,
    };
  } catch {
    return {
      success: false,
      message: "Stored term content is not valid TipTap JSON.",
    };
  }
}

export function serializeTipTapDocument(content: JSONContent): string {
  return JSON.stringify(content);
}

export function isTipTapDocumentEmpty(content?: JSONContent): boolean {
  if (!content) {
    return true;
  }

  if (typeof content.text === "string" && content.text.trim().length > 0) {
    return false;
  }

  if (Array.isArray(content.content)) {
    return content.content.every((childContent) => isTipTapDocumentEmpty(childContent));
  }

  return true;
}
