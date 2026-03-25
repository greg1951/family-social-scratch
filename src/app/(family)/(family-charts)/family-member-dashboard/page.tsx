import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import MemberStackedBarChart from "@/components/charts/family/feature-stacked-bar";
import FamilyRadialChart from "@/components/charts/family/family-radial-chart";

export default async function FamilyMemberDashboard() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="flex flex-col md:flex-row gap-3">
          <div className=" pt-5">
            <MemberStackedBarChart />
          </div>
          <div className=" pt-5">
            <FamilyRadialChart />
          </div>
        </Card>
      </div>
    </>
  );
}