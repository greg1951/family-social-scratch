import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getMasterKey(): Buffer {
	const rawKey = process.env.S3_CREDENTIALS_MASTER_KEY;

	if (!rawKey) {
		throw new Error("S3_CREDENTIALS_MASTER_KEY is required");
	}

	if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
		return Buffer.from(rawKey, "hex");
	}

	if (/^[A-Za-z0-9+/=]+$/.test(rawKey)) {
		const decoded = Buffer.from(rawKey, "base64");
		if (decoded.length === 32) {
			return decoded;
		}
	}

	throw new Error("S3_CREDENTIALS_MASTER_KEY must be 32-byte base64 or 64-char hex");
}

export function encryptS3Value(plainText: string): string {
	const key = getMasterKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptS3Value(cipherText: string): string {
	const key = getMasterKey();
	const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");

	if (!ivHex || !authTagHex || !encryptedHex) {
		throw new Error("Invalid encrypted value format");
	}

	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encrypted = Buffer.from(encryptedHex, "hex");

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
	return decrypted.toString("utf8");
}
