'use client';

import { BookOpenText, CircleHelp, HeartHandshake, LifeBuoy, Sparkles } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const helpResources = [
  {
    title: 'Getting Started Guide',
    description: 'Coming soon',
    icon: Sparkles,
  },
  {
    title: 'Family Setup Checklist',
    description: 'Coming soon',
    icon: BookOpenText,
  },
  {
    title: 'Safety and Support',
    description: 'Coming soon',
    icon: HeartHandshake,
  },
];

export default function PublicHelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open help resources"
          className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/75 text-[#005472] shadow-[0_10px_40px_-18px_rgba(0,84,114,0.65)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#59cdf7]"
        >
          <CircleHelp className="h-6 w-6 transition group-hover:scale-105" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-2xl border-[#9de4fe] bg-white/95 p-2 text-[#10364a] shadow-xl backdrop-blur">
        <DropdownMenuLabel className="px-3 pt-2 pb-1 text-sm font-bold text-[#005472]">
          Help Resources
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          { helpResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <DropdownMenuItem
                key={ resource.title }
                disabled
                className="mt-1 cursor-default rounded-xl px-3 py-3 opacity-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-100"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#dff6ff] p-2 text-[#005472]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#10364a]">{ resource.title }</p>
                    <p className="text-xs text-[#5a7381]">{ resource.description }</p>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          }) }
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#5a7381]">
          <LifeBuoy className="h-3.5 w-3.5" />
          Resource links will be connected here next.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
