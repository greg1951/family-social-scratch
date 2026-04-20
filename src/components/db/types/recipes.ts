export interface RecipeComment {
  id: number;
  createdAt: Date;
  commenterName: string;
  text: string;
}

export interface FoodiesRecipeDetail {
  id: number;
  recipeTitle: string;
  recipeShortSummary: string;
  recipeJson: string;
  status: string;
  recipeImageUrl: string | null;
  prepTimeMins: number;
  cookTimeMins: number;
  updatedAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  commentCount: number;
  noRatingCount: number;
  thumbsUpCount: number;
  loveCount: number;
  likedByMember: boolean;
  likenessDegree: number | null;
  selectedTagIds: number[];
  tagNamesByType: Partial<Record<RecipeTagType, string[]>>;
  templateId: number | null;
  recipeComments: RecipeComment[];
}

export interface FoodiesRecipe {
  id: number;
  recipeTitle: string;
  recipeShortSummary: string;
  recipeJson: string;
  status: string;
  recipeImageUrl: string | null;
  prepTimeMins: number;
  cookTimeMins: number;
  updatedAt: Date;
  memberId: number;
  familyId: number;
  submitterName: string;
  commentCount: number;
  noRatingCount: number;
  thumbsUpCount: number;
  loveCount: number;
  selectedTagIds: number[];
  tagNamesByType: Partial<Record<RecipeTagType, string[]>>;
  templateId: number | null;
}

export interface RecipeTagOption {
  id: number;
  tagName: string;
  tagDesc?: string | null;
  tagType: RecipeTagType;
  status: string;
  seqNo: number;
}

export interface RecipeTemplateOption {
  id: number;
  templateName: string;
  isGlobalTemplate: boolean;
  status: string;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  label: string;
}

export interface FoodiesTemplateRecord {
  id: number;
  templateName: string;
  status: string;
  isGlobalTemplate: boolean;
  templateJson: string;
  memberId: number | null;
  familyId: number | null;
  updatedAt: Date;
  ownerName: string;
  canEdit: boolean;
}

export type RecipeTagType =
  | "cuisine"
  | "course_type"
  | "cooking_method"
  | "dietary"
  | "meal_time";

export type FoodiesHomePageDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipes: FoodiesRecipe[];
      recipeTags: RecipeTagOption[];
      recipeTemplates: RecipeTemplateOption[];
    };

export type FoodiesTemplateManagementDataReturn =
  | { success: false; message: string }
  | {
      success: true;
      templates: FoodiesTemplateRecord[];
    };

export interface SaveFoodiesRecipeInput {
  id?: number;
  recipeTitle: string;
  recipeShortSummary: string;
  prepTimeMins: number;
  cookTimeMins: number;
  status: string;
  recipeImageUrl?: string | null;
  recipeJson: string;
  templateId: number;
  selectedTagIds: number[];
}

export type GetFoodiesRecipeReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipe: FoodiesRecipe;
    };

export type GetFoodiesRecipeDetailReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipe: FoodiesRecipeDetail;
    };

export type SaveFoodiesRecipeReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipe: FoodiesRecipe;
      message: string;
    };

export interface SaveFoodiesTemplateInput {
  id?: number;
  templateName: string;
  status: string;
  templateJson: string;
}

export type SaveFoodiesTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: FoodiesTemplateRecord;
      message: string;
    };

export interface ToggleRecipeLikeInput {
  recipeId: number;
  likenessDegree: number;
}

export type ToggleRecipeLikeReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipe: FoodiesRecipeDetail;
      message: string;
    };

export interface AddRecipeCommentInput {
  recipeId: number;
  commentText: string;
}

export type AddRecipeCommentReturn =
  | { success: false; message: string }
  | {
      success: true;
      recipe: FoodiesRecipeDetail;
      message: string;
    };

export interface RecipeTerm {
  id: number;
  term: string;
  termJson: string;
  status: string;
  updatedAt: Date;
}

export interface SaveRecipeTermInput {
  id?: number;
  term: string;
  termJson: string;
  status: string;
}

export type SaveRecipeTermReturn =
  | { success: false; message: string }
  | { success: true; recipeTerm: RecipeTerm; message: string };

export type GetRecipeTermReturn =
  | { success: false; message: string }
  | { success: true; recipeTerm: RecipeTerm };

export type RecipeTermsReturn =
  | { success: false; message: string }
  | { success: true; recipeTerms: RecipeTerm[] };
