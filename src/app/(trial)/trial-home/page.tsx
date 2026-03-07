'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { trialSteps } from '@/features/trial/components/trial-steps';
import Link from 'next/link';

export default function TrialSetup() {
  const steps = trialSteps;

  return (
    <Card className="flex align-top w-[350] md:w-[800]">
      <CardHeader className=" text-base md:text-2xl bg-[#59cdf7] rounded-2xl text-center p-2">
        <CardTitle className="text-center font-bold size-1.2 p-2">Set Up Your Family Social Account</CardTitle>
        {/* <div className="p-1">
          <CardDescription className="text-extrabold">
            Follow the steps below to get your family connected
          </CardDescription>
        </div> */}
      </CardHeader>
      <CardContent>
        {/* Benefits */ }
        <div className="grid grid-cols-1 md:grid-cols-3 mt-5 gap-2 pb-5">
          { [
            { title: 'Secure', description: 'Your family data is encrypted and private' },
            { title: 'Easy to Use', description: 'Intuitive interface for all ages' },
            { title: 'Always Connected', description: 'Access from any device, anytime' },
          ].map((benefit) => (
            <Card key={ benefit.title } className="p-2 text-center gap-y-2">
              <h3 className="font-semibold text-base text-neutral-900">
                { benefit.title }
              </h3>
              <p className="text-sm text-neutral-600">
                { benefit.description }
              </p>
            </Card>
          )) }
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 space-x-4 space-y-6 mb-6">
          { steps.map((step, index) => (
            <Card
              key={ step.number }
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start p-3">
                {/* Step Number Circle */ }
                <div className="shrink-0 mr-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#59cdf7] text-white font-bold text-base md:text-lg">
                    { step.number }
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-bold text-neutral-900 mb-2">
                    { step.title }
                  </h2>
                  <p className="text-neutral-600">
                    { step.description }
                  </p>
                </div>

                <div className="shrink-0 ml-4">
                  <CheckCircle2 className="w-6 h-6 text-neutral-300" />
                </div>
              </div>
            </Card>
          )) }
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-neutral-600 mb-8">
            Join our network of families who stay connected with Family Social!
          </p>
          <Link href="/trial-setup/trial-setup-steps">
            <Button size="lg" className="bg-[#59cdf7] hover:bg-[#9de4fe]">
              Step 1: Register Family Founder
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>

  );
}
