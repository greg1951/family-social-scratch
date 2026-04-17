const HTTP_URL_REGEX = /^https?:\/\//i;

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
      if (!url.hostname.endsWith("amazonaws.com")) {
        return null;
      }

      const decodedPath = decodeURIComponent(url.pathname);
      return decodedPath.replace(/^\/+/, "") || null;
    } catch {
      return null;
    }
  }

  const withoutQuery = stripQueryAndHash(trimmed);
  const decoded = decodeURIComponent(withoutQuery);
  const normalized = decoded.replace(/^\/+/, "");
  return normalized || null;
}