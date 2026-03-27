'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import AccountDetailsForm from "./index";
import FamilyNotificationsForm from "../family-notifications";
import FamilyMemberSuggestForm from "../family-member-suggest";
import { MessageCircleMore, UserPenIcon, Users } from "lucide-react";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { MemberKeyDetails } from "@/features/family/types/family-steps";

type TabValue = "profile" | "settings" | "family-members";

const VALID_TABS: TabValue[] = ["profile", "settings", "family-members"];

function getValidTab(tab: string | null): TabValue {
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }
  return "profile";
}

export default function MemberAccountTabs({
  accountDetails,
  notifications,
  familyId,
  currentFamilyMembers,
  memberKeyDetails,
  founderDetails,
}: {
  accountDetails: AccountDetails;
  notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"];
  familyId: number;
  currentFamilyMembers: CurrentFamilyMember[];
  memberKeyDetails: MemberKeyDetails;
  founderDetails: FounderDetails | null;
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
          <UserPenIcon className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Your Profile
        </TabsTrigger>
        <TabsTrigger value="settings" className="border bg-slate-100 data-[state=active]:bg-white">
          <MessageCircleMore className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Your Settings
        </TabsTrigger>
        <TabsTrigger value="family-members" className="border bg-slate-100 data-[state=active]:bg-white">
          <Users className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Family Members
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        { accountDetails && (
          <AccountDetailsForm accountDetails={ accountDetails } founderDetails={ founderDetails } />
        ) }
      </TabsContent>

      <TabsContent value="settings" className="mt-4 rounded-lg border p-4">
        <FamilyNotificationsForm notifications={ notifications } />
      </TabsContent>

      <TabsContent value="family-members" className="mt-4 rounded-lg border p-4">
        <FamilyMemberSuggestForm
          familyId={ familyId }
          currentFamilyMembers={ currentFamilyMembers }
          memberKeyDetails={ memberKeyDetails }
          founderDetails={ founderDetails }
        />
      </TabsContent>
    </Tabs>
  );
}
