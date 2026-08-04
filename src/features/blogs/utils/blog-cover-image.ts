export interface ResolveBlogCoverImageStateInput {
  coverImageS3Key: string | null | undefined;
  coverImageAlt: string | null | undefined;
  title: string;
}

export interface ResolveBlogCoverImageStateResult {
  altText: string;
  error: string | null;
}

export function resolveBlogCoverImageState({
  coverImageS3Key,
  coverImageAlt,
  title,
}: ResolveBlogCoverImageStateInput): ResolveBlogCoverImageStateResult {
  const normalizedKey = (coverImageS3Key ?? "").trim();
  const normalizedTitle = title.trim();
  const normalizedAlt = (coverImageAlt ?? "").trim();

  if (!normalizedKey) {
    return {
      altText: normalizedAlt,
      error: null,
    };
  }

  const fallbackAlt = normalizedTitle || "";
  const nextAltText = normalizedAlt || fallbackAlt;

  return {
    altText: nextAltText,
    error: nextAltText ? null : "Cover image alt text is required when a cover image is selected.",
  };
}
