export const GLOBAL_TEMPLATE_FAMILY_ID = 1;

export interface TemplateAccessRecord {
  isGlobalTemplate: boolean;
  familyId: number | null;
  memberId: number | null;
}

export function canViewTemplate(
  template: TemplateAccessRecord,
  familyId: number,
  memberId: number
): boolean {
  if (template.isGlobalTemplate) {
    return template.familyId === GLOBAL_TEMPLATE_FAMILY_ID;
  }

  return template.familyId === familyId && template.memberId === memberId;
}
