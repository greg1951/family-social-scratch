'use client';

import { ArrowLeft, CalendarDays, PenSquare, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteClubAction, deleteClubSessionAction, saveClubAction } from '@/app/(features)/(clubs)/add-club/actions';
import type { Club } from '@/components/db/types/clubs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { MemberKeyDetails } from '@/features/family/types/family-steps';

type ClubsHomePageProps = {
  clubs: Club[];
  member: MemberKeyDetails;
};

function formatCreatedAt(createdAt: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt));
}

function formatSessionDate(date: Date | null | undefined) {
  if (!date) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default function ClubsHomePage({ clubs, member }: ClubsHomePageProps) {
  const router = useRouter();
  const [isSaving, startSavingTransition] = useTransition();
  const [isDeleting, startDeletingTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [clubName, setClubName] = useState('');

  function openAddClubDialog() {
    setEditingClub(null);
    setClubName('');
    setIsDialogOpen(true);
  }

  function openEditClubDialog(club: Club) {
    setEditingClub(club);
    setClubName(club.clubName);
    setIsDialogOpen(true);
  }

  function handleSaveClub() {
    startSavingTransition(async () => {
      const result = await saveClubAction({
        id: editingClub?.id,
        clubName,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsDialogOpen(false);
      router.refresh();
    });
  }

  function handleDeleteClub(clubId: number) {
    if (!window.confirm('Delete this club and all of its sessions?')) {
      return;
    }

    startDeletingTransition(async () => {
      const result = await deleteClubAction({ clubId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleDeleteSession(clubSessionId: number) {
    if (!window.confirm('Delete this club session and its discussion thread?')) {
      return;
    }

    startDeletingTransition(async () => {
      const result = await deleteClubSessionAction({ clubSessionId });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.refresh();
    });
  }

  function handleGoBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }

  return (
    <section className="font-app w-full px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(47,74,109,0.96),rgba(76,121,170,0.9)_56%,rgba(188,149,95,0.84))] px-6 py-8 text-white shadow-[0_28px_80px_-40px_rgba(33,50,73,0.95)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.34em] text-[#edf6ff]">
                Book & Poetry Clubs
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={ handleGoBack }
                  className="inline-flex items-center rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0f7ff] transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ArrowLeft className="mr-2 size-4" />
                  Go Back
                </button>
              </div>

              <h1 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                Create clubs for shared book and poetry discussions.
              </h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white/88 shadow-[0_24px_70px_-40px_rgba(47,74,109,0.7)] backdrop-blur">
          <div className="border-b border-[#dbe5ef] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,249,253,0.86))] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#496789]">
                  Club Directory
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#20364f]">
                  Manage Family Clubs
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#587089]">
                  { clubs.length === 0
                    ? 'Create the first club for this family, then start sessions from the book or poetry home pages.'
                    : 'Edit club names here and use the club session flow from books or poetry to start discussions.' }
                </p>
              </div>

              <Button
                type="button"
                onClick={ openAddClubDialog }
                className="rounded-full bg-[#204a69] px-4 text-xs font-semibold text-white hover:bg-[#17384f]"
              >
                <Plus className="size-4" />
                Add Club
              </Button>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            { clubs.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#c7d4e0] bg-[#f7fbfe] px-6 py-10 text-center text-[#587089]">
                <Users className="mx-auto mb-3 size-10 text-[#6c87a5]" />
                <p className="text-lg font-semibold text-[#20364f]">No clubs have been created yet.</p>
                <p className="mt-2 text-sm">Use Add Club to create the first one.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                { clubs.map((club) => (
                  <article key={ club.id } className="rounded-[1.5rem] border border-[#dbe5ef] bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-[#5f7d9a]">Club</p>
                        <h3 className="mt-1 text-xl font-black tracking-tight text-[#20364f]">{ club.clubName }</h3>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={ () => openEditClubDialog(club) }
                          className="rounded-full border-[#bfd0e0] bg-white px-3 text-xs font-semibold text-[#365472] hover:bg-[#f4f8fc]"
                        >
                          <PenSquare className="size-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={ () => handleDeleteClub(club.id) }
                          disabled={ isSaving || isDeleting }
                          className="rounded-full border-[#e7c7c7] bg-white px-3 text-xs font-semibold text-[#8f4f4f] hover:bg-[#fff6f6]"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-[#587089]">
                      <p>Founder: { club.founderName ?? `Member #${ club.clubFounderId ?? member.memberId }` }</p>
                      <p>Created: { formatCreatedAt(club.createdAt) }</p>
                      <p>Sessions: { club.sessionCount ?? 0 }</p>
                    </div>

                    { club.sessions && club.sessions.length > 0 ? (
                      <div className="mt-4 space-y-3 border-t border-[#edf2f7] pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#5f7d9a]">
                          <CalendarDays className="size-4" />
                          Club Sessions
                        </div>

                        <div className="space-y-3">
                          { club.sessions.map((session) => (
                            <div key={ session.id } className="rounded-4xl border border-[#dbe5ef] bg-[#fbfdff] p-4">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-[#20364f]">
                                    { session.targetTitle ?? session.discussTopic ?? 'Club Session' }
                                  </p>
                                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#5f7d9a]">
                                    { session.targetType === 'book' ? 'Book Session' : 'Poem Session' }
                                  </p>
                                </div>

                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <Button asChild type="button" variant="outline" className="rounded-full border-[#bfd0e0] bg-white px-3 text-xs font-semibold text-[#365472] hover:bg-[#f4f8fc]">
                                    <Link href={ `/add-club-session?sessionId=${ session.id }` }>
                                      <PenSquare className="size-3.5" />
                                    </Link>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={ () => handleDeleteSession(session.id) }
                                    disabled={ isSaving || isDeleting }
                                    className="rounded-full border-[#e7c7c7] bg-white px-3 text-xs font-semibold text-[#8f4f4f] hover:bg-[#fff6f6]"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 text-sm text-[#587089] sm:grid-cols-2">
                                <p>Moderator: { session.moderatorName ?? `Member #${ session.moderatorId ?? member.memberId }` }</p>
                                <p>Started: { formatSessionDate(session.startedAt) }</p>
                                <p>Ends: { formatSessionDate(session.finishesAt) }</p>
                                <p>Discussion: { session.discussTopic ?? session.targetTitle ?? 'Open session' }</p>
                              </div>
                            </div>
                          )) }
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 rounded-4xl border border-dashed border-[#dbe5ef] bg-[#fbfdff] px-4 py-3 text-sm text-[#7a8f9c]">
                        No club sessions have been added yet.
                      </p>
                    ) }
                  </article>
                )) }
              </div>
            ) }
          </div>
        </div>
      </div>

      <Dialog open={ isDialogOpen } onOpenChange={ setIsDialogOpen }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#20364f]">
              { editingClub ? 'Edit Club' : 'Add Club' }
            </DialogTitle>
            <DialogDescription className="text-[#587089]">
              Name the club so family members can start club sessions from the book and poetry home pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7d9a]" htmlFor="club-name-input">
              Club Name
            </label>
            <Input
              id="club-name-input"
              value={ clubName }
              onChange={ (event) => setClubName(event.target.value) }
              placeholder="Enter a club name"
              disabled={ isSaving }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={ handleSaveClub }
              disabled={ isSaving }
              className="rounded-full bg-[#204a69] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#17384f]"
            >
              { isSaving ? 'Saving...' : 'Save Club' }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}