import type { ReactNode } from 'react';

import PublicEntryShell from '@/components/common/public-entry-shell';

export default function RegistrationLayout({ children }: { children: ReactNode }) {
  return <PublicEntryShell>{ children }</PublicEntryShell>;
}
