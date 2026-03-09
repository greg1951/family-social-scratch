'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, CirclePlay, Home, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { trialSteps } from '@/features/trial/constants/trial-steps';
import Link from 'next/link';

export default function TrialSetup() {
  const steps = trialSteps;

  return (
    <Card className="w-90 border-slate-200 bg-linear-to-b from-white to-slate-50 shadow-lg md:w-230">
      <CardHeader className="rounded-t-xl bg-linear-to-r from-[#59cdf7] to-[#9de4fe] px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-extrabold text-slate-900 md:text-3xl">Start Your Family Social Trial</CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-800 md:text-base">
              A quick 4-step setup to launch your private family space.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700 md:text-sm">
            <CirclePlay className="h-4 w-4" />
            Estimated time: 3–5 minutes
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 py-5 md:px-6 md:py-6">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          { [
            {
              title: 'Secure',
              description: 'Your family data is encrypted and private',
              icon: ShieldCheck,
            },
            {
              title: 'Easy to Use',
              description: 'Simple setup for all family members',
              icon: Sparkles,
            },
            {
              title: 'Always Connected',
              description: 'Invite, share, and stay in touch',
              icon: Users,
            },
          ].map((benefit) => (
            <Card key={ benefit.title } className="gap-2 border-slate-200 px-3 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <benefit.icon className="h-4 w-4 text-[#005472]" />
                <h3 className="text-sm font-bold text-slate-900 md:text-base">{ benefit.title }</h3>
              </div>
              <p className="text-xs text-slate-600 md:text-sm">{ benefit.description }</p>
            </Card>
          )) }
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 md:text-base">Setup Roadmap</h2>
            <p className="text-xs text-slate-500">{ steps.length } steps total</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            { steps.map((step) => (
              <Card
                key={ step.number }
                className="gap-3 border-slate-200 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#59cdf7] text-sm font-bold text-white md:h-10 md:w-10">
                    { step.number }
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900 md:text-base">{ step.title }</h3>
                    <p className="mt-1 text-xs text-slate-600 md:text-sm">{ step.description }</p>
                  </div>

                  <CheckCircle2 className="h-5 w-5 shrink-0 text-slate-300" />
                </div>
              </Card>
            )) }
          </div>
        </div>

        <div className="rounded-lg border border-[#bfeeff] bg-[#ecfaff] p-4 md:p-5">
          <h2 className="text-lg font-bold text-slate-900 md:text-2xl">Ready to get started?</h2>
          <p className="mt-2 text-sm text-slate-700">
            We&apos;ll guide you through founder setup, family name selection, and invitations.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-[#59cdf7] text-[#005472] hover:bg-[#dff6ff] sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>

            <Link href="/trial-setup/trial-setup-steps" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-[#59cdf7] text-slate-900 hover:bg-[#9de4fe] sm:w-auto">
                Step 1: Register Family Founder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>

  );
}
