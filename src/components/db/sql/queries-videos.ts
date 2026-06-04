import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import db from "@/components/db/drizzle";
import {
  video,
  videoS3Credentials,
  videoTag,
  videoTagReference,
} from "@/components/db/schema/family-social-schema-tables";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { getVideoS3ClientContext } from "@/lib/video-s3-client-factory";

const createVideoInputSchema = z.object({
  videoName: z.string().trim().min(2, "Video name must be at least 2 characters."),
  status: z.enum(["draft", "published"]),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute.").max(600, "Duration is too large."),
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
  status: string;
  durationMinutes: number;
  videoUrl: string | null;
  updatedAt: Date | null;
  tags: Array<{
    id: number;
    category: string;
    tagName: string;
  }>;
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
  status: z.enum(["draft", "published"]),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute.").max(600, "Duration is too large."),
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
      status: video.status,
      durationMinutes: video.durationMinutes,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
    })
    .from(video)
    .orderBy(desc(video.updatedAt), desc(video.id));

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
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
      link: normalized.videoUrl,
      videoUrl: normalized.videoUrl,
      updatedAt: new Date(),
      version: 1,
      videoS3Id: normalized.videoS3Id,
    })
    .returning({
      id: video.id,
      videoName: video.videoName,
      status: video.status,
      durationMinutes: video.durationMinutes,
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
      status: video.status,
      durationMinutes: video.durationMinutes,
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
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
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
      status: normalized.status,
      durationMinutes: normalized.durationMinutes,
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