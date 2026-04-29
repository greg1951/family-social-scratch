"use server";

import { asc, desc, eq } from "drizzle-orm";
import db from '@/components/db/drizzle';
import { supportFaq, supportFaqQna } from "@/components/db/schema/family-social-schema-tables";
import {
	createEmptyTipTapDocument,
	createTextTipTapDocument,
	isTipTapDocumentEmpty,
	parseSerializedTipTapDocument,
	serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import {
	DeleteSupportFaqReturn,
	SaveSupportFaqInput,
	SaveSupportFaqReturn,
	SupportFaqItem,
	SupportFaqItemsReturn,
	SupportFaqStatus,
	SupportFaqTypeOptionsReturn,
} from "@/components/db/types/support";

const SUPPORT_FAQ_STATUSES: readonly SupportFaqStatus[] = ["draft", "published", "archived"];

function isSupportFaqStatus(value: string): value is SupportFaqStatus {
	return SUPPORT_FAQ_STATUSES.includes(value as SupportFaqStatus);
}

function toSerializedFaqAnswerJson(value?: string): string {
	if (!value || value.trim().length === 0) {
		return serializeTipTapDocument(createEmptyTipTapDocument());
	}

	const parsedTipTap = parseSerializedTipTapDocument(value);

	if (parsedTipTap.success) {
		return serializeTipTapDocument(parsedTipTap.content);
	}

	try {
		const parsed = JSON.parse(value) as { answer?: unknown };

		if (typeof parsed.answer === "string") {
			const wrappedContent = createTextTipTapDocument(parsed.answer);
			return serializeTipTapDocument(wrappedContent);
		}
	} catch {
		// Keep fallback below for plain text values.
	}

	return serializeTipTapDocument(createTextTipTapDocument(value));
}

function toSerializedFaqQuestionJson(value?: string): string {
	if (!value || value.trim().length === 0) {
		return serializeTipTapDocument(createEmptyTipTapDocument());
	}

	const parsedTipTap = parseSerializedTipTapDocument(value);

	if (parsedTipTap.success) {
		return serializeTipTapDocument(parsedTipTap.content);
	}

	return serializeTipTapDocument(createTextTipTapDocument(value));
}

function mapSupportFaqItem(row: {
	faqId: number;
	faqType: string;
	status: string;
	seqNo: number;
	faqQuestion: string;
	faqAnswerJson: string;
	updatedAt: Date | null;
}): SupportFaqItem {
	return {
		id: row.faqId,
		faqType: row.faqType,
		questionJson: toSerializedFaqQuestionJson(row.faqQuestion),
		answerJson: toSerializedFaqAnswerJson(row.faqAnswerJson),
		status: isSupportFaqStatus(row.status) ? row.status : "draft",
		seqNo: row.seqNo,
		updatedAt: row.updatedAt,
	};
}

export async function getSupportFaqTypeOptions(): Promise<SupportFaqTypeOptionsReturn> {
	try {
		const rows = await db
			.select({ faqType: supportFaq.faqType })
			.from(supportFaq)
			.orderBy(asc(supportFaq.faqType));

		const uniqueTypes = [...new Set(rows.map((row) => row.faqType.trim()).filter(Boolean))];
		const faqTypes = uniqueTypes.includes("global")
			? uniqueTypes
			: ["global", ...uniqueTypes];

		return {
			success: true,
			faqTypes,
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unable to load FAQ type options.",
		};
	}
}

export async function getSupportFaqItems(): Promise<SupportFaqItemsReturn> {
	try {
		const rows = await db
			.select({
				faqId: supportFaq.id,
				faqType: supportFaq.faqType,
				status: supportFaq.status,
				seqNo: supportFaq.seqNo,
				faqQuestion: supportFaqQna.faqQuestion,
				faqAnswerJson: supportFaqQna.faqAnswerJson,
				updatedAt: supportFaqQna.updatedAt,
			})
			.from(supportFaq)
			.innerJoin(supportFaqQna, eq(supportFaqQna.faqId, supportFaq.id))
			.orderBy(asc(supportFaq.seqNo));

		return {
			success: true,
			faqItems: rows.map(mapSupportFaqItem),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unable to load support FAQs.",
		};
	}
}

export async function getPublishedSupportFaqItems(): Promise<SupportFaqItemsReturn> {
	try {
		const rows = await db
			.select({
				faqId: supportFaq.id,
				faqType: supportFaq.faqType,
				status: supportFaq.status,
				seqNo: supportFaq.seqNo,
				faqQuestion: supportFaqQna.faqQuestion,
				faqAnswerJson: supportFaqQna.faqAnswerJson,
				updatedAt: supportFaqQna.updatedAt,
			})
			.from(supportFaq)
			.innerJoin(supportFaqQna, eq(supportFaqQna.faqId, supportFaq.id))
			.where(eq(supportFaq.status, "published"))
			.orderBy(asc(supportFaq.seqNo), asc(supportFaq.id));

		return {
			success: true,
			faqItems: rows.map(mapSupportFaqItem),
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unable to load published FAQs.",
		};
	}
}

export async function saveSupportFaq(input: SaveSupportFaqInput): Promise<SaveSupportFaqReturn> {
	const normalizedFaqType = input.faqType?.trim() || "global";
	const normalizedQuestionJson = toSerializedFaqQuestionJson(input.questionJson.trim());
	const normalizedAnswerJson = toSerializedFaqAnswerJson(input.answerJson.trim());
	const candidateStatus = input.status?.trim() || "published";
	const normalizedStatus: SupportFaqStatus = isSupportFaqStatus(candidateStatus)
		? candidateStatus
		: "published";
	const parsedQuestionDocument = parseSerializedTipTapDocument(normalizedQuestionJson);
	const parsedAnswerDocument = parseSerializedTipTapDocument(normalizedAnswerJson);

	if (!parsedQuestionDocument.success) {
		return {
			success: false,
			message: parsedQuestionDocument.message,
		};
	}

	if (isTipTapDocumentEmpty(parsedQuestionDocument.content)) {
		return {
			success: false,
			message: "Enter a question before saving.",
		};
	}

	if (!parsedAnswerDocument.success) {
		return {
			success: false,
			message: parsedAnswerDocument.message,
		};
	}

	if (isTipTapDocumentEmpty(parsedAnswerDocument.content)) {
		return {
			success: false,
			message: "Enter an answer before saving.",
		};
	}

	try {
		if (input.id) {
			const [existingQna] = await db
				.select({ id: supportFaqQna.id })
				.from(supportFaqQna)
				.where(eq(supportFaqQna.faqId, input.id));

			if (!existingQna) {
				throw new Error(`No support FAQ was found for id ${ input.id }.`);
			}

			const nextFaqJson = JSON.stringify({
				faqType: normalizedFaqType,
				questionJson: normalizedQuestionJson,
				answerJson: normalizedAnswerJson,
			});

			await db
				.update(supportFaq)
				.set({
					faqType: normalizedFaqType,
					faqJson: nextFaqJson,
					status: normalizedStatus,
					seqNo: input.seqNo ?? 1,
					updatedAt: new Date(),
				})
				.where(eq(supportFaq.id, input.id));

			const [updatedQna] = await db
				.update(supportFaqQna)
				.set({
					faqQuestion: normalizedQuestionJson,
					faqAnswerJson: normalizedAnswerJson,
					updatedAt: new Date(),
				})
				.where(eq(supportFaqQna.faqId, input.id))
				.returning({
					faqId: supportFaqQna.faqId,
					faqQuestion: supportFaqQna.faqQuestion,
					faqAnswerJson: supportFaqQna.faqAnswerJson,
					updatedAt: supportFaqQna.updatedAt,
				});

			return {
				success: true,
				faqItem: {
					id: updatedQna.faqId,
					faqType: normalizedFaqType,
					questionJson: toSerializedFaqQuestionJson(updatedQna.faqQuestion),
					answerJson: toSerializedFaqAnswerJson(updatedQna.faqAnswerJson),
					status: normalizedStatus,
					updatedAt: updatedQna.updatedAt,
				},
				message: "FAQ updated.",
			};
		}

		const faqJson = JSON.stringify({
			faqType: normalizedFaqType,
			questionJson: normalizedQuestionJson,
			answerJson: normalizedAnswerJson,
		});

		const [insertedFaq] = await db
			.insert(supportFaq)
			.values({
				faqType: normalizedFaqType,
				faqJson,
				status: normalizedStatus,
				seqNo: input.seqNo ?? 1,
				updatedAt: new Date(),
			})
			.returning({
				id: supportFaq.id,
				status: supportFaq.status,
			});

		const [insertedQna] = await db
			.insert(supportFaqQna)
			.values({
				faqId: insertedFaq.id,
				faqQuestion: normalizedQuestionJson,
				faqAnswerJson: normalizedAnswerJson,
				updatedAt: new Date(),
			})
			.returning({
				faqId: supportFaqQna.faqId,
				faqQuestion: supportFaqQna.faqQuestion,
				faqAnswerJson: supportFaqQna.faqAnswerJson,
				updatedAt: supportFaqQna.updatedAt,
			});

		const insertedStatus = isSupportFaqStatus(insertedFaq.status)
			? insertedFaq.status
			: "published";

		return {
			success: true,
			faqItem: {
				id: insertedQna.faqId,
				faqType: normalizedFaqType,
				questionJson: toSerializedFaqQuestionJson(insertedQna.faqQuestion),
				answerJson: toSerializedFaqAnswerJson(insertedQna.faqAnswerJson),
				status: insertedStatus,
				updatedAt: insertedQna.updatedAt,
			},
			message: "FAQ created.",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unable to save support FAQ.",
		};
	}
}

export async function deleteSupportFaq(id: number): Promise<DeleteSupportFaqReturn> {
	if (!Number.isInteger(id) || id <= 0) {
		return {
			success: false,
			message: "A valid FAQ id is required.",
		};
	}

	try {
		const deletedRows = await db
			.delete(supportFaq)
			.where(eq(supportFaq.id, id))
			.returning({ id: supportFaq.id });

		if (deletedRows.length === 0) {
			return {
				success: false,
				message: `No support FAQ was found for id ${ id }.`,
			};
		}

		return {
			success: true,
			deletedId: id,
			message: "FAQ deleted.",
		};
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unable to delete support FAQ.",
		};
	}
}