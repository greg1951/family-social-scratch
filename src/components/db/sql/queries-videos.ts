import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import db from "@/components/db/drizzle";
import {
  video,
  videoS3Credentials,
  videoTag,
  videoTagReference,
} from "@/components/db/schema/global-schema-tables";
import { serializedTipTapDocumentSchema } from "@/components/db/types/poem-term-validation";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { getVideoS3ClientContext } from "@/lib/video-s3-client-factory";

const createVideoInputSchema = z.object({
  videoName: z.string().trim().min(2, "Video name must be at least 2 characters."),
  faqPageSeqNo: z.number().int().min(1, "FAQ page sequence number must be at least 1."),
  seqNo: z.number().int().min(1, "Sequence number must be at least 1."),
  caption: z.string().trim().min(1, "Caption is required."),
  status: z.enum(["draft", "published"]),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute.").max(600, "Duration is too large."),
  descriptionJson: serializedTipTapDocumentSchema,
  videoUrl: z.string().trim().min(3, "Video URL is required."),
  selectedTagIds: z.array(z.number().int().positive()).min(2, "Select at least 2 tags.").max(3, "Select up to 3 tags."),
  videoS3Id: z.number().int().positive(),
});

export type VideoTagOption = {
  id: number;
  category: string;
  tagName: string;
  tagDesc: string | null;
  seqNo: number;
};

export type VideoListItem = {
  id: number;
  videoName: string;
  faqPageSeqNo: number;
  seqNo: number;
  caption: string;
  status: string;
  durationMinutes: number;
  videoJson: string;
  videoUrl: string | null;
  updatedAt: Date | null;
  tags: Array<{
    id: number;
    category: string;
    tagName: string;
  }>;
};

export type FaqVideoItem = {
  id: number;
  videoName: string;
  caption: string;
  seqNo: number;
  durationMinutes: number;
  videoJson: string;
  videoUrl: string;
  playbackUrl: string;
};

export type VideoMaintenanceDataResult =
  | {
    success: true;
    videos: VideoListItem[];
    tagOptions: VideoTagOption[];
  }
  | {
    success: false;
    message: string;
  };

export type CreateVideoInput = z.infer<typeof createVideoInputSchema>;

export type CreateVideoResult =
  | {
    success: true;
    message: string;
    createdVideo: VideoListItem;
  }
  | {
    success: false;
    message: string;
  };

const updateVideoInputSchema = z.object({
  id: z.number().int().positive(),
  videoName: z.string().trim().min(2, "Video name must be at least 2 characters."),
  faqPageSeqNo: z.number().int().min(1, "FAQ page sequence number must be at least 1."),
  seqNo: z.number().int().min(1, "Sequence number must be at least 1."),
  videoUrl: z.string().trim().optional(),
  caption: z.string().trim().min(1, "Caption is required."),
  status: z.enum(["draft", "published"]),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute.").max(600, "Duration is too large."),
  descriptionJson: serializedTipTapDocumentSchema,
  selectedTagIds: z.array(z.number().int().positive()).min(2, "Select at least 2 tags.").max(3, "Select up to 3 tags."),
});

export type UpdateVideoInput = z.infer<typeof updateVideoInputSchema>;

export type UpdateVideoResult =
  | {
    success: true;
    message: string;
    updatedVideo: VideoListItem;
  }
  | {
    success: false;
    message: string;
  };

export type DeleteVideoResult =
  | {
    success: true;
    message: string;
    deletedVideoId: number;
  }
  | {
    success: false;
    message: string;
  };

