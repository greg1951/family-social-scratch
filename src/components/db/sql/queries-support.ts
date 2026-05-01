import type { JSONContent } from "@tiptap/core";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import db from "@/components/db/drizzle";
import {
	member,
	supportAttachment,
	supportFamily,
	supportIssue,
	supportPerson,
	supportPersonIssue,
	supportResponse,
	supportTeam,
} from "@/components/db/schema/family-social-schema-tables";
import {
	createSupportIssueSchema,
	createSupportResponseSchema,
	type CreateSupportIssueContext,
	type CreateSupportIssueInput,
	type CreateSupportIssueResult,
	type CreateSupportResponseInput,
	type CreateSupportResponseResult,
	type SupportAttachmentDraft,
	type SupportIssueDetail,
	type SupportIssueListItem,
	type UpdateIssueTeamResult,
} from "@/components/db/types/support";
import {
	createTextTipTapDocument,
	parseSerializedTipTapDocument,
	serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { createThreadConversationWithInitialPost } from "@/components/db/sql/queries-thread-convos";

function formatValidationMessage(input: CreateSupportIssueInput): string {
	const parsed = createSupportIssueSchema.safeParse(input);

	if (parsed.success) {
		return "Unable to create support issue.";
	}

	const firstIssue = parsed.error.issues[0];
	return firstIssue?.message ?? "Unable to create support issue.";
}

function getAttachmentType(attachment: SupportAttachmentDraft): string {
	const mimeType = attachment.type.trim().toLowerCase();

	if (mimeType.startsWith("image/")) {
		return "image";
	}

	return "file";
}

function extractTextFromTipTapNode(node: unknown): string {
	if (!node || typeof node !== "object") {
		return "";
	}

	const currentNode = node as {
		type?: string;
		text?: string;
		content?: unknown[];
	};

	if (typeof currentNode.text === "string") {
		return currentNode.text;
	}

	if (!Array.isArray(currentNode.content)) {
		return "";
	}

	const separator = currentNode.type === "paragraph"
		|| currentNode.type === "bulletList"
		|| currentNode.type === "orderedList"
		|| currentNode.type === "listItem"
		? "\n"
		: " ";

	return currentNode.content
		.map((childNode) => extractTextFromTipTapNode(childNode))
		.filter((value) => value.trim().length > 0)
		.join(separator);
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function buildAttachmentJson(attachment: SupportAttachmentDraft) {
	return {
		fileName: attachment.name,
		mimeType: attachment.type,
		fileSizeBytes: attachment.size,
		lastModified: attachment.lastModified ?? null,
		storageStatus: "pending-support-s3-bucket",
		storageLocation: null,
	};
}

function buildSupportReplyPath(issueId: number, responseId: number): string {
	return `/open-issue/reply?supportIssueId=${ issueId }&issueResponseId=${ responseId }`;
}

function appendSupportReplyLink(
	responseJson: string,
	issueId: number,
	responseId: number,
	isProposedSolution: boolean,
): string {
	const parsedDocument = parseSerializedTipTapDocument(responseJson);
	const baseDocument = parsedDocument.success
		? parsedDocument.content
		: createTextTipTapDocument("You have a new response from Family Social Support.");
	const replyPath = buildSupportReplyPath(issueId, responseId);
	const nextContent = Array.isArray(baseDocument.content) ? [...baseDocument.content] : [];

	if (isProposedSolution) {
		nextContent.push({
			type: "paragraph",
			content: [
				{
					type: "text",
					text: "Support marked this response as a proposed solution.",
				},
			],
		} as JSONContent);
	}

	nextContent.push({
		type: "paragraph",
	});
	nextContent.push({
		type: "paragraph",
		content: [
			{
				type: "text",
				text: "Reply back to support here",
				marks: [
					{
						type: "link",
						attrs: {
							href: replyPath,
						},
					},
				],
			},
		],
	} as JSONContent);

	return serializeTipTapDocument({
		...baseDocument,
		type: "doc",
		content: nextContent,
	});
}

export async function createSupportIssue(
	input: CreateSupportIssueInput,
	context: CreateSupportIssueContext,
): Promise<CreateSupportIssueResult> {
	const parsedInput = createSupportIssueSchema.safeParse(input);

	if (!parsedInput.success) {
		return {
			success: false,
			message: formatValidationMessage(input),
		};
	}

	const descriptionDocument = parseSerializedTipTapDocument(parsedInput.data.descriptionJson);

	if (!descriptionDocument.success) {
		return {
			success: false,
			message: "Description must be valid TipTap JSON.",
		};
	}

	const normalizedFamilyName = context.familyName.trim();
	const [matchedSupportFamily] = await db
		.select({
			id: supportFamily.id,
			familyName: supportFamily.familyName,
		})
		.from(supportFamily)
		.where(eq(supportFamily.familyName, normalizedFamilyName))
		.limit(1);

	if (!matchedSupportFamily) {
		return {
			success: false,
			message: `Support family record not found for ${ normalizedFamilyName }.`,
		};
	}

	const l1Teams = await db
		.select({ id: supportTeam.id })
		.from(supportTeam)
		.where(and(
			eq(supportTeam.supportLevel, "L1"),
			eq(supportTeam.status, "active"),
		))
		.orderBy(asc(supportTeam.id));

	if (l1Teams.length === 0) {
		return {
			success: false,
			message: "No active L1 support team is available to receive this issue.",
		};
	}

	const l1TeamIds = l1Teams.map((team) => team.id);
	const [assignedSupportPerson] = await db
		.select({
			id: supportPerson.id,
			firstName: supportPerson.firstName,
			lastName: supportPerson.lastName,
		})
		.from(supportPerson)
		.where(and(
			eq(supportPerson.status, "active"),
			inArray(supportPerson.supportTeamId, l1TeamIds),
		))
		.orderBy(asc(supportPerson.id))
		.limit(1);

	if (!assignedSupportPerson) {
		return {
			success: false,
			message: "No active L1 support person is available to receive this issue.",
		};
	}

	const descriptionPlainText = normalizeWhitespace(
		extractTextFromTipTapNode(descriptionDocument.content),
	);

	const issuePayload = {
		title: parsedInput.data.title,
		category: parsedInput.data.category,
		priority: parsedInput.data.priority,
		descriptionJson: parsedInput.data.descriptionJson,
		descriptionPlainText,
		createdBy: {
			memberId: context.memberId,
			familyId: context.familyId,
			familyName: normalizedFamilyName,
			memberName: context.memberName,
		},
		attachment: parsedInput.data.attachment ? buildAttachmentJson(parsedInput.data.attachment) : null,
	};

	const [createdIssue] = await db
		.insert(supportIssue)
		.values({
			issueType: parsedInput.data.category,
			issueTitle: parsedInput.data.title,
			issueJson: JSON.stringify(issuePayload),
			priority: parsedInput.data.priority.toLowerCase(),
			status: "open",
			updatedAt: new Date(),
			memberId: context.memberId,
			supportFamilyId: matchedSupportFamily.id,
		})
		.returning({
			id: supportIssue.id,
		});

	if (!createdIssue) {
		return {
			success: false,
			message: "Unable to create the support issue.",
		};
	}

	try {
		await db.insert(supportPersonIssue).values({
			supportIssueId: createdIssue.id,
			supportPersonId: assignedSupportPerson.id,
			createdAt: new Date(),
		});

		if (parsedInput.data.attachment) {
			await db.insert(supportAttachment).values({
				attachmentType: getAttachmentType(parsedInput.data.attachment),
				attachmentJson: JSON.stringify(buildAttachmentJson(parsedInput.data.attachment)),
				createdAt: new Date(),
				supportIssueId: createdIssue.id,
			});
		}
	} catch (error) {
		try {
			await db.delete(supportIssue).where(eq(supportIssue.id, createdIssue.id));
		} catch (cleanupError) {
			console.error("createSupportIssue cleanup failed", cleanupError);
		}

		console.error("createSupportIssue follow-up insert failed", error);

		return {
			success: false,
			message: "The support issue could not be finalized. Please try again.",
		};
	}

	const assignedSupportPersonName = `${ assignedSupportPerson.firstName } ${ assignedSupportPerson.lastName }`.trim() || "L1 support";

	return {
		success: true,
		issueId: createdIssue.id,
		message: "Your issue has been created and will be reviewed by the support team.",
		assignedSupportPersonName,
	};
}

// ─── List Issues ──────────────────────────────────────────────────────────────

export async function getSupportIssueList(): Promise<SupportIssueListItem[]> {
	const rows = await db
		.select({
			id: supportIssue.id,
			issueTitle: supportIssue.issueTitle,
			issueType: supportIssue.issueType,
			priority: supportIssue.priority,
			status: supportIssue.status,
			updatedAt: supportIssue.updatedAt,
			familyName: supportFamily.familyName,
			personFirstName: supportPerson.firstName,
			personLastName: supportPerson.lastName,
			teamLevel: supportTeam.supportLevel,
			personIssueId: supportPersonIssue.id,
			personId: supportPerson.id,
			teamId: supportTeam.id,
		})
		.from(supportIssue)
		.leftJoin(supportFamily, eq(supportIssue.supportFamilyId, supportFamily.id))
		.leftJoin(supportPersonIssue, eq(supportPersonIssue.supportIssueId, supportIssue.id))
		.leftJoin(supportPerson, eq(supportPersonIssue.supportPersonId, supportPerson.id))
		.leftJoin(supportTeam, eq(supportPerson.supportTeamId, supportTeam.id))
		.orderBy(desc(supportIssue.updatedAt));

	return rows.map((row) => ({
		id: row.id,
		issueTitle: row.issueTitle,
		issueType: row.issueType,
		priority: row.priority,
		status: row.status,
		updatedAt: row.updatedAt,
		familyName: row.familyName ?? null,
		assignedPersonName: row.personFirstName
			? `${row.personFirstName} ${row.personLastName}`.trim()
			: null,
		assignedTeamLevel: row.teamLevel ?? null,
		assignedPersonIssueId: row.personIssueId ?? null,
		assignedPersonId: row.personId ?? null,
		assignedTeamId: row.teamId ?? null,
	}));
}

export async function getSupportIssueDetail(issueId: number): Promise<SupportIssueDetail | null> {
	const [listRow] = await db
		.select({
			id: supportIssue.id,
			issueTitle: supportIssue.issueTitle,
			issueType: supportIssue.issueType,
			issueJson: supportIssue.issueJson,
			priority: supportIssue.priority,
			status: supportIssue.status,
			updatedAt: supportIssue.updatedAt,
			familyName: supportFamily.familyName,
			personFirstName: supportPerson.firstName,
			personLastName: supportPerson.lastName,
			teamLevel: supportTeam.supportLevel,
			personIssueId: supportPersonIssue.id,
			personId: supportPerson.id,
			teamId: supportTeam.id,
		})
		.from(supportIssue)
		.leftJoin(supportFamily, eq(supportIssue.supportFamilyId, supportFamily.id))
		.leftJoin(supportPersonIssue, eq(supportPersonIssue.supportIssueId, supportIssue.id))
		.leftJoin(supportPerson, eq(supportPersonIssue.supportPersonId, supportPerson.id))
		.leftJoin(supportTeam, eq(supportPerson.supportTeamId, supportTeam.id))
		.where(eq(supportIssue.id, issueId))
		.limit(1);

	if (!listRow) {
		return null;
	}

	const responses = await db
		.select({
			id: supportResponse.id,
			responseType: supportResponse.responseType,
			isProposedSolution: supportResponse.isProposedSolution,
			wasAccepted: supportResponse.wasAccepted,
			status: supportResponse.status,
			responseJson: supportResponse.responseJson,
			updatedAt: supportResponse.updatedAt,
		})
		.from(supportResponse)
		.where(eq(supportResponse.supportIssueId, issueId))
		.orderBy(desc(supportResponse.updatedAt));

	return {
		id: listRow.id,
		issueTitle: listRow.issueTitle,
		issueType: listRow.issueType,
		issueJson: listRow.issueJson,
		priority: listRow.priority,
		status: listRow.status,
		updatedAt: listRow.updatedAt,
		familyName: listRow.familyName ?? null,
		assignedPersonName: listRow.personFirstName
			? `${listRow.personFirstName} ${listRow.personLastName}`.trim()
			: null,
		assignedTeamLevel: listRow.teamLevel ?? null,
		assignedPersonIssueId: listRow.personIssueId ?? null,
		assignedPersonId: listRow.personId ?? null,
		assignedTeamId: listRow.teamId ?? null,
		responses,
	};
}

// ─── Update Team Assignment ───────────────────────────────────────────────────

export async function updateIssueTeamAssignment(
	issueId: number,
	targetLevel: "L1" | "L2",
): Promise<UpdateIssueTeamResult> {
	const targetTeams = await db
		.select({ id: supportTeam.id })
		.from(supportTeam)
		.where(and(
			eq(supportTeam.supportLevel, targetLevel),
			eq(supportTeam.status, "active"),
		))
		.orderBy(asc(supportTeam.id));

	if (targetTeams.length === 0) {
		return {
			success: false,
			message: `No active ${targetLevel} support team found.`,
		};
	}

	const targetTeamIds = targetTeams.map((t) => t.id);

	const [newPerson] = await db
		.select({
			id: supportPerson.id,
			firstName: supportPerson.firstName,
			lastName: supportPerson.lastName,
		})
		.from(supportPerson)
		.where(and(
			eq(supportPerson.status, "active"),
			inArray(supportPerson.supportTeamId, targetTeamIds),
		))
		.orderBy(asc(supportPerson.id))
		.limit(1);

	if (!newPerson) {
		return {
			success: false,
			message: `No active ${targetLevel} support person available.`,
		};
	}

	// Remove existing assignment and insert new one
	await db
		.delete(supportPersonIssue)
		.where(eq(supportPersonIssue.supportIssueId, issueId));

	await db.insert(supportPersonIssue).values({
		supportIssueId: issueId,
		supportPersonId: newPerson.id,
		createdAt: new Date(),
	});

	await db
		.update(supportIssue)
		.set({ updatedAt: new Date() })
		.where(eq(supportIssue.id, issueId));

	const newPersonName = `${newPerson.firstName} ${newPerson.lastName}`.trim() || targetLevel;

	return {
		success: true,
		newTeamLevel: targetLevel,
		newPersonName,
		message: `Issue reassigned to ${targetLevel} support (${newPersonName}).`,
	};
}

// ─── Create Response ──────────────────────────────────────────────────────────

export async function createSupportResponse(
	issueId: number,
	input: CreateSupportResponseInput,
): Promise<CreateSupportResponseResult> {
	const parsed = createSupportResponseSchema.safeParse(input);

	if (!parsed.success) {
		const firstIssue = parsed.error.issues[0];
		return {
			success: false,
			message: firstIssue?.message ?? "Unable to create response.",
		};
	}

	const descriptionDocument = parseSerializedTipTapDocument(parsed.data.responseJson);

	if (!descriptionDocument.success) {
		return {
			success: false,
			message: "Response must be valid TipTap JSON.",
		};
	}

	const [issue] = await db
		.select({ id: supportIssue.id, memberId: supportIssue.memberId, issueJson: supportIssue.issueJson })
		.from(supportIssue)
		.where(eq(supportIssue.id, issueId))
		.limit(1);

	if (!issue) {
		return { success: false, message: "Support issue not found." };
	}

	const [created] = await db
		.insert(supportResponse)
		.values({
			responseType: "general",
			isProposedSolution: parsed.data.isProposedSolution,
			wasAccepted: false,
			status: "open",
			responseJson: parsed.data.responseJson,
			updatedAt: new Date(),
			supportIssueId: issueId,
		})
		.returning({ id: supportResponse.id });

	if (!created) {
		return { success: false, message: "Unable to save the response." };
	}

	await db
		.update(supportIssue)
		.set({ updatedAt: new Date() })
		.where(eq(supportIssue.id, issueId));

	// Send a private Family Thread to the ticket submitter — non-fatal
	try {
		const issueContext = issue.issueJson
			? (JSON.parse(issue.issueJson) as { createdBy?: { familyId?: number; memberId?: number } })
			: {};
		const recipientFamilyId = issueContext.createdBy?.familyId;
		const recipientMemberId = issue.memberId ?? issueContext.createdBy?.memberId;

		if (recipientFamilyId && recipientMemberId) {
			// Use the family founder as the sender (admin is in a different family)
			const [founderRow] = await db
				.select({ id: member.id })
				.from(member)
				.where(and(eq(member.familyId, recipientFamilyId), eq(member.isFounder, true)))
				.limit(1);

			const senderMemberId = founderRow?.id ?? recipientMemberId;
			const supportReplyPath = buildSupportReplyPath(issueId, created.id);
			const threadResponseJson = appendSupportReplyLink(
				parsed.data.responseJson,
				issueId,
				created.id,
				parsed.data.isProposedSolution,
			);

			const plainText = descriptionDocument.content
				? descriptionDocument.content.content
						?.flatMap((node: { content?: { text?: string }[] }) => node.content ?? [])
						.map((n: { text?: string }) => n.text ?? "")
						.join(" ")
						.trim()
				: "";

			const threadResult = await createThreadConversationWithInitialPost(
				{
					title: "Support Response",
					subject: "Your support ticket has a new response",
					visibility: "private",
					recipientMemberIds: [recipientMemberId],
					content: [
						plainText || "You have a new response to your support ticket.",
						`Reply back to support here: ${ supportReplyPath }`,
					].join("\n\n"),
					contentJson: threadResponseJson,
				},
				{ familyId: recipientFamilyId, senderMemberId, isFounder: !!founderRow },
			);

			if (threadResult.success) {
				await db
					.update(supportResponse)
					.set({ threadSentAt: new Date() })
					.where(eq(supportResponse.id, created.id));
			}
		}
	} catch {
		// Thread notification failure is non-fatal; response was already saved
	}

	return {
		success: true,
		responseId: created.id,
		message: "Response saved successfully.",
	};
}

export async function getMemberSupportIssueResponseContext(
	supportIssueId: number,
	issueResponseId: number,
	memberId: number,
): Promise<
	| {
		success: true;
		issue: {
			id: number;
			issueTitle: string | null;
			issueJson: string;
			status: string;
		};
		response: {
			id: number;
			responseJson: string;
			isProposedSolution: boolean;
			updatedAt: Date | null;
		};
	}
	| { success: false; message: string }
> {
	const [issue] = await db
		.select({
			id: supportIssue.id,
			issueTitle: supportIssue.issueTitle,
			issueJson: supportIssue.issueJson,
			status: supportIssue.status,
		})
		.from(supportIssue)
		.where(and(eq(supportIssue.id, supportIssueId), eq(supportIssue.memberId, memberId)))
		.limit(1);

	if (!issue) {
		return {
			success: false,
			message: "Support issue was not found for this account.",
		};
	}

	const [response] = await db
		.select({
			id: supportResponse.id,
			responseJson: supportResponse.responseJson,
			isProposedSolution: supportResponse.isProposedSolution,
			updatedAt: supportResponse.updatedAt,
		})
		.from(supportResponse)
		.where(and(eq(supportResponse.id, issueResponseId), eq(supportResponse.supportIssueId, supportIssueId)))
		.limit(1);

	if (!response) {
		return {
			success: false,
			message: "Support response was not found.",
		};
	}

	return {
		success: true,
		issue,
		response,
	};
}

export async function createMemberSupportResponse(
	issueId: number,
	input: CreateSupportResponseInput,
	memberId: number,
): Promise<CreateSupportResponseResult> {
	const parsed = createSupportResponseSchema.safeParse(input);

	if (!parsed.success) {
		const firstIssue = parsed.error.issues[0];
		return {
			success: false,
			message: firstIssue?.message ?? "Unable to create response.",
		};
	}

	const descriptionDocument = parseSerializedTipTapDocument(parsed.data.responseJson);

	if (!descriptionDocument.success) {
		return {
			success: false,
			message: "Response must be valid TipTap JSON.",
		};
	}

	const [issue] = await db
		.select({ id: supportIssue.id })
		.from(supportIssue)
		.where(and(eq(supportIssue.id, issueId), eq(supportIssue.memberId, memberId)))
		.limit(1);

	if (!issue) {
		return {
			success: false,
			message: "Support issue was not found for this account.",
		};
	}

	const [created] = await db
		.insert(supportResponse)
		.values({
			responseType: "member_reply",
			isProposedSolution: false,
			wasAccepted: parsed.data.wasAccepted,
			status: "open",
			responseJson: parsed.data.responseJson,
			updatedAt: new Date(),
			supportIssueId: issueId,
		})
		.returning({ id: supportResponse.id });

	if (!created) {
		return { success: false, message: "Unable to save the response." };
	}

	await db
		.update(supportIssue)
		.set({
			updatedAt: new Date(),
			status: parsed.data.wasAccepted ? "resolved" : "open",
		})
		.where(eq(supportIssue.id, issueId));

	return {
		success: true,
		responseId: created.id,
		message: "Your support reply was saved successfully.",
	};
}
