'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import AccountDetailsForm from "./index";
import FamilyNotificationsForm from "../family-notifications";

type TabValue = "profile" | "notifications";

const VALID_TABS: TabValue[] = ["profile", "notifications"];

function getValidTab(tab: string | null): TabValue {
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }
  return "profile";
}

export default function MemberAccountTabs({
  accountDetails,
  notifications,
}: {
  accountDetails: AccountDetails;
  notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = getValidTab(searchParams.get("tab"));

  const onTabChange = (tab: string) => {
    const nextTab = getValidTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    router.replace(`${ pathname }?${ params.toString() }`, { scroll: false });
  };

  return (
    <Tabs value={ activeTab } onValueChange={ onTabChange } className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-3 mb-10 md:mb-1">
        <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
          Member Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="border bg-slate-100 data-[state=active]:bg-white">
          Notifications
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        { accountDetails && (
          <AccountDetailsForm accountDetails={ accountDetails } />
        ) }
      </TabsContent>

      <TabsContent value="notifications" className="mt-4 rounded-lg border p-4">
        <FamilyNotificationsForm notifications={ notifications } />
      </TabsContent>
    </Tabs>
  );
}
