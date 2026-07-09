import { useState } from "react";
import { Mail, ShieldCheck, User } from "lucide-react";
import { useStaffAuth } from "@hooks/useStaffAuth";
import { STAFF_ROLE_LABELS } from "@config/staffRoles";
import ProfileListItem from "@features/admin/components/ProfileListItem";
import EditNameModal from "@features/admin/components/EditNameModal";

export default function ProfileForm() {
  const { staffUser, refreshStaffUser } = useStaffAuth();
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);

  if (!staffUser) return null;

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-base-content">Profile</h1>

      <div className="overflow-hidden rounded-box border border-base-300 bg-base-100">
        <ProfileListItem icon={User} label="Name" value={staffUser.name} onEdit={() => setIsEditNameOpen(true)} />
        <ProfileListItem icon={Mail} label="Email" value={staffUser.email} />
        <ProfileListItem
          icon={ShieldCheck}
          label="Role"
          value={staffUser.role ? STAFF_ROLE_LABELS[staffUser.role] : "—"}
        />
      </div>

      <EditNameModal
        open={isEditNameOpen}
        currentName={staffUser.name}
        onCancel={() => setIsEditNameOpen(false)}
        onSaved={async () => {
          await refreshStaffUser();
          setIsEditNameOpen(false);
        }}
      />
    </div>
  );
}