export async function getPublishedFaqVideos(): Promise<FaqVideoItem[]> {
  const requiredFaqTagNames = ["Visitor", "High-Level"];

  const tagRows = await db
    .select({
      videoId: videoTag.videoId,
      tagName: videoTagReference.tagName,
    })
    .from(videoTag)
    .innerJoin(video, eq(video.id, videoTag.videoId))
    .innerJoin(videoTagReference, eq(videoTagReference.id, videoTag.tagId))
    .where(and(eq(video.status, "published"), inArray(videoTagReference.tagName, requiredFaqTagNames)));

  const matchedTagNamesByVideoId = new Map<number, Set<string>>();

  for (const row of tagRows) {
    const currentTagSet = matchedTagNamesByVideoId.get(row.videoId) ?? new Set<string>();
    currentTagSet.add(row.tagName);
    matchedTagNamesByVideoId.set(row.videoId, currentTagSet);
  }

  const qualifiedVideoIds = Array.from(matchedTagNamesByVideoId.entries())
    .filter(([, tagSet]) => requiredFaqTagNames.every((tagName) => tagSet.has(tagName)))
    .map(([videoId]) => videoId);

  if (qualifiedVideoIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: video.id,
      videoName: video.videoName,
      caption: video.caption,
      seqNo: video.seqNo,
      durationMinutes: video.durationMinutes,
      videoJson: video.videoJson,
      videoUrl: video.videoUrl,
    })
    .from(video)
    .where(and(eq(video.status, "published"), inArray(video.id, qualifiedVideoIds)))
    .orderBy(asc(video.faqPageSeqNo), asc(video.videoName), asc(video.seqNo), asc(video.id));

  return rows
    .map((row) => {
      const key = extractS3KeyFromValue(row.videoUrl);
      if (!key) {
        return null;
      }

      return {
        id: row.id,
        videoName: row.videoName,
        caption: row.caption,
        seqNo: row.seqNo,
        durationMinutes: row.durationMinutes,
        videoJson: row.videoJson,
        videoUrl: row.videoUrl ?? "",
        playbackUrl: `/api/video-faq-playback?videoId=${row.id}`,
      } satisfies FaqVideoItem;
    })
    .filter((row): row is FaqVideoItem => row !== null);
}

function dedupeTagIds(tagIds: number[]) {
  return Array.from(new Set(tagIds));
}

async function loadTagOptions(): Promise<VideoTagOption[]> {
  const rows = await db
    .select({
      id: videoTagReference.id,
      category: videoTagReference.category,
      tagName: videoTagReference.tagName,
      tagDesc: videoTagReference.tagDesc,
      seqNo: videoTagReference.seqNo,
    })
    .from(videoTagReference)
    .orderBy(asc(videoTagReference.category), asc(videoTagReference.seqNo), asc(videoTagReference.tagName));

  return rows;
}

async function loadVideos(): Promise<VideoListItem[]> {
  const videoRows = await db
    .select({
      id: video.id,
      videoName: video.videoName,
      faqPageSeqNo: video.faqPageSeqNo,
      seqNo: video.seqNo,
      caption: video.caption,
      status: video.status,
      durationMinutes: video.durationMinutes,
      videoJson: video.videoJson,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
    })
    .from(video)
    .orderBy(asc(video.faqPageSeqNo), asc(video.seqNo), asc(video.videoName));

  if (videoRows.length === 0) {
    return [];
  }

  const videoIds = videoRows.map((row) => row.id);
  const videoTagRows = await db
    .select({
      videoId: videoTag.videoId,
      tagId: videoTagReference.id,
      category: videoTagReference.category,
      tagName: videoTagReference.tagName,
      seqNo: videoTagReference.seqNo,
    })
    .from(videoTag)
    .innerJoin(videoTagReference, eq(videoTagReference.id, videoTag.tagId))
    .where(inArray(videoTag.videoId, videoIds))
    .orderBy(asc(videoTag.videoId), asc(videoTagReference.category), asc(videoTagReference.seqNo), asc(videoTagReference.tagName));

  const tagsByVideoId = new Map<number, VideoListItem["tags"]>();

  for (const row of videoTagRows) {
    const current = tagsByVideoId.get(row.videoId) ?? [];
    current.push({
      id: row.tagId,
      category: row.category,
      tagName: row.tagName,
    });
    tagsByVideoId.set(row.videoId, current);
  }

  return videoRows.map((row) => ({
    ...row,
    tags: tagsByVideoId.get(row.id) ?? [],
  }));
}

