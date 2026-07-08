import type { ReactNode } from "react";
import FeatureProfileMenu from "@/components/common/feature-profile-menu";

export default function MovieLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <FeatureProfileMenu mobileVariant="feature-hero" />
      { children }
    </div>
  );
}