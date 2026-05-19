'use client';

import { useMemo, useState, useTransition } from 'react';
import { UserRoundMinus, UserRoundX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MemberListIdentity from '@/components/common/member-list-identity';
import { RemovableFamilyMember } from '@/features/family/types/family-members';
import { removeFamilyMemberAction } from './actions';

type RemoveMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  joinedMembers: RemovableFamilyMember[];
};

export function RemoveMemberDialog({ open, onOpenChange, joinedMembers }: RemoveMemberDialogProps) {
  const router = useRouter();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const selectedMember = useMemo(
    () => joinedMembers.find((member) => member.memberId === selectedMemberId) ?? null,
    [joinedMembers, selectedMemberId],
  );

  function resetSelection() {
    setSelectedMemberId(null);
  }

  function onDialogChange(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetSelection();
    }
  }

  function handleRemove(deleteType: 'soft' | 'hard') {
    if (!selectedMemberId) {
      toast.error('Select a joined family member first.');
      return;
    }

    startSubmitTransition(async () => {
      const result = await removeFamilyMemberAction({
        targetMemberId: selectedMemberId,
        deleteType,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      onDialogChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={ open } onOpenChange={ onDialogChange }>
      <DialogContent className="sm:max-w-xl font-app text-xs">
        <DialogHeader>
          <DialogTitle>Remove Family Member</DialogTitle>
          <DialogDescription className="text-xs">
            Select a joined member and choose how to remove them.
            Soft delete keeps contributions and removes access.
            Hard delete removes the member and their contributed records.
          </DialogDescription>
        </DialogHeader>

        { joinedMembers.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            No joined members are currently eligible for removal.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Joined Family Members</p>
              <div className="max-h-80 space-y-2 overflow-auto pr-1">
                { joinedMembers.map((member) => {
                  const isSelected = member.memberId === selectedMemberId;

                  return (
                    <button
                      key={ member.memberId }
                      type="button"
                      onClick={ () => setSelectedMemberId(member.memberId) }
                      className={ [
                        "w-full rounded-xl border px-3 py-3 text-left transition",
                        isSelected
                          ? "border-[#0a779f] bg-[#eefaff] shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ") }
                      disabled={ isSubmitting }
                    >
                      <MemberListIdentity
                        firstName={ member.firstName }
                        lastName={ member.lastName }
                        email={ member.email }
                        memberImageUrl={ member.memberImageUrl ?? null }
                      />
                      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        { isSelected ? 'Selected for removal' : 'Click to select' }
                      </div>
                    </button>
                  );
                }) }
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Delete Method</p>
                <p className="mt-1 text-sm text-slate-600">
                  Choose the exact delete path for the selected joined member.
                </p>
              </div>

              { selectedMember ? (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <MemberListIdentity
                    firstName={ selectedMember.firstName }
                    lastName={ selectedMember.lastName }
                    email={ selectedMember.email }
                    memberImageUrl={ selectedMember.memberImageUrl ?? null }
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
                  Select a joined member to enable the delete actions.
                </div>
              ) }

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={ isSubmitting || joinedMembers.length === 0 || selectedMemberId === null }
                  onClick={ () => handleRemove('soft') }
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <UserRoundMinus className="mr-1 h-4 w-4" />
                  { isSubmitting ? 'Processing...' : 'Soft Delete (Retire)' }
                </Button>
                <Button
                  type="button"
                  disabled={ isSubmitting || joinedMembers.length === 0 || selectedMemberId === null }
                  onClick={ () => handleRemove('hard') }
                  className="w-full bg-[#0a779f] text-white hover:bg-[#086684]"
                >
                  <UserRoundX className="mr-1 h-4 w-4" />
                  { isSubmitting ? 'Processing...' : 'Hard Delete' }
                </Button>
              </div>
            </div>
          </div>
        ) }
      </DialogContent>
    </Dialog>
  );
}
