'use client';

import { useMemo, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, PencilLine, Plus, Send, Trash2, UserRoundMinus, UserRoundX } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import z from 'zod';

import MemberListIdentity from '@/components/common/member-list-identity';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CurrentFamilyMember } from '@/features/family/types/family-members';

import {
  addFamilyMemberAction,
  removeJoinedFamilyMemberAction,
  removePendingFamilyMemberAction,
  updateAndResendFamilyInvitationAction,
  updateFamilyMemberAction,
} from './family-members-actions';

const addMemberSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  inviteFounderMessage: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

const editMemberSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  cellPhone: z.string().max(14).optional(),
  inviteFounderMessage: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

type AddMemberValues = z.infer<typeof addMemberSchema>;
type EditMemberValues = z.infer<typeof editMemberSchema>;

function getMemberLifecycle(member: CurrentFamilyMember) {
  return member.status.toLowerCase() === 'joined' ? 'joined' : 'invited';
}

function getDisplayStatus(member: CurrentFamilyMember) {
  if (getMemberLifecycle(member) === 'joined') {
    return 'joined';
  }

  return member.status.toLowerCase();
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === 'joined') {
    return 'border-emerald-200 bg-emerald-100 text-emerald-700';
  }
  if (normalized === 'invited') {
    return 'border-sky-200 bg-sky-100 text-sky-700';
  }
  if (normalized === 'resend') {
    return 'border-cyan-200 bg-cyan-100 text-cyan-700';
  }
  if (normalized === 'declined') {
    return 'border-amber-200 bg-amber-100 text-amber-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${ digits.slice(0, 3) }) ${ digits.slice(3) }`;
  }

  return `(${ digits.slice(0, 3) }) ${ digits.slice(3, 6) }-${ digits.slice(6) }`;
}

