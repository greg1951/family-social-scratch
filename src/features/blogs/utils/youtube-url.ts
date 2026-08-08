const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function normalizeYouTubeUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const valueWithProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${ trimmedValue }`;

  try {
    const parsedUrl = new URL(valueWithProtocol);

    if (parsedUrl.protocol !== "https:" || !YOUTUBE_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
      return null;
    }

    return parsedUrl.href;
  } catch {
    return null;
  }
}