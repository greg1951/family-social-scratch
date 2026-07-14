'use server';

import { revalidatePath } from 'next/cache';

import { getMemberPageDetails } from '@/features/family/services/family-services';
import { saveFoodiesRecipe, saveFoodiesTemplate, toggleRecipeLike, addRecipeComment, getFoodiesRecipeDetail, deleteRecipe } from '@/components/db/sql/queries-foodies';
import { SaveFoodiesRecipeInput, SaveFoodiesTemplateInput, ToggleRecipeLikeInput, AddRecipeCommentInput } from '@/components/db/types/recipes';
import { withRequestCorrelation } from '@/components/db/sql/request-correlation';

export async function saveFoodiesRecipeAction(input: SaveFoodiesRecipeInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to add a recipe.',
      };
    }

    const result = await saveFoodiesRecipe(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isAdmin: memberDetails.isAdmin ?? false,
      isFounder: memberDetails.isFounder ?? false,
    });

    if (result.success) {
      revalidatePath('/foodies');
      revalidatePath('/foodies/add-recipe');
      revalidatePath(`/foodies/edit-recipe/${ result.recipe.id }`);
    }

    return result;
  });
}

export async function saveFoodiesTemplateAction(input: SaveFoodiesTemplateInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to manage recipe templates.',
      };
    }

    const result = await saveFoodiesTemplate(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isAdmin: memberDetails.isAdmin ?? false,
    });

    if (result.success) {
      revalidatePath('/foodies');
      revalidatePath('/foodies/add-recipe');
      revalidatePath('/foodies/templates');
    }

    return result;
  });
}

export async function toggleRecipeLikeAction(input: ToggleRecipeLikeInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to like a recipe.',
      };
    }

    const result = await toggleRecipeLike(input.recipeId, input.likenessDegree, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/foodies');
    }

    return result;
  });
}

export async function addRecipeCommentAction(input: AddRecipeCommentInput) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to comment on a recipe.',
      };
    }

    const result = await addRecipeComment(input, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
    });

    if (result.success) {
      revalidatePath('/foodies');
    }

    return result;
  }, input.clientRequestId);
}

export async function deleteFoodiesRecipeAction(input: { recipeId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to delete a recipe.',
      };
    }

    const result = await deleteRecipe(input.recipeId, {
      familyId: memberDetails.familyId,
      memberId: memberDetails.memberId,
      isFounder: memberDetails.isFounder ?? false,
    });

    if (result.success) {
      revalidatePath('/foodies');
    }

    return result;
  });
}

export async function getFoodiesRecipeDetailAction(input: { recipeId: number }) {
  return withRequestCorrelation(async () => {
    const memberDetails = await getMemberPageDetails();

    if (!memberDetails.isLoggedIn) {
      return {
        success: false as const,
        message: 'You must be signed in to view recipe details.',
      };
    }

    return getFoodiesRecipeDetail(
      memberDetails.familyId,
      input.recipeId,
      memberDetails.memberId
    );
  });
}