export async function getVideoMaintenanceData(): Promise<VideoMaintenanceDataResult> {
  try {
    const [tagOptions, videos] = await Promise.all([loadTagOptions(), loadVideos()]);

    return {
      success: true,
      tagOptions,
      videos,
    };
  } catch (error) {
    console.error("getVideoMaintenanceData failed", error);
    return {
      success: false,
      message: "Unable to load video maintenance data.",
    };
  }
}

export async function createVideoEntry(input: CreateVideoInput): Promise<CreateVideoResult> {
  const parsed = createVideoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to create video.",
    };
  }

  const normalized = parsed.data;
  const tagIds = dedupeTagIds(normalized.selectedTagIds);

  if (tagIds.length < 2 || tagIds.length > 3) {
    return {
      success: false,
      message: "Select 2 or 3 different tags.",
    };
  }

  const matchingTags = await db
    .select({ id: videoTagReference.id })
    .from(videoTagReference)
    .where(inArray(videoTagReference.id, tagIds));

  if (matchingTags.length !== tagIds.length) {
    return {
      success: false,
      message: "One or more selected tags are invalid.",
    };
  }

  const [activeCredential] = await db
    .select({ id: videoS3Credentials.id })
    .from(videoS3Credentials)
    .where(and(eq(videoS3Credentials.id, normalized.videoS3Id), eq(videoS3Credentials.isActive, true)))
    .limit(1);

  if (!activeCredential) {
    return {
      success: false,
      message: "Active video S3 credentials were not found. Re-seed credentials and try again.",
    };
  }

  const [insertedVideo] = await db
    .insert(video)
    .values({
      videoName: normalized.videoName,
      faqPageSeqNo: normalized.faqPageSeqNo,
      seqNo: normalized.seqNo,
      caption: normalized.caption,
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
      videoJson: normalized.descriptionJson,
      link: normalized.videoUrl,
      videoUrl: normalized.videoUrl,
      updatedAt: new Date(),
      version: 1,
      videoS3Id: normalized.videoS3Id,
    })
    .returning({
      id: video.id,
      videoName: video.videoName,
      faqPageSeqNo: video.faqPageSeqNo,
      seqNo: video.seqNo,
      caption: video.caption,
      status: video.status,
      durationMinutes: video.durationMinutes,
      videoJson: video.videoJson,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
    });

  if (!insertedVideo) {
    return {
      success: false,
      message: "Unable to create video row.",
    };
  }

  try {
    for (const tagId of tagIds) {
      await db.insert(videoTag).values({
        videoId: insertedVideo.id,
        tagId,
      });
    }
  } catch (error) {
    try {
      await db.delete(video).where(eq(video.id, insertedVideo.id));
    } catch (cleanupError) {
      console.error("createVideoEntry cleanup failed", cleanupError);
    }

    console.error("createVideoEntry tag insert failed", error);
    return {
      success: false,
      message: "Video was uploaded but tags could not be saved. Please try again.",
    };
  }

  const tagDetails = await db
    .select({
      id: videoTagReference.id,
      category: videoTagReference.category,
      tagName: videoTagReference.tagName,
    })
    .from(videoTagReference)
    .where(inArray(videoTagReference.id, tagIds))
    .orderBy(asc(videoTagReference.category), asc(videoTagReference.seqNo), asc(videoTagReference.tagName));

  return {
    success: true,
    message: "Video created successfully.",
    createdVideo: {
      ...insertedVideo,
      tags: tagDetails,
    },
  };
}

