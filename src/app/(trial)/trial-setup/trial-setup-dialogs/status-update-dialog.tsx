'use client';

import { Circle, CheckCircle2, CircleSlash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubmissionStep } from '@/features/trial/types/trial-steps';


type StatusUpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionSteps: SubmissionStep[];
};

export function StatusUpdateDialog({ open, onOpenChange, submissionSteps }: StatusUpdateDialogProps) {
  const router = useRouter();
  const allStepsCompleted = submissionSteps.every((s) => s.status === 'completed');

  return (
    <Dialog
      open={ open }
      onOpenChange={ (nextOpen) => {
        if (nextOpen || allStepsCompleted) {
          onOpenChange(nextOpen);
        }
      } }
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={ (event) => {
          if (!allStepsCompleted) event.preventDefault();
        } }
        onInteractOutside={ (event) => {
          if (!allStepsCompleted) event.preventDefault();
        } }
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Setting Up Your Family Social Account</DialogTitle>
          <DialogDescription>
            Please wait while we complete the following steps...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          { submissionSteps.map((step) => (
            <div key={ step.id } className="flex items-start gap-3">
              <div className="mt-0.5">
                { step.status === 'pending' && (
                  <Circle className="h-5 w-5 text-slate-300" />
                ) }
                { step.status === 'inProgress' && (
                  <Loader2 className="h-5 w-5 animate-spin text-[#59cdf7]" />
                ) }
                { step.status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) }
                { step.status === 'error' && (
                  <CircleSlash2 className="h-5 w-5 text-red-500" />
                ) }
              </div>
              <div className="flex-1">
                <p
                  className={ `text-sm font-medium ${ step.status === 'completed'
                    ? 'text-emerald-700'
                    : step.status === 'error'
                      ? 'text-red-700'
                      : step.status === 'inProgress'
                        ? 'text-[#005472]'
                        : 'text-slate-500'
                    }` }
                >
                  { step.label }
                </p>
                { step.status === 'error' && step.errorMessage && (
                  <p className="text-xs text-red-600 mt-1">{ step.errorMessage }</p>
                ) }
              </div>
            </div>
          )) }
        </div>

        <DialogFooter>
          <Button
            onClick={ () => {
              if (!allStepsCompleted) return;
              onOpenChange(false);
              router.push('/');
            } }
            disabled={ !allStepsCompleted }
            className="w-full bg-[#59cdf7] hover:bg-[#9de4fe] text-black font-semibold"
          >
            { allStepsCompleted ? 'Close' : 'Please wait...' }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
