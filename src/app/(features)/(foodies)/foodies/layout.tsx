import type { ReactNode } from "react";
import FeatureProfileMenu from "@/components/common/feature-profile-menu";

export default function FoodiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <FeatureProfileMenu />
      { children }
    </div>
  );
}