export async function updateVideoEntry(input: UpdateVideoInput): Promise<UpdateVideoResult> {
  const parsed = updateVideoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Unable to update video.",
    };
  }

  const normalized = parsed.data;
  const tagIds = dedupeTagIds(normalized.selectedTagIds);

  if (tagIds.length < 2 || tagIds.length > 3) {
    return {
      success: false,
      message: "Select 2 or 3 different tags.",
    };
  }

  const matchingTags = await db
    .select({ id: videoTagReference.id })
    .from(videoTagReference)
    .where(inArray(videoTagReference.id, tagIds));

  if (matchingTags.length !== tagIds.length) {
    return {
      success: false,
      message: "One or more selected tags are invalid.",
    };
  }

  const [existingVideo] = await db
    .select({
      id: video.id,
      videoName: video.videoName,
      faqPageSeqNo: video.faqPageSeqNo,
      seqNo: video.seqNo,
      caption: video.caption,
      status: video.status,
      durationMinutes: video.durationMinutes,
      videoJson: video.videoJson,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
    })
    .from(video)
    .where(eq(video.id, normalized.id))
    .limit(1);

  if (!existingVideo) {
    return {
      success: false,
      message: "Video not found.",
    };
  }

  await db
    .update(video)
    .set({
      videoName: normalized.videoName,
      faqPageSeqNo: normalized.faqPageSeqNo,
      seqNo: normalized.seqNo,
      caption: normalized.caption,
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
      videoJson: normalized.descriptionJson,
      ...(normalized.videoUrl !== undefined ? { videoUrl: normalized.videoUrl, link: normalized.videoUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(video.id, normalized.id));

  await db.delete(videoTag).where(eq(videoTag.videoId, normalized.id));

  for (const tagId of tagIds) {
    await db.insert(videoTag).values({
      videoId: normalized.id,
      tagId,
    });
  }

  const tagDetails = await db
    .select({
      id: videoTagReference.id,
      category: videoTagReference.category,
      tagName: videoTagReference.tagName,
    })
    .from(videoTagReference)
    .where(inArray(videoTagReference.id, tagIds))
    .orderBy(asc(videoTagReference.category), asc(videoTagReference.seqNo), asc(videoTagReference.tagName));

  return {
    success: true,
    message: "Video updated successfully.",
    updatedVideo: {
      ...existingVideo,
      videoName: normalized.videoName,
      faqPageSeqNo: normalized.faqPageSeqNo,
      seqNo: normalized.seqNo,
      caption: normalized.caption,
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
      videoUrl: normalized.videoUrl !== undefined ? normalized.videoUrl : existingVideo.videoUrl,
      updatedAt: new Date(),
      tags: tagDetails,
    },
  };
}

export async function deleteVideoEntry(videoId: number): Promise<DeleteVideoResult> {
  if (!Number.isInteger(videoId) || videoId <= 0) {
    return {
      success: false,
      message: "Invalid video id.",
    };
  }

  const [existingVideo] = await db
    .select({
      id: video.id,
      videoUrl: video.videoUrl,
    })
    .from(video)
    .where(eq(video.id, videoId))
    .limit(1);

  if (!existingVideo) {
    return {
      success: false,
      message: "Video not found.",
    };
  }

  const objectKey = extractS3KeyFromValue(existingVideo.videoUrl);

  if (objectKey) {
    try {
      const s3Context = await getVideoS3ClientContext();
      await s3Context.client.send(
        new DeleteObjectCommand({
          Bucket: s3Context.bucketName,
          Key: objectKey,
        })
      );
    } catch (error) {
      console.error("deleteVideoEntry failed to delete S3 object", {
        videoId,
        objectKey,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      return {
        success: false,
        message: "Unable to delete video file from S3. The video row was not removed.",
      };
    }
  }

  await db.delete(video).where(eq(video.id, videoId));

  return {
    success: true,
    message: "Video deleted successfully.",
    deletedVideoId: videoId,
  };
}