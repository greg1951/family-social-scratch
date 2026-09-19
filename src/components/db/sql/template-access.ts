export const GLOBAL_TEMPLATE_FAMILY_ID = 1;

export interface TemplateAccessRecord {
  isGlobalTemplate: boolean;
  familyId: number | null;
  memberId: number | null;
  status: string;
}

export function canViewTemplate(
  template: TemplateAccessRecord,
  familyId: number,
  memberId: number
): boolean {
  if (template.isGlobalTemplate) {
    return template.familyId === GLOBAL_TEMPLATE_FAMILY_ID;
  }

  if (template.familyId !== familyId) {
    return false;
  }

  // Drafts stay private to their author; published custom templates are family-wide.
  return template.status === "published" || template.memberId === memberId;
}