function parseBirthday(value?: string) {
  if (!value || value === '01/01/1970') {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function formatBirthday(date?: Date) {
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function FamilyMembersPanel({
  familyMembers,
}: {
  familyMembers: CurrentFamilyMember[];
}) {
  const router = useRouter();
  const sortedMembers = useMemo(
    () => [...familyMembers].sort((left, right) => {
      const leftLifecycleRank = getMemberLifecycle(left) === 'joined' ? 0 : 1;
      const rightLifecycleRank = getMemberLifecycle(right) === 'joined' ? 0 : 1;

      if (leftLifecycleRank !== rightLifecycleRank) {
        return leftLifecycleRank - rightLifecycleRank;
      }

      return `${ left.firstName } ${ left.lastName }`.localeCompare(`${ right.firstName } ${ right.lastName }`);
    }),
    [familyMembers],
  );

  const [selectedInviteId, setSelectedInviteId] = useState<number | null>(sortedMembers[0]?.id ?? null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isAddSubmitting, startAddTransition] = useTransition();
  const [isEditSubmitting, startEditTransition] = useTransition();
  const [isRemoveSubmitting, startRemoveTransition] = useTransition();
  const [isResendingInvite, startResendTransition] = useTransition();
  const [birthdayPopoverOpen, setBirthdayPopoverOpen] = useState(false);
  const [selectedBirthday, setSelectedBirthday] = useState<Date | undefined>(undefined);

  const resolvedSelectedInviteId = useMemo(() => {
    if (sortedMembers.length === 0) {
      return null;
    }

    return sortedMembers.some((member) => member.id === selectedInviteId)
      ? selectedInviteId
      : sortedMembers[0].id;
  }, [selectedInviteId, sortedMembers]);

  const selectedMember = useMemo(
    () => sortedMembers.find((member) => member.id === resolvedSelectedInviteId) ?? null,
    [resolvedSelectedInviteId, sortedMembers],
  );
  const selectedLifecycle = selectedMember ? getMemberLifecycle(selectedMember) : null;
  const isInviteSelection = selectedMember !== null && selectedLifecycle === 'invited';

  const addForm = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      inviteFounderMessage: '',
    },
  });

  const editForm = useForm<EditMemberValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      cellPhone: '',
      inviteFounderMessage: '',
    },
  });

  function prepareEditForm(member: CurrentFamilyMember) {
    editForm.reset({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      cellPhone: member.cellPhone && member.cellPhone !== '(000) 000-0000'
        ? member.cellPhone
        : '',
      inviteFounderMessage: member.inviteFounderMessage ?? '',
    });
    setSelectedBirthday(parseBirthday(member.birthday));
  }

  function openEditDialog() {
    if (!selectedMember) {
      return;
    }

    prepareEditForm(selectedMember);
    setIsEditOpen(true);
  }

  function openEditDialogForMember(member: CurrentFamilyMember) {
    setSelectedInviteId(member.id);
    prepareEditForm(member);
    setIsEditOpen(true);
  }

  async function handleAdd(values: AddMemberValues) {
    startAddTransition(async () => {
      const result = await addFamilyMemberAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      addForm.reset({
        firstName: '',
        lastName: '',
        email: '',
        inviteFounderMessage: '',
      });
      setIsAddOpen(false);
      router.refresh();
    });
  }

  async function handleEdit(values: EditMemberValues) {
    if (!selectedMember) {
      return;
    }

    const originalEmail = selectedMember.email.trim().toLowerCase();
    const submittedEmail = values.email.trim().toLowerCase();

    if (originalEmail !== submittedEmail) {
      const confirmed = window.confirm('Are you sure you want to change this member email address?');
      if (!confirmed) {
        return;
      }
    }

    startEditTransition(async () => {
      const result = await updateFamilyMemberAction({
        inviteId: selectedMember.id,
        memberId: selectedMember.memberId ?? null,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        cellPhone: selectedLifecycle === 'joined' ? values.cellPhone : '',
        birthday: selectedLifecycle === 'joined'
          ? formatBirthday(selectedBirthday) || selectedMember.birthday || '01/01/1970'
          : '',
        status: selectedLifecycle === 'joined' ? 'joined' : 'invited',
        inviteFounderMessage: selectedMember.inviteFounderMessage,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsEditOpen(false);
      router.refresh();
    });
  }

  function handleSendInvite(values: EditMemberValues) {
    if (!selectedMember || !isInviteSelection) {
      return;
    }

    startResendTransition(async () => {
      const result = await updateAndResendFamilyInvitationAction({
        inviteId: selectedMember.id,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        inviteFounderMessage: values.inviteFounderMessage,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsEditOpen(false);
      router.refresh();
    });
  }

  function handleInviteEditRemove() {
    if (!selectedMember || !isInviteSelection) {
      return;
    }

    startRemoveTransition(async () => {
      const result = await removePendingFamilyMemberAction({ inviteId: selectedMember.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsEditOpen(false);
      router.refresh();
    });
  }

  function handleRemove(deleteType?: 'soft' | 'hard') {
    if (!selectedMember) {
      return;
    }

    startRemoveTransition(async () => {
      const result = selectedMember.memberId
        ? await removeJoinedFamilyMemberAction({
          memberId: selectedMember.memberId,
          deleteType: deleteType ?? 'soft',
        })
        : await removePendingFamilyMemberAction({ inviteId: selectedMember.id });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setIsRemoveOpen(false);
      router.refresh();
    });
  }

  return (
    <CardContent className="space-y-4 pt-5">
      <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#f9fdff_0%,#eefaff_50%,#fff8ef_100%)] px-4 py-4 shadow-[0_18px_38px_-32px_rgba(16,54,74,0.55)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {/* <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2f7a95]">Family Members</p> */}
            <h3 className="mt-1 text-xl font-bold text-[#10364a]">Manage your family membership on this page.</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#456271]">
              Select a member from the list below to edit their details, send another invitation, or remove them from the family. You can also add new members to your family account.
            </p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/85 px-4 py-3 text-sm text-[#456271] shadow-sm">
            {/* <p className="font-semibold text-[#10364a]">{ founderDetails.familyName }</p> */}
            <p>{ sortedMembers.length } active records in this family list</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={ !selectedMember }
          onClick={ openEditDialog }
          className="border-[#c5dceb] bg-white text-[#23495c] hover:bg-[#eef8ff]"
        >
          <PencilLine className="mr-2 h-4 w-4" />
          Edit Member
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={ !selectedMember }
          onClick={ () => setIsRemoveOpen(true) }
          className="border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Member
        </Button>
        <Button
          type="button"
          onClick={ () => setIsAddOpen(true) }
          className="bg-[linear-gradient(135deg,#005472_0%,#0a779f_52%,#59cdf7_100%)] text-white hover:brightness-110"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_38px_-32px_rgba(16,54,74,0.5)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
          <p className="text-sm font-semibold text-slate-900">Current Family Members</p>
        </div>

        { sortedMembers.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-slate-500">No joined or invited members are available yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 p-2 min-[520px]:grid-cols-2 md:grid-cols-3">
            { sortedMembers.map((member) => {
              const isSelected = member.id === selectedInviteId;
              const status = getDisplayStatus(member);
              const isJoined = getMemberLifecycle(member) === 'joined';

              return (
                <button
                  key={ member.id }
                  type="button"
                  onClick={ () => setSelectedInviteId(member.id) }
                  onDoubleClick={ () => openEditDialogForMember(member) }
                  className={ cn(
                    'rounded-2xl border px-3 py-3 text-left transition',
                    isSelected
                      ? 'border-[#0a779f] bg-[#eefaff] shadow-[0_12px_26px_-22px_rgba(10,119,159,0.65)]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                  ) }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <MemberListIdentity
                        firstName={ member.firstName }
                        lastName={ member.lastName }
                        email={ member.email }
                        memberImageUrl={ member.memberImageUrl ?? null }
                        nameAccessory={ (
                          <span className={ cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', getStatusClasses(status)) }>
                            { status }
                          </span>
                        ) }
                      />
                      { isJoined && (member.cellPhone || member.birthday) && (
                        <div className="mt-2 space-y-0.5 text-xs text-slate-500">
                          { member.cellPhone && member.cellPhone !== '(000) 000-0000' && <p>Phone: { member.cellPhone }</p> }
                          { member.birthday && member.birthday !== '01/01/1970' && <p>Birthday: { member.birthday }</p> }
                        </div>
                      ) }
                      { !isJoined && member.inviteFounderMessage && (
                        <p className="mt-2 line-clamp-2 text-xs italic text-slate-500">{ member.inviteFounderMessage }</p>
                      ) }
                    </div>
                  </div>
                </button>
              );
            }) }
          </div>
        ) }
      </div>

      <Dialog open={ isAddOpen } onOpenChange={ setIsAddOpen }>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Capture the new member&apos;s name, email, and optional founder note. When you submit, the invitation email is sent immediately and the member enters invited status.
            </DialogDescription>
          </DialogHeader>

          <Form { ...addForm }>
            <form onSubmit={ addForm.handleSubmit(handleAdd) } className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={ addForm.control }
                  name="firstName"
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" { ...field } />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) }
                />
                <FormField
                  control={ addForm.control }
                  name="lastName"
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" { ...field } />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) }
                />
                <FormField
                  control={ addForm.control }
                  name="email"
                  render={ ({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" { ...field } />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) }
                />
              </div>
              <FormField
                control={ addForm.control }
                name="inviteFounderMessage"
                render={ ({ field }) => (
                  <FormItem>
                    <FormLabel>Founder Note</FormLabel>
                    <FormControl>
                      <Textarea rows={ 4 } placeholder="Optional note to include with the invitation" { ...field } />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                ) }
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={ isAddSubmitting }>
                  <Send className="mr-2 h-4 w-4" />
                  { isAddSubmitting ? 'Sending...' : 'Send Invitation' }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={ isEditOpen } onOpenChange={ setIsEditOpen }>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{ isInviteSelection ? 'Edit Invited Member' : 'Edit Joined Member' }</DialogTitle>
            <DialogDescription>
              { isInviteSelection
                ? 'Update the invitation details and either send another invitation or remove the invite.'
                : 'Update the selected joined member details.' }
            </DialogDescription>
          </DialogHeader>

          { selectedMember && (
            <Form { ...editForm }>
              <form onSubmit={ editForm.handleSubmit(handleEdit) } className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={ editForm.control }
                    name="firstName"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input { ...field } />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <FormField
                    control={ editForm.control }
                    name="lastName"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input { ...field } />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                  <FormField
                    control={ editForm.control }
                    name="email"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input { ...field } />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                </div>

                { isInviteSelection && (
                  <FormField
                    control={ editForm.control }
                    name="inviteFounderMessage"
                    render={ ({ field }) => (
                      <FormItem>
                        <FormLabel>Founder Note</FormLabel>
                        <FormControl>
                          <Textarea rows={ 4 } placeholder="Optional note to include with the invitation" { ...field } />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    ) }
                  />
                ) }

                { selectedLifecycle === 'joined' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={ editForm.control }
                      name="cellPhone"
                      render={ ({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(000) 000-0000"
                              { ...field }
                              value={ field.value ?? '' }
                              onChange={ (event) => field.onChange(formatPhoneNumber(event.target.value)) }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) }
                    />
                    <div className="space-y-2">
                      <FormLabel>Birthday</FormLabel>
                      <Popover open={ birthdayPopoverOpen } onOpenChange={ setBirthdayPopoverOpen }>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" className="w-full justify-start font-normal">
                            { selectedBirthday ? formatBirthday(selectedBirthday) : 'Select date' }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={ selectedBirthday }
                            defaultMonth={ selectedBirthday }
                            captionLayout="dropdown"
                            onSelect={ (date) => {
                              setSelectedBirthday(date as Date | undefined);
                              setBirthdayPopoverOpen(false);
                            } }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                ) }

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  { isInviteSelection ? (
                    <>
                      <Button type="button" variant="outline" disabled={ isRemoveSubmitting } onClick={ handleInviteEditRemove }>
                        <Trash2 className="mr-2 h-4 w-4" />
                        { isRemoveSubmitting ? 'Removing...' : 'Remove' }
                      </Button>
                      <Button type="button" disabled={ isResendingInvite } onClick={ editForm.handleSubmit(handleSendInvite) }>
                        <Mail className="mr-2 h-4 w-4" />
                        { isResendingInvite ? 'Sending...' : 'Send Invite' }
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={ isEditSubmitting }>
                      <PencilLine className="mr-2 h-4 w-4" />
                      { isEditSubmitting ? 'Saving...' : 'Save Changes' }
                    </Button>
                  ) }
                </DialogFooter>
              </form>
            </Form>
          ) }
        </DialogContent>
      </Dialog>

      <Dialog open={ isRemoveOpen } onOpenChange={ setIsRemoveOpen }>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              { selectedLifecycle === 'joined'
                ? 'Choose how to remove the selected joined member. Soft delete removes access and keeps contributions. Hard delete removes the member and their contributed records.'
                : 'Remove the selected invitation from the family list.' }
            </DialogDescription>
          </DialogHeader>

          { selectedMember ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <MemberListIdentity
                  firstName={ selectedMember.firstName }
                  lastName={ selectedMember.lastName }
                  email={ selectedMember.email }
                  memberImageUrl={ selectedMember.memberImageUrl ?? null }
                />
                <div className="mt-2 text-xs text-slate-500">
                  Current state: <span className="font-semibold uppercase tracking-wide text-slate-700">{ getDisplayStatus(selectedMember) }</span>
                </div>
              </div>

              { selectedLifecycle === 'joined' ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={ isRemoveSubmitting }
                    onClick={ () => handleRemove('soft') }
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <UserRoundMinus className="mr-2 h-4 w-4" />
                    { isRemoveSubmitting ? 'Processing...' : 'Soft Delete (Retire)' }
                  </Button>
                  <Button
                    type="button"
                    disabled={ isRemoveSubmitting }
                    onClick={ () => handleRemove('hard') }
                    className="w-full bg-[#0a779f] text-white hover:bg-[#086684]"
                  >
                    <UserRoundX className="mr-2 h-4 w-4" />
                    { isRemoveSubmitting ? 'Processing...' : 'Hard Delete' }
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  disabled={ isRemoveSubmitting }
                  onClick={ () => handleRemove() }
                  className="w-full bg-[#0a779f] text-white hover:bg-[#086684]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  { isRemoveSubmitting ? 'Removing...' : 'Remove Invitation' }
                </Button>
              ) }

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
              Select a member from the list before trying to remove them.
            </div>
          ) }
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}