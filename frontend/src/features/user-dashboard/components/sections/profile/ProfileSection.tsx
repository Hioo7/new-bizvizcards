import { useState } from "react";
import type { AuthUser } from "@app-types/auth";
import { useUserProfile } from "@features/user-dashboard/hooks/useUserProfile";
import ProfileBanner from "./ProfileBanner";
import OrgDashboardCard from "./OrgDashboardCard";
import ProfileContactCard from "./ProfileContactCard";
import ProfileBioCard from "./ProfileBioCard";
import ProfileSocialsCard from "./ProfileSocialsCard";
import EditProfileModal from "./EditProfileModal";
import EditContactModal from "./EditContactModal";
import EditBioModal from "./EditBioModal";
import EditSocialsModal from "./EditSocialsModal";

type ModalType = "profile" | "contact" | "bio" | "socials" | null;

interface ProfileSectionProps {
  user: AuthUser;
}

export default function ProfileSection({ user: initialUser }: ProfileSectionProps) {
  const [user, setUser] = useState<AuthUser>(initialUser);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { profile, updateContact, updateBio, updateSocials } = useUserProfile(user.id);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div className="min-h-[60vh] pb-24">
      <ProfileBanner
        user={user}
        phone={profile.phone}
        countryCode={profile.countryCode}
        onEditProfile={() => setOpenModal("profile")}
      />

      <div className="-mt-10 relative z-10 px-4 space-y-4 pb-4">
        <OrgDashboardCard />
        <ProfileContactCard
          phone={profile.phone}
          countryCode={profile.countryCode}
          email={user.email}
          onEdit={() => setOpenModal("contact")}
        />
        <ProfileBioCard
          profession={profile.profession}
          about={profile.about}
          description={profile.description}
          onEdit={() => setOpenModal("bio")}
        />
        <ProfileSocialsCard
          socials={profile.socials}
          onEdit={() => setOpenModal("socials")}
        />
      </div>

      <EditProfileModal
        open={openModal === "profile"}
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          setOpenModal(null);
          showToast("Profile updated successfully");
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditContactModal
        open={openModal === "contact"}
        phone={profile.phone}
        countryCode={profile.countryCode}
        onSave={(p, cc) => {
          updateContact(p, cc);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditBioModal
        open={openModal === "bio"}
        profession={profile.profession}
        about={profile.about}
        description={profile.description}
        onSave={(prof, ab, desc) => {
          updateBio(prof, ab, desc);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      <EditSocialsModal
        open={openModal === "socials"}
        socials={profile.socials}
        onSave={(s) => {
          updateSocials(s);
          setOpenModal(null);
        }}
        onClose={() => setOpenModal(null)}
      />

      {toastMessage && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
