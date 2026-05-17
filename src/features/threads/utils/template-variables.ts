/**
 * Template variable replacement utility for thread templates.
 * Supports delimited variables like !!family-founder!! and !!family-founder-first!!
 */

export interface FamilyFounderData {
  founderFirstName: string;
  founderLastName: string;
}

/**
 * Creates a registry of available variables and their values.
 * This registry can be extended with additional variables as needed.
 */
function createVariableRegistry(data: FamilyFounderData): Record<string, string> {
  return {
    "family-founder": `${data.founderFirstName} ${data.founderLastName}`,
    "family-founder-first": data.founderFirstName,
    "family-founder-last": data.founderLastName,
  };
}

/**
 * Replaces all delimited variables in a template string.
 * Variables are delimited with !! on both sides (e.g., !!family-founder!!)
 * 
 * @param template - The template string with variables
 * @param registry - Mapping of variable names to their replacement values
 * @returns The template with all variables replaced
 */
function replaceVariablesInString(template: string, registry: Record<string, string>): string {
  let result = template;
  
  for (const [varName, varValue] of Object.entries(registry)) {
    const pattern = new RegExp(`!!${varName}!!`, "g");
    result = result.replace(pattern, varValue);
  }
  
  return result;
}

/**
 * Recursively replaces variables in a TipTap JSON document.
 * Handles text nodes, marks, and nested structures.
 */
function replaceVariablesInNode(node: any, registry: Record<string, string>): any {
  if (typeof node === "string") {
    return replaceVariablesInString(node, registry);
  }
  
  if (Array.isArray(node)) {
    return node.map((item) => replaceVariablesInNode(item, registry));
  }
  
  if (node && typeof node === "object") {
    const result: any = {};
    
    for (const [key, value] of Object.entries(node)) {
      if (key === "text" && typeof value === "string") {
        // Replace variables in text content
        result[key] = replaceVariablesInString(value, registry);
      } else if (key === "marks" && Array.isArray(value)) {
        // Process marks array
        result[key] = value.map((mark) => replaceVariablesInNode(mark, registry));
      } else if (key === "content" && Array.isArray(value)) {
        // Process content array (nested nodes)
        result[key] = value.map((child) => replaceVariablesInNode(child, registry));
      } else {
        // Copy other properties as-is
        result[key] = value;
      }
    }
    
    return result;
  }
  
  return node;
}

/**
 * Main function to replace all variables in a template JSON string.
 * Parses the JSON, replaces variables throughout the document, and returns the updated JSON string.
 * 
 * @param templateJson - JSON string containing the template (typically from TipTap editor)
 * @param founderData - Family founder information for variable replacement
 * @returns The template JSON with variables replaced, or the original if parsing fails
 */
export function replaceTemplateVariables(
  templateJson: string,
  founderData: FamilyFounderData,
): string {
  try {
    const registry = createVariableRegistry(founderData);
    const template = JSON.parse(templateJson);
    const replaced = replaceVariablesInNode(template, registry);
    return JSON.stringify(replaced);
  } catch (error) {
    console.error("Error replacing template variables:", error);
    // Return original if parsing or replacement fails
    return templateJson;
  }
}

/**
 * Validates if the JSON structure is a valid TipTap document.
 * Returns error message if invalid, or undefined if valid.
 */
export function validateTipTapDocument(json: unknown): string | undefined {
  if (!json || typeof json !== "object") {
    return "Document must be an object";
  }

  const doc = json as Record<string, unknown>;

  if (doc.type !== "doc") {
    return "Document type must be 'doc'";
  }

  if (!Array.isArray(doc.content)) {
    return "Document content must be an array";
  }

  // Basic validation - at least check that content items have a type
  for (let i = 0; i < doc.content.length; i++) {
    const item = doc.content[i];
    if (!item || typeof item !== "object") {
      return `Content item ${i} is not an object`;
    }
    if (!(item as Record<string, unknown>).type) {
      return `Content item ${i} is missing required 'type' field`;
    }
  }

  return undefined;
}

/**
 * Checks if a template contains any variables that would be replaced.
 * Useful for determining if substitution is needed.
 */
export function hasTemplateVariables(templateJson: string): boolean {
  const variablePattern = /!![a-z-]+!!/gi;
  return variablePattern.test(templateJson);
}
