import { Card } from "@/components/ui/card";
import MemberStackedBarChart from "@/components/charts/family/feature-stacked-bar";
import FamilyRadialChart from "@/components/charts/family/family-radial-chart";

export default async function FamilyMemberDashboard() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-full">
        <Card className="flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            <MemberStackedBarChart />
            <FamilyRadialChart />
          </div>
        </Card>
      </div>
    </>
  );
}