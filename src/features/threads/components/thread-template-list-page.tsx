"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Archive, AlertCircle, ArrowLeft } from "lucide-react";

import { ThreadTemplate } from "@/components/db/types/thread-templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ThreadTemplateListPageProps = {
  initialTemplates: ThreadTemplate[];
};

export function ThreadTemplateListPage({ initialTemplates }: ThreadTemplateListPageProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ThreadTemplate[]>(initialTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<ThreadTemplate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  function handleCreateNew() {
    router.push("/threads/thread-template/new");
  }

  function handleEdit(template: ThreadTemplate) {
    router.push(`/threads/thread-template/${template.id}`);
  }

  function handleDeleteClick(template: ThreadTemplate) {
    setSelectedTemplate(template);
    setIsDeleteDialogOpen(true);
  }

  function handleCancelDelete() {
    setIsDeleteDialogOpen(false);
    setSelectedTemplate(null);
  }

  function handleConfirmDelete() {
    if (!selectedTemplate) {
      return;
    }

    startDeleteTransition(async () => {
      try {
        const response = await fetch(`/api/thread-templates/${selectedTemplate.id}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.message || "Error deleting template");
          return;
        }

        setTemplates((current) => current.filter((t) => t.id !== selectedTemplate.id));
        setIsDeleteDialogOpen(false);
        setSelectedTemplate(null);
        toast.success("Template deleted successfully");
        router.refresh();
      } catch (error) {
        toast.error("Error deleting template");
      }
    });
  }

  const activeTemplates = templates.filter((t) => t.status !== "archived");
  const archivedTemplates = templates.filter((t) => t.status === "archived");

  const globalTemplates = activeTemplates.filter((t) => t.templateCategory === "global");
  const threadTemplates = activeTemplates.filter((t) => t.templateCategory === "thread");

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(124,79,166,0.96),rgba(179,135,202,0.9)_52%,rgba(217,199,229,0.82))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(92,30,155,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={ () => router.push("/") }
                className="rounded-full border-white/50 bg-white/10 text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#f0e1ff]">
                Thread Templates
              </p>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-lg font-black tracking-tight sm:text-2xl">
                Manage Templates
              </h1>
              <p className="mt-2 text-sm text-[#e8d7ff]">
                Create and edit rich text templates for family threads. Use !! delimiters for variables.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={ handleCreateNew }
                className="rounded-full bg-white text-[#7c4fa6] hover:bg-[#f0e1ff]"
              >
                <Plus className="size-4" />
                Create New Template
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
          {/* Global Templates */}
          { globalTemplates.length > 0 && (
            <div className="rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(124,79,166,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-6 py-4 sm:px-8">
              <h2 className="text-lg font-black tracking-tight text-[#5a1e9b]">
                Global Templates
              </h2>
              <p className="mt-1 text-sm text-[#77578f]">
                Templates available across all thread contexts.
              </p>
            </div>
            <div className="divide-y divide-[#e4d9ee] px-6 py-4 sm:px-8">
              { globalTemplates.map((template) => (
                <div
                  key={ template.id }
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#43245d]">
                        { template.templateName }
                      </h3>
                      <span
                        className={ `inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-widest ${ template.status === "draft"
                          ? "border border-[#fbd38d] bg-[#fffaed] text-[#c05621]"
                          : "border border-[#9ae6b4] bg-[#f0fff4] text-[#22863a]"
                          }` }
                      >
                        { template.status }
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77578f]">
                      Last updated { new Date(template.updatedAt).toLocaleDateString() }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => handleEdit(template) }
                      className="rounded-full border-[#d7c9e8] text-[#7c4fa6]"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => handleDeleteClick(template) }
                      className="rounded-full border-[#f5a5a5] text-[#c53030]"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )) }
            </div>
            </div>
          ) }

          {/* Thread Templates */}
          { threadTemplates.length > 0 && (
            <div className="rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(124,79,166,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-6 py-4 sm:px-8">
              <h2 className="text-lg font-black tracking-tight text-[#5a1e9b]">
                Thread Templates
              </h2>
              <p className="mt-1 text-sm text-[#77578f]">
                Templates for specific thread contexts.
              </p>
            </div>
            <div className="divide-y divide-[#e4d9ee] px-6 py-4 sm:px-8">
              { threadTemplates.map((template) => (
                <div
                  key={ template.id }
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#43245d]">
                        { template.templateName }
                      </h3>
                      <span
                        className={ `inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-widest ${ template.status === "draft"
                          ? "border border-[#fbd38d] bg-[#fffaed] text-[#c05621]"
                          : "border border-[#9ae6b4] bg-[#f0fff4] text-[#22863a]"
                          }` }
                      >
                        { template.status }
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77578f]">
                      Last updated { new Date(template.updatedAt).toLocaleDateString() }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => handleEdit(template) }
                      className="rounded-full border-[#d7c9e8] text-[#7c4fa6]"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => handleDeleteClick(template) }
                      className="rounded-full border-[#f5a5a5] text-[#c53030]"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              )) }
            </div>
            </div>
          ) }
        </div>

        {/* Archived Templates */}
        { archivedTemplates.length > 0 && (
          <div className="rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_-40px_rgba(124,79,166,0.7)]">
            <div className="border-b border-[#e4d9ee] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,255,0.86))] px-6 py-4 sm:px-8">
              <h2 className="text-lg font-black tracking-tight text-[#5a1e9b]">
                Archived Templates
              </h2>
            </div>
            <div className="divide-y divide-[#e4d9ee] px-6 py-4 sm:px-8">
              { archivedTemplates.map((template) => (
                <div
                  key={ template.id }
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0 opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-[#43245d]">
                        { template.templateName }
                      </h3>
                      <span className="inline-flex rounded-full border border-[#cbd5e0] bg-[#f7fafc] px-2 py-1 text-xs font-semibold uppercase tracking-widest text-[#4a5568]">
                        Archived
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77578f]">
                      Last updated { new Date(template.updatedAt).toLocaleDateString() }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => handleEdit(template) }
                      className="rounded-full border-[#d7c9e8] text-[#7c4fa6]"
                      disabled
                    >
                      <Pencil className="size-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              )) }
            </div>
          </div>
        ) }

        {/* Empty State */}
        { templates.length === 0 && (
          <div className="rounded-[1.9rem] border border-dashed border-[#e4d9ee] bg-[#fcfaff] px-6 py-12 text-center">
            <AlertCircle className="mx-auto size-12 text-[#d7c9e8]" />
            <h3 className="mt-4 text-lg font-semibold text-[#43245d]">
              No templates yet
            </h3>
            <p className="mt-2 text-sm text-[#77578f]">
              Create your first template to get started.
            </p>
            <Button
              type="button"
              onClick={ handleCreateNew }
              className="mt-4 rounded-full bg-[#7c4fa6] text-white hover:bg-[#6a3d94]"
            >
              <Plus className="size-4" />
              Create First Template
            </Button>
          </div>
        ) }
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={ isDeleteDialogOpen } onOpenChange={ setIsDeleteDialogOpen }>
        <DialogContent className="border-[#d7c9e8] bg-[#f9fdff]">
          <DialogHeader>
            <DialogTitle className="text-[#43245d]">Delete Template?</DialogTitle>
            <DialogDescription className="text-[#77578f]">
              Are you sure you want to delete "{ selectedTemplate?.templateName }"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={ handleCancelDelete }
              disabled={ isDeleting }
              className="rounded-full border-[#d7c9e8] text-[#7c4fa6]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={ handleConfirmDelete }
              disabled={ isDeleting }
              className="rounded-full bg-[#c53030] text-white hover:bg-[#9b2c2c]"
            >
              { isDeleting ? "Deleting..." : "Delete" }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
