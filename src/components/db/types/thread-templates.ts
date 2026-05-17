export interface ThreadTemplate {
  id: number;
  templateName: string;
  templateCategory: "global" | "thread";
  templateJson: string;
  seqNo: number;
  status: "draft" | "active" | "archived";
  updatedAt: Date;
}

export interface ThreadTemplateInput {
  id?: number;
  templateName: string;
  templateCategory: "global" | "thread";
  templateJson: string;
  status: "draft" | "active" | "archived";
}

export type SaveThreadTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: ThreadTemplate;
      message: string;
    };

export type GetThreadTemplatesReturn =
  | { success: false; message: string }
  | {
      success: true;
      templates: ThreadTemplate[];
    };

export type GetThreadTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      template: ThreadTemplate;
    };

export type DeleteThreadTemplateReturn =
  | { success: false; message: string }
  | {
      success: true;
      message: string;
    };
