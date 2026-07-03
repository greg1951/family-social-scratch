'use client';

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountDetails } from "@/features/auth/types/auth-types";
import { GetMemberNotificationsReturn } from "@/components/db/types/family-member";
import AccountDetailsForm from "./index";
import FamilyNotificationsForm from "../family-notifications";
import FamilyMemberSuggestForm from "../family-member-suggest";
import { BarChart3, MessageCircleMore, UserPenIcon, Users } from "lucide-react";
import { CurrentFamilyMember, FounderDetails } from "@/features/family/types/family-members";
import { MemberKeyDetails } from "@/features/family/types/family-steps";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MemberActivitySummaryChart from "@/components/charts/family/member-activity-summary-chart";
import type { MemberDashboardActivitySummary } from "@/components/db/sql/queries-family-activity";

type TabValue = "profile" | "settings" | "family-members" | "activity";

const VALID_TABS: TabValue[] = ["profile", "settings", "family-members", "activity"];

function getValidTab(tab: string | null): TabValue {
  if (tab && VALID_TABS.includes(tab as TabValue)) {
    return tab as TabValue;
  }
  return "profile";
}

export default function MemberAccountTabs({
  accountDetails,
  notifications,
  currentFamilyMembers,
  memberKeyDetails,
  founderDetails,
  memberActivitySummary,
  startDateValue,
  endDateValue,
}: {
  accountDetails: AccountDetails;
  notifications: Extract<GetMemberNotificationsReturn, { success: true }>["notifications"];
  currentFamilyMembers: CurrentFamilyMember[];
  memberKeyDetails: MemberKeyDetails;
  founderDetails: FounderDetails | null;
  memberActivitySummary: MemberDashboardActivitySummary;
  startDateValue: string;
  endDateValue: string;
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
      <TabsList className="mb-10 grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:mb-1 md:grid-cols-4">
        <TabsTrigger value="profile" className="border bg-slate-100 data-[state=active]:bg-white">
          <UserPenIcon className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          My Profile
        </TabsTrigger>
        <TabsTrigger value="settings" className="border bg-slate-100 data-[state=active]:bg-white">
          <MessageCircleMore className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          My Settings
        </TabsTrigger>
        <TabsTrigger value="family-members" className="border bg-slate-100 data-[state=active]:bg-white">
          <Users className="inline h-3 w-3 mr-1 text-[#59cdf7]" />
          My Family
        </TabsTrigger>
        <TabsTrigger value="activity" className="border bg-slate-100 data-[state=active]:bg-white">
          <BarChart3 className="mr-1 inline h-3 w-3 text-[#59cdf7]" />
          My Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-4">
        { founderDetails && (
          <AccountDetailsForm accountDetails={ accountDetails } founderDetails={ founderDetails } />
        ) }
      </TabsContent>

      <TabsContent value="settings" className="mt-4 rounded-lg border p-4">
        <FamilyNotificationsForm notifications={ notifications } />
      </TabsContent>

      <TabsContent value="family-members" className="mt-4 rounded-lg border p-4">
        <FamilyMemberSuggestForm
          currentFamilyMembers={ currentFamilyMembers }
          memberKeyDetails={ memberKeyDetails }
          founderDetails={ founderDetails }
        />
      </TabsContent>

      <TabsContent value="activity" className="mt-4 rounded-lg border p-4">
        <Card className="p-3">
          <form method="get" className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <input type="hidden" name="tab" value="activity" />
            <div className="space-y-1">
              <label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wide text-[#2f7a95]">Start Date</label>
              <Input id="startDate" name="startDate" type="datetime-local" defaultValue={ startDateValue } />
            </div>
            <div className="space-y-1">
              <label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wide text-[#2f7a95]">End Date</label>
              <Input id="endDate" name="endDate" type="datetime-local" defaultValue={ endDateValue } />
            </div>
            <Button type="submit" className="md:w-auto">Apply Range</Button>
          </form>
        </Card>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="p-3">
            <div className="pt-5">
              <MemberActivitySummaryChart
                title="Your Activity on Other Members' Posts"
                data={ [
                  {
                    label: "You",
                    POST_CREATED: memberActivitySummary.memberToOthers.posts,
                    COMMENT_CREATED: memberActivitySummary.memberToOthers.comments,
                    LIKE_ADDED: memberActivitySummary.memberToOthers.likes,
                    LOVE_ADDED: memberActivitySummary.memberToOthers.loves,
                  },
                ] }
              />
            </div>
          </Card>
          <Card className="p-3">
            <div className="pt-5">
              <MemberActivitySummaryChart
                title="Other Members' Activity on Your Posts"
                data={ [
                  {
                    label: "Family",
                    POST_CREATED: memberActivitySummary.othersToMember.posts,
                    COMMENT_CREATED: memberActivitySummary.othersToMember.comments,
                    LIKE_ADDED: memberActivitySummary.othersToMember.likes,
                    LOVE_ADDED: memberActivitySummary.othersToMember.loves,
                  },
                ] }
              />
            </div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
