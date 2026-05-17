import { describe, it, expect } from "vitest";
import {
  replaceTemplateVariables,
  hasTemplateVariables,
} from "../utils/template-variables";

describe("Template Variable Replacement", () => {
  const founderData = {
    founderFirstName: "John",
    founderLastName: "Smith",
  };

  describe("replaceTemplateVariables", () => {
    it("should replace single variable in text node", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello !!family-founder!!",
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      expect(parsed.content[0].content[0].text).toBe("Hello John Smith");
    });

    it("should replace multiple different variables", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Welcome !!family-founder-first!!. Your last name is !!family-founder-last!!.",
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      expect(parsed.content[0].content[0].text).toBe(
        "Welcome John. Your last name is Smith."
      );
    });

    it("should replace variables in multiple nodes", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "From: !!family-founder!!",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Dear !!family-founder-first!!",
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      expect(parsed.content[0].content[0].text).toBe("From: John Smith");
      expect(parsed.content[1].content[0].text).toBe("Dear John");
    });

    it("should not replace variables with incorrect case", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello !!Family-Founder!! and !!FAMILY-FOUNDER-FIRST!!",
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      // Variables with incorrect case should not be replaced
      // Variable names are case-sensitive
      expect(parsed.content[0].content[0].text).toBe(
        "Hello !!Family-Founder!! and !!FAMILY-FOUNDER-FIRST!!"
      );
    });

    it("should handle templates with marks (bold, italic, etc.)", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello ",
              },
              {
                type: "text",
                text: "!!family-founder!!",
                marks: [{ type: "bold" }],
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      expect(parsed.content[0].content[1].text).toBe("John Smith");
      expect(parsed.content[0].content[1].marks[0].type).toBe("bold");
    });

    it("should replace variables inside task list template nodes", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Send this to !!family-founder-first!!",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const result = replaceTemplateVariables(template, founderData);
      const parsed = JSON.parse(result);

      expect(parsed.content[0].type).toBe("taskList");
      expect(parsed.content[0].content[0].type).toBe("taskItem");
      expect(parsed.content[0].content[0].content[0].content[0].text).toBe("Send this to John");
    });

    it("should return original template if JSON parsing fails", () => {
      const invalidJson = "{ not valid json }";
      const result = replaceTemplateVariables(invalidJson, founderData);
      expect(result).toBe(invalidJson);
    });

    it("should handle empty template", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [],
      });

      const result = replaceTemplateVariables(template, founderData);
      expect(result).toBe(template);
    });
  });

  describe("hasTemplateVariables", () => {
    it("should detect single variable", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello !!family-founder!!",
              },
            ],
          },
        ],
      });

      expect(hasTemplateVariables(template)).toBe(true);
    });

    it("should detect multiple variables", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello !!family-founder!! and !!family-founder-first!!",
              },
            ],
          },
        ],
      });

      expect(hasTemplateVariables(template)).toBe(true);
    });

    it("should return false for template with no variables", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Hello World",
              },
            ],
          },
        ],
      });

      expect(hasTemplateVariables(template)).toBe(false);
    });

    it("should detect partial matches", () => {
      const template = JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "!!some-variable!!",
              },
            ],
          },
        ],
      });

      expect(hasTemplateVariables(template)).toBe(true);
    });
  });
});
