"use client";

import LinkExtension from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { HelpCircle } from "lucide-react";
import { useEffect } from "react";

import {
  createTextTipTapDocument,
  parseSerializedTipTapDocument,
  serializeTipTapDocument,
} from "@/components/db/types/poem-term-validation";
import { SupportFaqItem } from "@/components/db/types/support";

type SupportFaqHomePageProps = {
  faqItems: SupportFaqItem[];
  loadError?: string;
};

function parseFaqContent(contentJson: string) {
  const parsed = parseSerializedTipTapDocument(contentJson);

  if (parsed.success) {
    return parsed.content;
  }

  return createTextTipTapDocument(parsed.message);
}

function SupportFaqContentPreview({ contentJson, className = "" }: { contentJson: string; className?: string }) {
  const previewEditor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: true,
      }),
    ],
    content: parseFaqContent(contentJson),
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap text-sm leading-7 text-[#365766] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!previewEditor) {
      return;
    }

    const nextContent = parseFaqContent(contentJson);
    const currentJson = serializeTipTapDocument(previewEditor.getJSON());
    const nextJson = serializeTipTapDocument(nextContent);

    if (currentJson !== nextJson) {
      previewEditor.commands.setContent(nextContent);
    }
  }, [previewEditor, contentJson]);

  return (
    <div className={ `mt-3 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-[#b9d2dd] [&_.tiptap_blockquote]:pl-4 [&_.tiptap_a]:font-semibold [&_.tiptap_a]:text-[#0b6087] [&_.tiptap_a]:underline [&_.tiptap_table]:my-3 [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_table]:rounded-lg [&_.tiptap_table]:overflow-hidden [&_.tiptap_th]:border [&_.tiptap_th]:border-[#b9d2dd] [&_.tiptap_th]:bg-[#e9f6fb] [&_.tiptap_th]:px-2 [&_.tiptap_th]:py-1.5 [&_.tiptap_th]:text-left [&_.tiptap_td]:border [&_.tiptap_td]:border-[#c9dce4] [&_.tiptap_td]:px-2 [&_.tiptap_td]:py-1.5 ${ className }` }>
      <EditorContent editor={ previewEditor } />
    </div>
  );
}

export function SupportFaqHomePage({ faqItems, loadError }: SupportFaqHomePageProps) {
  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(10,64,79,0.95),rgba(24,115,143,0.9)_50%,rgba(249,197,121,0.85))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(6,34,52,0.9)] sm:px-8">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#def8ff]">
            Support
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#eafcff]">
            Browse the most common questions and answers for account access, family setup, and support workflow.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-white/35 bg-white/15 px-4 py-2 text-sm font-semibold">
              { faqItems.length } Published FAQ{ faqItems.length === 1 ? "" : "s" }
            </div>
            <a href="/" className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#edfcff] transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Return to Main Page</a>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-[#d8e8ed] bg-white p-5 shadow-[0_18px_50px_-36px_rgba(7,63,72,0.55)] sm:p-6">
          { loadError ? (
            <p className="rounded-xl border border-[#f1d8d8] bg-[#fff6f6] px-4 py-3 text-sm text-[#8a3e3e]">
              { loadError }
            </p>
          ) : null }

          { faqItems.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-[#c3d7de] bg-[#f8fcff] px-5 py-10 text-center text-[#4a6d79]">
              <HelpCircle className="mx-auto mb-3 size-9 text-[#608f9d]" />
              <p className="text-base font-semibold text-[#164657]">No published FAQs are available right now.</p>
              <p className="mt-1 text-sm">Please check back soon.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              { faqItems.map((faqItem) => (
                <article
                  key={ faqItem.id }
                  className="rounded-[1.3rem] border border-[#d5e4e9] bg-[linear-gradient(180deg,#ffffff,#f8fcff)] p-4 sm:p-5"
                >
                  <SupportFaqContentPreview
                    contentJson={ faqItem.questionJson }
                    className="font-black tracking-tight text-[#164657] [&_.tiptap]:text-lg"
                  />
                  <SupportFaqContentPreview contentJson={ faqItem.answerJson } />
                </article>
              )) }
            </div>
          ) }
        </div>
      </div>
    </section>
  );
}