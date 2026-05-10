import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLinkDialog } from "@/features/books/hooks/use-link-dialog";

type BookLinkDialogProps = {
  linkDialog: ReturnType<typeof useLinkDialog>;
};

export function BookLinkDialog({ linkDialog }: BookLinkDialogProps) {
  return (
    <Dialog open={ linkDialog.isLinkDialogOpen } onOpenChange={ linkDialog.setIsLinkDialogOpen }>
      <DialogContent className="border-[#c8d7df] bg-[#f9fdff] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#183746]">Edit Link</DialogTitle>
          <DialogDescription className="text-[#51707e]">
            Add or replace the URL for the selected text. Leave it blank to remove the link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#183746]" htmlFor="books-home-link-url">
            URL
          </label>
          <Input
            id="books-home-link-url"
            value={ linkDialog.linkValue }
            onChange={ (event) => linkDialog.handleLinkValueChange(event.target.value) }
            placeholder="https://example.com"
            className="border-[#c8d7df] bg-white text-[#183746]"
          />
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="books-home-link-target"
              checked={ linkDialog.openLinkInNewTab }
              onCheckedChange={ (checked: boolean | "indeterminate") => linkDialog.setOpenLinkInNewTab(checked === true) }
            />
            <label className="text-sm text-[#355161]" htmlFor="books-home-link-target">
              Open in new tab
            </label>
          </div>
          { linkDialog.linkError ? (
            <p className="text-sm text-red-500">{ linkDialog.linkError }</p>
          ) : null }
          <div className="rounded-xl border border-[#d9e5ea] bg-white px-3 py-3 text-sm text-[#355161]">
            <p className="font-semibold text-[#183746]">Preview</p>
            <p className="mt-1 break-all">
              { linkDialog.normalizedLinkPreview ?? "Enter a valid URL to preview the saved link." }
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#5d8aa0]">
              { linkDialog.openLinkInNewTab ? "Opens In New Tab" : "Opens In Current Tab" }
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={ linkDialog.removeLink }
          >
            Remove Link
          </Button>
          <Button type="button" onClick={ linkDialog.applyLink }>
            Apply Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
