'use client';

import { useEffect, useMemo, useState } from "react";
import { extractS3KeyFromValue } from "@/lib/s3-object-key";

type MemberAvatarProps = {
  imageUrl?: string | null;
  firstName?: string;
  lastName?: string;
  sizeClassName?: string;
};

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";
  const initials = `${ first }${ last }`.toUpperCase();
  return initials || "?";
}

export default function MemberAvatar({
  imageUrl,
  firstName,
  lastName,
  sizeClassName = "h-16 w-16",
}: MemberAvatarProps) {
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const initials = getInitials(firstName, lastName);

  const displayImageUrl = useMemo(() => signedImageUrl ?? imageUrl ?? null, [signedImageUrl, imageUrl]);
  const hasImage = Boolean(displayImageUrl);

  useEffect(() => {
    let isCancelled = false;

    const resolveSignedUrl = async () => {
      if (!imageUrl) {
        if (!isCancelled) {
          setSignedImageUrl(null);
        }
        return;
      }

      const key = extractS3KeyFromValue(imageUrl);
      if (!key) {
        if (!isCancelled) {
          setSignedImageUrl(imageUrl);
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
            setSignedImageUrl(imageUrl);
          }
          return;
        }

        const body = await response.json();
        if (!isCancelled) {
          setSignedImageUrl(body.url ?? imageUrl);
        }
      } catch {
        if (!isCancelled) {
          setSignedImageUrl(imageUrl);
        }
      }
    };

    resolveSignedUrl();

    return () => {
      isCancelled = true;
    };
  }, [imageUrl]);

  return (
    <div className={ `relative inline-flex ${ sizeClassName } items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white shadow-sm` }>
      { hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ displayImageUrl! }
          alt={ `${ firstName ?? "Family" } ${ lastName ?? "Member" } profile image` }
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-extrabold tracking-wide text-[#005472]">{ initials }</span>
      ) }
    </div>
  );
}
