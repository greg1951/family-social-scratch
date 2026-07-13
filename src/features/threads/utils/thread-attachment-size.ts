export const THREAD_IMAGE_SIZE_WARNING_BYTES = 5 * 1024 * 1024;
export const MAX_THREAD_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function formatFileSizeInMb(fileSizeBytes: number): string {
  return `${ (fileSizeBytes / (1024 * 1024)).toFixed(1) } MB`;
}

export function getThreadAttachmentSizeWarning(file: { name: string; size: number }): string | null {
  if (file.size <= THREAD_IMAGE_SIZE_WARNING_BYTES || file.size >= MAX_THREAD_IMAGE_SIZE_BYTES) {
    return null;
  }

  return `${ file.name } is ${ formatFileSizeInMb(file.size) }. Smaller images are preferred when possible.`;
}