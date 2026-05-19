import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/(family)/(family-members)/family-current-members/actions", () => ({
  removeFamilyMemberAction: vi.fn(),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) => (open ? <div>{ children }</div> : null),
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
}));

vi.mock("@/components/common/member-list-identity", () => ({
  default: ({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) => (
    <div>
      <span>{ firstName } { lastName }</span>
      <span>{ email }</span>
    </div>
  ),
}));

import { RemoveMemberDialog } from "@/app/(family)/(family-members)/family-current-members/remove-member-dialog";

describe("RemoveMemberDialog UI", () => {
  it("renders joined family members and explicit soft/hard delete actions", () => {
    const markup = renderToStaticMarkup(
      <RemoveMemberDialog
        open={ true }
        onOpenChange={ vi.fn() }
        joinedMembers={ [
          {
            memberId: 12,
            firstName: "Jordan",
            lastName: "Lee",
            email: "jordan@example.com",
            status: "joined",
            memberImageUrl: null,
          },
          {
            memberId: 13,
            firstName: "Avery",
            lastName: "Cruz",
            email: "avery@example.com",
            status: "joined",
            memberImageUrl: null,
          },
        ] }
      />,
    );

    expect(markup).toContain("Joined Family Members");
    expect(markup).toContain("Jordan Lee");
    expect(markup).toContain("Avery Cruz");
    expect(markup).toContain("Soft Delete (Retire)");
    expect(markup).toContain("Hard Delete");
    expect(markup).not.toContain("Joined Member</span>");
  });
});
