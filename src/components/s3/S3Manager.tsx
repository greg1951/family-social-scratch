'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Info, Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { saveMemberImageUrl } from "@/app/(family)/(family-members)/family-image-upload/actions";

type S3ManagerProps = {
  memberId: number;
  initialMemberImageUrl: string | null;
};

const MAX_FILE_SIZE_BYTES = 50 * 1024;

function toS3Key(value: string) {
  if (value.includes("amazonaws.com/")) {
    const keyWithMaybeQuery = value.split("amazonaws.com/")[1] ?? "";
    return keyWithMaybeQuery.split("?")[0] ?? "";
  }

  return value.split("?")[0] ?? "";
}

function uploadWithProgress(url: string, file: File, contentType: string, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${ xhr.status }`));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading to S3."));
    xhr.send(file);
  });
}

export default function S3Manager({ memberId, initialMemberImageUrl }: S3ManagerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [memberImageUrl, setMemberImageUrl] = useState<string | null>(initialMemberImageUrl);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : signedPreviewUrl ?? memberImageUrl),
    [selectedFile, signedPreviewUrl, memberImageUrl],
  );

  useEffect(() => {
    if (!selectedFile || !previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile, previewUrl]);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedPreview = async () => {
      if (!memberImageUrl || selectedFile) {
        if (!isCancelled && !selectedFile) {
          setSignedPreviewUrl(null);
        }
        return;
      }

      const key = toS3Key(memberImageUrl);
      if (!key) {
        if (!isCancelled) {
          setSignedPreviewUrl(memberImageUrl);
        }
        return;
      }

      try {
        const response = await fetch("/api/s3-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "download",
            fileName: key,
          }),
        });

        if (!response.ok) {
          if (!isCancelled) {
            setSignedPreviewUrl(memberImageUrl);
          }
          return;
        }

        const body = await response.json();
        if (!isCancelled) {
          setSignedPreviewUrl(body.url ?? memberImageUrl);
        }
      } catch {
        if (!isCancelled) {
          setSignedPreviewUrl(memberImageUrl);
        }
      }
    };

    resolveSignedPreview();

    return () => {
      isCancelled = true;
    };
  }, [memberImageUrl, selectedFile]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const isValidType = ["image/png", "image/jpeg", "image/jpg"].includes(file.type);
    if (!isValidType) {
      toast.error("Only PNG and JPEG image files are supported.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("Image size exceeds 50 KB. Please choose a smaller file.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setUploadProgress(0);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Choose an image before uploading.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const extension = selectedFile.type === "image/png" ? "png" : "jpg";
      const fileName = `memberId-${ memberId }.${ extension }`;

      const signRes = await fetch("/api/s3-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "upload",
          folder: "members",
          fileName,
          contentType: selectedFile.type,
        }),
      });

      if (!signRes.ok) {
        throw new Error("Could not create a signed upload URL.");
      }

      const { url, fileUrl, s3Key, signedContentType } = await signRes.json();
      await uploadWithProgress(url, selectedFile, signedContentType ?? selectedFile.type, setUploadProgress);

      const imageUrlToPersist = fileUrl ?? s3Key;
      const saveResult = await saveMemberImageUrl(imageUrlToPersist);
      if (!saveResult.success) {
        throw new Error(saveResult.message ?? "Upload succeeded but failed to save member image URL.");
      }

      setMemberImageUrl(imageUrlToPersist);
      setSelectedFile(null);
      setUploadProgress(100);
      toast.success("Profile image uploaded successfully.");
    } catch (error) {
      console.error("S3 upload error", error);
      toast.error(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    const persisted = memberImageUrl;
    if (!persisted) {
      toast.error("No uploaded image found for this member yet.");
      return;
    }

    const key = persisted.includes("amazonaws.com/")
      ? persisted.split("amazonaws.com/")[1]
      : persisted;

    if (!key) {
      toast.error("Unable to determine the S3 key for this image.");
      return;
    }

    const res = await fetch("/api/s3-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName: key, action: "download" }),
    });

    if (!res.ok) {
      toast.error("Failed to prepare image download.");
      return;
    }

    const { url } = await res.json();
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-semibold text-[#10364a]">Recommended Image Size</label>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#9edcf4] text-[#005472] transition hover:bg-[#dff6ff]"
                aria-label="Image upload size recommendations"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="font-app w-72 text-xs leading-tight">
              Upload must be a PNG or JPEG file. For best profile quality, use around 160 x 160 pixels and keep size under 50K.
            </HoverCardContent>
          </HoverCard>
        </div>
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={ handleSelectFile }
          className="block w-full rounded-md border border-[#d8eef7] bg-white p-2 text-sm"
          disabled={ isUploading }
        />
      </div>

      { isUploading && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#d8eef7]">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,#005472_0%,#0a779f_55%,#59cdf7_100%)] transition-all duration-300"
              style={ { width: `${ uploadProgress }%` } }
            />
          </div>
          <p className="text-xs font-semibold text-[#315363]">Uploading... { uploadProgress }%</p>
        </div>
      ) }

      { previewUrl && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[#10364a]">Image preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */ }
          <img
            src={ previewUrl }
            alt="Member profile preview"
            className="h-36 w-36 rounded-full border border-[#d8eef7] object-cover"
          />
        </div>
      ) }

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          className="h-10 rounded-xl bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] px-4 text-xs font-bold text-white shadow-[0_18px_30px_-18px_rgba(0,84,114,0.8)] hover:brightness-110"
          onClick={ handleUpload }
          disabled={ isUploading || !selectedFile }
        >
          { isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" /> }
          Upload Image
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-[#9edcf4] bg-white text-xs font-semibold text-[#315363] hover:bg-[#dff6ff]"
          onClick={ handleDownload }
          disabled={ isUploading || !memberImageUrl }
        >
          Open Current Image
        </Button>
      </div>

      <p className="text-xs text-[#315363]">
        Saved member image URL: { memberImageUrl ?? "No image has been saved yet." }
      </p>
    </div>
  );
}