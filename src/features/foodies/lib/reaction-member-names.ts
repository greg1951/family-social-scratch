export function getRecipeReactionMemberNames(
  reactionCount: number,
  memberNames: string[] | undefined | null,
  fallbackMemberNames: string[] | undefined | null
): string[] {
  if (memberNames && memberNames.length > 0) {
    return memberNames;
  }

  if (reactionCount > 0 && fallbackMemberNames && fallbackMemberNames.length > 0) {
    return fallbackMemberNames;
  }

  return [];
}
