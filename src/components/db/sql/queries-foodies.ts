import db from "@/components/db/drizzle";
import { and, asc, desc, eq, ilike, inArray, ne, or } from "drizzle-orm";

import {
  member,
  recipe,
  recipeComment,
  recipeLike,
  recipeTag,
  recipeTagReference,
  recipeTemplate,
  recipeTerm,
} from "../schema/family-social-schema-tables";
import {
  FoodiesTemplateManagementDataReturn,
  FoodiesTemplateRecord,
  FoodiesHomePageDataReturn,
  FoodiesRecipe,
  FoodiesRecipeDetail,
  GetFoodiesRecipeReturn,
  RecipeComment,
  RecipeTagOption,
  RecipeTagType,
  RecipeTemplateOption,
  SaveFoodiesRecipeInput,
  SaveFoodiesRecipeReturn,
  SaveFoodiesTemplateInput,
  SaveFoodiesTemplateReturn,
  ToggleRecipeLikeReturn,
  AddRecipeCommentReturn,
  GetFoodiesRecipeDetailReturn,
  RecipeTerm,
  GetRecipeTermReturn,
  RecipeTermsReturn,
  SaveRecipeTermInput,
  SaveRecipeTermReturn,
} from "../types/recipes";
import {
  createEmptyTipTapDocument,
  isTipTapDocumentEmpty,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "../types/poem-term-validation";

const SUPPORTED_RECIPE_TAG_TYPES: RecipeTagType[] = [
  "cuisine",
  "course_type",
  "cooking_method",
  "dietary",
  "meal_time",
];

function createSubmitterName(firstName?: string | null, lastName?: string | null) {
  const names = [firstName, lastName].filter(Boolean);

  if (names.length > 0) {
    return names.join(" ");
  }

  return "Unknown Member";
}

function createDefaultRecipeTemplateJson() {
  return serializeTipTapDocument({
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "General" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Main Ingredients" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Spices" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Preparation" }] },
      { type: "paragraph" },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Cooking" }] },
      { type: "paragraph" },
    ],
  });
}

async function ensureGlobalRecipeTemplate(
  familyId: number,
  memberId: number
): Promise<RecipeTemplateOption> {
  const [existingTemplate] = await db
    .select({
      id: recipeTemplate.id,
      templateName: recipeTemplate.templateName,
      isGlobalTemplate: recipeTemplate.isGlobalTemplate,
      status: recipeTemplate.status,
      templateJson: recipeTemplate.templateJson,
      memberId: recipeTemplate.memberId,
      familyId: recipeTemplate.familyId,
    })
    .from(recipeTemplate)
    .where(and(eq(recipeTemplate.isGlobalTemplate, true), eq(recipeTemplate.familyId, familyId)))
    .orderBy(asc(recipeTemplate.id));

  if (existingTemplate) {
    return {
      id: existingTemplate.id,
      templateName: existingTemplate.templateName,
      isGlobalTemplate: existingTemplate.isGlobalTemplate,
      status: existingTemplate.status,
      templateJson: existingTemplate.templateJson,
      memberId: existingTemplate.memberId,
      familyId: existingTemplate.familyId,
      label: `${existingTemplate.templateName} (Global)`,
    };
  }

  const defaultTemplateJson = createDefaultRecipeTemplateJson();
  const [createdTemplate] = await db
    .insert(recipeTemplate)
    .values({
      templateName: `__global-${familyId}`,
      isGlobalTemplate: true,
      status: "published",
      templateJson: defaultTemplateJson,
      memberId,
      familyId,
    })
    .returning();

  return {
    id: createdTemplate.id,
    templateName: createdTemplate.templateName,
    isGlobalTemplate: createdTemplate.isGlobalTemplate,
    status: createdTemplate.status,
    templateJson: createdTemplate.templateJson,
    memberId: createdTemplate.memberId,
    familyId: createdTemplate.familyId,
    label: `${createdTemplate.templateName} (Global)`,
  };
}

async function loadRecipeTagOptions(): Promise<RecipeTagOption[]> {
  const result = await db
    .select({
      id: recipeTagReference.id,
      tagName: recipeTagReference.tagName,
      tagDesc: recipeTagReference.tagDesc,
      tagType: recipeTagReference.tagType,
      status: recipeTagReference.status,
      seqNo: recipeTagReference.seqNo,
    })
    .from(recipeTagReference)
    .where(inArray(recipeTagReference.tagType, SUPPORTED_RECIPE_TAG_TYPES))
    .orderBy(asc(recipeTagReference.tagType), asc(recipeTagReference.seqNo), asc(recipeTagReference.tagName));

  return result.map((row) => ({
    id: row.id,
    tagName: row.tagName,
    tagDesc: row.tagDesc,
    tagType: row.tagType as RecipeTagType,
    status: row.status,
    seqNo: row.seqNo,
  }));
}

