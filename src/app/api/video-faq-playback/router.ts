import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { logApiRouteError } from "@/components/api/api-error-logger";

import db from "@/components/db/drizzle";
import { video } from "@/components/db/schema/global-schema-tables";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";
import { getVideoS3ClientContext } from "@/lib/video-s3-client-factory";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoIdParam = searchParams.get("videoId");
  const videoId = Number(videoIdParam);

  if (!Number.isInteger(videoId) || videoId <= 0) {
    return NextResponse.json({ error: "Invalid video id" }, { status: 400 });
  }

  const [publishedVideo] = await db
    .select({
      id: video.id,
      videoUrl: video.videoUrl,
    })
    .from(video)
    .where(and(eq(video.id, videoId), eq(video.status, "published")))
    .limit(1);

  if (!publishedVideo) {
    return NextResponse.json({ error: "Published video not found" }, { status: 404 });
  }

  const objectKey = extractS3KeyFromValue(publishedVideo.videoUrl);
  if (!objectKey) {
    return NextResponse.json({ error: "Published video file is missing" }, { status: 404 });
  }

  try {
    const s3Context = await getVideoS3ClientContext();
    const response = await s3Context.client.send(
      new GetObjectCommand({
        Bucket: s3Context.bucketName,
        Key: objectKey,
      })
    );

    const bodyBytes = await response.Body?.transformToByteArray();
    if (!bodyBytes) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 });
    }

    return new NextResponse(Uint8Array.from(bodyBytes), {
      status: 200,
      headers: {
        "Content-Type": response.ContentType ?? "video/mp4",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (error) {
    logApiRouteError("api.video-faq-playback.GET.streamPublishedVideo", error, {
      videoId,
      objectKey,
      route: "video-faq-playback",
    });

    return NextResponse.json({ error: "Failed to load video" }, { status: 500 });
  }
}
