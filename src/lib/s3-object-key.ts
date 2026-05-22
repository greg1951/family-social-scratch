const HTTP_URL_REGEX = /^https?:\/\//i;
const S3_URL_REGEX = /^s3:\/\//i;
const KNOWN_S3_FOLDERS = new Set(["members", "movies", "tv", "music", "foodies", "threads", "galleries"]);
const FAMILY_PREFIX_REGEX = /^family-\d+$/i;

function extractKnownFolderKey(pathValue: string): string | null {
  const segments = pathValue.split("/").filter(Boolean);
  const folderIndex = segments.findIndex((segment) => KNOWN_S3_FOLDERS.has(segment));

  if (folderIndex === -1) {
    return null;
  }

  const hasFamilyPrefix = folderIndex > 0 && FAMILY_PREFIX_REGEX.test(segments[folderIndex - 1] ?? "");
  const keyStartIndex = hasFamilyPrefix ? folderIndex - 1 : folderIndex;
  const key = segments.slice(keyStartIndex).join("/");
  return key || null;
}

function stripQueryAndHash(value: string) {
  return value.split(/[?#]/, 1)[0] ?? "";
}

export function extractS3KeyFromValue(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (HTTP_URL_REGEX.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const decodedPath = decodeURIComponent(url.pathname);
      const normalizedPath = decodedPath.replace(/^\/+/, "");

      if (!url.hostname.endsWith("amazonaws.com")) {
        return extractKnownFolderKey(normalizedPath);
      }

      // Support both S3 virtual-hosted-style and path-style URLs.
      // - virtual-hosted: <bucket>.s3.<region>.amazonaws.com/<key>
      // - path-style: s3.<region>.amazonaws.com/<bucket>/<key>
      const host = url.hostname.toLowerCase();
      const isPathStyleHost = host === "s3.amazonaws.com" || host.startsWith("s3.");

      if (isPathStyleHost) {
        const [, ...keyParts] = normalizedPath.split("/");
        const pathStyleKey = keyParts.join("/");
        return pathStyleKey || null;
      }

      return normalizedPath || null;
    } catch {
      return null;
    }
  }

  if (S3_URL_REGEX.test(trimmed)) {
    const withoutScheme = trimmed.replace(S3_URL_REGEX, "");
    const normalizedValue = stripQueryAndHash(withoutScheme).replace(/^\/+/, "");
    const segments = normalizedValue.split("/").filter(Boolean);

    if (segments.length >= 2) {
      // s3://<bucket>/<key...>
      const [, ...keyParts] = segments;
      const key = keyParts.join("/");
      return key || null;
    }

    return null;
  }

  const withoutQuery = stripQueryAndHash(trimmed);
  const decoded = decodeURIComponent(withoutQuery);
  let normalized = decoded.replace(/^\/+/, "");

  // Handle legacy/plain values shaped as: <bucket>/<folder>/<file>
  const [firstSegment, secondSegment] = normalized.split("/");
  const isFamilyPrefixed = firstSegment ? FAMILY_PREFIX_REGEX.test(firstSegment) : false;
  if (
    firstSegment &&
    secondSegment &&
    !isFamilyPrefixed &&
    !KNOWN_S3_FOLDERS.has(firstSegment) &&
    KNOWN_S3_FOLDERS.has(secondSegment)
  ) {
    normalized = normalized.slice(firstSegment.length + 1);
  }

  return normalized || null;
}