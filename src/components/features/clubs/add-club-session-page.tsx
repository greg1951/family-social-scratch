'use client';

import type { JSONContent } from '@tiptap/core';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { ArrowLeft, Bold, Heading3, Italic, List, ListOrdered, Plus, Save, Underline as UnderlineIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { createClubSessionAction, updateClubSessionAction } from '@/app/(features)/(clubs)/add-club/actions';
import type { Club, ClubSession, ClubSessionTarget } from '@/components/db/types/clubs';
import { createEmptyTipTapDocument, isSerializedTipTapDocumentEmpty, parseSerializedTipTapDocument, serializeTipTapDocument } from '@/components/db/types/poem-term-validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberKeyDetails } from '@/features/family/types/family-steps';
import { replaceTemplateVariablesWithValues } from '@/features/threads/utils/template-variables';

type AddClubSessionPageProps = {
  mode: 'create' | 'edit';
  sessionId?: number;
  targetType: 'book' | 'poem' | null;
  targetId: number | null;
  targetTitle: string | null;
  availableTargets?: ClubSessionTarget[];
  sessionTemplates?: { book: string | null; poem: string | null };
  clubs: Club[];
  preselectedClubId?: number;
  existingSession: ClubSession | null;
  member: MemberKeyDetails;
  returnTo?: 'books' | 'poetry' | null;
};

function formatDateValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getEditorDocument(value?: string): JSONContent {
  const parsed = parseSerializedTipTapDocument(value);

  if (parsed.success) {
    return parsed.content;
  }

  return createEmptyTipTapDocument();
}

function ToolbarButton({
  label,
  onClick,
  editor,
  children,
}: {
  label: string;
  onClick: () => void;
  editor: ReturnType<typeof useEditor> | null;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onMouseDown={ (event) => event.preventDefault() }
      onClick={ onClick }
      disabled={ !editor }
      className="border-[#bfd0e0] bg-white text-[#355472] hover:bg-[#f4f8fc]"
      aria-label={ label }
    >
      { children }
      <span className="sr-only">{ label }</span>
    </Button>
  );
}

export default function AddClubSessionPage({
  mode,
  sessionId,
  targetType,
  targetId,
  targetTitle,
  availableTargets = [],
  sessionTemplates,
  clubs,
  preselectedClubId,
  existingSession,
  member,
  returnTo = null,
}: AddClubSessionPageProps) {
        const clubsBackHref = returnTo ? `/add-club?from=${returnTo}` : '/add-club';
  const router = useRouter();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const isEditMode = mode === 'edit';
  const mustPickTarget = !isEditMode && !targetType;
  const [selectedTargetType, setSelectedTargetType] = useState<'book' | 'poem' | ''>('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<number>(
    existingSession?.clubId
    ?? (preselectedClubId && clubs.some((club) => club.id === preselectedClubId) ? preselectedClubId : undefined)
    ?? clubs[0]?.id
    ?? 0,
  );
  const [startedAt, setStartedAt] = useState(
    existingSession?.startedAt ? formatDateValue(existingSession.startedAt) : formatDateValue(),
  );
  const [finishesAt, setFinishesAt] = useState(existingSession?.finishesAt ? formatDateValue(existingSession.finishesAt) : '');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: getEditorDocument(existingSession?.contentJson ?? existingSession?.topicJson ?? undefined),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'tiptap min-h-48 text-sm leading-6 text-[#20364f] focus:outline-none',
      },
    },
  });

  const targetsForSelectedType = useMemo(
    () => availableTargets.filter((target) => target.targetType === selectedTargetType),
    [availableTargets, selectedTargetType],
  );
  const pickedTarget = useMemo(
    () => targetsForSelectedType.find((target) => String(target.targetId) === selectedTargetId) ?? null,
    [targetsForSelectedType, selectedTargetId],
  );
  const effectiveTargetType = targetType ?? pickedTarget?.targetType ?? null;
  const effectiveTargetId = targetId ?? pickedTarget?.targetId ?? null;
  const effectiveTargetTitle = targetTitle ?? pickedTarget?.targetTitle ?? 'New Club Session';

  function submitClubSession() {
    if (!editor) {
      toast.error('Session topic editor is still loading.', { duration: 3000 });
      return;
    }

    const topicJson = serializeTipTapDocument(editor.getJSON());

    if (isSerializedTipTapDocumentEmpty(topicJson)) {
      toast.error('Enter a club session topic before saving.', { duration: 3000 });
      return;
    }

    if (!selectedClubId) {
      toast.error('Select a club before saving.', { duration: 3000 });
      return;
    }

    if (!isEditMode && (!effectiveTargetType || !effectiveTargetId)) {
      toast.error('Select a book or poem before saving.', { duration: 3000 });
      return;
    }

    startSubmittingTransition(async () => {
      const result = isEditMode && sessionId
        ? await updateClubSessionAction({
            clubSessionId: sessionId,
            clubId: selectedClubId,
            startedAt,
            finishesAt: finishesAt || undefined,
            topicJson,
          })
        : await createClubSessionAction({
            clubId: selectedClubId,
            targetType: effectiveTargetType as 'book' | 'poem',
            targetId: effectiveTargetId as number,
            startedAt,
            finishesAt: finishesAt || undefined,
            topicJson,
          });

      if (!result.success) {
        toast.error(result.message, { duration: 3000 });
        return;
      }

      toast.success(result.message, { duration: 3000 });
      if (isEditMode) {
        router.push(clubsBackHref);
        router.refresh();
        return;
      }

      router.push(effectiveTargetType === 'book'
        ? `/books/discussions/${ result.threadId }`
        : `/poetry/discussions/${ result.threadId }`);
      router.refresh();
    });
  }

  const targetLabel = effectiveTargetType === 'poem' ? 'Poem' : 'Book';
  const canSubmitSession = isEditMode
    ? clubs.length > 0
    : clubs.length > 0 && !existingSession && (!mustPickTarget || availableTargets.length > 0);
  const submitLabel = isEditMode ? 'Save Session Changes' : 'Create Club Session';
  const pageTitle = isEditMode ? 'Edit Club Session' : mustPickTarget ? 'Add Club Session' : `${ targetLabel } Club Session`;

  const selectedClub = useMemo(
    () => clubs.find((club) => club.id === selectedClubId) ?? null,
    [clubs, selectedClubId],
  );

  const autoFilledTopicRef = useRef<string | null>(null);
  const templateJson = effectiveTargetType === 'poem' ? sessionTemplates?.poem : sessionTemplates?.book;

  useEffect(() => {
    if (isEditMode || !editor || !templateJson || !effectiveTargetType || !effectiveTargetId || !startedAt || !finishesAt || !selectedClub) {
      return;
    }

    const currentTopicJson = serializeTipTapDocument(editor.getJSON());
    const wasEditedByModerator = !isSerializedTipTapDocumentEmpty(currentTopicJson)
      && currentTopicJson !== autoFilledTopicRef.current;

    if (wasEditedByModerator) {
      return;
    }

    const [startYear, startMonth, startDay] = startedAt.split('-');
    const [endYear, endMonth, endDay] = finishesAt.split('-');
    const filledTemplateJson = replaceTemplateVariablesWithValues(templateJson, {
      club_name: selectedClub.clubName,
      club_session: selectedClub.clubName,
      session_start: `${ startMonth }-${ startDay }-${ startYear }`,
      session_end: `${ endMonth }-${ endDay }-${ endYear }`,
      session_moderator: `${ member.firstName } ${ member.lastName }`,
      book_name: effectiveTargetType === 'book' ? effectiveTargetTitle : '',
      poem_name: effectiveTargetType === 'poem' ? effectiveTargetTitle : '',
    });

    editor.commands.setContent(getEditorDocument(filledTemplateJson));
    autoFilledTopicRef.current = serializeTipTapDocument(editor.getJSON());
  }, [
    editor,
    effectiveTargetId,
    effectiveTargetTitle,
    effectiveTargetType,
    finishesAt,
    isEditMode,
    member.firstName,
    member.lastName,
    selectedClub,
    startedAt,
    templateJson,
  ]);

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(33,64,83,0.96),rgba(51,99,122,0.9)_56%,rgba(187,143,86,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(19,38,48,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#e0f2fb]">
                { pageTitle }
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={ clubsBackHref }
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0f7ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Back to Clubs
                </Link>
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                { isEditMode ? 'Update the club session details.' : 'Create a Book or Poetry club session.' }
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(33,64,83,0.7)] backdrop-blur">
          <div className="border-b border-[#dbe5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,249,253,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#496789]">
                Club Session Details
              </p>
              <h2 className="text-2xl font-black tracking-tight text-[#20364f]">
                { effectiveTargetTitle }
              </h2>
              { mustPickTarget && selectedClub ? (
                <p className="text-sm text-[#587089]">
                  <span className="font-semibold text-[#20364f]">Club:</span> { selectedClub.clubName } &mdash; moderator will be { member.firstName } { member.lastName }.
                </p>
              ) : null }
              <p className="max-w-3xl text-sm leading-6 text-[#587089]">
                { isEditMode
                  ? 'Update the club, dates, and topic notes for this existing session.'
                  : 'Choose a club, select the dates, and define the topic notes for the club&apos;s discussion.' }
              </p>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            { clubs.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#c7d4e0] bg-[#f7fbfe] px-6 py-10 text-center text-[#587089]">
                <p className="text-lg font-semibold text-[#20364f]">No clubs are available yet.</p>
                <p className="mt-2 text-sm">Create a club first, then return here to start the session.</p>
                <div className="mt-4">
                  <Button asChild type="button" className="rounded-full bg-[#204a69] text-white hover:bg-[#17384f]">
                    <Link href={ clubsBackHref }>
                      <Plus className="size-4" />
                      Add Club
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null }

            { existingSession ? (
              <div className="rounded-[1.5rem] border border-[#c7d4e0] bg-[#f4f8fc] px-5 py-4 text-sm text-[#355472]">
                <p className="font-semibold text-[#20364f]">
                  { isEditMode ? 'Editing an existing club session.' : `A club session already exists for this ${ effectiveTargetType }.` }
                </p>
                <p className="mt-1">Club: { existingSession.clubName ?? 'Selected club' }</p>
                <p>Moderator: { existingSession.moderatorName ?? `Member #${ member.memberId }` }</p>
                { existingSession.discussThreadId ? (
                  <div className="mt-3">
                    <Button asChild type="button" className="rounded-full bg-[#204a69] text-white hover:bg-[#17384f]">
                      <Link href={ effectiveTargetType === 'book'
                        ? `/books/discussions/${ existingSession.discussThreadId }`
                        : `/poetry/discussions/${ existingSession.discussThreadId }` }>
                        Open Existing Session
                      </Link>
                    </Button>
                  </div>
                ) : null }
              </div>
            ) : null }

            { mustPickTarget ? (
              <div className="space-y-2">
                { availableTargets.length === 0 ? (
                  <p className="rounded-[1.4rem] border border-dashed border-[#c7d4e0] bg-[#f7fbfe] px-4 py-4 text-sm text-[#587089]">
                    Every book and poem already has an active club session. Add a book or poem first, then start a new session.
                  </p>
                ) : (
                  <div className="flex flex-row items-start gap-3">
                    <div className="w-32 shrink-0 space-y-2 sm:w-40">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]">Session Type</label>
                      <Select
                        value={ selectedTargetType }
                        onValueChange={ (value) => {
                          setSelectedTargetType(value as 'book' | 'poem');
                          setSelectedTargetId('');
                        } }
                        disabled={ !canSubmitSession || isSubmitting }
                      >
                        <SelectTrigger className="border-[#bfd0e0] bg-white text-[#20364f]">
                          <SelectValue placeholder="Select book or poem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="book">Book</SelectItem>
                          <SelectItem value="poem">Poem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-w-0 flex-1 space-y-2 md:max-w-md">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]">
                        { selectedTargetType === 'poem' ? 'Poem' : 'Book' }
                      </label>
                      <Select
                        value={ selectedTargetId }
                        onValueChange={ setSelectedTargetId }
                        disabled={ !canSubmitSession || isSubmitting || !selectedTargetType || targetsForSelectedType.length === 0 }
                      >
                        <SelectTrigger className="border-[#bfd0e0] bg-white text-[#20364f]">
                          <SelectValue placeholder={ !selectedTargetType ? 'Select a session type first' : 'Select a title' } />
                        </SelectTrigger>
                        <SelectContent>
                          { targetsForSelectedType.map((target) => (
                            <SelectItem key={ target.targetId } value={ String(target.targetId) }>
                              { target.targetTitle }
                            </SelectItem>
                          )) }
                        </SelectContent>
                      </Select>
                      { selectedTargetType && targetsForSelectedType.length === 0 ? (
                        <p className="text-sm text-[#587089]">
                          Every { selectedTargetType } already has an active club session.
                        </p>
                      ) : null }
                    </div>
                  </div>
                ) }
              </div>
            ) : null }

            <div className={ mustPickTarget ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4 md:grid-cols-3' }>
              { mustPickTarget ? null : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]">Club</label>
                  <Select value={ String(selectedClubId) } onValueChange={ (value) => setSelectedClubId(Number(value)) } disabled={ !canSubmitSession }>
                    <SelectTrigger className="border-[#bfd0e0] bg-white text-[#20364f]">
                      <SelectValue placeholder="Select a club" />
                    </SelectTrigger>
                    <SelectContent>
                      { clubs.map((club) => (
                        <SelectItem key={ club.id } value={ String(club.id) }>
                          { club.clubName }
                        </SelectItem>
                      )) }
                    </SelectContent>
                  </Select>
                  { selectedClub ? (
                    <p className="text-sm text-[#587089]">Moderator will be { member.firstName } { member.lastName }.</p>
                  ) : null }
                </div>
              ) }

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]" htmlFor="club-session-start-date">
                  Start Date
                </label>
                <Input
                  id="club-session-start-date"
                  type="date"
                  value={ startedAt }
                  onChange={ (event) => setStartedAt(event.target.value) }
                  className="border-[#bfd0e0] bg-white text-[#20364f]"
                  disabled={ !canSubmitSession || isSubmitting }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]" htmlFor="club-session-end-date">
                  End Date
                </label>
                <Input
                  id="club-session-end-date"
                  type="date"
                  value={ finishesAt }
                  onChange={ (event) => setFinishesAt(event.target.value) }
                  className="border-[#bfd0e0] bg-white text-[#20364f]"
                  disabled={ !canSubmitSession || isSubmitting }
                />
              </div>
            </div>

            <div className="space-y-2 rounded-[1.4rem] border border-[#dbe5ef] bg-white p-4">
              <div className="flex flex-wrap gap-2">
                <ToolbarButton label="Heading 3" editor={ editor } onClick={ () => editor?.chain().focus().toggleHeading({ level: 3 }).run() }>
                  <Heading3 className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Bold" editor={ editor } onClick={ () => editor?.chain().focus().toggleBold().run() }>
                  <Bold className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Italic" editor={ editor } onClick={ () => editor?.chain().focus().toggleItalic().run() }>
                  <Italic className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Underline" editor={ editor } onClick={ () => editor?.chain().focus().toggleUnderline().run() }>
                  <UnderlineIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Bulleted list" editor={ editor } onClick={ () => editor?.chain().focus().toggleBulletList().run() }>
                  <List className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Numbered list" editor={ editor } onClick={ () => editor?.chain().focus().toggleOrderedList().run() }>
                  <ListOrdered className="size-4" />
                </ToolbarButton>
              </div>

              <EditorContent
                editor={ editor }
                className="[&_.tiptap]:min-h-56 [&_.tiptap]:px-4 [&_.tiptap]:py-4 [&_.tiptap]:outline-none [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_li]:my-1"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                asChild
                type="button"
                variant="outline"
                className="rounded-full border-[#bfd0e0] bg-white px-4 text-xs font-semibold text-[#365472] hover:bg-[#f4f8fc]"
              >
                <Link href={ clubsBackHref }>Cancel</Link>
              </Button>

              <Button
                type="button"
                onClick={ submitClubSession }
                disabled={ !canSubmitSession || isSubmitting || (mustPickTarget && !pickedTarget) }
                className="rounded-full bg-[#204a69] px-4 text-xs font-semibold text-white hover:bg-[#17384f]"
              >
                <Save className="size-4" />
                { isSubmitting ? 'Saving...' : submitLabel }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}