async function loadRecipeTemplates(
  familyId: number,
  memberId: number,
  options: {
    includeDraft: boolean;
    includeGlobal: boolean;
    ensureGlobalTemplate?: boolean;
  }
): Promise<RecipeTemplateOption[]> {
  const { includeDraft, includeGlobal, ensureGlobalTemplate = false } = options;
  const isTemplateDebug = process.env.NODE_ENV !== "production";
  const defaultTemplate = includeGlobal && ensureGlobalTemplate
    ? await ensureGlobalRecipeTemplate(familyId, memberId)
    : null;
  const whereCondition = and(
    eq(recipeTemplate.familyId, familyId),
    includeDraft
      ? undefined
      : includeGlobal
        ? or(eq(recipeTemplate.status, "published"), eq(recipeTemplate.isGlobalTemplate, true))
        : eq(recipeTemplate.status, "published"),
    includeGlobal ? undefined : eq(recipeTemplate.isGlobalTemplate, false)
  );

  const templateRows = await db
    .select({
      id: recipeTemplate.id,
      templateName: recipeTemplate.templateName,
      isGlobalTemplate: recipeTemplate.isGlobalTemplate,
      status: recipeTemplate.status,
      templateJson: recipeTemplate.templateJson,
      memberId: recipeTemplate.memberId,
      familyId: recipeTemplate.familyId,
    })
    .from(recipeTemplate)
    .where(whereCondition)
    .orderBy(desc(recipeTemplate.isGlobalTemplate), asc(recipeTemplate.templateName));

  // if (isTemplateDebug) {
  //   console.log("[Foodies][loadRecipeTemplates] input", {
  //     familyId,
  //     memberId,
  //     includeDraft,
  //     includeGlobal,
  //     ensureGlobalTemplate,
  //   });
  //   console.log(
  //     "[Foodies][loadRecipeTemplates] rows",
  //     templateRows.map((template) => ({
  //       id: template.id,
  //       templateName: template.templateName,
  //       isGlobalTemplate: template.isGlobalTemplate,
  //       status: template.status,
  //       hasTemplateJson: Boolean(template.templateJson && template.templateJson.trim().length > 0),
  //       templateJsonLength: template.templateJson?.length ?? 0,
  //     }))
  //   );
  // }

  const templateMap = new Map<number, RecipeTemplateOption>();

  if (defaultTemplate) {
    templateMap.set(defaultTemplate.id, defaultTemplate);
  }

  for (const row of templateRows) {
    templateMap.set(row.id, {
      id: row.id,
      templateName: row.templateName,
      isGlobalTemplate: row.isGlobalTemplate,
      status: row.status,
      templateJson: row.templateJson,
      memberId: row.memberId,
      familyId: row.familyId,
      label: row.isGlobalTemplate ? `${row.templateName} (Global)` : row.templateName,
    });
  }

  const finalTemplates = Array.from(templateMap.values()).sort((leftTemplate, rightTemplate) => {
    if (leftTemplate.isGlobalTemplate !== rightTemplate.isGlobalTemplate) {
      return leftTemplate.isGlobalTemplate ? -1 : 1;
    }

    return leftTemplate.label.localeCompare(rightTemplate.label);
  });

  // if (isTemplateDebug) {
  //   console.log(
  //     "[Foodies][loadRecipeTemplates] final",
  //     finalTemplates.map((template) => ({
  //       id: template.id,
  //       label: template.label,
  //       isGlobalTemplate: template.isGlobalTemplate,
  //       status: template.status,
  //       hasTemplateJson: Boolean(template.templateJson && template.templateJson.trim().length > 0),
  //       templateJsonLength: template.templateJson?.length ?? 0,
  //     }))
  //   );
  // }

  return finalTemplates;
}

async function loadFoodiesTemplateManagementRecords(
  familyId: number,
  actorMemberId: number,
  actorIsAdmin: boolean
): Promise<FoodiesTemplateRecord[]> {
  if (actorIsAdmin) {
    await ensureGlobalRecipeTemplate(familyId, actorMemberId);
  }

  const whereCondition = actorIsAdmin
    ? eq(recipeTemplate.familyId, familyId)
    : and(eq(recipeTemplate.familyId, familyId), eq(recipeTemplate.isGlobalTemplate, false));

  const templateRows = await db
    .select({
      id: recipeTemplate.id,
      templateName: recipeTemplate.templateName,
      status: recipeTemplate.status,
      isGlobalTemplate: recipeTemplate.isGlobalTemplate,
      templateJson: recipeTemplate.templateJson,
      memberId: recipeTemplate.memberId,
      familyId: recipeTemplate.familyId,
      updatedAt: recipeTemplate.updatedAt,
    })
    .from(recipeTemplate)
    .where(whereCondition)
    .orderBy(desc(recipeTemplate.updatedAt), asc(recipeTemplate.templateName));

  const memberIds = [...new Set(templateRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))] as number[];
  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  return templateRows.map((row) => {
    const canEdit = row.isGlobalTemplate
      ? actorIsAdmin
      : row.memberId === actorMemberId;

    return {
      id: row.id,
      templateName: row.templateName,
      status: row.status,
      isGlobalTemplate: row.isGlobalTemplate,
      templateJson: row.templateJson,
      memberId: row.memberId,
      familyId: row.familyId,
      updatedAt: row.updatedAt ?? new Date(),
      ownerName: row.isGlobalTemplate
        ? "Global Template"
        : memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
      canEdit,
    };
  });
}

