import MemberAvatar from "@/components/common/member-avatar";

type MemberListIdentityProps = {
  firstName: string;
  lastName: string;
  email: string;
  memberImageUrl?: string | null;
  avatarSizeClassName?: string;
};

export default function MemberListIdentity({
  firstName,
  lastName,
  email,
  memberImageUrl,
  avatarSizeClassName = "h-8 w-8",
}: MemberListIdentityProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-start gap-2">
        { memberImageUrl && (
          <MemberAvatar
            imageUrl={ memberImageUrl }
            firstName={ firstName }
            lastName={ lastName }
            sizeClassName={ avatarSizeClassName }
          />
        ) }
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-slate-900">
            { firstName } { lastName }
          </p>
          <p className="break-all text-xs text-slate-600">{ email }</p>
        </div>
      </div>
    </div>
  );
}
