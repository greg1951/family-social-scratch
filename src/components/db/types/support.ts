export type ErrorReturnType = {
  error: boolean;
  message?: string;
}

export type SupportFaqStatus = "draft" | "published" | "archived";

export interface SupportFaqItem {
  id: number;
  faqType: string;
  questionJson: string;
  answerJson: string;
  status: SupportFaqStatus;
  seqNo: number;
  updatedAt: Date | null;
}

export interface SaveSupportFaqInput {
  id?: number;
  faqType?: string;
  questionJson: string;
  answerJson: string;
  status?: SupportFaqStatus;
  seqNo: number;
}

export type SupportFaqTypeOptionsReturn =
  | { success: false; message: string }
  | {
      success: true;
      faqTypes: string[];
    };

export interface DeleteSupportFaqInput {
  id: number;
}

export type SupportFaqItemsReturn =
  | { success: false; message: string }
  | {
      success: true;
      faqItems: SupportFaqItem[];
    };

export type SaveSupportFaqReturn =
  | { success: false; message: string }
  | {
      success: true;
      faqItem: SupportFaqItem;
      message: string;
    };

export type DeleteSupportFaqReturn =
  | { success: false; message: string }
  | {
      success: true;
      deletedId: number;
      message: string;
    };