async function loadFoodiesRecipes(familyId: number): Promise<FoodiesRecipe[]> {
  const recipeRows = await db
    .select()
    .from(recipe)
    .where(and(eq(recipe.familyId, familyId), ne(recipe.status, "template")))
    .orderBy(desc(recipe.updatedAt), asc(recipe.recipeTitle));

  if (!recipeRows || recipeRows.length === 0) {
    return [];
  }

  const recipeIds = recipeRows.map((row) => row.id);

  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select({
        id: recipeComment.id,
        recipeId: recipeComment.recipeId,
        isRecipeProTip: recipeComment.isRecipeProTip,
      })
      .from(recipeComment)
      .where(inArray(recipeComment.recipeId, recipeIds)),
    db
      .select({
        recipeId: recipeLike.recipeId,
        likenessDegree: recipeLike.likenessDegree,
      })
      .from(recipeLike)
      .where(inArray(recipeLike.recipeId, recipeIds)),
    db
      .select({
        recipeId: recipeTag.recipeId,
        tagId: recipeTag.tagId,
        tagName: recipeTagReference.tagName,
        tagType: recipeTagReference.tagType,
      })
      .from(recipeTag)
      .innerJoin(recipeTagReference, eq(recipeTagReference.id, recipeTag.tagId))
      .where(inArray(recipeTag.recipeId, recipeIds)),
  ]);

  const memberIds = [...new Set(recipeRows.map((row) => row.memberId))];
  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  const commentCountByRecipeId = new Map<number, number>();
  const noRatingByRecipeId = new Map<number, number>();
  const thumbsUpByRecipeId = new Map<number, number>();
  const loveByRecipeId = new Map<number, number>();
  const tagIdsByRecipeId = new Map<number, number[]>();
  const tagNamesByTypeByRecipeId = new Map<number, Partial<Record<RecipeTagType, string[]>>>();

  for (const commentRow of commentRows) {
    if (commentRow.isRecipeProTip) {
      continue;
    }

    commentCountByRecipeId.set(commentRow.recipeId, (commentCountByRecipeId.get(commentRow.recipeId) ?? 0) + 1);
  }

  for (const likeRow of likeRows) {
    if (likeRow.likenessDegree === 1) {
      thumbsUpByRecipeId.set(likeRow.recipeId, (thumbsUpByRecipeId.get(likeRow.recipeId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === 2) {
      loveByRecipeId.set(likeRow.recipeId, (loveByRecipeId.get(likeRow.recipeId) ?? 0) + 1);
      continue;
    }

    if (likeRow.likenessDegree === -1) {
      noRatingByRecipeId.set(likeRow.recipeId, (noRatingByRecipeId.get(likeRow.recipeId) ?? 0) + 1);
    }
  }

  for (const tagRow of tagRows) {
    const existingTagIds = tagIdsByRecipeId.get(tagRow.recipeId) ?? [];
    existingTagIds.push(tagRow.tagId);
    tagIdsByRecipeId.set(tagRow.recipeId, existingTagIds);

    const tagType = tagRow.tagType as RecipeTagType;
    const byType = tagNamesByTypeByRecipeId.get(tagRow.recipeId) ?? {};
    const currentNames = byType[tagType] ?? [];
    byType[tagType] = [...currentNames, tagRow.tagName];
    tagNamesByTypeByRecipeId.set(tagRow.recipeId, byType);
  }

  return recipeRows.map((row) => ({
    id: row.id,
    recipeTitle: row.recipeTitle,
    recipeShortSummary: row.recipeShortSummary,
    recipeJson: row.recipeJson,
    status: row.status,
    recipeImageUrl: row.recipeImageUrl,
    prepTimeMins: row.prepTimeMins,
    cookTimeMins: row.cookTimeMins,
    updatedAt: row.updatedAt ?? new Date(),
    memberId: row.memberId,
    familyId: row.familyId,
    submitterName: memberNameById.get(row.memberId) ?? `Member #${row.memberId}`,
    commentCount: commentCountByRecipeId.get(row.id) ?? 0,
    noRatingCount: noRatingByRecipeId.get(row.id) ?? 0,
    thumbsUpCount: thumbsUpByRecipeId.get(row.id) ?? 0,
    loveCount: loveByRecipeId.get(row.id) ?? 0,
    selectedTagIds: tagIdsByRecipeId.get(row.id) ?? [],
    tagNamesByType: tagNamesByTypeByRecipeId.get(row.id) ?? {},
    templateId: row.templateId ?? null,
  }));
}

export async function getFoodiesRecipeById(
  familyId: number,
  recipeId: number
): Promise<GetFoodiesRecipeReturn> {
  const recipes = await loadFoodiesRecipes(familyId);
  const selectedRecipe = recipes.find((recipeRecord) => recipeRecord.id === recipeId);

  if (!selectedRecipe) {
    return {
      success: false,
      message: `No recipe was found for id: ${ recipeId }`,
    };
  }

  return {
    success: true,
    recipe: selectedRecipe,
  };
}

export async function getFoodiesHomePageData(
  familyId: number,
  memberId: number,
  isAdmin = false
): Promise<FoodiesHomePageDataReturn> {
  try {
    const isTemplateDebug = process.env.NODE_ENV !== "production";
    const [recipes, recipeTags, recipeTemplates] = await Promise.all([
      loadFoodiesRecipes(familyId),
      loadRecipeTagOptions(),
      loadRecipeTemplates(familyId, memberId, {
        includeDraft: false,
        includeGlobal: true,
        ensureGlobalTemplate: isAdmin,
      }),
    ]);

    // if (isTemplateDebug) {
    //   console.log(
    //     "[Foodies][getFoodiesHomePageData] recipeTemplates",
    //     recipeTemplates.map((template) => ({
    //       id: template.id,
    //       label: template.label,
    //       isGlobalTemplate: template.isGlobalTemplate,
    //       status: template.status,
    //       hasTemplateJson: Boolean(template.templateJson && template.templateJson.trim().length > 0),
    //       templateJsonLength: template.templateJson?.length ?? 0,
    //     }))
    //   );
    // }

    return {
      success: true,
      recipes,
      recipeTags,
      recipeTemplates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading foodies home page data",
    };
  }
}

export async function getFoodiesTemplateManagementData(
  familyId: number,
  memberId: number,
  isAdmin: boolean
): Promise<FoodiesTemplateManagementDataReturn> {
  try {
    const templates = await loadFoodiesTemplateManagementRecords(familyId, memberId, isAdmin);

    return {
      success: true,
      templates,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error loading recipe templates",
    };
  }
}

export async function saveFoodiesRecipe(
  input: SaveFoodiesRecipeInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin?: boolean;
  }
): Promise<SaveFoodiesRecipeReturn> {
  const normalizedTitle = input.recipeTitle.trim();
  const normalizedSummary = input.recipeShortSummary.trim();
  const normalizedStatus = input.status.trim() || "draft";
  const normalizedPrepTime = Number.isFinite(input.prepTimeMins)
    ? Math.max(0, Math.round(input.prepTimeMins))
    : 0;
  const normalizedCookTime = Number.isFinite(input.cookTimeMins)
    ? Math.max(0, Math.round(input.cookTimeMins))
    : 0;
  const uniqueTagIds = [...new Set(input.selectedTagIds)];

  if (!normalizedTitle) {
    return {
      success: false,
      message: "Enter a recipe title before saving.",
    };
  }

  const existingRecipe = input.id
    ? await db
      .select()
      .from(recipe)
      .where(and(eq(recipe.id, input.id), eq(recipe.familyId, actor.familyId), ne(recipe.status, "template")))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingRecipe) {
    return {
      success: false,
      message: `No recipe was found for id: ${ input.id }`,
    };
  }

  if (existingRecipe && existingRecipe.memberId !== actor.memberId) {
    return {
      success: false,
      message: "Only the member who created this recipe can edit it.",
    };
  }

  const duplicateRows = await db
    .select({ id: recipe.id })
    .from(recipe)
    .where(
      input.id
        ? and(eq(recipe.familyId, actor.familyId), ilike(recipe.recipeTitle, normalizedTitle), ne(recipe.id, input.id))
        : and(eq(recipe.familyId, actor.familyId), ilike(recipe.recipeTitle, normalizedTitle))
    );

  if (duplicateRows.length > 0) {
    return {
      success: false,
      message: "A recipe with this title already exists in your family.",
    };
  }

  const templates = await loadRecipeTemplates(actor.familyId, actor.memberId, {
    includeDraft: false,
    includeGlobal: true,
    ensureGlobalTemplate: actor.isAdmin ?? false,
  });
  const selectedTemplate = templates.find((template) => template.id === input.templateId);

  if (!selectedTemplate) {
    return {
      success: false,
      message: "Select a valid recipe template before saving.",
    };
  }

  const incomingRecipeJson = input.recipeJson.trim();
  const parsedRecipeJson = incomingRecipeJson
    ? parseSerializedTipTapDocument(incomingRecipeJson)
    : { success: true as const, content: createEmptyTipTapDocument() };

  if (!parsedRecipeJson.success) {
    return {
      success: false,
      message: parsedRecipeJson.message,
    };
  }

  const recipeJsonToSave = serializeTipTapDocument(parsedRecipeJson.content);
  const incomingRecipeProTipsJson = input.recipeProTipsJson?.trim() ?? "";
  const parsedRecipeProTipsJson = incomingRecipeProTipsJson
    ? parseSerializedTipTapDocument(incomingRecipeProTipsJson)
    : { success: true as const, content: createEmptyTipTapDocument() };

  if (!parsedRecipeProTipsJson.success) {
    return {
      success: false,
      message: parsedRecipeProTipsJson.message,
    };
  }

  const recipeProTipsJsonToSave = serializeTipTapDocument(parsedRecipeProTipsJson.content);
  const hasRecipeProTips = !isTipTapDocumentEmpty(parsedRecipeProTipsJson.content);

  if (uniqueTagIds.length > 0) {
    const validTags = await db
      .select({ id: recipeTagReference.id })
      .from(recipeTagReference)
      .where(inArray(recipeTagReference.id, uniqueTagIds));

    if (validTags.length !== uniqueTagIds.length) {
      return {
        success: false,
        message: "One or more selected recipe tags are invalid.",
      };
    }
  }

  let createdRecipeId: number | null = null;

  try {
    const [savedRecipe] = existingRecipe
      ? await db
        .update(recipe)
        .set({
          recipeTitle: normalizedTitle,
          recipeShortSummary: normalizedSummary,
          recipeJson: recipeJsonToSave,
          status: normalizedStatus,
          recipeImageUrl: input.recipeImageUrl ?? null,
          prepTimeMins: normalizedPrepTime,
          cookTimeMins: normalizedCookTime,
          templateId: selectedTemplate.id,
          updatedAt: new Date(),
        })
        .where(eq(recipe.id, existingRecipe.id))
        .returning()
      : await db
        .insert(recipe)
        .values({
          recipeTitle: normalizedTitle,
          recipeShortSummary: normalizedSummary,
          recipeJson: recipeJsonToSave,
          status: normalizedStatus,
          recipeImageUrl: input.recipeImageUrl ?? null,
          prepTimeMins: normalizedPrepTime,
          cookTimeMins: normalizedCookTime,
          templateId: selectedTemplate.id,
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    if (!existingRecipe) {
      createdRecipeId = savedRecipe.id;
    }

    if (existingRecipe) {
      await db
        .delete(recipeTag)
        .where(eq(recipeTag.recipeId, existingRecipe.id));
    }

    if (uniqueTagIds.length > 0) {
      await db
        .insert(recipeTag)
        .values(uniqueTagIds.map((tagId) => ({
          recipeId: savedRecipe.id,
          tagId,
        })));
    }

    const existingActorProTip = await db
      .select({
        id: recipeComment.id,
      })
      .from(recipeComment)
      .where(
        and(
          eq(recipeComment.recipeId, savedRecipe.id),
          eq(recipeComment.memberId, actor.memberId),
          eq(recipeComment.isRecipeProTip, true)
        )
      )
      .orderBy(desc(recipeComment.createdAt))
      .then((rows) => rows[0] ?? null);

    if (hasRecipeProTips) {
      if (existingActorProTip) {
        await db
          .update(recipeComment)
          .set({
            commentJson: recipeProTipsJsonToSave,
          })
          .where(eq(recipeComment.id, existingActorProTip.id));
      } else {
        await db
          .insert(recipeComment)
          .values({
            recipeId: savedRecipe.id,
            memberId: actor.memberId,
            isRecipeProTip: true,
            commentJson: recipeProTipsJsonToSave,
          });
      }
    } else if (existingActorProTip) {
      await db
        .delete(recipeComment)
        .where(eq(recipeComment.id, existingActorProTip.id));
    }

    const [savedFoodiesRecipe] = await loadFoodiesRecipes(actor.familyId).then((rows) => rows.filter((row) => row.id === savedRecipe.id));

    if (!savedFoodiesRecipe) {
      return {
        success: false,
        message: "Recipe was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      recipe: savedFoodiesRecipe,
      message: `Recipe \"${savedFoodiesRecipe.recipeTitle}\" saved successfully.`,
    };
  } catch (error) {
    if (createdRecipeId) {
      try {
        await db
          .delete(recipe)
          .where(eq(recipe.id, createdRecipeId));
      } catch {
        // Best-effort cleanup only.
      }
    }

    return {
      success: false,
      message: error instanceof Error
        ? `Failed to save recipe changes. Best-effort cleanup was attempted: ${error.message}`
        : "Failed to save recipe changes. Best-effort cleanup was attempted.",
    };
  }
}

export async function saveFoodiesTemplate(
  input: SaveFoodiesTemplateInput,
  actor: {
    familyId: number;
    memberId: number;
    isAdmin: boolean;
  }
): Promise<SaveFoodiesTemplateReturn> {
  const normalizedName = input.templateName.trim();
  const normalizedStatus = input.status.trim().toLowerCase();
  const normalizedJson = input.templateJson.trim();

  if (!normalizedName) {
    return {
      success: false,
      message: "Enter a template name before saving.",
    };
  }

  if (normalizedStatus !== "draft" && normalizedStatus !== "published") {
    return {
      success: false,
      message: "Template status must be draft or published.",
    };
  }

  const parsedTemplateJson = parseSerializedTipTapDocument(normalizedJson);
  if (!parsedTemplateJson.success) {
    return {
      success: false,
      message: parsedTemplateJson.message,
    };
  }

  const existingTemplate = input.id
    ? await db
      .select()
      .from(recipeTemplate)
      .where(and(eq(recipeTemplate.id, input.id), eq(recipeTemplate.familyId, actor.familyId)))
      .then((rows) => rows[0] ?? null)
    : null;

  if (input.id && !existingTemplate) {
    return {
      success: false,
      message: `No template was found for id: ${input.id}`,
    };
  }

  if (existingTemplate) {
    if (existingTemplate.isGlobalTemplate && !actor.isAdmin) {
      return {
        success: false,
        message: "Only an admin can edit the global template.",
      };
    }

    if (!existingTemplate.isGlobalTemplate && existingTemplate.memberId !== actor.memberId) {
      return {
        success: false,
        message: "You can only edit templates you created.",
      };
    }
  }

  const duplicateRows = await db
    .select({ id: recipeTemplate.id })
    .from(recipeTemplate)
    .where(
      input.id
        ? and(
          eq(recipeTemplate.familyId, actor.familyId),
          ilike(recipeTemplate.templateName, normalizedName),
          ne(recipeTemplate.id, input.id)
        )
        : and(eq(recipeTemplate.familyId, actor.familyId), ilike(recipeTemplate.templateName, normalizedName))
    );

  if (duplicateRows.length > 0) {
    return {
      success: false,
      message: "A template with this name already exists in your family.",
    };
  }

  try {
    const [savedTemplate] = existingTemplate
      ? await db
        .update(recipeTemplate)
        .set({
          templateName: normalizedName,
          status: normalizedStatus,
          templateJson: serializeTipTapDocument(parsedTemplateJson.content),
          updatedAt: new Date(),
        })
        .where(eq(recipeTemplate.id, existingTemplate.id))
        .returning()
      : await db
        .insert(recipeTemplate)
        .values({
          templateName: normalizedName,
          status: normalizedStatus,
          isGlobalTemplate: false,
          templateJson: serializeTipTapDocument(parsedTemplateJson.content),
          memberId: actor.memberId,
          familyId: actor.familyId,
        })
        .returning();

    const templates = await loadFoodiesTemplateManagementRecords(actor.familyId, actor.memberId, actor.isAdmin);
    const savedTemplateRecord = templates.find((template) => template.id === savedTemplate.id);

    if (!savedTemplateRecord) {
      return {
        success: false,
        message: "Template was saved but could not be reloaded.",
      };
    }

    return {
      success: true,
      template: savedTemplateRecord,
      message: `Template "${savedTemplateRecord.templateName}" saved successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? `Failed to save template changes: ${error.message}`
        : "Failed to save template changes.",
    };
  }
}

async function loadFoodiesRecipeDetail(
  familyId: number,
  recipeId: number,
  viewerMemberId?: number
): Promise<FoodiesRecipeDetail | null> {
  const recipeRows = await db
    .select()
    .from(recipe)
    .where(and(eq(recipe.familyId, familyId), eq(recipe.id, recipeId), ne(recipe.status, "template")));

  if (!recipeRows || recipeRows.length === 0) {
    return null;
  }

  const recipeRow = recipeRows[0];
  const [commentRows, likeRows, tagRows] = await Promise.all([
    db
      .select()
      .from(recipeComment)
      .where(eq(recipeComment.recipeId, recipeId))
      .orderBy(asc(recipeComment.createdAt)),
    db
      .select({
        memberId: recipeLike.memberId,
        likenessDegree: recipeLike.likenessDegree,
      })
      .from(recipeLike)
      .where(eq(recipeLike.recipeId, recipeId)),
    db
      .select({
        tagId: recipeTag.tagId,
        tagName: recipeTagReference.tagName,
        tagType: recipeTagReference.tagType,
      })
      .from(recipeTag)
      .innerJoin(recipeTagReference, eq(recipeTagReference.id, recipeTag.tagId))
      .where(eq(recipeTag.recipeId, recipeId)),
  ]);

  const commentMemberIds = [...new Set(commentRows.map((row) => row.memberId).filter((memberId) => Number.isInteger(memberId)))];
  const memberIds = [...new Set([recipeRow.memberId, ...commentMemberIds])];

  const memberRows = memberIds.length > 0
    ? await db
      .select({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      })
      .from(member)
      .where(inArray(member.id, memberIds))
    : [];

  const memberNameById = new Map(
    memberRows.map((row) => [row.id, createSubmitterName(row.firstName, row.lastName)])
  );

  const noRatingCount = likeRows.filter((row) => row.likenessDegree === -1).length;
  const thumbsUpCount = likeRows.filter((row) => row.likenessDegree === 1).length;
  const loveCount = likeRows.filter((row) => row.likenessDegree === 2).length;
  const recipeProTipRows = commentRows.filter((row) => row.isRecipeProTip);
  const familyCommentRows = commentRows.filter((row) => !row.isRecipeProTip);

  const viewerLike = viewerMemberId
    ? likeRows.find((row) => row.memberId === viewerMemberId)
    : null;
  const likedByMember = Boolean(viewerLike && viewerLike.likenessDegree !== -1);
  const likenessDegree = viewerLike?.likenessDegree ?? null;

  const tagsByType = new Map<RecipeTagType, string[]>();
  for (const tagRow of tagRows) {
    const tagType = tagRow.tagType as RecipeTagType;
    const existing = tagsByType.get(tagType) ?? [];
    existing.push(tagRow.tagName);
    tagsByType.set(tagType, existing);
  }

  const tagIdsByRecipeId = new Map<number, number[]>();
  const tagNamesByTypeByRecipeId = new Map<number, Partial<Record<RecipeTagType, string[]>>>();

  for (const tagRow of tagRows) {
    const existingTagIds = tagIdsByRecipeId.get(recipeId) ?? [];
    existingTagIds.push(tagRow.tagId);
    tagIdsByRecipeId.set(recipeId, existingTagIds);

    const tagType = tagRow.tagType as RecipeTagType;
    const byType = tagNamesByTypeByRecipeId.get(recipeId) ?? {};
    const currentNames = byType[tagType] ?? [];
    byType[tagType] = [...currentNames, tagRow.tagName];
    tagNamesByTypeByRecipeId.set(recipeId, byType);
  }

  return {
    id: recipeRow.id,
    recipeTitle: recipeRow.recipeTitle,
    recipeShortSummary: recipeRow.recipeShortSummary,
    recipeJson: recipeRow.recipeJson,
    status: recipeRow.status,
    recipeImageUrl: recipeRow.recipeImageUrl,
    prepTimeMins: recipeRow.prepTimeMins,
    cookTimeMins: recipeRow.cookTimeMins,
    updatedAt: recipeRow.updatedAt ?? new Date(),
    memberId: recipeRow.memberId,
    familyId: recipeRow.familyId,
    submitterName: memberNameById.get(recipeRow.memberId) ?? `Member #${recipeRow.memberId}`,
    commentCount: familyCommentRows.length,
    noRatingCount,
    thumbsUpCount,
    loveCount,
    likedByMember,
    likenessDegree,
    selectedTagIds: tagIdsByRecipeId.get(recipeId) ?? [],
    tagNamesByType: tagNamesByTypeByRecipeId.get(recipeId) ?? {},
    templateId: recipeRow.templateId ?? null,
    recipeProTips: recipeProTipRows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt ?? new Date(),
      commenterName: memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
      memberId: row.memberId ?? 0,
      proTipJson: row.commentJson,
    })),
    recipeComments: familyCommentRows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt ?? new Date(),
      commenterName: memberNameById.get(row.memberId ?? 0) ?? `Member #${row.memberId ?? 0}`,
      text: row.commentJson,
    })),
  };
}

