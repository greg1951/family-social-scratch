import { z } from "zod";

import { isTipTapDocumentEmpty, parseSerializedTipTapDocument } from "@/components/db/types/poem-term-validation";

export type ErrorReturnType = {
  error: boolean;
  message?: string;
};

export const SUPPORT_ENV_PNEUMONICS = ["local", "dev", "qa", "stage", "trial", "prod"] as const;

export type SupportEnvPneumonic = typeof SUPPORT_ENV_PNEUMONICS[number];

export const upsertSupportEnvironmentSchema = z
  .object({
    id: z.number().int().positive().optional(),
    envPneumonic: z.enum(SUPPORT_ENV_PNEUMONICS, {
      message: "Environment pneumonic is required.",
    }),
    websiteDomain: z
      .string()
      .trim()
      .min(1, "Website domain is required.")
      .max(255, "Website domain must be 255 characters or fewer."),
    isAvailable: z.boolean().default(true),
    bypassUrl: z
      .string()
      .trim()
      .max(500, "Bypass URL must be 500 characters or fewer.")
      .nullable()
      .optional(),
    supportEmail: z
      .string()
      .trim()
      .email("Support email must be a valid email address.")
      .max(320, "Support email must be 320 characters or fewer.")
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    const normalizedBypassUrl = value.bypassUrl?.trim() ?? "";

    if (!value.isAvailable && normalizedBypassUrl.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bypassUrl"],
        message: "Bypass URL is required when the environment is not available.",
      });
      return;
    }

    if (normalizedBypassUrl.length > 0) {
      const parsedUrl = z.string().url().safeParse(normalizedBypassUrl);
      if (!parsedUrl.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bypassUrl"],
          message: "Bypass URL must be a valid URL.",
        });
      }
    }
  });

export type UpsertSupportEnvironmentFormInput = z.input<typeof upsertSupportEnvironmentSchema>;
export type UpsertSupportEnvironmentInput = z.infer<typeof upsertSupportEnvironmentSchema>;

export type SupportEnvironmentListItem = {
  id: number;
  envPneumonic: SupportEnvPneumonic;
  websiteDomain: string;
  isAvailable: boolean;
  bypassUrl: string | null;
  supportEmail: string | null;
  updatedAt: Date | null;
};

export type UpsertSupportEnvironmentResult =
  | {
      success: true;
      environment: SupportEnvironmentListItem;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export const SUPPORT_ISSUE_CATEGORIES = [
  "Technical Issue",
  "General Inquiry",
  "Feedback",
] as const;

export const SUPPORT_ISSUE_PRIORITIES = ["Low", "Medium", "High"] as const;

export type SupportIssueCategory = typeof SUPPORT_ISSUE_CATEGORIES[number];
export type SupportIssuePriority = typeof SUPPORT_ISSUE_PRIORITIES[number];

export const supportAttachmentDraftSchema = z.object({
  name: z.string().trim().min(1, "Attachment file name is required."),
  size: z.number().int().nonnegative(),
  type: z.string().trim().default("application/octet-stream"),
  lastModified: z.number().int().nonnegative().optional(),
});

export const supportDescriptionJsonSchema = z.string().trim().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Description is required.",
    });
    return;
  }

  const parsed = parseSerializedTipTapDocument(value);

  if (!parsed.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Description must be valid TipTap JSON.",
    });
    return;
  }

  if (isTipTapDocumentEmpty(parsed.content)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Description is required.",
    });
  }
});

export const createSupportIssueSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160, "Title must be 160 characters or fewer."),
  category: z.enum(SUPPORT_ISSUE_CATEGORIES, {
    message: "Category is required.",
  }),
  priority: z.enum(SUPPORT_ISSUE_PRIORITIES, {
    message: "Priority is required.",
  }),
  descriptionJson: supportDescriptionJsonSchema,
  attachment: supportAttachmentDraftSchema.nullable().optional(),
});

export type SupportAttachmentDraft = z.infer<typeof supportAttachmentDraftSchema>;
export type SupportAttachmentDraftInput = z.input<typeof supportAttachmentDraftSchema>;
export type CreateSupportIssueFormInput = z.input<typeof createSupportIssueSchema>;
export type CreateSupportIssueInput = z.infer<typeof createSupportIssueSchema>;

export type CreateSupportIssueContext = {
  memberId: number;
  familyId: number;
  familyName: string;
  memberName: string;
};

export type CreateSupportIssueResult =
  | {
      success: true;
      issueId: number;
      message: string;
      assignedSupportPersonName: string;
    }
  | {
      success: false;
      message: string;
    };

// ─── List Issues ─────────────────────────────────────────────────────────────

export type SupportIssueListItem = {
  id: number;
  issueTitle: string | null;
  issueType: string;
  priority: string;
  status: string;
  updatedAt: Date | null;
  familyName: string | null;
  assignedPersonName: string | null;
  assignedTeamLevel: string | null;
  assignedPersonIssueId: number | null;
  assignedPersonId: number | null;
  assignedTeamId: number | null;
};

export type SupportIssueResponse = {
  id: number;
  responseType: string;
  isProposedSolution: boolean;
  wasAccepted: boolean;
  status: string;
  responseJson: string;
  updatedAt: Date | null;
};

export type SupportIssueDetail = SupportIssueListItem & {
  issueJson: string;
  responses: SupportIssueResponse[];
};

// ─── Create Response ──────────────────────────────────────────────────────────

export const createSupportResponseSchema = z.object({
  responseJson: supportDescriptionJsonSchema,
  isProposedSolution: z.boolean().default(false),
  wasAccepted: z.boolean().default(false),
});

export type CreateSupportResponseFormInput = z.input<typeof createSupportResponseSchema>;
export type CreateSupportResponseInput = z.infer<typeof createSupportResponseSchema>;

export type CreateSupportResponseResult =
  | { success: true; responseId: number; message: string }
  | { success: false; message: string };

// ─── Update Team Assignment ───────────────────────────────────────────────────

export type UpdateIssueTeamResult =
  | { success: true; newTeamLevel: string; newPersonName: string; message: string }
  | { success: false; message: string };

