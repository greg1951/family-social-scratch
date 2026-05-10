import type { Editor } from "@tiptap/react";
import { useMemo, useState } from "react";

function normalizeLinkUrl(value: string): string | null {
  const trimmedUrl = value.trim();

  if (!trimmedUrl) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedUrl)
    ? trimmedUrl
    : `https://${ trimmedUrl }`;

  try {
    const normalizedUrl = new URL(candidate);

    if (!["http:", "https:", "mailto:", "tel:"].includes(normalizedUrl.protocol)) {
      return null;
    }

    return normalizedUrl.toString();
  } catch {
    return null;
  }
}

export function useLinkDialog(analysisEditor: Editor | null) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [openLinkInNewTab, setOpenLinkInNewTab] = useState(true);

  const normalizedLinkPreview = useMemo(
    () => (linkValue.trim() ? normalizeLinkUrl(linkValue) : null),
    [linkValue]
  );

  function openLinkDialog() {
    if (!analysisEditor || !analysisEditor.isEditable) {
      return;
    }

    const linkAttributes = analysisEditor.getAttributes("link") as {
      href?: string;
      target?: string | null;
    };

    setLinkValue(linkAttributes.href ?? "https://");
    setOpenLinkInNewTab(linkAttributes.target === "_blank");
    setLinkError(null);
    setIsLinkDialogOpen(true);
  }

  function applyLink() {
    if (!analysisEditor) {
      return;
    }

    const trimmedUrl = linkValue.trim();

    if (!trimmedUrl) {
      analysisEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      setLinkError(null);
      setIsLinkDialogOpen(false);
      return;
    }

    const normalizedUrl = normalizeLinkUrl(trimmedUrl);

    if (!normalizedUrl) {
      setLinkError("Enter a valid http, https, mailto, or tel link.");
      return;
    }

    setLinkValue(normalizedUrl);
    setLinkError(null);

    analysisEditor.chain().focus().extendMarkRange("link").setLink({
      href: normalizedUrl,
      target: openLinkInNewTab ? "_blank" : null,
      rel: openLinkInNewTab ? "noopener noreferrer nofollow" : null,
    }).run();

    setIsLinkDialogOpen(false);
  }

  function removeLink() {
    if (analysisEditor?.isActive("link")) {
      analysisEditor.chain().focus().extendMarkRange("link").unsetLink().run();
    }

    setIsLinkDialogOpen(false);
  }

  function handleLinkValueChange(value: string) {
    setLinkValue(value);

    if (linkError) {
      setLinkError(null);
    }
  }

  return {
    isLinkDialogOpen,
    setIsLinkDialogOpen,
    linkValue,
    linkError,
    openLinkInNewTab,
    setOpenLinkInNewTab,
    normalizedLinkPreview,
    openLinkDialog,
    applyLink,
    removeLink,
    handleLinkValueChange,
  };
}
