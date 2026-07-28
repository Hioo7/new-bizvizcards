import { useCallback, useEffect, useState } from "react";
import type { AuthUser } from "@app-types/auth";
import type { Ecard } from "@app-types/ecard";
import { getCustomerProfile } from "@services/authService";
import { useOrganisation } from "@features/user-dashboard/hooks/useOrganisation";
import { useCustomerEcards } from "@features/user-dashboard/hooks/useCustomerEcards";
import ProfileBanner from "./ProfileBanner";
import OrgDashboardCard from "./OrgDashboardCard";
import EditProfileModal from "./EditProfileModal";
import CreateOrgModal from "./CreateOrgModal";
import CustomerEcardBuilderSheet from "./CustomerEcardBuilderSheet";
import EcardsHorizontalSection from "./EcardsHorizontalSection";

type ModalType = "profile" | "createOrg" | null;

interface ProfileSectionProps {
  user: AuthUser;
  ecardAvailable: boolean;
  orgAvailable: boolean;
}

export default function ProfileSection({
  user: initialUser,
  ecardAvailable,
  orgAvailable,
}: ProfileSectionProps) {
  const [user, setUser] = useState<AuthUser>(initialUser);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [dialCode, setDialCode] = useState<string | undefined>(undefined);
  const org = useOrganisation();
  const customerEcards = useCustomerEcards();

  const refreshPhone = useCallback(() => {
    getCustomerProfile()
      .then((p) => {
        setPhone(p.phoneNumber ?? undefined);
        setDialCode(p.phoneCountryDialCode ?? undefined);
      })
      .catch(() => { /* keep existing */ });
  }, []);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderEcard, setBuilderEcard] = useState<Ecard | null>(null);

  useEffect(() => {
    if (orgAvailable) void org.load();
    if (ecardAvailable) void customerEcards.load();
    refreshPhone();
    // load once on mount when available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  return (
    <div className="min-h-[60vh] pb-24">
      <ProfileBanner
        user={user}
        phone={phone}
        countryCode={dialCode}
        onEditProfile={() => setOpenModal("profile")}
        onManageEcards={
          ecardAvailable
            ? () => {
                void customerEcards.load();
                setBuilderEcard(null);
                setBuilderOpen(true);
              }
            : undefined
        }
      />

      <div className="-mt-10 relative z-10 px-4 pb-4">
        <div className="space-y-4">
          <OrgDashboardCard
            data={org.data}
            loading={org.loading}
            error={org.error}
            isAvailable={orgAvailable}
            onCreateOrg={() => setOpenModal("createOrg")}
            onUpdateName={async (name) => {
              await org.update(name);
              showToast("Organisation updated");
            }}
          />

          <EcardsHorizontalSection
            ecards={customerEcards.ecards}
            loading={customerEcards.loading}
            error={customerEcards.error}
            isAvailable={ecardAvailable}
            onCreateNew={() => {
              setBuilderEcard(null);
              setBuilderOpen(true);
            }}
            onEdit={(ecard) => {
              setBuilderEcard(ecard);
              setBuilderOpen(true);
            }}
            onDelete={customerEcards.remove}
          />
        </div>
      </div>

      <EditProfileModal
        open={openModal === "profile"}
        user={user}
        onSave={(updatedUser) => {
          setUser(updatedUser);
          setOpenModal(null);
          refreshPhone();
          showToast("Profile updated successfully");
        }}
        onClose={() => setOpenModal(null)}
      />

      <CreateOrgModal
        open={openModal === "createOrg"}
        onClose={() => setOpenModal(null)}
        onSubmit={async (name) => {
          await org.create(name);
          showToast("Organisation created!");
        }}
      />

      {toastMessage && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <CustomerEcardBuilderSheet
        key={builderEcard?.id ?? "new"}
        open={builderOpen}
        existingEcard={builderEcard}
        prefillName={user.name}
        prefillEmail={user.email}
        onClose={() => setBuilderOpen(false)}
        onSaved={() => {
          void customerEcards.load();
        }}
      />
    </div>
  );
}
