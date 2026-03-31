'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageCircleMore, UserPenIcon, UserPlus, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import FamilyNotificationsForm from "../family-notifications";
import AccountDetailsForm from "@/app/(family)/family-member-account";
import NewMembersAccountForm from "../(family-members)/family-new-members/index-new";
import CurrentMembersAccountForm from "../(family-members)/family-current-members/index-current";
// import { MemberKeyDetails } from "@/features/family/types/family-steps";

type TabValue = "profile" | "notifications" | "current-family" | "new-family";

const VALID_TABS: TabValue[] = ["profile", "notifications", "current-family", "new-family"];

function getValidTab(tab: string | null): TabValue {
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }

  return "profile";
}

export default function FounderAccountTabs({
  founderDetails,
  notifications,
  currentFamilyMembers,
}: {
  // accountDetails: AccountDetails | null;
  founderDetails: FounderDetails;
  notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"];
  currentFamilyMembers: CurrentFamilyMember[];
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
    <Tabs value={ activeTab } onValueChange={ onTabChange } className=" gap-y-25 md:gap-y-2">
      <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-4 mb-10 md:mb-1">
        <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
          <UserPenIcon className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Your Profile
        </TabsTrigger>
        <TabsTrigger value="notifications" className="border bg-slate-100 data-[state=active]:bg-white">
          <MessageCircleMore className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Your Settings
        </TabsTrigger>
        <TabsTrigger value="current-family" className="border bg-slate-100 data-[state=active]:bg-white">
          <Users className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Current Invites
        </TabsTrigger>
        <TabsTrigger value="new-family" className="border bg-slate-100 data-[state=active]:bg-white">
          <UserPlus className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          Add Invites
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        { founderDetails && (
          <AccountDetailsForm founderDetails={ founderDetails } />
        ) }
      </TabsContent>

      <TabsContent value="notifications" className="mt-4 rounded-lg border p-4">
        <FamilyNotificationsForm notifications={ notifications } />
      </TabsContent>

      <TabsContent value="new-family" className="mt-4 rounded-lg border">
        <NewMembersAccountForm
          founderDetails={ founderDetails }
          currentFamilyMembers={ currentFamilyMembers }
        />
      </TabsContent>

      <TabsContent value="current-family" className="mt-4 rounded-lg border">
        <CurrentMembersAccountForm familyMembers={ currentFamilyMembers } founderDetails={ founderDetails } />
      </TabsContent>
    </Tabs>
  );
}