export async function getFoodiesRecipeDetail(
  familyId: number,
  recipeId: number,
  viewerMemberId?: number
): Promise<GetFoodiesRecipeDetailReturn> {
  try {
    const recipeDetail = await loadFoodiesRecipeDetail(familyId, recipeId, viewerMemberId);

    if (!recipeDetail) {
      return {
        success: false,
        message: "Recipe not found.",
      };
    }

    return {
      success: true,
      recipe: recipeDetail,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to load recipe detail.",
    };
  }
}

export async function toggleRecipeLike(
  recipeId: number,
  likenessDegree: number,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<ToggleRecipeLikeReturn> {
  const existingRecipe = await db
    .select()
    .from(recipe)
    .where(and(eq(recipe.familyId, actor.familyId), eq(recipe.id, recipeId), ne(recipe.status, "template")))
    .then((rows) => rows[0] ?? null);

  if (!existingRecipe) {
    return {
      success: false,
      message: "Recipe not found.",
    };
  }

  if (![1, 2].includes(likenessDegree)) {
    return {
      success: false,
      message: "Invalid like type.",
    };
  }

  try {
    const existingLike = await db
      .select()
      .from(recipeLike)
      .where(
        and(
          eq(recipeLike.recipeId, recipeId),
          eq(recipeLike.memberId, actor.memberId)
        )
      )
      .then((rows) => rows[0] ?? null);

    if (existingLike && existingLike.likenessDegree === likenessDegree) {
      await db
        .delete(recipeLike)
        .where(
          and(
            eq(recipeLike.recipeId, recipeId),
            eq(recipeLike.memberId, actor.memberId),
            eq(recipeLike.likenessDegree, likenessDegree)
          )
        );
    } else if (existingLike) {
      await db
        .update(recipeLike)
        .set({
          likenessDegree,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(recipeLike.recipeId, recipeId),
            eq(recipeLike.memberId, actor.memberId)
          )
        );
    } else {
      await db
        .insert(recipeLike)
        .values({
          recipeId,
          memberId: actor.memberId,
          likenessDegree,
        });
    }

    const updatedRecipe = await loadFoodiesRecipeDetail(actor.familyId, recipeId, actor.memberId);

    if (!updatedRecipe) {
      return {
        success: false,
        message: "Recipe was updated but could not be reloaded.",
      };
    }

    const actionText = existingLike && existingLike.likenessDegree === likenessDegree
      ? "reaction removed"
      : "reaction added";

    return {
      success: true,
      recipe: updatedRecipe,
      message: `Recipe ${actionText} successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update recipe reaction.",
    };
  }
}

export async function addRecipeComment(
  recipeId: number,
  commentText: string,
  actor: {
    familyId: number;
    memberId: number;
  }
): Promise<AddRecipeCommentReturn> {
  const normalizedComment = commentText.trim();

  if (normalizedComment.length < 2) {
    return {
      success: false,
      message: "Comment must be at least 2 characters.",
    };
  }

  const existingRecipe = await db
    .select()
    .from(recipe)
    .where(and(eq(recipe.familyId, actor.familyId), eq(recipe.id, recipeId), ne(recipe.status, "template")))
    .then((rows) => rows[0] ?? null);

  if (!existingRecipe) {
    return {
      success: false,
      message: "Recipe not found.",
    };
  }

  try {
    await db
      .insert(recipeComment)
      .values({
        recipeId,
        memberId: actor.memberId,
        commentJson: normalizedComment,
        isRecipeProTip: false,
      });

    const updatedRecipe = await loadFoodiesRecipeDetail(actor.familyId, recipeId, actor.memberId);

    if (!updatedRecipe) {
      return {
        success: false,
        message: "Comment was added but recipe could not be reloaded.",
      };
    }

    return {
      success: true,
      recipe: updatedRecipe,
      message: "Comment posted successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add comment.",
    };
  }
}

/*------------------ getRecipeTerms ------------------ */
export async function getRecipeTerms(): Promise<RecipeTermsReturn> {
  const result = await db
    .select()
    .from(recipeTerm)
    .orderBy(asc(recipeTerm.term));

  const recipeTerms = result.map((row) => ({
    id: row.id,
    term: row.term,
    termJson: row.termJson,
    status: row.status,
    updatedAt: row.updatedAt as Date,
  }));

  return { success: true, recipeTerms };
}

export async function getRecipeTermById(id: number): Promise<GetRecipeTermReturn> {
  const [result] = await db
    .select()
    .from(recipeTerm)
    .where(eq(recipeTerm.id, id));

  if (!result) {
    return { success: false, message: `No recipe term found for id: ${id}` };
  }

  return {
    success: true,
    recipeTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      updatedAt: result.updatedAt as Date,
    },
  };
}

export async function saveRecipeTerm(input: SaveRecipeTermInput): Promise<SaveRecipeTermReturn> {
  const parsedTermJson = parseSerializedTipTapDocument(input.termJson.trim());

  if (!parsedTermJson.success) {
    return { success: false, message: parsedTermJson.message };
  }

  const termPayload = {
    term: input.term.trim(),
    termJson: serializeTipTapDocument(parsedTermJson.content),
    status: input.status.trim(),
  };

  const duplicateConditions = input.id
    ? and(ilike(recipeTerm.term, termPayload.term), ne(recipeTerm.id, input.id))
    : ilike(recipeTerm.term, termPayload.term);

  const [existingTerm] = await db
    .select({ id: recipeTerm.id })
    .from(recipeTerm)
    .where(duplicateConditions)
    .limit(1);

  if (existingTerm) {
    return {
      success: false,
      message: `A term named "${termPayload.term}" already exists. Term names must be unique.`,
    };
  }

  if (input.id) {
    const [result] = await db
      .update(recipeTerm)
      .set(termPayload)
      .where(eq(recipeTerm.id, input.id))
      .returning();

    if (!result) {
      return { success: false, message: `Failed to update recipe term with id: ${input.id}` };
    }

    return {
      success: true,
      recipeTerm: {
        id: result.id,
        term: result.term,
        termJson: result.termJson,
        status: result.status,
        updatedAt: result.updatedAt as Date,
      },
      message: `Saved changes to "${result.term}".`,
    };
  }

  const [result] = await db
    .insert(recipeTerm)
    .values(termPayload)
    .returning();

  if (!result) {
    return { success: false, message: "Failed to create recipe term." };
  }

  return {
    success: true,
    recipeTerm: {
      id: result.id,
      term: result.term,
      termJson: result.termJson,
      status: result.status,
      updatedAt: result.updatedAt as Date,
    },
    message: `Created "${result.term}".`,
  };
}
